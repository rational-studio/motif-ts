'use client';

import { cn } from '@/lib/cn';
import { Bot, Layers, LocateFixed, Package, ShieldCheck, Workflow } from 'lucide-react';
import { motion } from 'motion/react';

const PHILOSOPHY_ITEMS = [
  {
    title: 'Workflows as Graphs',
    description:
      'Build logic with explicit steps and edges. Each transition is deterministic and type-checked, making complex flows understandable and testable.',
    icon: Workflow,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Type-Safety End-to-End',
    description:
      'Strong TypeScript APIs ensure inputs, states, and transitions are safe. Zod integration adds runtime validation without compromising ergonomics.',
    icon: ShieldCheck,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Immutability',
    description:
      'State updates are immutable by default, powered by Zustand. This ensures predictable state changes and enables powerful features like time-travel debugging.',
    icon: Package,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'Colocation',
    description:
      'Keep your logic, types, and UI close together. Steps are self-contained units that are easy to reason about, test, and reuse across your application.',
    icon: LocateFixed,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Framework Agnostic',
    description:
      'The core is UI-agnostic and works in any framework or runtime. Optional adapters integrate with different UIs (React included) without coupling.',
    icon: Layers,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    title: 'AI-Friendly',
    description:
      'Co-location makes it easy for AI to understand component purpose and for humans to verify. Future releases will include LLM.txt to guide AI operations.',
    icon: Bot,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
];

export default function Philosophy() {
  return (
    <section id="philosophy" className="relative overflow-hidden px-6 py-24">
      {/* Background Elements */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl">
            Core Philosophy
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Built on first principles to solve the complexity of state management and workflow orchestration.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {PHILOSOPHY_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel group rounded-2xl border border-white/5 p-8 transition-all hover:border-white/10"
            >
              <div
                className={cn(
                  'mb-6 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                  item.bg,
                )}
              >
                <item.icon className={cn('h-6 w-6', item.color)} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">{item.title}</h3>
              <p className="leading-relaxed text-gray-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
