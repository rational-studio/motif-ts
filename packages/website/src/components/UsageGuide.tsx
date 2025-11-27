import { highlight } from '@/lib/shiki';

import InteractiveUsage from './InteractiveUsage';

export default async function UsageGuide() {
  const installCode = `pnpm add @motif-ts/core @motif-ts/react`;

  const stepCode = `import { step } from '@motif-ts/core';
import { z } from 'zod';

export const Validate = step(
  { 
    kind: 'validate', 
    inputSchema: z.object({ email: z.string().email() }),
    outputSchema: z.object({ isValid: z.boolean() })
  }, 
  ({ next, input }) => ({
    check() {
      const isValid = input.email.includes('@');
      next({ isValid });
    }
  })
);`;

  const workflowCode = `import { workflow } from '@motif-ts/core';
import { Validate, Save } from './steps';

const flow = workflow([Validate, Save]);

// Register instances
const validate = Validate();
const save = Save();

flow.register([validate, save]);

// Connect steps
flow.connect(validate, save);

// Start execution
flow.start(validate);`;

  const reactCode = `import { useWorkflow } from '@motif-ts/react';
import { flow } from './workflow';

export function SignupForm() {
  const current = useWorkflow(flow);

  if (current.kind === 'validate') {
    return <button onClick={() => current.state.check()}>Validate</button>;
  }
  
  return <div>Processing...</div>;
}`;

  const [installHtml, stepHtml, workflowHtml, reactHtml] = await Promise.all([
    highlight(installCode, 'bash', 'github-dark-high-contrast'),
    highlight(stepCode, 'typescript', 'github-dark-high-contrast'),
    highlight(workflowCode, 'typescript', 'github-dark-high-contrast'),
    highlight(reactCode, 'tsx', 'github-dark-high-contrast'),
  ]);

  const blocks = [
    {
      label: 'Installation',
      value: 'install',
      iconName: 'terminal' as const,
      description: 'Get started by installing the core package and optional React adapter.',
      codeHtml: installHtml,
    },
    {
      label: 'Define Steps',
      value: 'steps',
      iconName: 'box' as const,
      description: 'Create strongly-typed steps with Zod schemas for inputs and outputs.',
      codeHtml: stepHtml,
    },
    {
      label: 'Compose Workflow',
      value: 'workflow',
      iconName: 'layers' as const,
      description: 'Connect steps into a graph. The orchestrator manages state and transitions.',
      codeHtml: workflowHtml,
    },
    {
      label: 'React Integration',
      value: 'react',
      iconName: 'code' as const,
      description: 'Use the `useWorkflow` hook to drive your UI based on the current step.',
      codeHtml: reactHtml,
    },
  ];

  return (
    <section className="relative px-6 py-24" id="usage">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-6 bg-linear-to-b from-white to-white/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-5xl">
            Detailed Usage Guide
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Step-by-step instructions to get you up and running.
          </p>
        </div>
        <InteractiveUsage blocks={blocks} />
      </div>
    </section>
  );
}
