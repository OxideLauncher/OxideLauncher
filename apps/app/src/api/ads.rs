// Ads disabled for OxideLauncher

use tauri::Runtime;
use tauri::plugin::TauriPlugin;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    tauri::plugin::Builder::<R>::new("ads")
        .invoke_handler(tauri::generate_handler![
            init_ads_window,
            hide_ads_window,
            show_ads_window,
            record_ads_click,
            open_link,
            get_ads_personalization,
        ])
        .build()
}

#[tauri::command]
pub async fn init_ads_window() {}

#[tauri::command]
pub async fn show_ads_window() {}

#[tauri::command]
pub async fn hide_ads_window() {}

#[tauri::command]
pub async fn record_ads_click() {}

#[tauri::command]
pub async fn open_link() {}

#[tauri::command]
pub async fn get_ads_personalization() -> crate::api::Result<bool> {
    Ok(false)
}
