import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { readFile, writeFile } from "../commands.js";

export type OnChangeCallback = (content: string, path: string) => void;

let _view: EditorView | null = null;
let _currentPath = "";
let _dirty = false;
let _timer: ReturnType<typeof setTimeout> | null = null;
let _onChange: OnChangeCallback | null = null;

const titleEl  = document.getElementById("editor-title")!;
const saveBtn  = document.getElementById("btn-save")    as HTMLButtonElement;
const newStepBtn = document.getElementById("btn-new-step") as HTMLButtonElement;

export function initEditor(onChange: OnChangeCallback): void {
  _onChange = onChange;
  _view = new EditorView({
    extensions: [
      basicSetup,
      markdown(),
      oneDark,
      EditorView.updateListener.of((u) => {
        if (!u.docChanged) return;
        _dirty = true;
        saveBtn.disabled = false;
        if (_timer) clearTimeout(_timer);
        _timer = setTimeout(() => _onChange?.(getContent(), _currentPath), 300);
      }),
    ],
    parent: document.getElementById("editor-container")!,
  });
}

export async function openFile(path: string): Promise<void> {
  if (!_view) return;
  try {
    const content = await readFile(path);
    _currentPath = path;
    _dirty = false;
    saveBtn.disabled = true;
    newStepBtn.disabled = false;
    titleEl.textContent = path.split("/").slice(-3).join("/");
    _view.dispatch({ changes: { from: 0, to: _view.state.doc.length, insert: content } });
  } catch (e) { titleEl.textContent = `Error: ${e}`; }
}

export async function saveCurrentFile(): Promise<void> {
  if (!_currentPath || !_dirty) return;
  try {
    await writeFile(_currentPath, getContent());
    _dirty = false;
    saveBtn.disabled = true;
  } catch (e) { alert(`Save failed: ${e}`); }
}

export function getContent(): string {
  return _view?.state.doc.toString() ?? "";
}

export function getCurrentPath(): string { return _currentPath; }

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveCurrentFile(); }
});
