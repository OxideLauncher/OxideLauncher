<template>
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-4">
			<DropdownSelect
				v-model="selectedGameVersion"
				name="game-version-filter"
				:options="gameVersionOptions"
				:placeholder="formatMessage(messages.allVersions)"
				:display-name="(option) => option?.label ?? option"
			/>
			<DropdownSelect
				v-model="selectedLoader"
				name="loader-filter"
				:options="loaderOptions"
				:placeholder="formatMessage(messages.allLoaders)"
				:display-name="(option) => option?.label ?? option"
			/>
			<DropdownSelect
				v-model="selectedChannel"
				name="channel-filter"
				:options="channelOptions"
				:placeholder="formatMessage(messages.allChannels)"
				:display-name="(option) => option?.label ?? option"
			/>
		</div>

		<div class="flex flex-col gap-2">
			<div
				v-for="file in filteredFiles"
				:key="file.id"
				class="card-shadow p-4 bg-bg-raised rounded-xl flex items-center gap-4 group hover:brightness-95 cursor-pointer transition-all"
				@click="navigateToFile(file)"
			>
				<div class="flex flex-col gap-1 min-w-0 flex-1">
					<div class="flex items-center gap-2">
						<Badge
							:color="releaseColor(getReleaseTypeString(file.releaseType))"
							:type="getReleaseTypeString(file.releaseType)"
						/>
						<span class="font-bold text-contrast truncate">{{ file.displayName }}</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-secondary">
						<span>{{ file.fileName }}</span>
						<span>•</span>
						<span>{{ formatBytes(file.fileLength) }}</span>
					</div>
					<div class="flex flex-wrap items-center gap-1 mt-1">
						<span
							v-for="version in getFileGameVersions(file).slice(0, 3)"
							:key="version"
							class="px-1.5 py-0.5 bg-button-bg rounded text-xs"
						>
							{{ version }}
						</span>
						<span v-if="getFileGameVersions(file).length > 3" class="text-xs text-secondary">
							+{{ getFileGameVersions(file).length - 3 }}
						</span>
						<span
							v-for="loader in getFileLoaders(file)"
							:key="loader"
							class="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs"
						>
							{{ loader }}
						</span>
					</div>
				</div>
				<div class="flex items-center gap-4 text-sm text-secondary shrink-0">
					<div v-if="mod.classId === ClassId.Modpacks && file.downloadCount > 0" class="flex items-center gap-1">
						<DownloadIcon class="w-4 h-4" />
						<span>{{ formatNumber(file.downloadCount) }}</span>
					</div>
					<div class="flex items-center gap-1">
						<CalendarIcon class="w-4 h-4" />
						<span>{{ formatRelativeTime(file.fileDate) }}</span>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<ButtonStyled circular type="transparent">
						<button
							v-tooltip="formatMessage(messages.install)"
							:class="{
								'group-hover:!bg-brand group-hover:[&>svg]:!text-brand-inverted':
									!installed || file.id !== installedFileId,
							}"
							:disabled="installing || (installed && file.id === installedFileId)"
							@click.stop="() => handleInstall(file)"
						>
							<DownloadIcon v-if="!installed" />
							<SwapIcon v-else-if="installed && file.id !== installedFileId" />
							<CheckIcon v-else />
						</button>
					</ButtonStyled>
					<ButtonStyled circular type="transparent">
						<a
							v-tooltip="formatMessage(messages.openInBrowser)"
							class="group-hover:!bg-button-bg"
							:href="getFileUrl(mod, file.id)"
							target="_blank"
							@click.stop
						>
							<ExternalIcon />
						</a>
					</ButtonStyled>
				</div>
			</div>

			<div v-if="filteredFiles.length === 0" class="text-center text-secondary py-8">
				{{ formatMessage(messages.noFilesFound) }}
			</div>
		</div>
	</div>
</template>

