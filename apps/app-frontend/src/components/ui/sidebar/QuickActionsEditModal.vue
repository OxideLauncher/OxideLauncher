<script setup lang="ts">
import {
    ArrowDownIcon,
    ArrowUpIcon,
    ChangeSkinIcon,
    CodeIcon,
    CompassIcon,
    ExternalIcon,
    GlobeIcon,
    LibraryIcon,
    MessageIcon,
    MinusIcon,
    NewspaperIcon,
    PaintbrushIcon,
    PlayIcon,
    PlusIcon,
    SettingsIcon,
    SunIcon,
    ToggleRightIcon,
    UndoIcon,
} from '@oxide/assets'
import { ButtonStyled, defineMessages, useVIntl } from '@oxide/ui'
import { computed, ref } from 'vue'

import ModalWrapper from '@/components/ui/modal/ModalWrapper.vue'
import {
    ALL_QUICK_ACTIONS,
    DEFAULT_ENABLED_ACTIONS,
    type QuickActionId,
    useQuickActions,
} from '@/store/quickActions'

const quickActionsStore = useQuickActions()
const { formatMessage } = useVIntl()

const modalRef = ref<InstanceType<typeof ModalWrapper> | null>(null)

const messages = defineMessages({
	title: {
		id: 'sidebar.quick-actions.edit-modal.title',
		defaultMessage: 'Edit Quick Actions',
	},
	enabledActions: {
		id: 'sidebar.quick-actions.edit-modal.enabled-actions',
		defaultMessage: 'Enabled Actions',
	},
	availableActions: {
		id: 'sidebar.quick-actions.edit-modal.available-actions',
		defaultMessage: 'Available Actions',
	},
	useArrowsToReorder: {
		id: 'sidebar.quick-actions.edit-modal.use-arrows-to-reorder',
		defaultMessage: 'Use arrows to reorder',
	},
	resetToDefault: {
		id: 'sidebar.quick-actions.edit-modal.reset',
		defaultMessage: 'Reset to Default',
	},
	done: {
		id: 'sidebar.quick-actions.edit-modal.done',
		defaultMessage: 'Done',
	},
	comingSoon: {
		id: 'sidebar.quick-actions.coming-soon',
		defaultMessage: 'Coming Soon',
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
})

const iconComponents: Record<string, unknown> = {
	PlusIcon,
	ChangeSkinIcon,
	PlayIcon,
	GlobeIcon,
	ExternalIcon,
	ToggleRightIcon,
	SunIcon,
	PaintbrushIcon,
	CodeIcon,
	MessageIcon,
	NewspaperIcon,
	SettingsIcon,
	LibraryIcon,
	CompassIcon,
}

const enabledActionsList = computed(() => {
	return quickActionsStore.enabledActions
		.map(id => ALL_QUICK_ACTIONS.find(a => a.id === id))
		.filter((a): a is typeof ALL_QUICK_ACTIONS[0] => a !== undefined)
})

const availableActionsList = computed(() => {
	return ALL_QUICK_ACTIONS.filter(
		a => !quickActionsStore.isEnabled(a.id)
	)
})

function show(e?: MouseEvent) {
	modalRef.value?.show(e as MouseEvent)
}

function hide() {
	modalRef.value?.hide()
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

function getIconComponent(iconName: string) {
	return iconComponents[iconName] || null
}

function addAction(actionId: QuickActionId) {
	const action = ALL_QUICK_ACTIONS.find(a => a.id === actionId)
	if (action?.comingSoon) return
	quickActionsStore.toggleAction(actionId)
}

function removeAction(actionId: QuickActionId) {
	quickActionsStore.toggleAction(actionId)
}

function moveUp(index: number) {
	if (index > 0) {
		quickActionsStore.reorderActions(index, index - 1)
	}
}

function moveDown(index: number) {
	if (index < quickActionsStore.enabledActions.length - 1) {
		quickActionsStore.reorderActions(index, index + 1)
	}
}

function resetToDefault() {
	quickActionsStore.setEnabledActions([...DEFAULT_ENABLED_ACTIONS])
}

function isDefault(): boolean {
	const enabled = quickActionsStore.enabledActions
	if (enabled.length !== DEFAULT_ENABLED_ACTIONS.length) return false
	return DEFAULT_ENABLED_ACTIONS.every((id, i) => enabled[i] === id)
}

defineExpose({ show, hide })
</script>

<template>
	<ModalWrapper ref="modalRef" :header="formatMessage(messages.title)">
		<div class="modal-content">
			<div class="section">
				<div class="section-header">
					<h3 class="section-title">{{ formatMessage(messages.enabledActions) }}</h3>
					<span class="section-hint">{{ formatMessage(messages.useArrowsToReorder) }}</span>
				</div>
				<div class="enabled-actions-list">
					<div
						v-for="(action, index) in enabledActionsList"
						:key="action.id"
						class="enabled-action-item"
					>
						<div class="action-info">
							<div class="action-icon">
								<component :is="getIconComponent(action.iconName)" class="w-5 h-5" />
							</div>
							<span class="action-label">{{ getActionLabel(action.id) }}</span>
						</div>
						<div class="action-controls">
							<button
								v-tooltip="'Move up'"
								class="control-btn"
								:disabled="index === 0"
								@click="moveUp(index)"
							>
								<ArrowUpIcon class="w-4 h-4" />
							</button>
							<button
								v-tooltip="'Move down'"
								class="control-btn"
								:disabled="index === enabledActionsList.length - 1"
								@click="moveDown(index)"
							>
								<ArrowDownIcon class="w-4 h-4" />
							</button>
							<button
								v-tooltip="'Remove'"
								class="control-btn remove"
								@click="removeAction(action.id)"
							>
								<MinusIcon class="w-4 h-4" />
							</button>
						</div>
					</div>
					<div v-if="enabledActionsList.length === 0" class="empty-state">
						No actions enabled
					</div>
				</div>
			</div>

			<div class="section">
				<div class="section-header">
					<h3 class="section-title">{{ formatMessage(messages.availableActions) }}</h3>
				</div>
				<div class="available-actions-list">
					<button
						v-for="action in availableActionsList"
						:key="action.id"
						class="available-action-item"
						:class="{ 'coming-soon': action.comingSoon }"
						:disabled="action.comingSoon"
						@click="addAction(action.id)"
					>
						<div class="action-info">
							<div class="action-icon">
								<component :is="getIconComponent(action.iconName)" class="w-5 h-5" />
							</div>
							<span class="action-label">{{ getActionLabel(action.id) }}</span>
						</div>
						<span v-if="action.comingSoon" class="coming-soon-badge">
							{{ formatMessage(messages.comingSoon) }}
						</span>
						<PlusIcon v-else class="w-5 h-5 add-icon" />
					</button>
				</div>
			</div>

			<div class="modal-actions">
				<ButtonStyled type="transparent">
					<button :disabled="isDefault()" @click="resetToDefault">
						<UndoIcon class="w-4 h-4" />
						{{ formatMessage(messages.resetToDefault) }}
					</button>
				</ButtonStyled>
				<ButtonStyled color="brand">
					<button @click="hide">{{ formatMessage(messages.done) }}</button>
				</ButtonStyled>
			</div>
		</div>
	</ModalWrapper>
</template>

<style scoped lang="scss">
.modal-content {
	width: 28rem;
	min-width: 28rem;
	box-sizing: border-box;
}

.section {
	margin-bottom: 1.5rem;

	&:last-of-type {
		margin-bottom: 1rem;
	}
}

.section-header {
	display: flex;
	align-items: baseline;
	gap: 0.75rem;
	margin-bottom: 0.75rem;
}

.section-title {
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--color-contrast);
	margin: 0;
}

.section-hint {
	font-size: 0.75rem;
	color: var(--color-secondary);
}

.enabled-actions-list {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	max-height: 14rem;
	overflow-y: auto;
	padding: 0.125rem;
}

.enabled-action-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.625rem 0.75rem;
	border-radius: var(--radius-md);
	background-color: var(--color-button-bg);
	transition: all 0.15s ease;

	&:hover {
		background-color: var(--color-raised-bg-hover, var(--color-button-bg));
	}

	.action-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		background-color: var(--color-bg);
		flex-shrink: 0;
	}

	.action-label {
		font-weight: 500;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.action-controls {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.control-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-secondary);
		cursor: pointer;
		transition: all 0.15s ease;

		&:hover:not(:disabled) {
			background-color: var(--color-bg);
			color: var(--color-contrast);
		}

		&:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}

		&.remove:hover:not(:disabled) {
			background-color: var(--color-red);
			color: white;
		}
	}
}

