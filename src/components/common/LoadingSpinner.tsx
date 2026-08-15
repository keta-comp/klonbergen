import { motion } from 'framer-motion';

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        className="h-12 w-12 rounded-full border-4 border-muted border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
