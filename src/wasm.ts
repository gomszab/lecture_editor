import { render_step_scan, render_step_render } from "step-renderer";
import { parse_lecture_yaml, assemble_lecture_spa, collect_diagnostics } from "lecture-assembler";

let _wasmReady = false;

export async function initWasm(): Promise<boolean> {
  try {
    // wasm-pack 0.14 bundler target: WASM is initialized automatically
    // by the module instantiation — no init() call required
    _wasmReady = true;
    console.log("[wasm] ready");
    return true;
  } catch (err) {
    console.warn("[wasm] unavailable:", err);
    return false;
  }
}

export const isWasmReady = () => _wasmReady;

export function renderStepScan(md: string, base: string) {
  return render_step_scan(md, base);
}
export function renderStepRender(md: string, base: string, assets: string) {
  return render_step_render(md, base, assets);
}