<template>
	<div>
		<Card>
			<Breadcrumbs
				:current-title="file?.displayName || 'Loading...'"
				:link-stack="[
					{
						href: `/cf-project/${route.params.id}/versions${instance ? `?i=${encodeURIComponent(instance.path)}` : ''}`,
						label: formatMessage(messages.files),
					},
				]"
			/>
			<div v-if="file" class="version-title">
				<h2>{{ file.displayName }}</h2>
			</div>
			<div v-if="file" class="button-group">
				<Button
					color="primary"
					:action="() => handleInstall()"
					:disabled="installing || (installed && installedFileId === file.id)"
				>
					<DownloadIcon v-if="!installed" />
					<SwapIcon v-else-if="installedFileId !== file.id" />
					<CheckIcon v-else />
					{{
						installing
							? formatMessage(messages.installing)
							: installed && installedFileId === file.id
								? formatMessage(messages.installed)
								: formatMessage(messages.install)
					}}
				</Button>
				<a
					:href="getFileUrl(mod, file.id)"
					rel="external"
					target="_blank"
					class="btn"
				>
					<ExternalIcon />
					{{ formatMessage(messages.curseforgeWebsite) }}
				</a>
			</div>
		</Card>
		<div v-if="file" class="version-container">
			<div class="description-cards">
				<Card>
					<h3 class="card-title">{{ formatMessage(messages.changelog) }}</h3>
					<div v-if="changelogLoading" class="changelog-loading">
						<AnimatedLogo class="w-8 h-8" />
					</div>
					<div v-else-if="changelog" class="markdown-body" v-html="renderString(changelog)" />
					<div v-else class="no-changelog">{{ formatMessage(messages.noChangelog) }}</div>
				</Card>
				<Card>
					<h3 class="card-title">{{ formatMessage(messages.fileInfo) }}</h3>
					<Card class="file primary">
						<span class="label">
							<FileIcon />
							<span>
								<span class="title">{{ file.fileName }}</span>
								({{ formatBytes(file.fileLength) }})
								<span class="primary-label">{{ formatMessage(messages.primary) }}</span>
							</span>
						</span>
						<Button
							class="download"
							:action="() => handleInstall()"
							:disabled="installed && installedFileId === file.id"
						>
							<DownloadIcon v-if="!installed || installedFileId !== file.id" />
							<CheckIcon v-else />
							{{ installed && installedFileId === file.id ? formatMessage(messages.installed) : formatMessage(messages.install) }}
						</Button>
					</Card>
				</Card>
				<Card v-if="serverPackFile || alternateFile">
					<h3 class="card-title">{{ formatMessage(messages.additionalFiles) }}</h3>
					<Card v-if="serverPackFile" class="file additional-file">
						<span class="label">
							<ServerIcon />
							<span>
								<span class="title">{{ serverPackFile.fileName }}</span>
								({{ formatBytes(serverPackFile.fileLength) }})
								<span class="additional-label">{{ formatMessage(messages.serverPack) }}</span>
							</span>
						</span>
						<a
							:href="serverPackFile.downloadUrl"
							target="_blank"
							rel="noopener noreferrer"
							class="btn download"
						>
							<DownloadIcon />
							{{ formatMessage(messages.download) }}
						</a>
					</Card>
					<Card v-if="alternateFile" class="file additional-file">
						<span class="label">
							<FileIcon />
							<span>
								<span class="title">{{ alternateFile.fileName }}</span>
								({{ formatBytes(alternateFile.fileLength) }})
								<span class="additional-label">{{ formatMessage(messages.alternate) }}</span>
							</span>
						</span>
						<a
							:href="alternateFile.downloadUrl"
							target="_blank"
							rel="noopener noreferrer"
							class="btn download"
						>
							<DownloadIcon />
							{{ formatMessage(messages.download) }}
						</a>
					</Card>
				</Card>
				<Card v-if="displayDependencies.length > 0">
					<h3 class="card-title">{{ formatMessage(messages.dependencies) }}</h3>
					<div v-for="dependency in displayDependencies" :key="dependency.title">
						<router-link v-if="dependency.link" class="btn dependency" :to="dependency.link">
							<Avatar size="sm" :src="dependency.icon" />
							<div>
								<span class="title">{{ dependency.title }}</span><br />
								<span>{{ dependency.subtitle }}</span>
							</div>
						</router-link>
						<div v-else class="dependency disabled">
							<Avatar size="sm" :src="dependency.icon" />
							<div class="text">
								<div class="title">{{ dependency.title }}</div>
								<div>{{ dependency.subtitle }}</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
			<Card class="metadata-card">
				<h3 class="card-title">{{ formatMessage(messages.metadata) }}</h3>
				<div class="metadata">
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.releaseChannel) }}</span>
						<span class="metadata-value">
							<Badge
								:color="releaseColor(getReleaseTypeString(file.releaseType))"
								:type="getReleaseTypeString(file.releaseType)"
							/>
						</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.fileName) }}</span>
						<span class="metadata-value">{{ file.fileName }}</span>
					</div>
					<div v-if="fileLoaders.length > 0" class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.loaders) }}</span>
						<span class="metadata-value">
							{{ fileLoaders.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ') }}
						</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.gameVersions) }}</span>
						<span class="metadata-value">{{ fileGameVersions.join(', ') }}</span>
					</div>
					<div v-if="mod.classId === ClassId.Modpacks && file.downloadCount > 0" class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.downloads) }}</span>
						<span class="metadata-value">{{ formatNumber(file.downloadCount) }}</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.published) }}</span>
						<span class="metadata-value">
							{{ formatDate(file.fileDate) }} {{ formatMessage(messages.at) }} {{ formatTime(file.fileDate) }}
						</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.fileSize) }}</span>
						<span class="metadata-value">{{ formatBytes(file.fileLength) }}</span>
					</div>
					<div v-if="file.fileFingerprint" class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.fingerprint) }}</span>
						<span class="metadata-value">
							<CopyCode class="copycode" :text="String(file.fileFingerprint)" />
						</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">{{ formatMessage(messages.fileId) }}</span>
						<span class="metadata-value">
							<CopyCode class="copycode" :text="String(file.id)" />
						</span>
					</div>
				</div>
			</Card>
		</div>
		<div v-else class="flex items-center justify-center py-12">
			<AnimatedLogo class="w-16 h-16" />
		</div>
	</div>
