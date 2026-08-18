import { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CornerFiligree, Divider, Rings } from './Ornaments';
import { getTemplate } from './templates';

export interface StoryData {
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  wedding_time: string | null;
  hall_name: string;
  address?: string | null;
  photos?: string[] | null;
  template?: string | null;
}

const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];
const WEEKDAYS = ['Ekshembi', 'Dúyshembi', 'Siyshembi', 'Sárshembi', 'Piyshembi', 'Juma', 'Shembi'];

function parts(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: date, month: '', year: '', weekday: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()],
    year: String(d.getFullYear()),
    weekday: WEEKDAYS[d.getDay()],
  };
}

interface Props {
  invitation: StoryData;
  shareUrl: string;
  /** visual scale — 1 = 1080x1920 */
  scale?: number;
}

/**
 * Fixed 1080x1920 (9:16) poster, made to be exported as an Instagram Story image.
 */
const StoryCard = forwardRef<HTMLDivElement, Props>(({ invitation, shareUrl, scale = 1 }, ref) => {
  const tpl = getTemplate(invitation.template);
  const d = parts(invitation.wedding_date);
  const photos = (invitation.photos || []).filter(Boolean);
  const initials = `${(invitation.groom_name || '?')[0]} ${(invitation.bride_name || '?')[0]}`.toUpperCase();

  return (
    <div
      style={{ width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      className="relative shrink-0 overflow-hidden"
    >
      <div ref={ref} className={`${tpl.page} grain vignette relative h-[1920px] w-[1080px] overflow-hidden`}>
        {/* frame */}
        <div className={`pointer-events-none absolute inset-10 rounded-[64px] border ${tpl.tone === 'dark' ? 'border-gold/35' : 'border-gold/30'}`} />
        <div className={`pointer-events-none absolute inset-[52px] rounded-[56px] border ${tpl.tone === 'dark' ? 'border-gold/15' : 'border-gold/15'}`} />
        <CornerFiligree className={`pointer-events-none absolute left-16 top-16 h-32 w-32 ${tpl.accent}`} />
        <CornerFiligree className={`pointer-events-none absolute right-16 top-16 h-32 w-32 rotate-90 ${tpl.accent}`} />
        <CornerFiligree className={`pointer-events-none absolute bottom-16 right-16 h-32 w-32 rotate-180 ${tpl.accent}`} />
        <CornerFiligree className={`pointer-events-none absolute bottom-16 left-16 h-32 w-32 -rotate-90 ${tpl.accent}`} />

        <div className={`relative flex h-full flex-col items-center justify-between px-24 py-32 text-center ${tpl.body}`}>
          <div className="flex flex-col items-center">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{ background: `radial-gradient(circle at 32% 28%, hsl(45 90% 78%), ${tpl.seal} 55%, hsl(38 60% 30%) 100%)` }}
            >
              <span className="font-monogram text-4xl text-white/95">{initials}</span>
            </div>
            <Rings className={`mt-8 h-10 w-20 ${tpl.accent}`} />
            <p className={`mt-6 text-lg font-semibold uppercase tracking-[0.55em] ${tpl.label_cls}`}>Toy mirátnaması</p>
          </div>

          {photos.length > 0 && (
            <div className="flex items-end justify-center gap-10">
              {photos.slice(0, 2).map((src, i) => (
                <div key={src} className="flex flex-col items-center">
                  <img
                    src={src}
                    alt={i === 0 ? invitation.groom_name : invitation.bride_name}
                    crossOrigin="anonymous"
                    className={`h-[430px] w-[300px] rounded-t-[150px] object-cover ${tpl.frame}`}
                  />
                  <span className={`mt-6 text-base font-semibold uppercase tracking-[0.35em] ${tpl.label_cls}`}>
                    {i === 0 ? 'Kúyew' : 'Kelin'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center">
            <h1 className={`font-display text-[104px] font-light leading-[1.02] ${tpl.heading}`}>
              {invitation.groom_name}
              <span className={`mx-6 font-monogram text-[0.5em] align-middle ${tpl.accent}`}>&</span>
              {invitation.bride_name}
            </h1>
            <Divider className={`mt-10 h-8 w-[420px] ${tpl.accent}`} />

            <div className="mt-12 flex items-center justify-center gap-10">
              <p className="w-48 text-right text-xl font-semibold uppercase tracking-[0.3em] opacity-70">{d.weekday}</p>
              <div className={`border-x px-10 ${tpl.tone === 'dark' ? 'border-gold/30' : 'border-gold/25'}`}>
                <div className={`font-display text-[96px] font-light leading-none ${tpl.accent}`}>{d.day}</div>
                <div className="mt-3 text-xl font-semibold uppercase tracking-[0.28em] opacity-80">{d.month}</div>
              </div>
              <p className="w-48 text-left text-xl font-semibold uppercase tracking-[0.3em] opacity-70">{d.year}</p>
            </div>

            <p className={`mt-10 text-3xl tracking-[0.2em] ${tpl.accent}`}>{(invitation.wedding_time || '').slice(0, 5)}</p>
            <p className="mt-6 font-display text-5xl font-medium">{invitation.hall_name}</p>
            {invitation.address && <p className="mt-4 max-w-[760px] text-2xl opacity-70">{invitation.address}</p>}
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="rounded-[32px] bg-white p-5">
              <QRCodeCanvas value={shareUrl} size={168} level="H" includeMargin fgColor="#1a1613" />
            </div>
            <p className="text-xl opacity-70">Mirátnamanı ashıw ushın QR</p>
            <p className={`font-monogram text-lg tracking-[0.5em] opacity-70 ${tpl.accent}`}>VOWLY MENEN JARATILDI</p>
          </div>
        </div>
      </div>
    </div>
  );
});

StoryCard.displayName = 'StoryCard';
export default StoryCard;
