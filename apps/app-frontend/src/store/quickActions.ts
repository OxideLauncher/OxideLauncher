import { defineStore } from 'pinia'

export type QuickActionId =
	| 'create-instance'
	| 'skins'
	| 'launch-recent'
	| 'website'
	| 'modrinth'
	| 'curseforge'
	| 'toggle-discord-rpc'
	| 'theme-toggle'
	| 'accent-color'
	| 'github'
	| 'discord'
	| 'news'
	| 'settings'
	| 'library'
	| 'browse'

export interface QuickAction {
	id: QuickActionId
	labelKey: string
	defaultLabel: string
	iconName: string
	comingSoon?: boolean
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
	{ id: 'create-instance', labelKey: 'quick-actions.create-instance', defaultLabel: 'Create Instance', iconName: 'PlusIcon' },
	{ id: 'skins', labelKey: 'quick-actions.skins', defaultLabel: 'Skins', iconName: 'ChangeSkinIcon' },
	{ id: 'launch-recent', labelKey: 'quick-actions.launch-recent', defaultLabel: 'Launch Recent', iconName: 'PlayIcon' },
	{ id: 'website', labelKey: 'quick-actions.website', defaultLabel: 'Website', iconName: 'GlobeIcon' },
	{ id: 'modrinth', labelKey: 'quick-actions.modrinth', defaultLabel: 'Modrinth', iconName: 'ExternalIcon' },
	{ id: 'curseforge', labelKey: 'quick-actions.curseforge', defaultLabel: 'CurseForge', iconName: 'ExternalIcon' },
	{ id: 'toggle-discord-rpc', labelKey: 'quick-actions.toggle-discord-rpc', defaultLabel: 'Discord RPC', iconName: 'ToggleRightIcon' },
	{ id: 'theme-toggle', labelKey: 'quick-actions.theme-toggle', defaultLabel: 'Toggle Theme', iconName: 'SunIcon' },
	{ id: 'accent-color', labelKey: 'quick-actions.accent-color', defaultLabel: 'Accent Color', iconName: 'PaintbrushIcon' },
	{ id: 'github', labelKey: 'quick-actions.github', defaultLabel: 'GitHub', iconName: 'CodeIcon' },
	{ id: 'discord', labelKey: 'quick-actions.discord', defaultLabel: 'Discord', iconName: 'MessageIcon', comingSoon: true },
	{ id: 'news', labelKey: 'quick-actions.news', defaultLabel: 'News', iconName: 'NewspaperIcon' },
	{ id: 'settings', labelKey: 'quick-actions.settings', defaultLabel: 'Settings', iconName: 'SettingsIcon' },
	{ id: 'library', labelKey: 'quick-actions.library', defaultLabel: 'Library', iconName: 'LibraryIcon' },
	{ id: 'browse', labelKey: 'quick-actions.browse', defaultLabel: 'Browse Content', iconName: 'CompassIcon' },
]

export const DEFAULT_ENABLED_ACTIONS: QuickActionId[] = [
	'create-instance',
	'skins',
	'launch-recent',
]

const STORAGE_KEY = 'oxide_quick_actions'

function loadFromStorage(): QuickActionId[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			const parsed = JSON.parse(stored) as QuickActionId[]
			const validIds = ALL_QUICK_ACTIONS.map(a => a.id)
			return parsed.filter(id => validIds.includes(id))
		}
	} catch {
		// Fall through to default
	}
	return [...DEFAULT_ENABLED_ACTIONS]
}

function saveToStorage(actions: QuickActionId[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(actions))
}

export const useQuickActions = defineStore('quickActionsStore', {
	state: () => ({
		enabledActions: loadFromStorage(),
	}),
	getters: {
		enabledQuickActions(state): QuickAction[] {
			return state.enabledActions
				.map(id => ALL_QUICK_ACTIONS.find(a => a.id === id))
				.filter((a): a is QuickAction => a !== undefined)
		},
		availableActions(): QuickAction[] {
			return ALL_QUICK_ACTIONS
		},
	},
	actions: {
		setEnabledActions(actions: QuickActionId[]) {
			this.enabledActions = actions
			saveToStorage(actions)
		},
		toggleAction(actionId: QuickActionId) {
			const index = this.enabledActions.indexOf(actionId)
			if (index === -1) {
				this.enabledActions.push(actionId)
			} else {
				this.enabledActions.splice(index, 1)
			}
			saveToStorage(this.enabledActions)
		},
		isEnabled(actionId: QuickActionId): boolean {
			return this.enabledActions.includes(actionId)
		},
		resetToDefault() {
			this.enabledActions = [...DEFAULT_ENABLED_ACTIONS]
			saveToStorage(this.enabledActions)
		},
		reorderActions(fromIndex: number, toIndex: number) {
			const actions = [...this.enabledActions]
			const [removed] = actions.splice(fromIndex, 1)
			actions.splice(toIndex, 0, removed)
			this.enabledActions = actions
			saveToStorage(actions)
		},
	},
})
