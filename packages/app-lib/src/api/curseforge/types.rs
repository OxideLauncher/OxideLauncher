//! CurseForge API type definitions
//!
//! Based on the CurseForge REST API documentation at https://docs.curseforge.com/rest-api/

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Minecraft game ID on CurseForge
pub const MINECRAFT_GAME_ID: i32 = 432;

/// CurseForge class IDs for different content types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ClassId {
    Mods = 6,
    Modpacks = 4471,
    ResourcePacks = 12,
    Worlds = 17,
    BukkitPlugins = 5,
    Customization = 4546,
    Shaders = 6552,
    DataPacks = 6945,
}

impl ClassId {
    pub fn from_project_type(project_type: &str) -> Option<Self> {
        match project_type {
            "mod" => Some(Self::Mods),
            "modpack" => Some(Self::Modpacks),
            "resourcepack" => Some(Self::ResourcePacks),
            "shader" => Some(Self::Shaders),
            "datapack" => Some(Self::DataPacks),
            "plugin" => Some(Self::BukkitPlugins),
            _ => None,
        }
    }

    pub fn to_project_type(self) -> &'static str {
        match self {
            Self::Mods => "mod",
            Self::Modpacks => "modpack",
            Self::ResourcePacks => "resourcepack",
            Self::Shaders => "shader",
            Self::DataPacks => "datapack",
            Self::BukkitPlugins => "plugin",
            Self::Worlds => "world",
            Self::Customization => "customization",
        }
    }

    pub fn as_i32(self) -> i32 {
        self as i32
    }

    pub fn from_i32(value: i32) -> Option<Self> {
        match value {
            6 => Some(Self::Mods),
            4471 => Some(Self::Modpacks),
            12 => Some(Self::ResourcePacks),
            17 => Some(Self::Worlds),
            5 => Some(Self::BukkitPlugins),
            4546 => Some(Self::Customization),
            6552 => Some(Self::Shaders),
            6945 => Some(Self::DataPacks),
            _ => None,
        }
    }
}

/// CurseForge mod loader types
#[derive(
    Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Hash, Default,
)]
pub enum ModLoaderType {
    #[default]
    #[serde(rename = "0")]
    Any,
    #[serde(rename = "1")]
    Forge,
    #[serde(rename = "2")]
    Cauldron,
    #[serde(rename = "3")]
    LiteLoader,
    #[serde(rename = "4")]
    Fabric,
    #[serde(rename = "5")]
    Quilt,
    #[serde(rename = "6")]
    NeoForge,
}

impl ModLoaderType {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "forge" => Self::Forge,
            "fabric" => Self::Fabric,
            "quilt" => Self::Quilt,
            "neoforge" => Self::NeoForge,
            "liteloader" => Self::LiteLoader,
            "cauldron" => Self::Cauldron,
            _ => Self::Any,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Any => "any",
            Self::Forge => "forge",
            Self::Cauldron => "cauldron",
            Self::LiteLoader => "liteloader",
            Self::Fabric => "fabric",
            Self::Quilt => "quilt",
            Self::NeoForge => "neoforge",
        }
    }

    pub fn as_i32(&self) -> i32 {
        match self {
            Self::Any => 0,
            Self::Forge => 1,
            Self::Cauldron => 2,
            Self::LiteLoader => 3,
            Self::Fabric => 4,
            Self::Quilt => 5,
            Self::NeoForge => 6,
        }
    }

    pub fn from_i32(v: i32) -> Self {
        match v {
            1 => Self::Forge,
            2 => Self::Cauldron,
            3 => Self::LiteLoader,
            4 => Self::Fabric,
            5 => Self::Quilt,
            6 => Self::NeoForge,
            _ => Self::Any,
        }
    }
}

/// Sort field options for CurseForge search
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize,
)]
pub enum ModsSearchSortField {
    #[default]
    Featured = 1,
    Popularity = 2,
    LastUpdated = 3,
    Name = 4,
    Author = 5,
    TotalDownloads = 6,
    Category = 7,
    GameVersion = 8,
    EarlyAccess = 9,
    FeaturedReleased = 10,
    ReleasedDate = 11,
    Rating = 12,
}

