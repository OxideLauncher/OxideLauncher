//! CurseForge API client
//!
//! Provides functions for interacting with the CurseForge REST API.

pub mod types;

use crate::LAUNCHER_USER_AGENT;
use crate::state::Settings;
use crate::util::fetch::FetchSemaphore;
use bytes::Bytes;
use reqwest::Method;
use serde::de::DeserializeOwned;
use sqlx::SqlitePool;
use std::sync::LazyLock;
use std::time;

pub use types::*;

/// The default CurseForge API URL
const CURSEFORGE_API_URL: &str = "https://api.curseforge.com/v1/";

/// CurseForge-specific HTTP client
static CF_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    let mut headers = reqwest::header::HeaderMap::new();
    let header =
        reqwest::header::HeaderValue::from_str(LAUNCHER_USER_AGENT).unwrap();
    headers.insert(reqwest::header::USER_AGENT, header);
    reqwest::Client::builder()
        .tcp_keepalive(Some(time::Duration::from_secs(10)))
        .default_headers(headers)
        .build()
        .expect("CurseForge Reqwest Client Building Failed")
});

const FETCH_ATTEMPTS: usize = 3;

/// Default CurseForge API key for the launcher
/// This key is provided by CurseForge for launcher applications.
/// Users can override this in settings if they have their own key.
const DEFAULT_CURSEFORGE_API_KEY: &str =
    "$2a$10$bL4bIL5pUWqfcO7KQtnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm";

/// Get the CurseForge API key
/// Uses the custom key from settings if available, otherwise uses the default key
pub async fn get_api_key(pool: &SqlitePool) -> crate::Result<String> {
    let settings = Settings::get(pool).await?;

    if let Some(ref custom_key) = settings.curseforge_api_key {
        if !custom_key.is_empty() {
            return Ok(custom_key.clone());
        }
    }

    Ok(DEFAULT_CURSEFORGE_API_KEY.to_string())
}