</template>

<script setup>
import { CheckIcon, DownloadIcon, ExternalIcon, FileIcon, ServerIcon } from '@oxide/assets'
import {
	AnimatedLogo,
	Avatar,
	Badge,
	Breadcrumbs,
	Button,
	Card,
	CopyCode,
	defineMessages,
	injectNotificationManager,
	useVIntl,
} from '@oxide/ui'
import { formatBytes, formatNumber, renderString } from '@oxide/utils'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { SwapIcon } from '@/assets/icons'
import {
	ClassId,
	get_file_changelog,
	get_mod_file,
	get_mods,
	getDependencyTypeString,
	getFileGameVersions,
	getFileLoaders,
	getFileUrl,
	getReleaseTypeString,
} from '@/helpers/curseforge.ts'
import { releaseColor } from '@/helpers/utils'
import { useBreadcrumbs } from '@/store/breadcrumbs'

const messages = defineMessages({
	files: { id: 'cf-version.files', defaultMessage: 'Files' },
	install: { id: 'cf-version.install', defaultMessage: 'Install' },
	installing: { id: 'cf-version.installing', defaultMessage: 'Installing...' },
	installed: { id: 'cf-version.installed', defaultMessage: 'Installed' },
	curseforgeWebsite: { id: 'cf-version.curseforge-website', defaultMessage: 'CurseForge website' },
	changelog: { id: 'cf-version.changelog', defaultMessage: 'Changelog' },
	noChangelog: { id: 'cf-version.no-changelog', defaultMessage: 'No changelog available' },
	fileInfo: { id: 'cf-version.file-info', defaultMessage: 'File' },
	primary: { id: 'cf-version.primary', defaultMessage: 'Primary' },
	additionalFiles: { id: 'cf-version.additional-files', defaultMessage: 'Additional Files' },
	serverPack: { id: 'cf-version.server-pack', defaultMessage: 'Server Pack' },
	alternate: { id: 'cf-version.alternate', defaultMessage: 'Alternate' },
	download: { id: 'cf-version.download', defaultMessage: 'Download' },
	dependencies: { id: 'cf-version.dependencies', defaultMessage: 'Dependencies' },
	metadata: { id: 'cf-version.metadata', defaultMessage: 'Metadata' },
	releaseChannel: { id: 'cf-version.release-channel', defaultMessage: 'Release Channel' },
	fileName: { id: 'cf-version.file-name', defaultMessage: 'File Name' },
	loaders: { id: 'cf-version.loaders', defaultMessage: 'Loaders' },
	gameVersions: { id: 'cf-version.game-versions', defaultMessage: 'Game Versions' },
	downloads: { id: 'cf-version.downloads', defaultMessage: 'Downloads' },
	published: { id: 'cf-version.published', defaultMessage: 'Published' },
	at: { id: 'cf-version.at', defaultMessage: 'at' },
	fileSize: { id: 'cf-version.file-size', defaultMessage: 'File Size' },
	fingerprint: { id: 'cf-version.fingerprint', defaultMessage: 'Fingerprint' },
	fileId: { id: 'cf-version.file-id', defaultMessage: 'File ID' },
})

