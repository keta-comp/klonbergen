import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
};

// 🔥 MUHIM: banners optional qilindi va default value []
export default function BannerCarousel({ banners = [] }: { banners?: Banner[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isHovered, setIsHovered] = useState(false);

  // 🔥 Xavfsiz tekshiruv
  if (!banners || banners.length === 0) {
    console.warn("⚠️ BannerCarousel: No banners provided");
    return null;
  }

  const index = ((page % banners.length) + banners.length) % banners.length;

  const paginate = useCallback((newDirection: number) => {
    setPage(([p]) => [p + newDirection, newDirection]);
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const timer = setInterval(() => paginate(1), 4500);
    return () => clearInterval(timer);
  }, [banners.length, isHovered, paginate]);

  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) paginate(1);
    else if (swipe > swipeConfidenceThreshold) paginate(-1);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
      style={{ aspectRatio: '9/16' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background blur layer */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={banners[index].image_url}
          alt=""
          className="h-full w-full scale-110 object-cover blur-2xl opacity-40"
        />
      </div>

      {/* Main slide */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
            scale: { duration: 0.4 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={banners[index].image_url}
            alt={banners[index].title || 'Banner'}
            className="h-full w-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {banners[index].title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute bottom-20 left-0 right-0 px-6 text-center"
            >
              <h3 className="text-2xl font-bold font-serif text-white drop-shadow-lg">
                {banners[index].title}
              </h3>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(-1)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-md hover:bg-white/40"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => paginate(1)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 backdrop-blur-md hover:bg-white/40"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </motion.button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setPage([i, i > index ? 1 : -1])}
              className="relative h-2 rounded-full bg-white/30 backdrop-blur-sm"
              animate={{ width: i === index ? 24 : 8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {i === index && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {banners.length > 1 && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-sm">
          {index + 1} / {banners.length}
        </div>
      )}
    </div>
  );
}
