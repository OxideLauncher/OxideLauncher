<script setup lang="ts">
import { Combobox, ThemeSelector, Toggle } from '@oxide/ui'
import { ref, watch } from 'vue'

import { get, set } from '@/helpers/settings.ts'
import { getOS } from '@/helpers/utils'
import { useTheming } from '@/store/state'
import type { AccentColor, ColorTheme } from '@/store/theme.ts'

const themeStore = useTheming()

const os = ref(await getOS())
const settings = ref(await get())

const accentColorOptions = [
	{ value: 'orange', label: 'Orange', color: '#ea580c' },
	{ value: 'blue', label: 'Blue', color: '#3b82f6' },
	{ value: 'red', label: 'Red', color: '#ef4444' },
	{ value: 'purple', label: 'Purple', color: '#a855f7' },
	{ value: 'green', label: 'Green', color: '#22c55e' },
	{ value: 'pink', label: 'Pink', color: '#ec4899' },
	{ value: 'cyan', label: 'Cyan', color: '#06b6d4' },
	{ value: 'yellow', label: 'Yellow', color: '#eab308' },
]

watch(
	settings,
	async () => {
		await set(settings.value)
	},
	{ deep: true },
)
</script>
<template>
	<h2 class="m-0 text-lg font-extrabold text-contrast">Color theme</h2>
	<p class="m-0 mt-1">Select your preferred color theme for Oxide Launcher.</p>

	<ThemeSelector
		:update-color-theme="
			(theme: ColorTheme) => {
				themeStore.setThemeState(theme)
				settings.theme = theme
			}
		"
		:current-theme="settings.theme"
		:theme-options="themeStore.getThemeOptions()"
		system-theme-color="system"
	/>

	<div class="mt-6">
		<h2 class="m-0 text-lg font-extrabold text-contrast">Accent color</h2>
		<p class="m-0 mt-1">Choose an accent color for buttons and highlights.</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<button
				v-for="option in accentColorOptions"
				:key="option.value"
				class="accent-color-btn"
				:class="{ active: settings.accent_color === option.value }"
				:style="{ '--accent-preview': option.color }"
				:title="option.label"
				@click="
					() => {
						themeStore.setAccentColor(option.value as AccentColor)
						settings.accent_color = option.value as AccentColor
					}
				"
			>
				<span class="color-preview" />
				<span class="label">{{ option.label }}</span>
			</button>
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Advanced rendering</h2>
			<p class="m-0 mt-1">
				Enables advanced rendering such as blur effects that may cause performance issues without
				hardware-accelerated rendering.
			</p>
		</div>

		<Toggle
			id="advanced-rendering"
			:model-value="themeStore.advancedRendering"
			@update:model-value="
				(e) => {
					themeStore.advancedRendering = !!e
					settings.advanced_rendering = themeStore.advancedRendering
				}
			"
		/>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Hide nametag</h2>
			<p class="m-0 mt-1">Disables the nametag above your player on the skins page.</p>
		</div>
		<Toggle id="hide-nametag-skins-page" v-model="settings.hide_nametag_skins_page" />
	</div>

	<div v-if="os !== 'MacOS'" class="mt-4 flex items-center justify-between gap-4">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Native decorations</h2>
			<p class="m-0 mt-1">Use system window frame (app restart required).</p>
		</div>
		<Toggle id="native-decorations" v-model="settings.native_decorations" />
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Minimize launcher</h2>
			<p class="m-0 mt-1">Minimize the launcher when a Minecraft process starts.</p>
		</div>
		<Toggle id="minimize-launcher" v-model="settings.hide_on_process_start" />
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Default landing page</h2>
			<p class="m-0 mt-1">Change the page to which the launcher opens on.</p>
		</div>
		<Combobox
			id="opening-page"
			v-model="settings.default_page"
			name="Opening page dropdown"
			class="w-40"
			:options="['Home', 'Library'].map((v) => ({ value: v, label: v }))"
			:display-value="settings.default_page ?? 'Select an option'"
		/>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Jump back into worlds</h2>
			<p class="m-0 mt-1">Includes recent worlds in the "Jump back in" section on the Home page.</p>
		</div>
		<Toggle
			:model-value="themeStore.getFeatureFlag('worlds_in_home')"
			@update:model-value="
				() => {
					const newValue = !themeStore.getFeatureFlag('worlds_in_home')
					themeStore.featureFlags['worlds_in_home'] = newValue
					settings.feature_flags['worlds_in_home'] = newValue
				}
			"
		/>
	</div>

	<div class="mt-4 flex items-center justify-between">
		<div>
			<h2 class="m-0 text-lg font-extrabold text-contrast">Toggle sidebar</h2>
			<p class="m-0 mt-1">Enables the ability to toggle the sidebar.</p>
		</div>
		<Toggle
			id="toggle-sidebar"
			:model-value="settings.toggle_sidebar"
			@update:model-value="
				(e) => {
					settings.toggle_sidebar = !!e
					themeStore.toggleSidebar = settings.toggle_sidebar
				}
			"
		/>
	</div>
</template>

<style scoped>
.accent-color-btn {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	border-radius: var(--radius-md);
	background: var(--color-button-bg);
	border: 2px solid transparent;
	cursor: pointer;
	transition: all 0.15s ease;
}

.accent-color-btn:hover {
	background: var(--color-raised-bg);
}

.accent-color-btn.active {
	border-color: var(--accent-preview);
	background: var(--color-raised-bg);
}

.accent-color-btn .color-preview {
	width: 1.25rem;
	height: 1.25rem;
	border-radius: var(--radius-sm);
	background: var(--accent-preview);
}

.accent-color-btn .label {
	color: var(--color-base);
	font-size: 0.875rem;
	font-weight: 500;
}
</style>
