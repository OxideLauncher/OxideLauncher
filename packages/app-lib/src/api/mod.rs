//! API for interacting with Theseus
pub mod cache;
pub mod curseforge;
pub mod handler;
pub mod jre;
pub mod logs;
pub mod metadata;
pub mod minecraft_auth;
pub mod minecraft_skins;
pub mod mr_auth;
pub mod pack;
pub mod process;
pub mod profile;
pub mod server_address;
pub mod settings;
pub mod tags;
pub mod worlds;

pub mod data {
    pub use crate::api::curseforge::{
        Category as CurseForgeCategory, ClassId as CurseForgeClassId,
        CurseForgeFile, CurseForgeMod, FeaturedModsResponse, FingerprintMatch,
        FingerprintsMatchesResult, ModSearchParams,
        PaginatedResponse as CurseForgePaginatedResponse,
    };
    pub use crate::state::{
        CacheBehaviour, CacheValueType, CfCachedAuthor, CfCachedCategory,
        CfCachedDependency, CfCachedFile, CfCachedFingerprint, CfCachedProject,
        CfSearchResults, ContentProvider, Credentials, Dependency,
        DirectoryInfo, Hooks, JavaVersion, LinkedData, MemorySettings,
        ModLoader, ModrinthCredentials, Organization, ProcessMetadata,
        ProfileFile, Project, ProjectType, SearchResult, SearchResults,
        Settings, TeamMember, Theme, User, Version, WindowSize,
    };
}

pub mod prelude {
    pub use crate::{
        State, curseforge,
        data::*,
        event::CommandPayload,
        jre, metadata, minecraft_auth, mr_auth, pack, process,
        profile::{self, Profile, create},
        settings,
        util::{
            io::{IOError, canonicalize},
            network::{is_network_metered, tcp_listen_any_loopback},
        },
    };
}
