import { type StepInstance } from '../step/types';
import { createEdge } from './factory';

export const conditionalEdge = createEdge(
  <I, O extends I>(
    from: StepInstance<any, O, any, any, any>,
    to: StepInstance<I, any, any, any, any>,
    predicate: (outputFrom: O) => boolean,
    unidirectional = false,
  ) => {
    return {
      kind: 'conditional',
      from,
      to,
      unidirectional,
      validateTransition(outputFrom: O) {
        const ok = predicate(outputFrom);
        return ok ? { allow: true, nextInput: outputFrom } : { allow: false };
      },
    };
  },
);

export const transformEdge = createEdge(
  <I, O>(
    from: StepInstance<any, O, any, any, any>,
    to: StepInstance<I, any, any, any, any>,
    transform: (outputFrom: O) => I,
    unidirectional = false,
  ) => {
    return {
      kind: 'transform',
      from,
      to,
      unidirectional,
      validateTransition(outputFrom: O) {
        try {
          const convertedRaw = transform(outputFrom);
          if (convertedRaw === undefined) {
            throw new Error('result is undefined');
          }
          const converted = convertedRaw as I;
          return { allow: true as const, nextInput: converted };
        } catch (e: any) {
          // Handle conversion errors explicitly
          const msg = e?.message ?? String(e);
          throw new Error(`TransformEdge: failed to convert output -> input. Reason: ${msg}`);
        }
      },
    };
  },
);