.empty-state {
	padding: 1.5rem;
	text-align: center;
	color: var(--color-secondary);
	font-size: 0.875rem;
	background-color: var(--color-bg);
	border-radius: var(--radius-md);
}

.available-actions-list {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	max-height: 12rem;
	overflow-y: auto;
	padding: 0.125rem;
}

.available-action-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0.625rem 0.75rem;
	border-radius: var(--radius-md);
	background: transparent;
	border: 1px solid var(--color-divider);
	cursor: pointer;
	transition: all 0.15s ease;
	text-align: left;
	width: 100%;
	color: var(--color-base);

	&:hover:not(.coming-soon) {
		background-color: var(--color-button-bg);
		border-color: var(--color-brand);

		.add-icon {
			color: var(--color-brand);
		}
	}

	&.coming-soon {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		background-color: var(--color-button-bg);
		flex-shrink: 0;
	}

	.action-label {
		font-weight: 500;
		font-size: 0.875rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.coming-soon-badge {
		font-size: 0.625rem;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius-sm);
		background-color: var(--color-orange);
		color: var(--color-accent-contrast);
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.025em;
		flex-shrink: 0;
	}

	.add-icon {
		color: var(--color-secondary);
		transition: color 0.15s ease;
		flex-shrink: 0;
	}
}

.modal-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	padding-top: 1rem;
	margin-top: 0.5rem;
	border-top: 1px solid var(--color-divider);
}
</style>