/// Internal helper to fetch bytes from CurseForge API with authentication
async fn fetch_curseforge_bytes(
    method: Method,
    url: &str,
    body: Option<serde_json::Value>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Bytes> {
    let _permit = fetch_semaphore.0.acquire().await?;
    let api_key = get_api_key(pool).await?;

    for attempt in 1..=(FETCH_ATTEMPTS + 1) {
        let mut req = CF_CLIENT.request(method.clone(), url);

        req = req.header("x-api-key", &api_key);

        if let Some(ref body) = body {
            req = req.json(body);
        }

        let result = req.send().await;
        match result {
            Ok(resp) => {
                if resp.status().is_server_error() && attempt <= FETCH_ATTEMPTS
                {
                    continue;
                }
                if resp.status().is_client_error()
                    || resp.status().is_server_error()
                {
                    let status = resp.status();
                    let error_text = resp.text().await.unwrap_or_default();
                    return Err(crate::ErrorKind::OtherError(format!(
                        "CurseForge API error ({}): {}",
                        status, error_text
                    ))
                    .into());
                }

                let bytes = resp.bytes().await;
                if let Ok(bytes) = bytes {
                    tracing::trace!("Done downloading CurseForge URL {url}");
                    return Ok(bytes);
                } else if attempt <= FETCH_ATTEMPTS {
                    continue;
                } else if let Err(err) = bytes {
                    return Err(err.into());
                }
            }
            Err(_) if attempt <= FETCH_ATTEMPTS => continue,
            Err(err) => {
                return Err(err.into());
            }
        }
    }

    unreachable!()
}

/// Internal helper to fetch JSON from CurseForge API with authentication
async fn fetch_curseforge<T: DeserializeOwned>(
    method: Method,
    endpoint: &str,
    body: Option<serde_json::Value>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<T> {
    let url = format!("{}{}", CURSEFORGE_API_URL, endpoint);
    let bytes =
        fetch_curseforge_bytes(method, &url, body, fetch_semaphore, pool)
            .await?;

    let value = serde_json::from_slice(&bytes)?;
    Ok(value)
}

/// Search for mods/modpacks/etc on CurseForge
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn search_mods(
    params: ModSearchParams,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<PaginatedResponse<CurseForgeMod>> {
    let query = params.to_query_string();
    let endpoint = format!("mods/search?{}", query);

    fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool).await
}

/// Get a single mod by ID
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_mod(
    mod_id: i32,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<CurseForgeMod> {
    let endpoint = format!("mods/{}", mod_id);
    let response: ApiResponse<CurseForgeMod> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get multiple mods by ID
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_mods(
    mod_ids: Vec<i32>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Vec<CurseForgeMod>> {
    if mod_ids.is_empty() {
        return Ok(Vec::new());
    }

    let body = serde_json::json!({
        "modIds": mod_ids
    });

    let response: ApiResponse<Vec<CurseForgeMod>> = fetch_curseforge(
        Method::POST,
        "mods",
        Some(body),
        fetch_semaphore,
        pool,
    )
    .await?;
    Ok(response.data)
}

/// Get a mod by slug
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_mod_by_slug(
    slug: &str,
    class_id: Option<ClassId>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Option<CurseForgeMod>> {
    let mut params = ModSearchParams::new().with_search(slug);
    if let Some(class) = class_id {
        params = params.with_class(class);
    }
    params.page_size = Some(1);
    params.slug = Some(slug.to_string());

    let response = search_mods(params, fetch_semaphore, pool).await?;
    Ok(response.data.into_iter().find(|m| m.slug == slug))
}

/// Get files for a mod
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_mod_files(
    mod_id: i32,
    game_version: Option<&str>,
    mod_loader_type: Option<ModLoaderType>,
    index: Option<u32>,
    page_size: Option<u32>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<PaginatedResponse<CurseForgeFile>> {
    let mut params = vec![];

    if let Some(version) = game_version {
        params.push(format!("gameVersion={}", version));
    }
    if let Some(loader) = mod_loader_type {
        if loader != ModLoaderType::Any {
            params.push(format!("modLoaderType={}", loader as i32));
        }
    }
    if let Some(idx) = index {
        params.push(format!("index={}", idx));
    }
    if let Some(size) = page_size {
        params.push(format!("pageSize={}", size.min(50)));
    }

    let query = if params.is_empty() {
        String::new()
    } else {
        format!("?{}", params.join("&"))
    };

    let endpoint = format!("mods/{}/files{}", mod_id, query);

    fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool).await
}

/// Get a single file
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_file(
    mod_id: i32,
    file_id: i32,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<CurseForgeFile> {
    let endpoint = format!("mods/{}/files/{}", mod_id, file_id);
    let response: ApiResponse<CurseForgeFile> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get multiple files by ID
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_files(
    file_ids: Vec<i32>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Vec<CurseForgeFile>> {
    if file_ids.is_empty() {
        return Ok(Vec::new());
    }

    let body = serde_json::json!({
        "fileIds": file_ids
    });

    let response: ApiResponse<Vec<CurseForgeFile>> = fetch_curseforge(
        Method::POST,
        "mods/files",
        Some(body),
        fetch_semaphore,
        pool,
    )
    .await?;
    Ok(response.data)
}

/// Get file download URL
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_file_download_url(
    mod_id: i32,
    file_id: i32,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<String> {
    let endpoint = format!("mods/{}/files/{}/download-url", mod_id, file_id);
    let response: ApiResponse<String> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get all categories for Minecraft
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_categories(
    class_id: Option<ClassId>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Vec<Category>> {
    let mut params = vec![format!("gameId={}", MINECRAFT_GAME_ID)];

    if let Some(class) = class_id {
        params.push(format!("classId={}", class as i32));
    }

    let endpoint = format!("categories?{}", params.join("&"));

    let response: ApiResponse<Vec<Category>> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get featured mods
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_featured_mods(
    game_version_type_id: Option<i32>,
    excluded_mod_ids: Option<Vec<i32>>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<FeaturedModsResponse> {
    let body = serde_json::json!({
        "gameId": MINECRAFT_GAME_ID,
        "excludedModIds": excluded_mod_ids.unwrap_or_default(),
        "gameVersionTypeId": game_version_type_id,
    });

    let response: ApiResponse<FeaturedModsResponse> = fetch_curseforge(
        Method::POST,
        "mods/featured",
        Some(body),
        fetch_semaphore,
        pool,
    )
    .await?;
    Ok(response.data)
}

/// Get game versions for Minecraft
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_game_versions(
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Vec<GameVersionsByType>> {
    let endpoint = format!("games/{}/versions", MINECRAFT_GAME_ID);
    let response: ApiResponse<Vec<GameVersionsByType>> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get game version types (release, snapshot, etc.)
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_game_version_types(
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<Vec<GameVersionType>> {
    let endpoint = format!("games/{}/version-types", MINECRAFT_GAME_ID);
    let response: ApiResponse<Vec<GameVersionType>> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Match files by fingerprint (murmur2 hash)
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn match_fingerprints(
    fingerprints: Vec<i64>,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<FingerprintsMatchesResult> {
    let body = serde_json::json!({
        "fingerprints": fingerprints
    });

    let response: ApiResponse<FingerprintsMatchesResult> = fetch_curseforge(
        Method::POST,
        "fingerprints",
        Some(body),
        fetch_semaphore,
        pool,
    )
    .await?;
    Ok(response.data)
}

/// Get mod description (HTML body)
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_mod_description(
    mod_id: i32,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<String> {
    let endpoint = format!("mods/{}/description", mod_id);
    let response: ApiResponse<String> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

/// Get file changelog (HTML body)
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn get_file_changelog(
    mod_id: i32,
    file_id: i32,
    fetch_semaphore: &FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<String> {
    let endpoint = format!("mods/{}/files/{}/changelog", mod_id, file_id);
    let response: ApiResponse<String> =
        fetch_curseforge(Method::GET, &endpoint, None, fetch_semaphore, pool)
            .await?;
    Ok(response.data)
}

// ====== High-level API functions using global state ======
// These wrappers use State::get() to provide the semaphore and pool

use crate::State;

/// Search for mods on CurseForge (using global state)
#[tracing::instrument]
pub async fn search(
    params: &ModSearchParams,
) -> crate::Result<PaginatedResponse<CurseForgeMod>> {
    let state = State::get().await?;
    search_mods(params.clone(), &state.api_semaphore, &state.pool).await
}

/// Get a single mod by ID (using global state)
#[tracing::instrument]
pub async fn get_single_mod(mod_id: i32) -> crate::Result<CurseForgeMod> {
    let state = State::get().await?;
    get_mod(mod_id, &state.api_semaphore, &state.pool).await
}

/// Get multiple mods by ID (using global state)
#[tracing::instrument]
pub async fn get_multiple_mods(
    mod_ids: Vec<i32>,
) -> crate::Result<Vec<CurseForgeMod>> {
    let state = State::get().await?;
    get_mods(mod_ids, &state.api_semaphore, &state.pool).await
}

/// Get files for a mod (using global state)
#[tracing::instrument]
pub async fn get_files_for_mod(
    mod_id: i32,
    game_version: Option<&str>,
    mod_loader_type: Option<ModLoaderType>,
    index: Option<u32>,
    page_size: Option<u32>,
) -> crate::Result<PaginatedResponse<CurseForgeFile>> {
    let state = State::get().await?;
    get_mod_files(
        mod_id,
        game_version,
        mod_loader_type,
        index,
        page_size,
        &state.api_semaphore,
        &state.pool,
    )
    .await
}

/// Get a single file for a mod (using global state)
#[tracing::instrument]
pub async fn get_single_file(
    mod_id: i32,
    file_id: i32,
) -> crate::Result<CurseForgeFile> {
    let state = State::get().await?;
    get_file(mod_id, file_id, &state.api_semaphore, &state.pool).await
}

/// Get multiple files by ID (using global state)
#[tracing::instrument]
pub async fn get_multiple_files(
    file_ids: Vec<i32>,
) -> crate::Result<Vec<CurseForgeFile>> {
    let state = State::get().await?;
    get_files(file_ids, &state.api_semaphore, &state.pool).await
}

/// Get CurseForge categories (using global state)
#[tracing::instrument]
pub async fn get_all_categories(
    class_id: Option<ClassId>,
) -> crate::Result<Vec<Category>> {
    let state = State::get().await?;
    get_categories(class_id, &state.api_semaphore, &state.pool).await
}

/// Get featured mods (using global state)
#[tracing::instrument]
pub async fn get_featured(
    game_version_type_id: Option<i32>,
    excluded_mod_ids: Option<Vec<i32>>,
) -> crate::Result<FeaturedModsResponse> {
    let state = State::get().await?;
    get_featured_mods(
        game_version_type_id,
        excluded_mod_ids,
        &state.api_semaphore,
        &state.pool,
    )
    .await
}

/// Match fingerprints to find mods (using global state)
#[tracing::instrument]
pub async fn fingerprint_match(
    fingerprints: Vec<i64>,
) -> crate::Result<FingerprintsMatchesResult> {
    let state = State::get().await?;
    match_fingerprints(fingerprints, &state.api_semaphore, &state.pool).await
}

/// Get mod description (using global state)
#[tracing::instrument]
pub async fn get_description(mod_id: i32) -> crate::Result<String> {
    let state = State::get().await?;
    get_mod_description(mod_id, &state.api_semaphore, &state.pool).await
}

/// Get file changelog (using global state)
#[tracing::instrument]
pub async fn get_changelog(mod_id: i32, file_id: i32) -> crate::Result<String> {
    let state = State::get().await?;
    get_file_changelog(mod_id, file_id, &state.api_semaphore, &state.pool).await
}

/// Get Minecraft game versions from CurseForge (using global state)
#[tracing::instrument]
pub async fn get_mc_versions() -> crate::Result<Vec<GameVersionsByType>> {
    let state = State::get().await?;
    get_game_versions(&state.api_semaphore, &state.pool).await
}

/// Get Minecraft version types from CurseForge (using global state)
#[tracing::instrument]
pub async fn get_mc_version_types() -> crate::Result<Vec<GameVersionType>> {
    let state = State::get().await?;
    get_game_version_types(&state.api_semaphore, &state.pool).await
}

/// Get download URL for a CurseForge file (using global state)
#[tracing::instrument]
pub async fn get_download_url(
    mod_id: i32,
    file_id: i32,
) -> crate::Result<String> {
    let state = State::get().await?;
    get_file_download_url(mod_id, file_id, &state.api_semaphore, &state.pool)
        .await
}

// ====== Cached API functions ======
// These functions use the SQLite cache to avoid unnecessary API calls

use crate::state::{
    CacheBehaviour, CachedEntry, CfCachedCategory, CfCachedFile,
    CfCachedFingerprint, CfCachedProject, CfSearchResults,
};

/// Get a single mod by ID with caching support
#[tracing::instrument]
pub async fn get_mod_cached(
    mod_id: i32,
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Option<CfCachedProject>> {
    let state = State::get().await?;
    CachedEntry::get_cf_project(
        &mod_id.to_string(),
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get multiple mods by ID with caching support
#[tracing::instrument]
pub async fn get_mods_cached(
    mod_ids: &[i32],
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Vec<CfCachedProject>> {
    if mod_ids.is_empty() {
        return Ok(Vec::new());
    }
    let state = State::get().await?;
    let ids: Vec<String> = mod_ids.iter().map(|id| id.to_string()).collect();
    let id_refs: Vec<&str> = ids.iter().map(|s| s.as_str()).collect();
    CachedEntry::get_cf_project_many(
        &id_refs,
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get a single file by ID with caching support
#[tracing::instrument]
pub async fn get_file_cached(
    file_id: i32,
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Option<CfCachedFile>> {
    let state = State::get().await?;
    CachedEntry::get_cf_file(
        &file_id.to_string(),
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get multiple files by ID with caching support
#[tracing::instrument]
pub async fn get_files_cached(
    file_ids: &[i32],
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Vec<CfCachedFile>> {
    if file_ids.is_empty() {
        return Ok(Vec::new());
    }
    let state = State::get().await?;
    let ids: Vec<String> = file_ids.iter().map(|id| id.to_string()).collect();
    let id_refs: Vec<&str> = ids.iter().map(|s| s.as_str()).collect();
    CachedEntry::get_cf_file_many(
        &id_refs,
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get fingerprint matches with caching support
#[tracing::instrument]
pub async fn get_fingerprint_cached(
    fingerprint: i64,
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Option<CfCachedFingerprint>> {
    let state = State::get().await?;
    CachedEntry::get_cf_fingerprint(
        &fingerprint.to_string(),
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get multiple fingerprint matches with caching support
#[tracing::instrument]
pub async fn get_fingerprints_cached(
    fingerprints: &[i64],
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Vec<CfCachedFingerprint>> {
    if fingerprints.is_empty() {
        return Ok(Vec::new());
    }
    let state = State::get().await?;
    let ids: Vec<String> =
        fingerprints.iter().map(|fp| fp.to_string()).collect();
    let id_refs: Vec<&str> = ids.iter().map(|s| s.as_str()).collect();
    CachedEntry::get_cf_fingerprint_many(
        &id_refs,
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Get CurseForge categories with caching support
#[tracing::instrument]
pub async fn get_categories_cached(
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<Option<Vec<CfCachedCategory>>> {
    let state = State::get().await?;
    CachedEntry::get_cf_categories(
        cache_behaviour,
        &state.pool,
        &state.api_semaphore,
    )
    .await
}

/// Search for mods and cache the results
/// The search query is used as the cache key
#[tracing::instrument(skip(fetch_semaphore, pool))]
pub async fn search_mods_cached(
    params: ModSearchParams,
    cache_behaviour: Option<CacheBehaviour>,
    fetch_semaphore: &crate::util::fetch::FetchSemaphore,
    pool: &SqlitePool,
) -> crate::Result<CfSearchResults> {
    use crate::state::CacheValue;

    let query_key = params.to_query_string();
    let cache_behaviour = cache_behaviour.unwrap_or_default();

    // Try to get from cache first
    if cache_behaviour != CacheBehaviour::Bypass
        && let Some(cached) = CachedEntry::get_cf_search_results(
            &query_key,
            Some(cache_behaviour),
            pool,
            fetch_semaphore,
        )
        .await?
    {
        return Ok(cached);
    }

    // Fetch from API
    let response = search_mods(params, fetch_semaphore, pool).await?;

    // Convert to cached format
    let cached_results: Vec<CfCachedProject> = response
        .data
        .iter()
        .map(CfCachedProject::from_cf_mod)
        .collect();

    let result = CfSearchResults {
        query: query_key,
        results: cached_results,
        total_count: response.pagination.total_count,
        index: response.pagination.index,
        page_size: response.pagination.page_size,
    };

    // Store in cache
    CachedEntry::upsert_many(
        &[CacheValue::CfSearchResults(result.clone()).get_entry()],
        pool,
    )
    .await?;

    // Also cache individual projects
    let project_entries: Vec<_> = response
        .data
        .iter()
        .map(|m| {
            CacheValue::CfProject(CfCachedProject::from_cf_mod(m)).get_entry()
        })
        .collect();

    if !project_entries.is_empty() {
        CachedEntry::upsert_many(&project_entries, pool).await?;
    }

    Ok(result)
}

/// Search for mods with caching (using global state)
#[tracing::instrument]
pub async fn search_cached(
    params: &ModSearchParams,
    cache_behaviour: Option<CacheBehaviour>,
) -> crate::Result<CfSearchResults> {
    let state = State::get().await?;
    search_mods_cached(
        params.clone(),
        cache_behaviour,
        &state.api_semaphore,
        &state.pool,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mod_search_params_query_string() {
        let params = ModSearchParams::new()
            .with_class(ClassId::Mods)
            .with_search("sodium")
            .with_game_version("1.20.1")
            .with_loader(ModLoaderType::Fabric)
            .with_sort(ModsSearchSortField::Popularity)
            .with_pagination(0, 20);

        let query = params.to_query_string();

        assert!(query.contains("gameId=432"));
        assert!(query.contains("classId=6"));
        assert!(query.contains("searchFilter=sodium"));
        assert!(query.contains("gameVersion=1.20.1"));
        assert!(query.contains("modLoaderType=4"));
        assert!(query.contains("sortField=2"));
        assert!(query.contains("pageSize=20"));
    }

    #[test]
    fn test_class_id_conversion() {
        assert_eq!(ClassId::from_project_type("mod"), Some(ClassId::Mods));
        assert_eq!(
            ClassId::from_project_type("modpack"),
            Some(ClassId::Modpacks)
        );
        assert_eq!(
            ClassId::from_project_type("shader"),
            Some(ClassId::Shaders)
        );
        assert_eq!(ClassId::Mods.to_project_type(), "mod");
    }

    #[test]
    fn test_mod_loader_conversion() {
        assert_eq!(ModLoaderType::from_str("fabric"), ModLoaderType::Fabric);
        assert_eq!(ModLoaderType::from_str("Forge"), ModLoaderType::Forge);
        assert_eq!(ModLoaderType::from_str("unknown"), ModLoaderType::Any);
    }
}
