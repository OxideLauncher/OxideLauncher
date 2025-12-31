//! Theseus settings file

use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use std::collections::HashMap;

// Types
/// Content provider for browsing mods/modpacks
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContentProvider {
    #[default]
    Modrinth,
    CurseForge,
}

impl ContentProvider {
    pub fn as_str(&self) -> &'static str {
        match self {
            ContentProvider::Modrinth => "modrinth",
            ContentProvider::CurseForge => "curseforge",
        }
    }

    pub fn from_string(string: &str) -> Self {
        match string.to_lowercase().as_str() {
            "curseforge" => Self::CurseForge,
            _ => Self::Modrinth,
        }
    }
}
/// Global Theseus settings
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Settings {
    pub max_concurrent_downloads: usize,
    pub max_concurrent_writes: usize,

    pub theme: Theme,
    pub accent_color: AccentColor,
    pub locale: String,
    pub default_page: DefaultPage,
    pub collapsed_navigation: bool,
    pub hide_nametag_skins_page: bool,
    pub advanced_rendering: bool,
    pub native_decorations: bool,
    pub toggle_sidebar: bool,

    pub telemetry: bool,
    pub discord_rpc: bool,
    pub personalized_ads: bool,

    pub onboarded: bool,

    pub extra_launch_args: Vec<String>,
    pub custom_env_vars: Vec<(String, String)>,
    pub memory: MemorySettings,
    pub force_fullscreen: bool,
    pub game_resolution: WindowSize,
    pub hide_on_process_start: bool,
    pub hooks: Hooks,

    pub custom_dir: Option<String>,
    pub prev_custom_dir: Option<String>,
    pub migrated: bool,

    pub developer_mode: bool,
    pub feature_flags: HashMap<FeatureFlag, bool>,

    pub skipped_update: Option<String>,
    pub pending_update_toast_for_version: Option<String>,
    pub auto_download_updates: Option<bool>,

    pub curseforge_api_key: Option<String>,
    pub default_content_provider: ContentProvider,

    pub version: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, Eq, Hash, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FeatureFlag {
    PagePath,
    ProjectBackground,
    WorldsTab,
    WorldsInHome,
}

impl Settings {
    const CURRENT_VERSION: usize = 2;

    pub async fn get(
        exec: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
    ) -> crate::Result<Self> {
        let res = sqlx::query!(
            "
            SELECT
                max_concurrent_writes, max_concurrent_downloads,
                theme, accent_color, locale, default_page, collapsed_navigation, hide_nametag_skins_page, advanced_rendering, native_decorations,
                discord_rpc, developer_mode, telemetry, personalized_ads,
                onboarded,
                json(extra_launch_args) extra_launch_args, json(custom_env_vars) custom_env_vars,
                mc_memory_max, mc_force_fullscreen, mc_game_resolution_x, mc_game_resolution_y, hide_on_process_start,
                hook_pre_launch, hook_wrapper, hook_post_exit,
                custom_dir, prev_custom_dir, migrated, json(feature_flags) feature_flags, toggle_sidebar,
                skipped_update, pending_update_toast_for_version, auto_download_updates,
                curseforge_api_key, default_content_provider,
                version
            FROM settings
            "
        )
            .fetch_one(exec)
            .await?;

        Ok(Self {
            max_concurrent_downloads: res.max_concurrent_downloads as usize,
            max_concurrent_writes: res.max_concurrent_writes as usize,
            theme: Theme::from_string(&res.theme),
            accent_color: AccentColor::from_string(&res.accent_color),
            locale: res.locale,
            default_page: DefaultPage::from_string(&res.default_page),
            collapsed_navigation: res.collapsed_navigation == 1,
            hide_nametag_skins_page: res.hide_nametag_skins_page == 1,
            advanced_rendering: res.advanced_rendering == 1,
            native_decorations: res.native_decorations == 1,
            toggle_sidebar: res.toggle_sidebar == 1,
            telemetry: res.telemetry == 1,
            discord_rpc: res.discord_rpc == 1,
            developer_mode: res.developer_mode == 1,
            personalized_ads: res.personalized_ads == 1,
            onboarded: res.onboarded == 1,
            extra_launch_args: res
                .extra_launch_args
                .as_ref()
                .and_then(|x| serde_json::from_str(x).ok())
                .unwrap_or_default(),
            custom_env_vars: res
                .custom_env_vars
                .as_ref()
                .and_then(|x| serde_json::from_str(x).ok())
                .unwrap_or_default(),
            memory: MemorySettings {
                maximum: res.mc_memory_max as u32,
            },
            force_fullscreen: res.mc_force_fullscreen == 1,
            game_resolution: WindowSize(
                res.mc_game_resolution_x as u16,
                res.mc_game_resolution_y as u16,
            ),
            hide_on_process_start: res.hide_on_process_start == 1,
            hooks: Hooks {
                pre_launch: res.hook_pre_launch,
                wrapper: res.hook_wrapper,
                post_exit: res.hook_post_exit,
            },
            custom_dir: res.custom_dir,
            prev_custom_dir: res.prev_custom_dir,
            migrated: res.migrated == 1,
            feature_flags: res
                .feature_flags
                .as_ref()
                .and_then(|x| serde_json::from_str(x).ok())
                .unwrap_or_default(),
            skipped_update: res.skipped_update,
            pending_update_toast_for_version: res
                .pending_update_toast_for_version,
            auto_download_updates: res.auto_download_updates.map(|x| x == 1),
            curseforge_api_key: res.curseforge_api_key,
            default_content_provider: ContentProvider::from_string(
                &res.default_content_provider,
            ),
            version: res.version as usize,
        })
    }

    pub async fn update(
        &self,
        exec: impl sqlx::Executor<'_, Database = sqlx::Sqlite>,
    ) -> crate::Result<()> {
        let max_concurrent_writes = self.max_concurrent_writes as i32;
        let max_concurrent_downloads = self.max_concurrent_downloads as i32;
        let theme = self.theme.as_str();
        let accent_color = self.accent_color.as_str();
        let default_page = self.default_page.as_str();
        let extra_launch_args = serde_json::to_string(&self.extra_launch_args)?;
        let custom_env_vars = serde_json::to_string(&self.custom_env_vars)?;
        let feature_flags = serde_json::to_string(&self.feature_flags)?;
        let default_content_provider = self.default_content_provider.as_str();
        let version = self.version as i64;

        sqlx::query!(
            "
            UPDATE settings
            SET
                max_concurrent_writes = $1,
                max_concurrent_downloads = $2,

                theme = $3,
                accent_color = $4,
                locale = $5,
                default_page = $6,
                collapsed_navigation = $7,
                advanced_rendering = $8,
                native_decorations = $9,

                discord_rpc = $10,
                developer_mode = $11,
                telemetry = $12,
                personalized_ads = $13,

                onboarded = $14,

                extra_launch_args = jsonb($15),
                custom_env_vars = jsonb($16),
                mc_memory_max = $17,
                mc_force_fullscreen = $18,
                mc_game_resolution_x = $19,
                mc_game_resolution_y = $20,
                hide_on_process_start = $21,

                hook_pre_launch = $22,
                hook_wrapper = $23,
                hook_post_exit = $24,

                custom_dir = $25,
                prev_custom_dir = $26,
                migrated = $27,

                toggle_sidebar = $28,
                feature_flags = $29,
                hide_nametag_skins_page = $30,

                skipped_update = $31,
                pending_update_toast_for_version = $32,
                auto_download_updates = $33,

                curseforge_api_key = $34,
                default_content_provider = $35,

                version = $36
            ",
            max_concurrent_writes,
            max_concurrent_downloads,
            theme,
            accent_color,
            self.locale,
            default_page,
            self.collapsed_navigation,
            self.advanced_rendering,
            self.native_decorations,
            self.discord_rpc,
            self.developer_mode,
            self.telemetry,
            self.personalized_ads,
            self.onboarded,
            extra_launch_args,
            custom_env_vars,
            self.memory.maximum,
            self.force_fullscreen,
            self.game_resolution.0,
            self.game_resolution.1,
            self.hide_on_process_start,
            self.hooks.pre_launch,
            self.hooks.wrapper,
            self.hooks.post_exit,
            self.custom_dir,
            self.prev_custom_dir,
            self.migrated,
            self.toggle_sidebar,
            feature_flags,
            self.hide_nametag_skins_page,
            self.skipped_update,
            self.pending_update_toast_for_version,
            self.auto_download_updates,
            self.curseforge_api_key,
            default_content_provider,
            version,
        )
        .execute(exec)
        .await?;

        Ok(())
    }

    pub async fn migrate(exec: &Pool<Sqlite>) -> crate::Result<()> {
        let mut settings = Self::get(exec).await?;

        if settings.version < Settings::CURRENT_VERSION {
            tracing::info!(
                "Migrating settings version {} to {:?}",
                settings.version,
                Settings::CURRENT_VERSION
            );
        }
        while settings.version < Settings::CURRENT_VERSION {
            if let Err(err) = settings.perform_migration() {
                tracing::error!(
                    "Failed to migrate settings from version {}: {}",
                    settings.version,
                    err
                );
                return Err(err);
            }
        }

        settings.update(exec).await?;

        Ok(())
    }

    pub fn perform_migration(&mut self) -> crate::Result<()> {
        match self.version {
            1 => {
                let quoter = shlex::Quoter::new().allow_nul(true);

                // Previously split by spaces
                if let Some(pre_launch) = self.hooks.pre_launch.as_ref() {
                    self.hooks.pre_launch =
                        Some(quoter.join(pre_launch.split(' ')).unwrap())
                }

                // Previously treated as complete path to command
                if let Some(wrapper) = self.hooks.wrapper.as_ref() {
                    self.hooks.wrapper =
                        Some(quoter.quote(wrapper).unwrap().to_string())
                }

                // Previously split by spaces
                if let Some(post_exit) = self.hooks.post_exit.as_ref() {
                    self.hooks.post_exit =
                        Some(quoter.join(post_exit.split(' ')).unwrap())
                }

                self.version = 2;
            }
            version => {
                return Err(crate::ErrorKind::OtherError(format!(
                    "Invalid settings version: {version}"
                ))
                .into());
            }
        }

        Ok(())
    }
}

/// Theseus theme
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    Dark,
    Light,
    Oled,
    System,
}

