'use client';

import { step, workflow, type CurrentStep, type WorkflowAPI } from '@motif-ts/core';
import { conditionalEdge } from '@motif-ts/core/edge/non-serializable';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Code,
  CreditCard,
  Loader2,
  Mail,
  Play,
  RotateCcw,
  Smartphone,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import ReactFlow, { Background, Edge, MarkerType, Node, useEdgesState, useNodesState } from 'reactflow';
import { createHighlighter, type Highlighter } from 'shiki';

import 'reactflow/dist/style.css';

import { cn } from '@/lib/cn';
import { z } from 'zod';

import Button from './Button';
import GlassPanel from './GlassPanel';
import MotifStepNode, { MotifStepData } from './MotifStepNode';
import SectionHeading from './SectionHeading';

const nodeTypes = {
  motifStep: MotifStepNode,
};

// --- Step Definitions ---

const InputStep = step(
  {
    kind: 'input',
    outputSchema: z.object({ email: z.string().email() }).passthrough(),
  },
  ({ next }) => {
    return {
      submit: (email: string) => {
        next({ email });
      },
    };
  },
);

const VerifyStep = step(
  {
    kind: 'verify',
    inputSchema: z.object({ email: z.string() }).passthrough(),
    outputSchema: z.object({ email: z.string(), isVerified: z.boolean() }).passthrough(),
  },
  ({ next, input }) => {
    return {
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
        next({ ...input, isVerified: true });
      },
    };
  },
);

const ProfileStep = step(
  {
    kind: 'profile',
    inputSchema: z.object({ email: z.string() }).passthrough(),
    outputSchema: z.object({ email: z.string(), name: z.string(), role: z.string() }).passthrough(),
  },
  ({ next, input }) => {
    return {
      submitProfile: (name: string, role: string) => {
        next({ ...input, name, role });
      },
    };
  },
);

const PlanStep = step(
  {
    kind: 'plan',
    inputSchema: z.object({ email: z.string() }).passthrough(),
    outputSchema: z.object({ email: z.string(), plan: z.string() }).passthrough(),
  },
  ({ next, input }) => {
    return {
      selectPlan: (plan: string) => {
        next({ ...input, plan });
      },
    };
  },
);

const SuccessStep = step(
  {
    kind: 'success',
    inputSchema: z.object({ email: z.string() }).passthrough(),
  },
  ({ input }) => {
    return {
      data: input,
    };
  },
);

const STEPS_INFO = [
  {
    id: 'input',
    label: 'User Input',
    code: '({ next }) => ({ submit: (email) => next({ email }) })',
    input: 'void',
    output: '{ email }',
  },
  {
    id: 'verify',
    label: 'Verify Email',
    code: 'async ({ next }) => { await api.check(); next({ ...input, isVerified: true }) }',
    input: '{ email }',
    output: '{ email, isVerified }',
  },
  {
    id: 'profile',
    label: 'Profile',
    code: '({ next, input }) => ({ submit: (name, role) => next({ ...input, name, role }) })',
    input: '{ email }',
    output: '{ email, name, role }',
  },
  {
    id: 'plan',
    label: 'Select Plan',
    code: '({ next, input }) => ({ select: (plan) => next({ ...input, plan }) })',
    input: '{ email }',
    output: '{ email, plan }',
  },
  {
    id: 'success',
    label: 'Success',
    code: '({ input }) => <SuccessUI data={input} />',
    input: '{ ...data }',
    output: 'void',
  },
];

// --- Shiki Hook ---
const useShiki = (code: string) => {
  const [html, setHtml] = useState<string | null>(null);
  const highlighterRef = useRef<Highlighter | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!highlighterRef.current) {
        highlighterRef.current = await createHighlighter({
          themes: ['github-dark-high-contrast'],
          langs: ['typescript'],
        });
      }

      if (mounted && highlighterRef.current) {
        const highlighted = highlighterRef.current.codeToHtml(code, {
          lang: 'typescript',
          theme: 'github-dark-high-contrast',
        });
        setHtml(highlighted);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [code]);

  return html;
};