impl ModsSearchSortField {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "featured" => Self::Featured,
            "popularity" | "follows" => Self::Popularity,
            "updated" | "lastupdated" => Self::LastUpdated,
            "name" | "alphabetical" => Self::Name,
            "author" => Self::Author,
            "downloads" | "totaldownloads" => Self::TotalDownloads,
            "category" => Self::Category,
            "game_version" | "gameversion" => Self::GameVersion,
            "rating" | "relevance" => Self::Rating,
            "newest" | "released" => Self::ReleasedDate,
            _ => Self::Featured,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Featured => "featured",
            Self::Popularity => "popularity",
            Self::LastUpdated => "updated",
            Self::Name => "name",
            Self::Author => "author",
            Self::TotalDownloads => "downloads",
            Self::Category => "category",
            Self::GameVersion => "game_version",
            Self::EarlyAccess => "early_access",
            Self::FeaturedReleased => "featured_released",
            Self::ReleasedDate => "newest",
            Self::Rating => "rating",
        }
    }

    pub fn as_i32(&self) -> i32 {
        *self as i32
    }
}

/// Sort order for search results
#[derive(
    Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Default,
)]
#[serde(rename_all = "lowercase")]
pub enum SortOrder {
    #[default]
    #[serde(rename = "desc")]
    Descending,
    #[serde(rename = "asc")]
    Ascending,
}

/// Generic API response wrapper
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApiResponse<T> {
    pub data: T,
}

/// Paginated API response wrapper
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: Pagination,
}

/// Pagination info
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Pagination {
    pub index: u32,
    pub page_size: u32,
    pub result_count: u32,
    pub total_count: u32,
}

/// CurseForge mod (project)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurseForgeMod {
    pub id: i32,
    pub game_id: i32,
    pub name: String,
    pub slug: String,
    pub links: ModLinks,
    pub summary: String,
    pub status: i32,
    pub download_count: i64,
    pub is_featured: bool,
    pub primary_category_id: i32,
    pub categories: Vec<Category>,
    pub class_id: Option<i32>,
    pub authors: Vec<ModAuthor>,
    pub logo: Option<ModAsset>,
    pub screenshots: Vec<ModAsset>,
    pub main_file_id: i32,
    pub latest_files: Vec<CurseForgeFile>,
    pub latest_files_indexes: Vec<FileIndex>,
    #[serde(default)]
    pub latest_early_access_files_indexes: Vec<FileIndex>,
    pub date_created: DateTime<Utc>,
    pub date_modified: DateTime<Utc>,
    pub date_released: DateTime<Utc>,
    #[serde(default)]
    pub allow_mod_distribution: Option<bool>,
    pub game_popularity_rank: i32,
    pub is_available: bool,
    #[serde(default)]
    pub thumbs_up_count: i32,
    #[serde(default)]
    pub rating: Option<f64>,
}

/// Mod links
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModLinks {
    pub website_url: Option<String>,
    pub wiki_url: Option<String>,
    pub issues_url: Option<String>,
    pub source_url: Option<String>,
}

/// Mod author
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModAuthor {
    pub id: i32,
    pub name: String,
    pub url: String,
}

/// Mod asset (logo/screenshot)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModAsset {
    pub id: i32,
    pub mod_id: i32,
    pub title: String,
    pub description: String,
    pub thumbnail_url: String,
    pub url: String,
}

/// File index for quick lookup
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileIndex {
    pub game_version: String,
    pub file_id: i32,
    pub filename: String,
    pub release_type: i32,
    pub game_version_type_id: Option<i32>,
    pub mod_loader: Option<i32>,
}

/// CurseForge file (version)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurseForgeFile {
    pub id: i32,
    pub game_id: i32,
    pub mod_id: i32,
    pub is_available: bool,
    pub display_name: String,
    pub file_name: String,
    pub release_type: i32,
    pub file_status: i32,
    pub hashes: Vec<FileHash>,
    pub file_date: DateTime<Utc>,
    pub file_length: i64,
    pub download_count: i64,
    #[serde(default)]
    pub file_fingerprint: Option<i64>,
    pub download_url: Option<String>,
    pub game_versions: Vec<String>,
    #[serde(default)]
    pub sortable_game_versions: Vec<SortableGameVersion>,
    #[serde(default)]
    pub dependencies: Vec<FileDependency>,
    #[serde(default)]
    pub expose_as_alternative: Option<bool>,
    #[serde(default)]
    pub parent_project_file_id: Option<i32>,
    #[serde(default)]
    pub alternate_file_id: Option<i32>,
    #[serde(default)]
    pub is_server_pack: Option<bool>,
    #[serde(default)]
    pub server_pack_file_id: Option<i32>,
    #[serde(default)]
    pub is_early_access_content: Option<bool>,
    #[serde(default)]
    pub early_access_end_date: Option<DateTime<Utc>>,
    #[serde(default)]
    pub file_fingerprint64: Option<i64>,
    #[serde(default)]
    pub modules: Vec<FileModule>,
}

