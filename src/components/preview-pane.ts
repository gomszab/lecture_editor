import { readFile } from "../commands.js";
import { isWasmReady, renderStepScan, renderStepRender } from "../wasm.js";

const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement;

interface IncludeDirective {
  src_raw: string;
  resolved_path: string;
}

export async function updatePreview(
  markdown: string,
  stepFilePath: string,
): Promise<void> {
  // Support both Windows and POSIX separators
  const parts = stepFilePath.split(/[\\/]/);
  const stepsIdx = parts.lastIndexOf("steps");
  const basePath =
    stepsIdx > 0 ? parts.slice(0, stepsIdx).join("/") : parts.slice(0, -1).join("/");

  if (!isWasmReady()) {
    iframe.srcdoc = fallback(markdown);
    return;
  }

  try {
    const scanJson = renderStepScan(markdown, basePath);
    let assetsJson = "{}";

    if (scanJson) {
      const scan = JSON.parse(scanJson) as { includes: IncludeDirective[] };

      if (Array.isArray(scan.includes) && scan.includes.length > 0) {
        const assets: Record<string, string> = {};

        await Promise.all(
          scan.includes.map(async (inc) => {
            // inc is an IncludeDirective, not a string
            const full = inc.resolved_path;
            try {
              // Use the resolved OS path for the Tauri fs backend
              assets[inc.resolved_path] = await readFile(full);
            } catch {
              // Keep a visible marker; diagnostics pipeline will report the real error
              assets[inc.resolved_path] = `_include not found: ${inc.src_raw}_`;
            }
          }),
        );

        assetsJson = JSON.stringify(assets);
      }
    }

    const html = renderStepRender(markdown, basePath, assetsJson);
    iframe.srcdoc = html ? wrap(html) : fallback(markdown);
  } catch (e) {
    console.error("[preview]", e);
    iframe.srcdoc = fallback(markdown);
  }
}

function wrap(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:system-ui,sans-serif;padding:16px;font-size:14px;line-height:1.6}
pre{background:#f4f4f4;padding:12px;border-radius:4px;overflow-x:auto}
code{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:13px}
pre code{background:transparent;padding:0}
</style>
</head><body>${body}</body></html>`;
}

function fallback(md: string): string {
  const esc = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = esc
    .split("\n")
    .map((l) => {
      if (l.startsWith("# ")) return `<h1>${l.slice(2)}</h1>`;
      if (l.startsWith("## ")) return `<h2>${l.slice(3)}</h2>`;
      if (l.startsWith("### ")) return `<h3>${l.slice(4)}</h3>`;
      if (l.trim() === "") return "<br>";
      return `<p>${l}</p>`;
    })
    .join("\n");
  return wrap(
    `<div style="color:#888;font-size:11px;margin-bottom:8px">[WASM unavailable — plain text preview]</div>${html}`,
  );
}