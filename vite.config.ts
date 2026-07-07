import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),          // ← explicitly anchor to vite.config.ts location
  plugins: [wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "step-renderer":     path.resolve(__dirname, "../../../pkg/step_renderer_bundler"),
      "lecture-assembler": path.resolve(__dirname, "../../../pkg/lecture_assembler_bundler"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
    fs: {
      allow: [
        path.resolve(__dirname),                            // editor/ itself
        path.resolve(__dirname, "../../pkg"),               // pkg/ for WASM
      ],
    },
  },
  clearScreen: false,
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    target: ["es2021", "chrome100", "safari13"],
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});