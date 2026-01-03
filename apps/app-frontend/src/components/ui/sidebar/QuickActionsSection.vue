<script setup lang="ts">
import {
    ChangeSkinIcon,
    CodeIcon,
    CompassIcon,
    ExternalIcon,
    GlobeIcon,
    LibraryIcon,
    MessageIcon,
    MoonIcon,
    NewspaperIcon,
    PaintbrushIcon,
    PlayIcon,
    PlusIcon,
    SettingsIcon,
    SunIcon,
    ToggleLeftIcon,
    ToggleRightIcon,
    WrenchIcon,
} from '@oxide/assets'
import { ButtonStyled, defineMessages, injectNotificationManager, useVIntl } from '@oxide/ui'
import { openUrl } from '@tauri-apps/plugin-opener'
import { computed, inject, type Ref, ref } from 'vue'
import { useRouter } from 'vue-router'

import type InstanceCreationModal from '@/components/ui/InstanceCreationModal.vue'
import type AppSettingsModal from '@/components/ui/modal/AppSettingsModal.vue'
import { run } from '@/helpers/profile.js'
import * as settings from '@/helpers/settings'
import type { GameInstance } from '@/helpers/types'
import { handleSevereError } from '@/store/error.js'
import {
    ALL_QUICK_ACTIONS,
    type QuickActionId,
    useQuickActions,
} from '@/store/quickActions'
import { useTheming } from '@/store/theme.ts'

import QuickActionsEditModal from './QuickActionsEditModal.vue'

const props = defineProps<{
	recentInstances: GameInstance[]
}>()

const router = useRouter()
const themeStore = useTheming()
const quickActionsStore = useQuickActions()
const { handleError } = injectNotificationManager()
const { formatMessage } = useVIntl()

const installationModal = inject('installationModal') as Ref<typeof InstanceCreationModal> | undefined
const settingsModal = inject('settingsModal') as Ref<typeof AppSettingsModal> | undefined

const editModalRef = ref<InstanceType<typeof QuickActionsEditModal> | null>(null)
const discordRpcEnabled = ref(true)

const messages = defineMessages({
	quickActions: {
		id: 'sidebar.quick-actions.title',
		defaultMessage: 'Quick Actions',
	},
	edit: {
		id: 'sidebar.quick-actions.edit',
		defaultMessage: 'Edit',
	},
	createInstance: {
		id: 'sidebar.quick-actions.create-instance',
		defaultMessage: 'Create Instance',
	},
	skins: {
		id: 'sidebar.quick-actions.skins',
		defaultMessage: 'Skins',
	},
	launchRecent: {
		id: 'sidebar.quick-actions.launch-recent',
		defaultMessage: 'Launch Recent',
	},
	website: {
		id: 'sidebar.quick-actions.website',
		defaultMessage: 'Website',
	},
	modrinth: {
		id: 'sidebar.quick-actions.modrinth',
		defaultMessage: 'Modrinth',
	},
	curseforge: {
		id: 'sidebar.quick-actions.curseforge',
		defaultMessage: 'CurseForge',
	},
	toggleDiscordRpc: {
		id: 'sidebar.quick-actions.toggle-discord-rpc',
		defaultMessage: 'Discord RPC',
	},
	themeToggle: {
		id: 'sidebar.quick-actions.theme-toggle',
		defaultMessage: 'Toggle Theme',
	},
	accentColor: {
		id: 'sidebar.quick-actions.accent-color',
		defaultMessage: 'Accent Color',
	},
	github: {
		id: 'sidebar.quick-actions.github',
		defaultMessage: 'GitHub',
	},
	discord: {
		id: 'sidebar.quick-actions.discord',
		defaultMessage: 'Discord',
	},
	news: {
		id: 'sidebar.quick-actions.news',
		defaultMessage: 'News',
	},
	settingsAction: {
		id: 'sidebar.quick-actions.settings',
		defaultMessage: 'Settings',
	},
	library: {
		id: 'sidebar.quick-actions.library',
		defaultMessage: 'Library',
	},
	browse: {
		id: 'sidebar.quick-actions.browse',
		defaultMessage: 'Browse Content',
	},
	comingSoon: {
		id: 'sidebar.quick-actions.coming-soon',
		defaultMessage: 'Coming Soon',
	},
	noRecentInstance: {
		id: 'sidebar.quick-actions.no-recent-instance',
		defaultMessage: 'No recent instance',
	},
})

const iconComponents: Record<string, unknown> = {
	PlusIcon,
	ChangeSkinIcon,
	PlayIcon,
	GlobeIcon,
	ExternalIcon,
	ToggleRightIcon,
	ToggleLeftIcon,
	SunIcon,
	MoonIcon,
	PaintbrushIcon,
	CodeIcon,
	MessageIcon,
	NewspaperIcon,
	SettingsIcon,
	LibraryIcon,
	CompassIcon,
	WrenchIcon,
}

const enabledActions = computed(() => quickActionsStore.enabledQuickActions)

const mostRecentInstance = computed(() => {
	if (props.recentInstances.length > 0) {
		return props.recentInstances[0]
	}
	return null
})

function getIconComponent(actionId: QuickActionId) {
	const action = ALL_QUICK_ACTIONS.find(a => a.id === actionId)
	if (!action) return null

	if (actionId === 'theme-toggle') {
		return themeStore.selectedTheme === 'dark' || themeStore.selectedTheme === 'oled'
			? SunIcon
			: MoonIcon
	}

	if (actionId === 'toggle-discord-rpc') {
		return discordRpcEnabled.value ? ToggleRightIcon : ToggleLeftIcon
	}

	return iconComponents[action.iconName] || null
}