const CodeBlock = ({ code }: { code: string }) => {
  const html = useShiki(code);

  if (!html) {
    return <div className="font-mono text-sm leading-relaxed whitespace-pre text-gray-300">{code}</div>;
  }

  return (
    <div
      className="font-mono text-sm leading-relaxed whitespace-pre [&>pre]:bg-transparent! [&>pre]:p-0!"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default function InteractiveShowcase() {
  const [activeSteps, setActiveSteps] = useState<string[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [useConditional, setUseConditional] = useState(false);
  const [errorShake, setErrorShake] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Execution State
  const [currentStepKind, setCurrentStepKind] = useState<string | null>(null);
  const orchestratorRef = useRef<WorkflowAPI<any> | null>(null);
  // Add state to store workflow data for rendering, avoiding direct ref access in render
  const [workflowData, setWorkflowData] = useState<any>(null);

  // Update workflowData whenever currentStepKind changes or steps update
  useEffect(() => {
    // Wrap in timeout to avoid synchronous state update warning
    const timer = setTimeout(() => {
      if (orchestratorRef.current) {
        const currentStep = orchestratorRef.current.getCurrentStep();
        setWorkflowData(currentStep?.state?.data || null);
      } else {
        setWorkflowData(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentStepKind, isRunning]); // Add dependencies that indicate state change

  const isValidConnection = (prevId: string, nextId: string) => {
    // Input must be first
    if (prevId === 'input') return nextId !== 'input';

    // Success must be last (nothing connects FROM success)
    if (prevId === 'success') return false;

    // Can't connect to Input (except as first, handled above)
    if (nextId === 'input') return false;

    // Prevent self-loops for simplicity in this demo
    if (prevId === nextId) return false;

    return true;
  };

  const addStep = (stepId: string) => {
    if (activeSteps.includes(stepId)) return;

    // Check validity with previous step
    if (activeSteps.length > 0) {
      const prevStepId = activeSteps[activeSteps.length - 1];
      if (!isValidConnection(prevStepId, stepId)) {
        setErrorShake(stepId);
        setTimeout(() => setErrorShake(null), 500);
        return;
      }
    } else {
      // First step MUST be input
      if (stepId !== 'input') {
        setErrorShake(stepId);
        setTimeout(() => setErrorShake(null), 500);
        return;
      }
    }

    const newActiveSteps = [...activeSteps, stepId];
    setActiveSteps(newActiveSteps);

    const stepInfo = STEPS_INFO.find((s) => s.id === stepId)!;
    const newNode: Node<MotifStepData> = {
      id: stepId,
      type: 'motifStep',
      data: {
        label: stepInfo.label,
        inputSchema: stepInfo.input,
        outputSchema: stepInfo.output,
        status: 'idle',
      },
      position: { x: 250, y: newActiveSteps.length * 150 },
    };

    setNodes((nds) => [...nds, newNode]);

    if (newActiveSteps.length > 1) {
      const prevStepId = newActiveSteps[newActiveSteps.length - 2];
      const newEdge: Edge = {
        id: `e${prevStepId}-${stepId}`,
        source: prevStepId,
        target: stepId,
        animated: true,
        style: { stroke: '#333' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#333' },
      };

      if (useConditional && prevStepId === 'input' && stepId === 'verify') {
        newEdge.label = 'valid?';
        newEdge.style = { stroke: '#eab308' };
        newEdge.markerEnd = { type: MarkerType.ArrowClosed, color: '#eab308' };
      }

      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const resetBuilder = () => {
    setActiveSteps([]);
    setNodes([]);
    setEdges([]);
    setIsRunning(false);
    setCurrentStepKind(null);
    setCanGoBack(false);
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
      orchestratorRef.current = null;
    }
  };

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === 'input' && edge.target === 'verify') {
          return {
            ...edge,
            label: useConditional ? 'valid?' : undefined,
            style: { stroke: useConditional ? '#eab308' : '#333' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: useConditional ? '#eab308' : '#333',
            },
          };
        }
        return edge;
      }),
    );
  }, [useConditional, setEdges]);

  const runWorkflow = async () => {
    setIsRunning(true);
    setCurrentStepKind(null);
    setCanGoBack(false);

    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    try {
      const inventory = [InputStep, VerifyStep, ProfileStep, PlanStep, SuccessStep];
      const orchestrator = workflow(inventory);
      orchestratorRef.current = orchestrator;

      // Create instances
      const stepInstances: any[] = [];
      const instanceMap = new Map<string, any>();

      activeSteps.forEach((id) => {
        let instance;
        if (id === 'input') instance = InputStep();
        else if (id === 'verify') instance = VerifyStep();
        else if (id === 'profile') instance = ProfileStep();
        else if (id === 'plan') instance = PlanStep();
        else if (id === 'success') instance = SuccessStep();

        if (instance) {
          stepInstances.push(instance);
          instanceMap.set(id, instance);
        }
      });

      orchestrator.register(stepInstances);

      for (let i = 0; i < activeSteps.length - 1; i++) {
        const currentId = activeSteps[i];
        const nextId = activeSteps[i + 1];
        const current = instanceMap.get(currentId);
        const next = instanceMap.get(nextId);

        if (useConditional && currentId === 'input') {
          orchestrator.connect(conditionalEdge(current, next, () => true));
        } else {
          orchestrator.connect(current, next);
        }
      }

      const unsub = orchestrator.subscribe((currentStep: CurrentStep<any>) => {
        const { kind, status, state } = currentStep;

        // Update canGoBack state
        setCanGoBack(orchestrator.$$INTERNAL.history.length > 0);

        if (status === 'transitionIn' || status === 'ready' || status === 'transitionOut') {
          // Update status for the current node, and reset others to idle
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === kind) {
                return { ...node, data: { ...node.data, status } };
              }
              // If it's not the current node, ensure it's idle
              return { ...node, data: { ...node.data, status: 'idle' } };
            }),
          );
        }

        if (status === 'ready') {
          setCurrentStepKind(kind);

          // Auto-run verify step
          if (kind === 'verify') {
            // Access the state from the currentStep object, NOT the instance definition
            (state as any).execute().catch((err: any) => {
              if (err.message && err.message.includes('No next step')) {
                handleRestart();
              } else {
                console.error(err);
              }
            });
          }
        }
      });

      const firstStepId = activeSteps[0];
      if (firstStepId) {
        const firstInstance = instanceMap.get(firstStepId);
        orchestrator.start(firstInstance);
      }

      return unsub;
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('No next step')) {
        handleRestart();
      } else {
        setIsRunning(false);
      }
    }
  };

  // UI Actions
  const handleInputSubmit = (email: string) => {
    if (orchestratorRef.current) {
      const currentStep = orchestratorRef.current.getCurrentStep();
      if (currentStep && currentStep.kind === 'input') {
        try {
          (currentStep.state as any).submit(email);
        } catch (err: any) {
          if (err.message && err.message.includes('No next step')) {
            handleRestart();
          } else {
            console.error(err);
          }
        }
      }
    }
  };

  const handleProfileSubmit = (name: string, role: string) => {
    if (orchestratorRef.current) {
      const currentStep = orchestratorRef.current.getCurrentStep();
      if (currentStep && currentStep.kind === 'profile') {
        try {
          (currentStep.state as any).submitProfile(name, role);
        } catch (err: any) {
          if (err.message && err.message.includes('No next step')) {
            handleRestart();
          } else {
            console.error(err);
          }
        }
      }
    }
  };

  const handlePlanSelect = (plan: string) => {
    if (orchestratorRef.current) {
      const currentStep = orchestratorRef.current.getCurrentStep();
      if (currentStep && currentStep.kind === 'plan') {
        try {
          (currentStep.state as any).selectPlan(plan);
        } catch (err: any) {
          if (err.message && err.message.includes('No next step')) {
            handleRestart();
          } else {
            console.error(err);
          }
        }
      }
    }
  };

  const handleBack = () => {
    if (orchestratorRef.current) {
      try {
        orchestratorRef.current.goBack();
      } catch (err) {
        console.error('Back navigation failed:', err);
      }
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setCurrentStepKind(null);
    setCanGoBack(false);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    if (orchestratorRef.current) {
      orchestratorRef.current.stop();
      orchestratorRef.current = null;
    }
  };

  function captialize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const generateCode = () => {
    const stepDefs = activeSteps.map((id) => `const ${captialize(id)} = step({ kind: '${id}' }, ...);`).join('\n');
    const creations = activeSteps.map((id) => `const ${id} = ${captialize(id)}();`).join('\n');
    const registrations = `flow.register([${activeSteps.join(', ')}])`;
    const connections = activeSteps
      .slice(0, -1)
      .map((id, i) => {
        const nextId = activeSteps[i + 1];
        if (useConditional && id === 'input' && nextId === 'verify') {
          return `    .connect(conditionalEdge(${id}, ${nextId}, 'true'))`;
        }
        return `    .connect(${id}, ${nextId})`;
      })
      .join('\n');

    return `import { workflow, step, conditionalEdge } from '@motif-ts/core';

// Your Workflow Definition
${stepDefs}

${creations}

const flow = workflow([${activeSteps.map((id) => captialize(id)).join(', ')}]);

${registrations}
${connections}
    .start();`;
  };

  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Build in Seconds"
          description="Compose workflows visually or with code. motif-ts keeps them in sync."
        />

        <div className="grid h-[750px] gap-8 md:grid-cols-2">
          {/* Visual Builder */}
          <GlassPanel className="relative flex flex-col overflow-hidden border-gray-800">
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
              {STEPS_INFO.map((step) => (
                <motion.button
                  key={step.id}
                  onClick={() => addStep(step.id)}
                  disabled={activeSteps.includes(step.id)}
                  animate={errorShake === step.id ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cn('rounded-full border px-3 py-1 text-sm backdrop-blur-md transition-all', {
                    'border-red-500 bg-red-500/20 text-red-400': errorShake === step.id,
                    'cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500':
                      activeSteps.includes(step.id) && errorShake !== step.id,
                    'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20':
                      !activeSteps.includes(step.id) && errorShake !== step.id,
                  })}
                >
                  + {step.label}
                </motion.button>
              ))}
              {activeSteps.length > 0 && (
                <button
                  onClick={resetBuilder}
                  className="rounded-full border border-red-500/50 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                  title="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative flex-1 bg-[#0a0c10]">
              {activeSteps.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-600">
                  <p>Add steps to start building...</p>
                </div>
              )}
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#333" gap={20} size={1} />
              </ReactFlow>
            </div>

            <div className="z-10 flex items-center justify-between border-t border-gray-800 bg-black/40 p-4 backdrop-blur-md">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <input
                  type="checkbox"
                  checked={useConditional}
                  onChange={(e) => setUseConditional(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                Use Conditional Edge
              </label>

              <Button
                onClick={runWorkflow}
                disabled={activeSteps.length === 0 || isRunning}
                variant="primary"
                className={cn(activeSteps.length === 0 || isRunning ? 'bg-gray-800 text-gray-500' : '')}
              >
                <Play className="mr-2 h-4 w-4" />
                {isRunning ? 'Running...' : 'Run Workflow'}
              </Button>
            </div>
          </GlassPanel>

          {/* Right Panel: Flip Card (Code vs Live Preview) */}
          <div className="group relative h-full" style={{ perspective: '1000px' }}>
            <motion.div
              className="relative h-full w-full"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isRunning ? 180 : 0 }}
              transition={{
                duration: 0.6,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
            >
              {/* Front Face: Generated Code */}
              <GlassPanel
                className="absolute inset-0 flex flex-col overflow-hidden border-gray-800 bg-[#0a0c10]"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-center gap-2 border-b border-gray-800 bg-white/5 px-6 py-4 font-medium text-gray-500">
                  <Code className="h-4 w-4" />
                  Generated Code
                </div>
                <div className="flex-1 overflow-auto p-6">
                  <CodeBlock code={generateCode()} />
                </div>
              </GlassPanel>

              {/* Back Face: Live Preview (Mobile Simulator) */}
              <GlassPanel
                className="absolute inset-0 flex flex-col overflow-hidden border-gray-800 bg-black"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="flex items-center justify-between border-b border-gray-800 bg-blue-500/10 px-6 py-4 font-medium text-white">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-400" />
                    Live Preview
                  </div>
                  <button
                    onClick={handleRestart}
                    className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700"
                  >
                    Stop & Flip Back
                  </button>
                </div>

                <div className="relative flex flex-1 items-center justify-center bg-linear-to-br from-gray-900 to-black p-8">
                  {/* Mobile Device Frame */}
                  <div className="relative mx-auto flex h-[630px] w-[300px] flex-col overflow-hidden rounded-[3rem] border-12 border-gray-800 bg-gray-900 shadow-2xl ring-1 ring-white/5">
                    {/* Status Bar */}
                    <div className="z-10 flex h-12 w-full items-center justify-between px-6 pt-4 text-[10px] text-white">
                      <span className="pl-1 font-medium">9:41</span>
                    </div>

                    {/* Navigation Bar */}
                    <div className="relative z-10 flex h-10 w-full items-center px-4">
                      {canGoBack && (
                        <button
                          onClick={handleBack}
                          className="flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </button>
                      )}
                    </div>

                    {/* Screen Content */}
                    <div className="relative flex flex-1 flex-col overflow-hidden bg-gray-950">
                      <AnimatePresence mode="wait">
                        {isRunning && currentStepKind === 'input' && (
                          <motion.div
                            key="input"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
                          >
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
                              <Mail className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-white">Welcome Back</h2>
                            <p className="mb-8 text-sm text-gray-400">Enter your email to access your workspace.</p>

                            <form
                              className="space-y-4"
                              onSubmit={(e) => {
                                e.preventDefault();
                                // @ts-expect-error
                                handleInputSubmit(e.target.email.value);
                              }}
                            >
                              <div>
                                <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">EMAIL</label>
                                <input
                                  name="email"
                                  type="email"
                                  placeholder="name@example.com"
                                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  defaultValue="hello@zhongliang.wang"
                                />
                              </div>

                              <Button type="submit" variant="white" className="w-full">
                                Continue <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </form>
                          </motion.div>
                        )}

                        {isRunning && currentStepKind === 'verify' && (
                          <motion.div
                            key="verify"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 text-center"
                          >
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />
                              <Loader2 className="relative z-10 h-12 w-12 animate-spin text-blue-500" />
                            </div>
                            <h3 className="mt-8 mb-2 font-semibold text-white">Verifying...</h3>
                            <p className="text-xs tracking-wider text-gray-500 uppercase">Secure Connection</p>
                          </motion.div>
                        )}

                        {isRunning && currentStepKind === 'profile' && (
                          <motion.div
                            key="profile"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
                          >
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
                              <User className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-white">Your Profile</h2>
                            <p className="mb-8 text-sm text-gray-400">Tell us a bit about yourself.</p>

                            <form
                              className="space-y-4"
                              onSubmit={(e) => {
                                e.preventDefault();
                                // @ts-expect-error
                                handleProfileSubmit(e.target.name.value, e.target.role.value);
                              }}
                            >
                              <div>
                                <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">NAME</label>
                                <input
                                  name="name"
                                  type="text"
                                  placeholder="John Doe"
                                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                                  defaultValue="Zhongliang Wang"
                                />
                              </div>
                              <div>
                                <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">ROLE</label>
                                <input
                                  name="role"
                                  type="text"
                                  placeholder="Developer"
                                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                                  defaultValue="Engineer"
                                />
                              </div>

                              <Button type="submit" variant="white" className="w-full">
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            </form>
                          </motion.div>
                        )}

                        {isRunning && currentStepKind === 'plan' && (
                          <motion.div
                            key="plan"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
                          >
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-green-600 to-teal-600 shadow-lg shadow-green-500/20">
                              <CreditCard className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-white">Select Plan</h2>
                            <p className="mb-8 text-sm text-gray-400">Choose a plan that fits your needs.</p>

                            <div className="space-y-3">
                              {['Free', 'Pro', 'Team'].map((plan) => (
                                <Button
                                  key={plan}
                                  variant="secondary"
                                  onClick={() => handlePlanSelect(plan)}
                                  className="group w-full justify-between border-gray-800 bg-gray-900 p-4 hover:border-green-500/50 hover:bg-gray-800"
                                >
                                  <span className="font-medium text-white">{plan}</span>
                                  <ChevronRight className="h-4 w-4 text-gray-600 transition-colors group-hover:text-green-500" />
                                </Button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {isRunning && currentStepKind === 'success' && (
                          <motion.div
                            key="success"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-green-950/30 to-black p-6 text-center"
                          >
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                              <Check className="h-10 w-10 text-green-500" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-white">All Set!</h3>
                            <div className="mb-8 space-y-1 text-sm text-gray-400">
                              <p>
                                Welcome, <span className="font-medium text-white">{workflowData?.name || 'User'}</span>
                              </p>
                              <p>
                                Role: <span className="text-white">{workflowData?.role || 'N/A'}</span>
                              </p>
                              <p>
                                Plan: <span className="text-white">{workflowData?.plan || 'N/A'}</span>
                              </p>
                              <p className="mt-2 text-xs text-gray-500">{workflowData?.email}</p>
                            </div>

                            <Button
                              onClick={handleRestart}
                              variant="secondary"
                              className="rounded-full bg-gray-900 px-8 py-3 hover:bg-gray-800"
                            >
                              Start Over
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-800" />
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
