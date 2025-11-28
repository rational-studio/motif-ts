'use client';

import { cn } from '@/lib/cn';
import { Box, Code2, Layers, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import GlassPanel from './GlassPanel';

type CodeBlock = {
  label: string;
  value: string;
  iconName: 'terminal' | 'box' | 'layers' | 'code';
  description: string;
  codeHtml: string;
};

const iconMap = {
  terminal: Terminal,
  box: Box,
  layers: Layers,
  code: Code2,
};

const colorMap = {
  terminal: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  box: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  layers: { text: 'text-pink-400', bg: 'bg-pink-500/10' },
  code: { text: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function InteractiveUsage({ blocks }: { blocks: CodeBlock[] }) {
  const [activeTab, setActiveTab] = useState(blocks[0].value);
  const activeBlock = blocks.find((b) => b.value === activeTab) || blocks[0];
  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Sidebar / Tabs */}
      <div className="space-y-4 lg:col-span-2">
        {blocks.map((block) => {
          const Icon = iconMap[block.iconName];
          const colors = colorMap[block.iconName];
          const isActive = activeTab === block.value;

          return (
            <button
              key={block.value}
              onClick={() => setActiveTab(block.value)}
              className={cn(
                'group flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all duration-300',
                isActive ? 'bg-white/5' : 'hover:bg-white/5',
              )}
            >
              <div
                className={cn(
                  'mt-1 rounded-lg p-2 transition-colors',
                  colors.bg,
                  colors.text,
                  isActive ? '' : 'opacity-80 group-hover:opacity-100',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={cn('mb-1 font-semibold', isActive ? 'text-white' : 'text-gray-300 group-hover:text-white')}
                >
                  {block.label}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">{block.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Window */}
      <div className="lg:col-span-3">
        <GlassPanel className="flex h-full min-h-[400px] flex-col overflow-hidden border-gray-800">
          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-gray-800 bg-black/20 px-4 py-3">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full border border-red-500/50 bg-red-500/20" />
              <div className="h-3 w-3 rounded-full border border-yellow-500/50 bg-yellow-500/20" />
              <div className="h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20" />
            </div>
            <div className="font-mono text-xs text-gray-500">
              {activeBlock.label.toLowerCase().replace(/\s+/g, '-')}.ts
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Code Content */}
          <div className="relative flex-1 overflow-x-auto bg-[#0a0c10] p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: activeBlock.codeHtml }}
              />
            </AnimatePresence>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