impl CurseForgeFile {
    pub fn get_sha1(&self) -> Option<&str> {
        self.hashes
            .iter()
            .find(|h| h.algo == 1) // 1 = SHA1
            .map(|h| h.value.as_str())
    }

    pub fn release_type_str(&self) -> &'static str {
        match self.release_type {
            1 => "release",
            2 => "beta",
            3 => "alpha",
            _ => "unknown",
        }
    }
}

/// File hash
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileHash {
    pub value: String,
    pub algo: i32,
}

/// Sortable game version
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SortableGameVersion {
    pub game_version_name: String,
    pub game_version_padded: String,
    pub game_version: String,
    pub game_version_release_date: DateTime<Utc>,
    pub game_version_type_id: Option<i32>,
}

/// File dependency
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileDependency {
    pub mod_id: i32,
    pub relation_type: i32,
}

impl FileDependency {
    pub fn is_required(&self) -> bool {
        self.relation_type == 3 // RequiredDependency
    }

    pub fn is_optional(&self) -> bool {
        self.relation_type == 2 // OptionalDependency
    }

    pub fn is_incompatible(&self) -> bool {
        self.relation_type == 5 // Incompatible
    }
}

/// File module (for modpack contents)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileModule {
    pub name: String,
    pub fingerprint: i64,
}

/// Category
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i32,
    pub game_id: i32,
    pub name: String,
    pub slug: String,
    pub url: String,
    pub icon_url: String,
    pub date_modified: DateTime<Utc>,
    #[serde(default)]
    pub is_class: Option<bool>,
    pub class_id: Option<i32>,
    pub parent_category_id: Option<i32>,
    #[serde(default)]
    pub display_index: Option<i32>,
}

/// Search parameters for mods
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModSearchParams {
    #[serde(default = "default_game_id")]
    pub game_id: i32,
    pub class_id: Option<i32>,
    pub category_id: Option<i32>,
    pub category_ids: Option<Vec<i32>>,
    pub game_version: Option<String>,
    pub game_versions: Option<Vec<String>>,
    pub search_filter: Option<String>,
    pub sort_field: Option<ModsSearchSortField>,
    pub sort_order: Option<SortOrder>,
    pub mod_loader_type: Option<ModLoaderType>,
    pub mod_loader_types: Option<Vec<ModLoaderType>>,
    pub game_version_type_id: Option<i32>,
    pub author_id: Option<i32>,
    pub primary_author_id: Option<i32>,
    pub slug: Option<String>,
    pub index: Option<u32>,
    pub page_size: Option<u32>,
}

fn default_game_id() -> i32 {
    MINECRAFT_GAME_ID
}

impl Default for ModSearchParams {
    fn default() -> Self {
        Self {
            game_id: MINECRAFT_GAME_ID,
            class_id: None,
            category_id: None,
            category_ids: None,
            game_version: None,
            game_versions: None,
            search_filter: None,
            sort_field: None,
            sort_order: None,
            mod_loader_type: None,
            mod_loader_types: None,
            game_version_type_id: None,
            author_id: None,
            primary_author_id: None,
            slug: None,
            index: None,
            page_size: None,
        }
    }
}

impl ModSearchParams {
    pub fn new() -> Self {
        Self {
            game_id: MINECRAFT_GAME_ID,
            ..Default::default()
        }
    }

    pub fn with_class(mut self, class_id: ClassId) -> Self {
        self.class_id = Some(class_id.as_i32());
        self
    }

    pub fn with_search(mut self, query: &str) -> Self {
        if !query.is_empty() {
            self.search_filter = Some(query.to_string());
        }
        self
    }

    pub fn with_game_version(mut self, version: &str) -> Self {
        self.game_version = Some(version.to_string());
        self
    }

    pub fn with_loader(mut self, loader: ModLoaderType) -> Self {
        if loader != ModLoaderType::Any {
            self.mod_loader_type = Some(loader);
        }
        self
    }

    pub fn with_category(mut self, category_id: i32) -> Self {
        self.category_id = Some(category_id);
        self
    }

