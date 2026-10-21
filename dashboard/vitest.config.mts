import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.join(import.meta.dirname, "src"),
      // "server-only" só pode ser importado dentro do Next; nos testes vira um módulo vazio.
      "server-only": path.join(import.meta.dirname, "tests", "stubs", "server-only.ts"),
    },
  },
});
