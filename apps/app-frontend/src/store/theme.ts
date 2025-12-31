import { defineStore } from 'pinia'

export const DEFAULT_FEATURE_FLAGS = {
	project_background: false,
	page_path: false,
	worlds_tab: false,
	worlds_in_home: true,
}

export const THEME_OPTIONS = ['dark', 'light', 'oled', 'system'] as const
export const ACCENT_COLOR_OPTIONS = ['orange', 'blue', 'red', 'purple', 'green', 'pink', 'cyan', 'yellow'] as const

export type FeatureFlag = keyof typeof DEFAULT_FEATURE_FLAGS
export type FeatureFlags = Record<FeatureFlag, boolean>
export type ColorTheme = (typeof THEME_OPTIONS)[number]
export type AccentColor = (typeof ACCENT_COLOR_OPTIONS)[number]

export type ThemeStore = {
	selectedTheme: ColorTheme
	accentColor: AccentColor
	advancedRendering: boolean
	toggleSidebar: boolean

	devMode: boolean
	featureFlags: FeatureFlags
}

export const DEFAULT_THEME_STORE: ThemeStore = {
	selectedTheme: 'dark',
	accentColor: 'orange',
	advancedRendering: true,
	toggleSidebar: false,

	devMode: false,
	featureFlags: DEFAULT_FEATURE_FLAGS,
}

export const useTheming = defineStore('themeStore', {
	state: () => DEFAULT_THEME_STORE,
	actions: {
		setThemeState(newTheme: ColorTheme) {
			if (THEME_OPTIONS.includes(newTheme)) {
				this.selectedTheme = newTheme
			} else {
				console.warn('Selected theme is not present. Check themeOptions.')
			}

			this.setThemeClass()
		},
		setAccentColor(newAccent: AccentColor) {
			if (ACCENT_COLOR_OPTIONS.includes(newAccent)) {
				this.accentColor = newAccent
			} else {
				console.warn('Selected accent color is not present. Check accentColorOptions.')
			}

			this.setThemeClass()
		},
		setThemeClass() {
			const htmlEl = document.getElementsByTagName('html')[0]

			for (const theme of THEME_OPTIONS) {
				htmlEl.classList.remove(`${theme}-mode`)
			}

			for (const accent of ACCENT_COLOR_OPTIONS) {
				htmlEl.classList.remove(`accent-${accent}`)
			}

			let theme = this.selectedTheme
			if (this.selectedTheme === 'system') {
				const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')
				if (darkThemeMq.matches) {
					theme = 'dark'
				} else {
					theme = 'light'
				}
			}

			htmlEl.classList.add(`${theme}-mode`)
			htmlEl.classList.add(`accent-${this.accentColor}`)
		},
		getFeatureFlag(key: FeatureFlag) {
			return this.featureFlags[key] ?? DEFAULT_FEATURE_FLAGS[key]
		},
		getThemeOptions() {
			return THEME_OPTIONS
		},
		getAccentColorOptions() {
			return ACCENT_COLOR_OPTIONS
		},
	},
})
