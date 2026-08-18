import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface MusicContextValue {
  isPlaying: boolean;
  toggle: () => void;
  hasMusic: boolean;
}

const MusicContext = createContext<MusicContextValue>({
  isPlaying: false,
  toggle: () => {},
  hasMusic: false,
});

/**
 * Guest-side background music.
 *
 * Behaviour (per product spec):
 *  - A single persistent <audio> element is created once and reused, so the file
 *    is never re-fetched from the network on every render/interaction.
 *  - It loops and uses the browser volume (no custom volume UI required).
 *  - On mount it tries to autoplay. If the browser blocks autoplay (no user
 *    gesture yet, which mobile always does), it stays paused and starts on the
 *    FIRST user tap/click/keypress anywhere on the page.
 *  - If the URL is missing, unreachable, or the browser refuses playback, the
 *    rest of the invitation keeps working and we do NOT spam the console.
 */
export function MusicProvider({
  children,
  musicUrl,
}: {
  children: ReactNode;
  musicUrl?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const startedRef = useRef(false);
  const urlRef = useRef<string | null>(null);

  // (Re)configure the single audio element whenever the active track changes.
  useEffect(() => {
    if (!musicUrl) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.volume = 0.55;
      audio.preload = 'auto';
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      // Swallow decode/network errors silently — music is non-critical.
      audio.addEventListener('error', () => setIsPlaying(false));
      audioRef.current = audio;
    }

    // Only swap the source when it actually changed (prevents needless refetch).
    if (urlRef.current !== musicUrl) {
      audio.pause();
      audio.src = musicUrl;
      urlRef.current = musicUrl;
      startedRef.current = false;
      setIsPlaying(false);
    }

    // Best-effort autoplay. If blocked, it simply stays paused until a gesture.
    audio
      .play()
      .then(() => {
        startedRef.current = true;
        setIsPlaying(true);
      })
      .catch(() => {
        startedRef.current = false;
      });
  }, [musicUrl]);

  // Autoplay fallback: start on the first user gesture anywhere on the page.
  useEffect(() => {
    const onGesture = () => {
      const audio = audioRef.current;
      if (audio && audio.src && !startedRef.current) {
        audio
          .play()
          .then(() => {
            startedRef.current = true;
            setIsPlaying(true);
          })
          .catch(() => {});
        removeGesture();
      }
    };
    const removeGesture = () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('touchstart', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('touchstart', onGesture);
    window.addEventListener('keydown', onGesture);
    return removeGesture;
  }, []);

  // Clean up the element when the provider unmounts.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => {
          startedRef.current = true;
          setIsPlaying(true);
        })
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <MusicContext.Provider value={{ isPlaying, toggle, hasMusic: !!musicUrl }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicPlayer() {
  return useContext(MusicContext);
}
