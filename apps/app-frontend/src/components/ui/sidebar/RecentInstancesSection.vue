<script setup lang="ts">
import { GameIcon, PlayIcon } from '@oxide/assets'
import { Avatar, ButtonStyled, defineMessages, injectNotificationManager, useVIntl } from '@oxide/ui'
import { formatCategory } from '@oxide/utils'
import { convertFileSrc } from '@tauri-apps/api/core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { run } from '@/helpers/profile.js'
import type { GameInstance } from '@/helpers/types'
import { handleSevereError } from '@/store/error.js'

dayjs.extend(relativeTime)

const props = defineProps<{
	recentInstances: GameInstance[]
}>()

const router = useRouter()
const { handleError } = injectNotificationManager()
const { formatMessage } = useVIntl()

const launchingInstance = ref<string | null>(null)

const messages = defineMessages({
	recentlyPlayed: {
		id: 'sidebar.recent-instances.title',
		defaultMessage: 'Recently Played',
	},
	noRecentInstances: {
		id: 'sidebar.recent-instances.empty',
		defaultMessage: 'No recently played instances',
	},
	launchInstance: {
		id: 'sidebar.recent-instances.launch',
		defaultMessage: 'Launch',
	},
	lastPlayed: {
		id: 'sidebar.recent-instances.last-played',
		defaultMessage: 'Last played {time}',
	},
})

const displayedInstances = computed(() => {
	return props.recentInstances.slice(0, 5)
})

function getInstanceIcon(instance: GameInstance): string | undefined {
	return instance.icon_path ? convertFileSrc(instance.icon_path) : undefined
}

function formatLastPlayed(instance: GameInstance): string {
	if (!instance.last_played) return ''
	return dayjs(instance.last_played).fromNow()
}

function navigateToInstance(instance: GameInstance) {
	router.push(`/instance/${encodeURIComponent(instance.path)}`)
}

async function launchInstance(instance: GameInstance, event: Event) {
	event.stopPropagation()
	if (launchingInstance.value) return

	launchingInstance.value = instance.path
	try {
		await run(instance.path).catch(handleSevereError)
	} catch (e) {
		handleError(e as Error)
	} finally {
		launchingInstance.value = null
	}
}
</script>

<template>
	<div class="recent-instances-section p-4 pr-1 border-0 border-b-[1px] border-[--brand-gradient-border] border-solid">
		<h3 class="text-base text-primary font-medium m-0 mb-3">
			{{ formatMessage(messages.recentlyPlayed) }}
		</h3>
		<div v-if="displayedInstances.length > 0" class="instances-list">
			<div
				v-for="instance in displayedInstances"
				:key="instance.path"
				class="instance-item"
				@click="navigateToInstance(instance)"
			>
				<Avatar
					:src="getInstanceIcon(instance)"
					:alt="instance.name"
					size="40px"
					:tint-by="instance.path"
				/>
				<div class="instance-info">
					<span class="instance-name">{{ instance.name }}</span>
					<span class="instance-meta">
						<GameIcon class="w-3 h-3" />
						{{ formatCategory(instance.loader) }} {{ instance.game_version }}
						<template v-if="instance.last_played">· {{ formatLastPlayed(instance) }}</template>
					</span>
				</div>
				<ButtonStyled type="transparent" color="brand" circular>
					<button
						v-tooltip="formatMessage(messages.launchInstance)"
						class="launch-btn"
						:disabled="launchingInstance !== null"
						@click="launchInstance(instance, $event)"
					>
						<PlayIcon class="w-4 h-4" />
					</button>
				</ButtonStyled>
			</div>
		</div>
		<div v-else class="empty-state">
			<span class="text-secondary text-sm">{{ formatMessage(messages.noRecentInstances) }}</span>
		</div>
	</div>
</template>

<style scoped lang="scss">
.instances-list {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
}

.instance-item {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem;
	border-radius: var(--radius-md);
	cursor: pointer;
	transition: background-color 0.15s ease;

	&:hover {
		background-color: var(--color-button-bg);
	}
}

.instance-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
}

.instance-name {
	font-weight: 600;
	font-size: 0.875rem;
	color: var(--color-contrast);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.instance-meta {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	color: var(--color-secondary);
	text-transform: capitalize;
}

.launch-btn {
	width: 2rem;
	height: 2rem;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.empty-state {
	padding: 1rem;
	text-align: center;
}
</style>