const { formatMessage } = useVIntl()
const breadcrumbs = useBreadcrumbs()
const route = useRoute()
const { handleError } = injectNotificationManager()

const props = defineProps({
	mod: {
		type: Object,
		required: true,
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
		required: true,
	},
	installing: {
		type: Boolean,
		required: true,
	},
	installedFileId: {
		type: Number,
		default: null,
	},
	instance: {
		type: Object,
		default: null,
	},
})

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
}

function formatTime(dateString) {
	return new Date(dateString).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour12: true,
	})
}

const file = ref(props.files.find((f) => f.id === parseInt(route.params.version)))

const fileLoaders = computed(() => (file.value ? getFileLoaders(file.value) : []))
const fileGameVersions = computed(() => (file.value ? getFileGameVersions(file.value) : []))

if (file.value) {
	breadcrumbs.setName('CfVersion', file.value.displayName)
}

watch(
	() => props.files,
	async () => {
		if (route.params.version) {
			file.value = props.files.find((f) => f.id === parseInt(route.params.version))
			if (file.value) {
				await Promise.all([
					refreshDisplayDependencies(),
					fetchChangelog(),
					fetchAdditionalFiles(),
				])
				breadcrumbs.setName('CfVersion', file.value.displayName)
			}
		}
	},
)

watch(
	() => route.params.version,
	async () => {
		if (route.params.version) {
			file.value = props.files.find((f) => f.id === parseInt(route.params.version))
			if (file.value) {
				await Promise.all([
					refreshDisplayDependencies(),
					fetchChangelog(),
					fetchAdditionalFiles(),
				])
				breadcrumbs.setName('CfVersion', file.value.displayName)
			}
		}
	},
)

const displayDependencies = ref([])
const changelog = ref('')
const changelogLoading = ref(false)
const serverPackFile = ref(null)
const alternateFile = ref(null)

async function fetchChangelog() {
	if (!file.value) return
	changelogLoading.value = true
	try {
		const data = await get_file_changelog(props.mod.id, file.value.id)
		changelog.value = data || ''
	} catch (err) {
		handleError(err)
		changelog.value = ''
	} finally {
		changelogLoading.value = false
	}
}

async function fetchAdditionalFiles() {
	if (!file.value) return

	const promises = []

	if (file.value.serverPackFileId && file.value.serverPackFileId !== file.value.id) {
		promises.push(
			get_mod_file(props.mod.id, file.value.serverPackFileId)
				.then((f) => { serverPackFile.value = f })
				.catch((err) => {
					handleError(err)
					serverPackFile.value = null
				})
		)
	} else {
		serverPackFile.value = null
	}

	if (
		file.value.alternateFileId &&
		file.value.alternateFileId !== file.value.id &&
		file.value.alternateFileId !== file.value.serverPackFileId
	) {
		promises.push(
			get_mod_file(props.mod.id, file.value.alternateFileId)
				.then((f) => { alternateFile.value = f })
				.catch((err) => {
					handleError(err)
					alternateFile.value = null
				})
		)
	} else {
		alternateFile.value = null
	}

	await Promise.all(promises)
}