<script setup>
import { CalendarIcon, CheckIcon, DownloadIcon, ExternalIcon } from '@oxide/assets'
import {
    Badge,
    ButtonStyled,
    defineMessages,
    DropdownSelect,
    useVIntl,
} from '@oxide/ui'
import { formatBytes, formatNumber } from '@oxide/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { SwapIcon } from '@/assets/icons/index.js'
import {
    ClassId,
    getFileGameVersions,
    getFileLoaders,
    getFileUrl,
    getReleaseTypeString,
} from '@/helpers/curseforge.ts'
import { releaseColor } from '@/helpers/utils'

dayjs.extend(relativeTime)

const messages = defineMessages({
	allVersions: { id: 'cf-versions.all-versions', defaultMessage: 'All versions' },
	allLoaders: { id: 'cf-versions.all-loaders', defaultMessage: 'All loaders' },
	allChannels: { id: 'cf-versions.all-channels', defaultMessage: 'All channels' },
	install: { id: 'cf-versions.install', defaultMessage: 'Install' },
	openInBrowser: { id: 'cf-versions.open-in-browser', defaultMessage: 'Open in browser' },
	noFilesFound: { id: 'cf-versions.no-files-found', defaultMessage: 'No files match the selected filters' },
})

const { formatMessage } = useVIntl()
const router = useRouter()

const props = defineProps({
	mod: {
		type: Object,
		default: () => ({}),
	},
	files: {
		type: Array,
		required: true,
	},
	install: {
		type: Function,
		required: true,
	},
	installed: {
		type: Boolean,
		default: null,
	},
	installing: {
		type: Boolean,
		default: false,
	},
	instance: {
		type: Object,
		default: null,
	},
	installedFileId: {
		type: Number,
		default: null,
	},
})

// Filter state
const selectedGameVersion = ref(null)
const selectedLoader = ref(null)
const selectedChannel = ref(null)

// Build filter options from files
const gameVersionOptions = computed(() => {
	const versions = new Set()
	for (const file of props.files) {
		for (const version of getFileGameVersions(file)) {
			versions.add(version)
		}
	}
	return Array.from(versions)
		.sort((a, b) => {
			const partsA = a.split('.').map(Number)
			const partsB = b.split('.').map(Number)
			for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
				const diff = (partsB[i] || 0) - (partsA[i] || 0)
				if (diff !== 0) return diff
			}
			return 0
		})
		.map((v) => ({ value: v, label: v }))
})

const loaderOptions = computed(() => {
	const loaders = new Set()
	for (const file of props.files) {
		for (const loader of getFileLoaders(file)) {
			loaders.add(loader)
		}
	}
	return Array.from(loaders)
		.sort()
		.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))
})

const channelOptions = [
	{ value: 'release', label: 'Release' },
	{ value: 'beta', label: 'Beta' },
	{ value: 'alpha', label: 'Alpha' },
]

// Filter files
const filteredFiles = computed(() => {
	return props.files.filter((file) => {
		// Game version filter
		if (selectedGameVersion.value) {
			const fileVersions = getFileGameVersions(file)
			const filterValue = selectedGameVersion.value?.value ?? selectedGameVersion.value
			if (!fileVersions.includes(filterValue)) {
				return false
			}
		}

		// Loader filter
		if (selectedLoader.value) {
			const fileLoaders = getFileLoaders(file)
			const filterValue = selectedLoader.value?.value ?? selectedLoader.value
			if (!fileLoaders.includes(filterValue)) {
				return false
			}
		}

		// Channel filter
		if (selectedChannel.value) {
			const releaseType = getReleaseTypeString(file.releaseType)
			const filterValue = selectedChannel.value?.value ?? selectedChannel.value
			if (releaseType !== filterValue) {
				return false
			}
		}

		return true
	})
})

function formatRelativeTime(dateString) {
	return dayjs(dateString).fromNow()
}

function navigateToFile(file) {
	const query = props.instance ? { i: encodeURIComponent(props.instance.path) } : {}
	router.push({
		path: `/cf-project/${props.mod.id}/version/${file.id}`,
		query,
	})
}

function handleInstall(file) {
	props.install(file.id)
}
</script>

<script>
export default {
	name: 'CfVersions',
}
</script>
