import { invoke } from "@tauri-apps/api/core";

export interface StepMeta { filename: string; title: string; slug: string; }
export interface LectureMeta { title: string; slug: string; lang: string; description?: string; }
export interface LectureYaml { lecture: LectureMeta; steps: StepMeta[]; }
export interface LectureEntry { slug: string; languages: string[]; }
export interface FileEntry { name: string; path: string; is_dir: boolean; }
export type DiagnosticLevel = "error" | "warning";
export type DiagnosticCode =
  | "BROKEN_INCLUDE" | "BROKEN_INTERNAL_LINK" | "MISSING_STEP_METADATA"
  | "INVALID_INCLUDE_PATH" | "NESTED_INCLUDE_DISALLOWED" | "MISSING_REQUIRED_FIELD";
export interface Diagnostic {
  level: DiagnosticLevel; code: DiagnosticCode; message: string; step_filename?: string;
}

export const scanWorkspace = (contentPath: string) =>
  invoke<LectureEntry[]>("scan_workspace", { content_path: contentPath });

export const loadLecture = (lectureYamlPath: string) =>
  invoke<LectureYaml>("load_lecture", { lecture_yaml_path: lectureYamlPath });

export const saveLecture = (lectureYamlPath: string, lecture: LectureYaml) =>
  invoke<void>("save_lecture", { lecture_yaml_path: lectureYamlPath, lecture });

export const regenerateManifest = (contentPath: string, manifestPath: string) =>
  invoke<void>("regenerate_manifest", { content_path: contentPath, manifest_path: manifestPath });

export const readFile = (path: string) =>
  invoke<string>("read_file", { path });

export const writeFile = (path: string, content: string) =>
  invoke<void>("write_file", { path, content });

export const listDir = (path: string) =>
  invoke<FileEntry[]>("list_dir", { path });

export const createLecture = (contentPath: string, slug: string, lang: string, title: string) =>
  invoke<void>("create_lecture", { content_path: contentPath, slug, lang, title });

export const createLanguage = (lecturePath: string, lang: string) =>
  invoke<void>("create_language", { lecture_path: lecturePath, lang });

export const createStep = (lecturePath: string, lang: string, slug: string, title: string) =>
  invoke<void>("create_step", { lecture_path: lecturePath, lang, slug, title });

export const deleteStep = (lecturePath: string, lang: string, filename: string) =>
  invoke<void>("delete_step", { lecture_path: lecturePath, lang, filename });

export const renameStep = (lecturePath: string, lang: string, filename: string, newTitle: string) =>
  invoke<void>("rename_step", { lecture_path: lecturePath, lang, filename, new_title: newTitle });

export const reorderSteps = (lectureYamlPath: string, orderedFilenames: string[]) =>
  invoke<void>("reorder_steps", { lecture_yaml_path: lectureYamlPath, ordered_filenames: orderedFilenames });

export const runDiagnostics = (lectureYamlPath: string) =>
  invoke<Diagnostic[]>("run_diagnostics", { lecture_yaml_path: lectureYamlPath });