function getActionLabel(actionId: QuickActionId): string {
	const messageMap: Record<QuickActionId, unknown> = {
		'create-instance': messages.createInstance,
		'skins': messages.skins,
		'launch-recent': messages.launchRecent,
		'website': messages.website,
		'modrinth': messages.modrinth,
		'curseforge': messages.curseforge,
		'toggle-discord-rpc': messages.toggleDiscordRpc,
		'theme-toggle': messages.themeToggle,
		'accent-color': messages.accentColor,
		'github': messages.github,
		'discord': messages.discord,
		'news': messages.news,
		'settings': messages.settingsAction,
		'library': messages.library,
		'browse': messages.browse,
	}
	const message = messageMap[actionId]
	if (message) {
		return formatMessage(message as Parameters<typeof formatMessage>[0])
	}
	return actionId
}

async function loadDiscordRpcState() {
	try {
		const appSettings = await settings.get()
		discordRpcEnabled.value = appSettings.discord_rpc
	} catch (e) {
		handleError(e as Error)
	}
}

loadDiscordRpcState()

async function executeAction(actionId: QuickActionId) {
	const action = ALL_QUICK_ACTIONS.find(a => a.id === actionId)
	if (action?.comingSoon) return

	switch (actionId) {
		case 'create-instance':
			if (installationModal?.value) {
				installationModal.value.show()
			}
			break
		case 'skins':
			router.push('/skins')
			break
		case 'launch-recent':
			if (mostRecentInstance.value) {
				try {
					await run(mostRecentInstance.value.path).catch(handleSevereError)
				} catch (e) {
					handleError(e as Error)
				}
			}
			break
		case 'website':
			openUrl('https://oxidelauncher.org')
			break
		case 'modrinth':
			openUrl('https://modrinth.com')
			break
		case 'curseforge':
			openUrl('https://curseforge.com')
			break
		case 'toggle-discord-rpc':
			await toggleDiscordRpc()
			break
		case 'theme-toggle':
			toggleTheme()
			break
		case 'accent-color':
			if (settingsModal?.value) {
				settingsModal.value.show()
			}
			break
		case 'github':
			openUrl('https://github.com/OxideLauncher/OxideLauncher')
			break
		case 'discord':
			break
		case 'news':
			router.push('/news')
			break
		case 'settings':
			if (settingsModal?.value) {
				settingsModal.value.show()
			}
			break
		case 'library':
			router.push('/library')
			break
		case 'browse':
			router.push('/browse/modpack')
			break
	}
}

async function toggleDiscordRpc() {
	try {
		const appSettings = await settings.get()
		appSettings.discord_rpc = !appSettings.discord_rpc
		await settings.set(appSettings)
		discordRpcEnabled.value = appSettings.discord_rpc
	} catch (e) {
		handleError(e as Error)
	}
}

async function toggleTheme() {
	try {
		const appSettings = await settings.get()
		const currentTheme = themeStore.selectedTheme
		let newTheme: 'dark' | 'light' | 'oled'
		if (currentTheme === 'dark') {
			newTheme = 'light'
		} else if (currentTheme === 'light') {
			newTheme = 'oled'
		} else {
			newTheme = 'dark'
		}
		themeStore.setThemeState(newTheme)
		appSettings.theme = newTheme
		await settings.set(appSettings)
	} catch (e) {
		handleError(e as Error)
	}
}

function openEditModal(e: MouseEvent) {
	editModalRef.value?.show(e)
}

function isActionDisabled(actionId: QuickActionId): boolean {
	const action = ALL_QUICK_ACTIONS.find(a => a.id === actionId)
	if (action?.comingSoon) return true
	if (actionId === 'launch-recent' && !mostRecentInstance.value) return true
	return false
}

function getTooltip(actionId: QuickActionId): string {
	const action = ALL_QUICK_ACTIONS.find(a => a.id === actionId)
	if (action?.comingSoon) {
		return `${getActionLabel(actionId)} (${formatMessage(messages.comingSoon)})`
	}
	if (actionId === 'launch-recent' && !mostRecentInstance.value) {
		return formatMessage(messages.noRecentInstance)
	}
	return getActionLabel(actionId)
}
</script>

<template>
	<div class="quick-actions-section p-4 pr-1 border-0 border-b-[1px] border-[--brand-gradient-border] border-solid">
		<div class="flex items-center justify-between mb-3">
			<h3 class="text-base text-primary font-medium m-0">
				{{ formatMessage(messages.quickActions) }}
			</h3>
			<ButtonStyled type="transparent">
				<button class="text-xs px-2 py-1" @click="openEditModal($event)">
					<WrenchIcon class="w-3 h-3" />
					{{ formatMessage(messages.edit) }}
				</button>
			</ButtonStyled>
		</div>
		<div class="quick-actions-grid">
			<button
				v-for="action in enabledActions"
				:key="action.id"
				v-tooltip="getTooltip(action.id)"
				class="quick-action-btn"
				:class="{ disabled: isActionDisabled(action.id) }"
				:disabled="isActionDisabled(action.id)"
				@click="executeAction(action.id)"
			>
				<component :is="getIconComponent(action.id)" class="w-5 h-5" />
			</button>
		</div>
		<QuickActionsEditModal ref="editModalRef" />
	</div>
</template>

<style scoped lang="scss">
.quick-actions-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.quick-action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: var(--radius-md);
	background-color: var(--color-button-bg);
	color: var(--color-base);
	border: none;
	cursor: pointer;
	transition: all 0.15s ease;

	&:hover:not(.disabled) {
		background-color: var(--color-button-bg-hover);
		color: var(--color-contrast);
	}

	&:active:not(.disabled) {
		transform: scale(0.95);
	}

	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
