import { motion } from 'framer-motion';

interface StatusBadgeProps {
  online: boolean;
  showText?: boolean;
}

export default function StatusBadge({ online, showText = true }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{
          scale: online ? [1, 1.2, 1] : 1,
          opacity: online ? 1 : 0.5,
        }}
        transition={{
          duration: 2,
          repeat: online ? Infinity : 0,
          repeatType: 'loop',
        }}
        className={`w-2.5 h-2.5 rounded-full ${
          online 
            ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' 
            : 'bg-slate-500'
        }`}
      />
      {showText && (
        <span className={`text-sm font-medium ${online ? 'text-emerald-400' : 'text-slate-500'}`}>
          {online ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  );
}


