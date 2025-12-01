import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import { slideVariants } from './animation';

export function VerifyPage({ custom }: { custom: number }) {
  return (
    <motion.div
      key="verify"
      custom={custom}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />
        <Loader2 className="relative z-10 h-12 w-12 animate-spin text-blue-500" />
      </div>
      <h3 className="mt-8 mb-2 font-semibold text-white">Verifying...</h3>
      <p className="text-xs tracking-wider text-gray-500 uppercase">Secure Connection</p>
    </motion.div>
  );
}
