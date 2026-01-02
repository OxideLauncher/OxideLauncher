//! CurseForge API Tauri commands
//!
//! Exposes CurseForge API functions to the frontend.

use crate::api::Result;
use theseus::curseforge::{
    Category, ClassId, CurseForgeFile, CurseForgeMod, FeaturedModsResponse,
    FingerprintsMatchesResult, GameVersionType, GameVersionsByType,
    ModLoaderType, ModSearchParams, PaginatedResponse,
};

pub fn init<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("curseforge")
        .invoke_handler(tauri::generate_handler![
            curseforge_search_mods,
            curseforge_get_mod,
            curseforge_get_mods,
            curseforge_get_mod_files,
            curseforge_get_mod_file,
            curseforge_get_categories,
            curseforge_get_featured_mods,
            curseforge_match_fingerprints,
            curseforge_get_mod_description,
            curseforge_get_game_versions,
            curseforge_get_game_version_types,
            curseforge_get_file_download_url,
            curseforge_install_file,
        ])
        .build()
}

/// Search for mods on CurseForge
#[tauri::command]
pub async fn curseforge_search_mods(
    params: ModSearchParams,
) -> Result<PaginatedResponse<CurseForgeMod>> {
    Ok(theseus::curseforge::search(&params).await?)
}

/// Get a single mod by ID
#[tauri::command]
pub async fn curseforge_get_mod(mod_id: i32) -> Result<CurseForgeMod> {
    Ok(theseus::curseforge::get_single_mod(mod_id).await?)
}

/// Get multiple mods by their IDs
#[tauri::command]
pub async fn curseforge_get_mods(
    mod_ids: Vec<i32>,
) -> Result<Vec<CurseForgeMod>> {
    Ok(theseus::curseforge::get_multiple_mods(mod_ids).await?)
}

/// Get files for a specific mod
#[tauri::command]
pub async fn curseforge_get_mod_files(
    mod_id: i32,
    game_version: Option<String>,
    mod_loader_type: Option<String>,
    index: Option<u32>,
    page_size: Option<u32>,
) -> Result<PaginatedResponse<CurseForgeFile>> {
    let loader = mod_loader_type.as_deref().map(ModLoaderType::from_str);

    Ok(theseus::curseforge::get_files_for_mod(
        mod_id,
        game_version.as_deref(),
        loader,
        index,
        page_size,
    )
    .await?)
}

/// Get a specific file for a mod
#[tauri::command]
pub async fn curseforge_get_mod_file(
    mod_id: i32,
    file_id: i32,
) -> Result<CurseForgeFile> {
    Ok(theseus::curseforge::get_single_file(mod_id, file_id).await?)
}

/// Get CurseForge categories for Minecraft
#[tauri::command]
pub async fn curseforge_get_categories(
    class_id: Option<i32>,
) -> Result<Vec<Category>> {
    let class = class_id.and_then(ClassId::from_i32);
    Ok(theseus::curseforge::get_all_categories(class).await?)
}

/// Get featured mods for Minecraft
#[tauri::command]
pub async fn curseforge_get_featured_mods(
    game_version_type_id: Option<i32>,
    excluded_mod_ids: Option<Vec<i32>>,
) -> Result<FeaturedModsResponse> {
    Ok(theseus::curseforge::get_featured(
        game_version_type_id,
        excluded_mod_ids,
    )
    .await?)
}

/// Match fingerprints to find mods by file hash
#[tauri::command]
pub async fn curseforge_match_fingerprints(
    fingerprints: Vec<i64>,
) -> Result<FingerprintsMatchesResult> {
    Ok(theseus::curseforge::fingerprint_match(fingerprints).await?)
}

/// Get mod description (HTML content)
#[tauri::command]
pub async fn curseforge_get_mod_description(mod_id: i32) -> Result<String> {
    Ok(theseus::curseforge::get_description(mod_id).await?)
}

/// Get Minecraft game versions from CurseForge
#[tauri::command]
pub async fn curseforge_get_game_versions() -> Result<Vec<GameVersionsByType>> {
    Ok(theseus::curseforge::get_mc_versions().await?)
}

/// Get Minecraft game version types from CurseForge
#[tauri::command]
pub async fn curseforge_get_game_version_types() -> Result<Vec<GameVersionType>>
{
    Ok(theseus::curseforge::get_mc_version_types().await?)
}

/// Get file download URL
#[tauri::command]
pub async fn curseforge_get_file_download_url(
    mod_id: i32,
    file_id: i32,
) -> Result<String> {
    Ok(theseus::curseforge::get_download_url(mod_id, file_id).await?)
}

/// Install a CurseForge project to a profile
#[tauri::command]
pub async fn curseforge_install_file(
    profile_path: String,
    mod_id: i32,
    file_id: i32,
) -> Result<String> {
    Ok(
        theseus::profile::add_curseforge_project(
            &profile_path,
            mod_id,
            file_id,
        )
        .await?,
    )
}
