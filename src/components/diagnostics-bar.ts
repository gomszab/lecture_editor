import { Diagnostic, runDiagnostics } from "../commands.js";

const bar = document.getElementById("diagnostics-bar")!;

export async function refreshDiagnostics(lectureYamlPath: string | null): Promise<void> {
  if (!lectureYamlPath) { render([]); return; }
  try {
    render(await runDiagnostics(lectureYamlPath));
  } catch (e) {
    bar.innerHTML = `<span class="diag-error">Diagnostics error: ${e}</span>`;
  }
}

function render(diags: Diagnostic[]): void {
  if (diags.length === 0) {
    bar.innerHTML = `<span class="diag-none">\u2713 No diagnostics.</span>`;
    return;
  }
  bar.innerHTML = diags.map(d => {
    const cls  = d.level === "error" ? "diag-error" : d.level === "warning" ? "diag-warning" : "diag-info";
    const icon = d.level === "error" ? "\u2716" : d.level === "warning" ? "\u26A0" : "\u2139";
    const file = d.step_filename ? ` \u2014 ${d.step_filename}` : "";
    return `<div class="diag-entry ${cls}">${icon} [${d.code}]${file}: ${d.message}</div>`;
  }).join("");
}
