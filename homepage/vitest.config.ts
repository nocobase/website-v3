import { defineConfig } from 'vitest/config';

// 官网的测试和共用包 packages/shared 的测试一起跑（pnpm test，根目录的 pnpm homepage:test）。
export default defineConfig({
  test: {
    include: ['src/**/*.test.{mjs,ts}', 'scripts/**/*.test.{mjs,ts}', '../packages/shared/src/**/*.test.{mjs,ts}'],
  },
});
