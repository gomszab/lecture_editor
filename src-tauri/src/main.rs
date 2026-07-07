#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_commands as cmd;

 #[tauri::command(rename_all = "snake_case")]
fn scan_workspace(content_path: String) -> Result<Vec<cmd::LectureEntry>, String> {
    cmd::scan_workspace(content_path)
}

 #[tauri::command(rename_all = "snake_case")]
fn load_lecture(lecture_yaml_path: String) -> Result<md_core::LectureYaml, String> {
    cmd::load_lecture(lecture_yaml_path)
}

 #[tauri::command(rename_all = "snake_case")]
fn save_lecture(lecture_yaml_path: String, lecture: md_core::LectureYaml) -> Result<(), String> {
    cmd::save_lecture(lecture_yaml_path, lecture)
}

 #[tauri::command(rename_all = "snake_case")]
fn regenerate_manifest(content_path: String, manifest_path: String) -> Result<(), String> {
    cmd::regenerate_manifest(content_path, manifest_path)
}

 #[tauri::command(rename_all = "snake_case")]
fn read_file(path: String) -> Result<String, String> { cmd::read_file(path) }

 #[tauri::command(rename_all = "snake_case")]
fn write_file(path: String, content: String) -> Result<(), String> { cmd::write_file(path, content) }

 #[tauri::command(rename_all = "snake_case")]
fn list_dir(path: String) -> Result<Vec<cmd::FileEntry>, String> { cmd::list_dir(path) }

 #[tauri::command(rename_all = "snake_case")]
fn create_lecture(content_path: String, slug: String, lang: String, title: String) -> Result<(), String> {
    cmd::create_lecture(content_path, slug, lang, title)
}

 #[tauri::command(rename_all = "snake_case")]
fn create_language(lecture_path: String, lang: String) -> Result<(), String> {
    cmd::create_language(lecture_path, lang)
}

 #[tauri::command(rename_all = "snake_case")]
fn create_step(lecture_path: String, lang: String, slug: String, title: String) -> Result<(), String> {
    cmd::create_step(lecture_path, lang, slug, title)
}

 #[tauri::command(rename_all = "snake_case")]
fn delete_step(lecture_path: String, lang: String, filename: String) -> Result<(), String> {
    cmd::delete_step(lecture_path, lang, filename)
}

 #[tauri::command(rename_all = "snake_case")]
fn rename_step(lecture_path: String, lang: String, filename: String, new_title: String) -> Result<(), String> {
    cmd::rename_step(lecture_path, lang, filename, new_title)
}

 #[tauri::command(rename_all = "snake_case")]
fn reorder_steps(lecture_yaml_path: String, ordered_filenames: Vec<String>) -> Result<(), String> {
    cmd::reorder_steps(lecture_yaml_path, ordered_filenames)
}

 #[tauri::command(rename_all = "snake_case")]
fn run_diagnostics(lecture_yaml_path: String) -> Result<Vec<md_core::Diagnostic>, String> {
    cmd::run_diagnostics(lecture_yaml_path)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_workspace, load_lecture, save_lecture, regenerate_manifest,
            read_file, write_file, list_dir,
            create_lecture, create_language, create_step,
            delete_step, rename_step, reorder_steps, run_diagnostics,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}