import { open } from "@tauri-apps/plugin-dialog";
import { createLecture, regenerateManifest } from "./commands.js";
import { initEditor, openFile, saveCurrentFile } from "./components/editor-pane.js";
import { updatePreview } from "./components/preview-pane.js";
import { init as initTree } from "./components/workspace-tree.js";
import type { TreeSelection } from "./components/workspace-tree.js";
import { refreshDiagnostics } from "./components/diagnostics-bar.js";
import { showModal } from "./components/modal.js";
import { initWasm } from "./wasm.js";

let _contentPath = "";
let _activeLectureYamlPath: string | null = null;

export async function initApp(): Promise<void> {
  await initWasm();
  bindToolbar();
  initEditor(onEditorChange);
}

function bindToolbar(): void {
  document.getElementById("btn-open")!.addEventListener("click", handleOpen);
  document.getElementById("btn-new-lecture")!.addEventListener("click", handleNewLecture);
  document.getElementById("btn-save")!.addEventListener("click", () => saveCurrentFile());
  document.getElementById("btn-diagnostics")!.addEventListener("click", () =>
    refreshDiagnostics(_activeLectureYamlPath));
  document.getElementById("btn-new-step")!.addEventListener("click", handleNewStep);
}

async function handleOpen(): Promise<void> {
  const selected = await open({ directory: true, multiple: false, title: "Open content/ folder" });
  if (!selected || typeof selected !== "string") return;
  _contentPath = selected;
  document.getElementById("workspace-label")!.textContent = selected;
  initTree(selected, onTreeSelect, onTreeMutate);
}

async function handleNewLecture(): Promise<void> {
  if (!_contentPath) { alert("Open a workspace first."); return; }
  const r = await showModal("New Lecture", [
    { label: "Title",          id: "title", placeholder: "Rust Intro" },
    { label: "Slug (URL-safe)",id: "slug",  placeholder: "rust-intro" },
    { label: "Language code",  id: "lang",  placeholder: "en" },
  ]);
  if (!r) return;
  try {
    await createLecture(_contentPath, r.slug, r.lang, r.title);
    await regenerateManifest(_contentPath, `${_contentPath}/../manifest.json`);
    initTree(_contentPath, onTreeSelect, onTreeMutate);
  } catch (e) { alert(`Error creating lecture: ${e}`); }
}

async function handleNewStep(): Promise<void> {
  if (!_activeLectureYamlPath) { alert("Select a lecture/language first."); return; }
  // extract lang + lecturePath from lecture.yaml path
  const parts = _activeLectureYamlPath.split("/");
  const yi = parts.indexOf("lecture.yaml");
  if (yi < 2) return;
  const lang = parts[yi - 1];
  const lecturePath = parts.slice(0, yi - 1).join("/");

  const r = await showModal("New Step", [
    { label: "Title", id: "title", placeholder: "New Step" },
    { label: "Slug",  id: "slug",  placeholder: "new-step"  },
  ]);
  if (!r) return;
  const { createStep } = await import("./commands.js");
  try {
    await createStep(lecturePath, lang, r.slug, r.title);
    initTree(_contentPath, onTreeSelect, onTreeMutate);
  } catch (e) { alert(`Error creating step: ${e}`); }
}

async function onTreeSelect(sel: TreeSelection): Promise<void> {
  if (sel.type === "step" && sel.filename) {
    const stepPath = `${sel.lecturePath}/${sel.lang}/steps/${sel.filename}`;
    await openFile(stepPath);
    _activeLectureYamlPath = sel.lectureYamlPath ?? null;
    await refreshDiagnostics(_activeLectureYamlPath);
  } else if (sel.type === "lang" && sel.lectureYamlPath) {
    _activeLectureYamlPath = sel.lectureYamlPath;
    await openFile(sel.lectureYamlPath);
    await refreshDiagnostics(_activeLectureYamlPath);
  }
}

function onTreeMutate(): void {
  if (_contentPath) {
    regenerateManifest(_contentPath, `${_contentPath}/../manifest.json`)
      .catch(console.warn);
  }
  refreshDiagnostics(_activeLectureYamlPath);
}

async function onEditorChange(content: string, path: string): Promise<void> {
  if (path.endsWith(".md")) await updatePreview(content, path);
}