    pub fn with_sort(mut self, sort_field: ModsSearchSortField) -> Self {
        self.sort_field = Some(sort_field);
        self
    }

    pub fn with_pagination(mut self, index: u32, page_size: u32) -> Self {
        self.index = Some(index);
        self.page_size = Some(page_size.min(50)); // CurseForge max is 50
        self
    }

    pub fn to_query_string(&self) -> String {
        let mut params = vec![format!("gameId={}", self.game_id)];

        if let Some(class_id) = self.class_id {
            params.push(format!("classId={}", class_id));
        }
        if let Some(category_id) = self.category_id {
            params.push(format!("categoryId={}", category_id));
        }
        if let Some(ref category_ids) = self.category_ids {
            let ids: String = category_ids
                .iter()
                .map(|id| format!("[{}]", id))
                .collect::<Vec<_>>()
                .join(",");
            params.push(format!("categoryIds={}", ids));
        }
        if let Some(ref version) = self.game_version {
            params.push(format!("gameVersion={}", version));
        }
        if let Some(ref versions) = self.game_versions {
            let vers: String = versions
                .iter()
                .map(|v| format!("[{}]", v))
                .collect::<Vec<_>>()
                .join(",");
            params.push(format!("gameVersions={}", vers));
        }
        if let Some(ref query) = self.search_filter {
            params.push(format!("searchFilter={}", urlencoding(query)));
        }
        if let Some(sort_field) = self.sort_field {
            params.push(format!("sortField={}", sort_field.as_i32()));
        }
        if let Some(sort_order) = self.sort_order {
            params.push(format!(
                "sortOrder={}",
                match sort_order {
                    SortOrder::Descending => "desc",
                    SortOrder::Ascending => "asc",
                }
            ));
        }
        if let Some(ref loader) = self.mod_loader_type {
            if *loader != ModLoaderType::Any {
                params.push(format!("modLoaderType={}", loader.as_i32()));
            }
        }
        if let Some(ref loaders) = self.mod_loader_types {
            let loader_ids: String = loaders
                .iter()
                .map(|l| format!("[{}]", l.as_i32()))
                .collect::<Vec<_>>()
                .join(",");
            params.push(format!("modLoaderTypes={}", loader_ids));
        }
        if let Some(index) = self.index {
            params.push(format!("index={}", index));
        }
        if let Some(page_size) = self.page_size {
            params.push(format!("pageSize={}", page_size));
        }

        params.join("&")
    }
}

/// Simple URL encoding for query parameters
fn urlencoding(s: &str) -> String {
    let mut result = String::new();
    for c in s.chars() {
        match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' | '.' | '~' => {
                result.push(c);
            }
            ' ' => result.push_str("%20"),
            _ => {
                for b in c.to_string().as_bytes() {
                    result.push_str(&format!("%{:02X}", b));
                }
            }
        }
    }
    result
}

/// Featured mods response
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FeaturedModsResponse {
    pub featured: Vec<CurseForgeMod>,
    pub popular: Vec<CurseForgeMod>,
    pub recently_updated: Vec<CurseForgeMod>,
}

/// Fingerprint match result
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FingerprintMatch {
    pub id: i32,
    pub file: CurseForgeFile,
    pub latest_files: Vec<CurseForgeFile>,
}

/// Fingerprints matches response
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FingerprintsMatchesResult {
    pub is_cache_built: bool,
    pub exact_matches: Vec<FingerprintMatch>,
    pub exact_fingerprints: Vec<i64>,
    #[serde(default)]
    pub partial_matches: Vec<FingerprintMatch>,
    #[serde(default)]
    pub partial_match_fingerprints: HashMap<String, Vec<i64>>,
    #[serde(default)]
    pub additional_properties: Option<Vec<i64>>,
    pub installed_fingerprints: Vec<i64>,
    #[serde(default)]
    pub unmatched_fingerprints: Vec<i64>,
}

/// Game version type (e.g., release, snapshot)
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameVersionType {
    pub id: i32,
    pub game_id: i32,
    pub name: String,
    pub slug: String,
    #[serde(default)]
    pub is_syncable: bool,
    pub status: i32,
}

/// Game versions by type response
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameVersionsByType {
    #[serde(rename = "type")]
    pub type_id: i32,
    pub versions: Vec<String>,
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

    #[test]
    fn test_urlencoding() {
        assert_eq!(urlencoding("hello world"), "hello%20world");
        assert_eq!(urlencoding("test"), "test");
    }
}
