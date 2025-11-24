import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/edge/non-serializable.ts', 'src/edge/serializable.ts', 'src/edge/factory.ts'],
  exports: true,
});
