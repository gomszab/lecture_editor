import {
  LectureEntry, scanWorkspace, loadLecture,
  createLanguage, createStep, deleteStep, renameStep, reorderSteps,
} from "../commands.js";
import { showModal, showConfirm } from "./modal.js";

export interface TreeSelection {
  type: "lecture" | "lang" | "step";
  lecturePath: string;
  lang?: string;
  filename?: string;
  lectureYamlPath?: string;
}

export type OnSelectCallback = (sel: TreeSelection) => void;
export type OnMutateCallback = () => void;

let _contentPath = "";
let _entries: LectureEntry[] = [];
let _onSelect: OnSelectCallback | null = null;
let _onMutate: OnMutateCallback | null = null;
let _active: TreeSelection | null = null;

const sidebar = document.getElementById("sidebar")!;
const ctxMenu = document.getElementById("context-menu")!;

export function init(cp: string, onSel: OnSelectCallback, onMut: OnMutateCallback): void {
  _contentPath = cp; _onSelect = onSel; _onMutate = onMut;
  refresh();
}

export async function refresh(): Promise<void> {
  try {
    _entries = await scanWorkspace(_contentPath);
    await renderTree();
  } catch (e) { sidebar.innerHTML = `<div class="tree-empty">Error: ${e}</div>`; }
}

async function renderTree(): Promise<void> {
  if (_entries.length === 0) {
    sidebar.innerHTML = `<div class="tree-empty">No lectures found.</div>`;
    return;
  }
  sidebar.innerHTML = "";
  for (const entry of _entries) {
    const lp = `${_contentPath}/${entry.slug}`;
    sidebar.appendChild(mkNode(`\u{1F4DA} ${entry.slug}`, "tree-node tree-lecture",
      { type: "lecture", lecturePath: lp }));
    for (const lang of entry.languages) {
      const yp = `${lp}/${lang}/lecture.yaml`;
      sidebar.appendChild(mkNode(`\u{1F310} ${lang}`, "tree-node tree-lang",
        { type: "lang", lecturePath: lp, lang, lectureYamlPath: yp }));
      try {
        const lecture = await loadLecture(yp);
        for (const step of lecture.steps) {
          const sel: TreeSelection = { type: "step", lecturePath: lp, lang, filename: step.filename, lectureYamlPath: yp };
          const el = mkNode(`\u{1F4C4} ${step.title}`, "tree-node tree-step", sel);
          if (_active?.type === "step" && _active.filename === step.filename
              && _active.lang === lang && _active.lecturePath === lp)
            el.classList.add("active");
          sidebar.appendChild(el);
        }
      } catch { /* no-op */ }
    }
  }
}

function mkNode(text: string, cls: string, sel: TreeSelection): HTMLElement {
  const el = document.createElement("div");
  el.className = cls; el.title = text; el.textContent = text;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.querySelectorAll(".tree-node.active").forEach(n => n.classList.remove("active"));
    el.classList.add("active"); _active = sel; _onSelect?.(sel);
  });
  el.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); openCtx(e as MouseEvent, sel); });
  return el;
}

function openCtx(e: MouseEvent, sel: TreeSelection): void {
  ctxMenu.innerHTML = ""; ctxMenu.style.display = "block";
  ctxMenu.style.left = `${e.clientX}px`; ctxMenu.style.top = `${e.clientY}px`;
  const item = (label: string, fn: () => void) => {
    const d = document.createElement("div"); d.className = "menu-item"; d.textContent = label;
    d.addEventListener("click", () => { hideCtx(); fn(); }); ctxMenu.appendChild(d);
  };
  const sep = () => { const s = document.createElement("div"); s.className = "menu-sep"; ctxMenu.appendChild(s); };
  if (sel.type === "lecture") { item("Add Language", () => doAddLang(sel)); sep(); item("Delete Lecture", () => alert("Remove folder manually.")); }
  else if (sel.type === "lang") { item("Add Step", () => doAddStep(sel)); sep(); item("Delete Language", () => alert("Remove folder manually.")); }
  else { item("Rename", () => doRename(sel)); item("Move Up", () => doMove(sel, "up")); item("Move Down", () => doMove(sel, "down")); sep(); item("Delete", () => doDel(sel)); }
  document.addEventListener("click", hideCtx, { once: true });
}
function hideCtx(): void { ctxMenu.style.display = "none"; }

async function doAddLang(sel: TreeSelection): Promise<void> {
  const r = await showModal("Add Language", [{ label: "Language code", id: "lang", placeholder: "en" }]);
  if (!r) return;
  try { await createLanguage(sel.lecturePath, r.lang); await afterMutate(); } catch (e) { alert(`${e}`); }
}
async function doAddStep(sel: TreeSelection): Promise<void> {
  const r = await showModal("New Step", [
    { label: "Title", id: "title", placeholder: "My Step" },
    { label: "Slug",  id: "slug",  placeholder: "my-step" },
  ]);
  if (!r) return;
  try { await createStep(sel.lecturePath, sel.lang!, r.slug, r.title); await afterMutate(); } catch (e) { alert(`${e}`); }
}
async function doRename(sel: TreeSelection): Promise<void> {
  const r = await showModal("Rename Step", [{ label: "New title", id: "title", placeholder: "" }]);
  if (!r) return;
  try { await renameStep(sel.lecturePath, sel.lang!, sel.filename!, r.title); await afterMutate(); } catch (e) { alert(`${e}`); }
}
async function doDel(sel: TreeSelection): Promise<void> {
  if (!await showConfirm(`Delete step "${sel.filename}"?`)) return;
  try { await deleteStep(sel.lecturePath, sel.lang!, sel.filename!); await afterMutate(); } catch (e) { alert(`${e}`); }
}
async function doMove(sel: TreeSelection, dir: "up" | "down"): Promise<void> {
  if (!sel.lectureYamlPath) return;
  try {
    const lecture = await loadLecture(sel.lectureYamlPath);
    const idx = lecture.steps.findIndex(s => s.filename === sel.filename);
    if (idx < 0) return;
    const ni = dir === "up" ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= lecture.steps.length) return;
    const ord = lecture.steps.map(s => s.filename);
    [ord[idx], ord[ni]] = [ord[ni], ord[idx]];
    await reorderSteps(sel.lectureYamlPath, ord);
    await afterMutate();
  } catch (e) { alert(`${e}`); }
}
async function afterMutate(): Promise<void> { await refresh(); _onMutate?.(); }