impl Theme {
    pub fn as_str(&self) -> &'static str {
        match self {
            Theme::Dark => "dark",
            Theme::Light => "light",
            Theme::Oled => "oled",
            Theme::System => "system",
        }
    }

    pub fn from_string(string: &str) -> Theme {
        match string {
            "dark" => Theme::Dark,
            "light" => Theme::Light,
            "oled" => Theme::Oled,
            "system" => Theme::System,
            _ => Theme::Dark,
        }
    }
}

/// Accent color for UI
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccentColor {
    Orange,
    Blue,
    Red,
    Purple,
    Green,
    Pink,
    Cyan,
    Yellow,
}

impl AccentColor {
    pub fn as_str(&self) -> &'static str {
        match self {
            AccentColor::Orange => "orange",
            AccentColor::Blue => "blue",
            AccentColor::Red => "red",
            AccentColor::Purple => "purple",
            AccentColor::Green => "green",
            AccentColor::Pink => "pink",
            AccentColor::Cyan => "cyan",
            AccentColor::Yellow => "yellow",
        }
    }

    pub fn from_string(string: &str) -> AccentColor {
        match string {
            "orange" => AccentColor::Orange,
            "blue" => AccentColor::Blue,
            "red" => AccentColor::Red,
            "purple" => AccentColor::Purple,
            "green" => AccentColor::Green,
            "pink" => AccentColor::Pink,
            "cyan" => AccentColor::Cyan,
            "yellow" => AccentColor::Yellow,
            _ => AccentColor::Orange,
        }
    }
}

/// Minecraft memory settings
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct MemorySettings {
    pub maximum: u32,
}

/// Game window size
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub struct WindowSize(pub u16, pub u16);

/// Game initialization hooks
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde_with::serde_as]
pub struct Hooks {
    #[serde_as(as = "serde_with::NoneAsEmptyString")]
    pub pre_launch: Option<String>,
    #[serde_as(as = "serde_with::NoneAsEmptyString")]
    pub wrapper: Option<String>,
    #[serde_as(as = "serde_with::NoneAsEmptyString")]
    pub post_exit: Option<String>,
}

/// Opening window to start with
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum DefaultPage {
    Home,
    Library,
}

impl DefaultPage {
    pub fn as_str(&self) -> &'static str {
        match self {
            DefaultPage::Home => "home",
            DefaultPage::Library => "library",
        }
    }

    pub fn from_string(string: &str) -> Self {
        match string {
            "home" => Self::Home,
            "library" => Self::Library,
            _ => Self::Home,
        }
    }
}