async function refreshDisplayDependencies() {
	if (!file.value?.dependencies?.length) {
		displayDependencies.value = []
		return
	}

	const modIds = file.value.dependencies.map((dep) => dep.modId)

	if (modIds.length === 0) {
		displayDependencies.value = []
		return
	}

	try {
		const mods = await get_mods(modIds)
		const modMap = new Map(mods.map((m) => [m.id, m]))

		displayDependencies.value = file.value.dependencies.map((dep) => {
			const depMod = modMap.get(dep.modId)
			if (depMod) {
				return {
					icon: depMod.logo?.url,
					title: depMod.name,
					subtitle: getDependencyTypeString(dep.relationType),
					link: `/cf-project/${depMod.id}${props.instance ? `?i=${encodeURIComponent(props.instance.path)}` : ''}`,
				}
			}
			return {
				icon: null,
				title: `Mod #${dep.modId}`,
				subtitle: getDependencyTypeString(dep.relationType),
				link: null,
			}
		})
	} catch (err) {
		handleError(err)
		displayDependencies.value = file.value.dependencies.map((dep) => ({
			icon: null,
			title: `Mod #${dep.modId}`,
			subtitle: getDependencyTypeString(dep.relationType),
			link: null,
		}))
	}
}

if (file.value) {
	await Promise.all([
		refreshDisplayDependencies(),
		fetchChangelog(),
		fetchAdditionalFiles(),
	])
}

function handleInstall() {
	if (file.value) {
		props.install(file.value.id)
	}
}
</script>

<script>
export default {
	name: 'CfVersion',
}
</script>

<style scoped lang="scss">
.version-container {
	display: flex;
	flex-direction: row;
	gap: 1rem;
}

.version-title {
	margin-bottom: 1rem;
	h2 {
		font-size: var(--font-size-2xl);
		font-weight: 700;
		color: var(--color-contrast);
		margin: 0;
	}
}

.dependency {
	display: flex;
	padding: 0.5rem 1rem 0.5rem 0.5rem;
	gap: 0.5rem;
	background: var(--color-raised-bg);
	color: var(--color-base);
	width: 100%;
	margin-bottom: 0.5rem;
	border-radius: var(--radius-md);

	.title {
		font-weight: bolder;
	}

	:deep(svg) {
		margin-right: 0 !important;
	}
}

.file {
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
	background: var(--color-button-bg);
	color: var(--color-base);
	padding: 0.5rem 1rem;

	.download {
		margin-left: auto;
		background-color: var(--color-raised-bg);
	}

	.label {
		display: flex;
		margin: auto 0 auto;
		gap: 0.5rem;

		.title {
			font-weight: bolder;
			word-break: break-all;
		}

		svg {
			min-width: 1.1rem;
			min-height: 1.1rem;
			width: 1.1rem;
			height: 1.1rem;
			margin: auto 0;
		}

		.primary-label {
			font-style: italic;
		}
	}
}

.primary {
	background: var(--color-brand-highlight);
	color: var(--color-contrast);
}

.button-group {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	gap: 0.5rem;
}

.card-title {
	font-size: var(--font-size-lg);
	color: var(--color-contrast);
	margin: 0 0 0.5rem;
}

.description-cards {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.metadata-card {
	width: 20rem;
	height: min-content;
}

.metadata {
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	gap: 1rem;

	.metadata-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		.metadata-label {
			font-weight: bold;
		}
	}
}

.copycode {
	border: 0;
	color: var(--color-contrast);
}

.disabled {
	display: flex;
	flex-direction: row;
	vertical-align: center;
	align-items: center;
	cursor: not-allowed;
	border-radius: var(--radius-lg);

	.text {
		filter: brightness(0.5);
	}
}

.changelog-loading {
	display: flex;
	justify-content: center;
	padding: 1rem;
}

.no-changelog {
	color: var(--color-secondary);
	font-style: italic;
}

.markdown-body {
	:deep(h1),
	:deep(h2),
	:deep(h3),
	:deep(h4),
	:deep(h5),
	:deep(h6) {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	:deep(p) {
		margin-bottom: 0.5rem;
	}

	:deep(ul),
	:deep(ol) {
		margin-left: 1.5rem;
		margin-bottom: 0.5rem;
	}

	:deep(li) {
		margin-bottom: 0.25rem;
	}

	:deep(a) {
		color: var(--color-brand);
	}

	:deep(code) {
		background: var(--color-raised-bg);
		padding: 0.125rem 0.25rem;
		border-radius: var(--radius-sm);
	}

	:deep(pre) {
		background: var(--color-raised-bg);
		padding: 0.5rem;
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin-bottom: 0.5rem;
	}
}

.additional-file {
	margin-top: 0.5rem;

	.additional-label {
		font-style: italic;
		color: var(--color-secondary);
	}
}
</style>
