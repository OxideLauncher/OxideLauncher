<template>
	<div>
		<Teleport v-if="mod" to="#sidebar-teleport-target">
			<div class="project-sidebar-section">
				<h3 class="m-0 text-contrast text-base font-bold">
					{{ formatMessage(messages.compatibility) }}
				</h3>
				<div class="flex flex-col gap-2">
					<div v-if="loaders.length > 0" class="flex flex-wrap gap-1">
						<span
							v-for="loader in loaders"
							:key="loader"
							class="px-2 py-0.5 bg-button-bg rounded text-sm"
						>
							{{ loader.charAt(0).toUpperCase() + loader.slice(1) }}
						</span>
					</div>
					<div v-if="gameVersions.length > 0" class="text-secondary text-sm">
						{{ formatMessage(messages.gameVersions) }}: {{ gameVersions.slice(0, 5).join(', ') }}
						<span v-if="gameVersions.length > 5">+{{ gameVersions.length - 5 }} more</span>
					</div>
				</div>
			</div>
			<div class="project-sidebar-section">
				<h3 class="m-0 text-contrast text-base font-bold">
					{{ formatMessage(messages.externalLinks) }}
				</h3>
				<div class="flex flex-col gap-2">
					<a
						v-if="mod.links.websiteUrl"
						:href="mod.links.websiteUrl"
						target="_blank"
						class="flex items-center gap-2 text-primary hover:text-contrast transition-colors"
					>
						<GlobeIcon class="w-4 h-4" />
						<span>{{ formatMessage(messages.website) }}</span>
						<ExternalIcon class="w-3 h-3 opacity-50" />
					</a>
					<a
						v-if="mod.links.issuesUrl"
						:href="mod.links.issuesUrl"
						target="_blank"
						class="flex items-center gap-2 text-primary hover:text-contrast transition-colors"
					>
						<IssuesIcon class="w-4 h-4" />
						<span>{{ formatMessage(messages.issues) }}</span>
						<ExternalIcon class="w-3 h-3 opacity-50" />
					</a>
					<a
						v-if="mod.links.sourceUrl"
						:href="mod.links.sourceUrl"
						target="_blank"
						class="flex items-center gap-2 text-primary hover:text-contrast transition-colors"
					>
						<CodeIcon class="w-4 h-4" />
						<span>{{ formatMessage(messages.source) }}</span>
						<ExternalIcon class="w-3 h-3 opacity-50" />
					</a>
					<a
						v-if="mod.links.wikiUrl"
						:href="mod.links.wikiUrl"
						target="_blank"
						class="flex items-center gap-2 text-primary hover:text-contrast transition-colors"
					>
						<WikiIcon class="w-4 h-4" />
						<span>{{ formatMessage(messages.wiki) }}</span>
						<ExternalIcon class="w-3 h-3 opacity-50" />
					</a>
				</div>
			</div>
			<div class="project-sidebar-section">
				<h3 class="m-0 text-contrast text-base font-bold">
					{{ formatMessage(messages.authors) }}
				</h3>
				<div class="flex flex-col gap-2">
					<a
						v-for="author in mod.authors"
						:key="author.id"
						:href="author.url || `https://www.curseforge.com/members/${author.name}`"
						target="_blank"
						class="flex items-center gap-2 text-primary hover:text-contrast transition-colors"
					>
						<Avatar size="xs" :src="undefined" :alt="author.name" />
						<span>{{ author.name }}</span>
						<ExternalIcon class="w-3 h-3 opacity-50" />
					</a>
				</div>
			</div>
			<div class="project-sidebar-section">
				<h3 class="m-0 text-contrast text-base font-bold">
					{{ formatMessage(messages.details) }}
				</h3>
				<div class="flex flex-col gap-2 text-sm">
					<div class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.downloads) }}</span>
						<span class="text-contrast font-medium">{{ formatNumber(mod.downloadCount) }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.thumbsUp) }}</span>
						<span class="text-contrast font-medium">{{ formatNumber(mod.thumbsUpCount) }}</span>
					</div>
					<div v-if="mod.gamePopularityRank > 0" class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.popularityRank) }}</span>
						<span class="text-contrast font-medium">#{{ mod.gamePopularityRank }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.created) }}</span>
						<span class="text-contrast font-medium">{{ formatDate(mod.dateCreated) }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.updated) }}</span>
						<span class="text-contrast font-medium">{{ formatDate(mod.dateModified) }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-secondary">{{ formatMessage(messages.projectId) }}</span>
						<CopyCode class="text-contrast font-mono text-xs" :text="String(mod.id)" />
					</div>
				</div>
			</div>
		</Teleport>
		<div class="flex flex-col gap-4 p-6">
			<InstanceIndicator v-if="instance" :instance="instance" />
			<template v-if="mod">
				<div class="flex gap-6">
					<Avatar size="96px" :src="mod.logo?.url" :alt="mod.name" class="shrink-0 rounded-xl" />
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-3">
							<h1 class="text-2xl font-bold text-contrast m-0">{{ mod.name }}</h1>
							<span
								class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-[#F16436]/20 text-[#F16436]"
							>
								<CurseForgeIcon class="w-3.5 h-3.5" />
								CurseForge
							</span>
						</div>
						<p class="text-secondary m-0">{{ mod.summary }}</p>
						<div class="flex items-center gap-2 text-sm text-secondary">
							<span>{{ formatMessage(messages.by) }} {{ mod.authors[0]?.name }}</span>
							<span>•</span>
							<span>{{ formatNumber(mod.downloadCount) }} {{ formatMessage(messages.downloads) }}</span>
							<span>•</span>
							<span>{{ formatNumber(mod.thumbsUpCount) }} {{ formatMessage(messages.thumbsUp) }}</span>
						</div>
					</div>
					<div class="ml-auto flex items-start gap-2">
						<ButtonStyled size="large" color="brand">
							<button
								v-tooltip="installed ? formatMessage(messages.alreadyInstalled) : null"
								:disabled="installed || installing"
								@click="install(null)"
							>
								<DownloadIcon v-if="!installed && !installing" />
								<CheckIcon v-else-if="installed" />
								{{
									installing
										? formatMessage(messages.installing)
										: installed
											? formatMessage(messages.installed)
											: formatMessage(messages.install)
								}}
							</button>
						</ButtonStyled>
						<ButtonStyled size="large" circular type="transparent">
							<OverflowMenu
								:tooltip="formatMessage(messages.moreOptions)"
								:options="[
									{
										id: 'open-in-curseforge',
										link: curseforgeUrl,
										external: true,
									},
									{
										id: 'copy-link',
									},
								]"
								:aria-label="formatMessage(messages.moreOptions)"
							>
								<MoreVerticalIcon aria-hidden="true" />
								<template #open-in-curseforge>
									<ExternalIcon /> {{ formatMessage(messages.openInCurseforge) }}
								</template>
								<template #copy-link>
									<ClipboardCopyIcon /> {{ formatMessage(messages.copyLink) }}
								</template>
							</OverflowMenu>
						</ButtonStyled>
					</div>
				</div>
				<NavTabs
					:links="[
						{
							label: formatMessage(messages.description),
							href: `/cf-project/${$route.params.id}`,
						},
						{
							label: formatMessage(messages.files),
							href: `/cf-project/${$route.params.id}/versions`,
						},
						{
							label: formatMessage(messages.gallery),
							href: `/cf-project/${$route.params.id}/gallery`,
							shown: mod.screenshots && mod.screenshots.length > 0,
						},
					]"
				/>
				<RouterView
					:mod="mod"
					:description="description"
					:files="files"
					:instance="instance"
					:install="install"
					:installed="installed"
					:installing="installing"
					:installed-file-id="installedFileId"
				/>
			</template>
			<template v-else-if="loading">
				<div class="flex items-center justify-center py-12">
					<AnimatedLogo class="w-16 h-16" />
				</div>
			</template>
			<template v-else>
				<div class="text-secondary">{{ formatMessage(messages.loadError) }}</div>
			</template>
		</div>
		<ContextMenu ref="options" @option-clicked="handleOptionsClick">
			<template #install> <DownloadIcon /> {{ formatMessage(messages.install) }} </template>
			<template #open_link>
				<CurseForgeIcon /> {{ formatMessage(messages.openInCurseforge) }} <ExternalIcon />
			</template>
			<template #copy_link> <ClipboardCopyIcon /> {{ formatMessage(messages.copyLink) }} </template>
		</ContextMenu>
	</div>
</template>

<script setup>
import {
    CheckIcon,
    ClipboardCopyIcon,
    CodeIcon,
    CurseForgeIcon,
    DownloadIcon,
    ExternalIcon,
    GlobeIcon,
    IssuesIcon,
    MoreVerticalIcon,
    WikiIcon,
} from '@oxide/assets'
import {
    AnimatedLogo,
    Avatar,
    ButtonStyled,
    CopyCode,
    defineMessages,
    injectNotificationManager,
    OverflowMenu,
    useVIntl,
} from '@oxide/ui'
import { formatNumber } from '@oxide/utils'
import { openUrl } from '@tauri-apps/plugin-opener'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import ContextMenu from '@/components/ui/ContextMenu.vue'
import InstanceIndicator from '@/components/ui/InstanceIndicator.vue'
import NavTabs from '@/components/ui/NavTabs.vue'
import { trackEvent } from '@/helpers/analytics'
import {
    classIdToProjectType,
    fetchCfProject,
    findPreferredFile,
    getCurseForgeUrl,
    getModGameVersions,
    getModLoaders,
    installCfDependencies,
    install_file as installCfFile,
    isFileCompatible,
} from '@/helpers/curseforge.ts'
import {
    get as getInstance,
    get_projects as getInstanceProjects,
    remove_project,
} from '@/helpers/profile'
import { useBreadcrumbs } from '@/store/breadcrumbs'
import { useInstall } from '@/store/install.js'

dayjs.extend(relativeTime)

const messages = defineMessages({
	compatibility: { id: 'cf-project.compatibility', defaultMessage: 'Compatibility' },
	gameVersions: { id: 'cf-project.game-versions', defaultMessage: 'Minecraft' },
	externalLinks: { id: 'cf-project.external-links', defaultMessage: 'External Links' },
	website: { id: 'cf-project.website', defaultMessage: 'Website' },
	issues: { id: 'cf-project.issues', defaultMessage: 'Issues' },
	source: { id: 'cf-project.source', defaultMessage: 'Source' },
	wiki: { id: 'cf-project.wiki', defaultMessage: 'Wiki' },
	authors: { id: 'cf-project.authors', defaultMessage: 'Authors' },
	details: { id: 'cf-project.details', defaultMessage: 'Details' },
	downloads: { id: 'cf-project.downloads', defaultMessage: 'Downloads' },
	thumbsUp: { id: 'cf-project.thumbs-up', defaultMessage: 'Thumbs Up' },
	popularityRank: { id: 'cf-project.popularity-rank', defaultMessage: 'Popularity Rank' },
	created: { id: 'cf-project.created', defaultMessage: 'Created' },
	updated: { id: 'cf-project.updated', defaultMessage: 'Updated' },
	projectId: { id: 'cf-project.project-id', defaultMessage: 'Project ID' },
	by: { id: 'cf-project.by', defaultMessage: 'by' },
	install: { id: 'cf-project.install', defaultMessage: 'Install' },
	installing: { id: 'cf-project.installing', defaultMessage: 'Installing...' },
	installed: { id: 'cf-project.installed', defaultMessage: 'Installed' },
	alreadyInstalled: { id: 'cf-project.already-installed', defaultMessage: 'This project is already installed' },
	moreOptions: { id: 'cf-project.more-options', defaultMessage: 'More options' },
	openInCurseforge: { id: 'cf-project.open-in-curseforge', defaultMessage: 'Open in CurseForge' },
	copyLink: { id: 'cf-project.copy-link', defaultMessage: 'Copy link' },
	description: { id: 'cf-project.description', defaultMessage: 'Description' },
	files: { id: 'cf-project.files', defaultMessage: 'Files' },
	gallery: { id: 'cf-project.gallery', defaultMessage: 'Gallery' },
	loadError: { id: 'cf-project.load-error', defaultMessage: "Project data couldn't be loaded." },
})

const { formatMessage } = useVIntl()
const { handleError } = injectNotificationManager()
const route = useRoute()
const breadcrumbs = useBreadcrumbs()

const loading = ref(true)
const installing = ref(false)
const mod = shallowRef(null)
const description = ref('')
const files = shallowRef([])
const instance = ref(null)
const instanceProjects = ref(null)

const installed = ref(false)
const installedFileId = ref(null)

// Computed properties for mod data
const loaders = computed(() => (mod.value ? getModLoaders(mod.value) : []))
const gameVersions = computed(() => (mod.value ? getModGameVersions(mod.value) : []))
const curseforgeUrl = computed(() => (mod.value ? getCurseForgeUrl(mod.value) : ''))

function formatDate(dateString) {
	return dayjs(dateString).format('MMM D, YYYY')
}

async function fetchProjectData() {
	loading.value = true
	installed.value = false
	installedFileId.value = null

	try {
		const modId = parseInt(route.params.id)
		if (isNaN(modId)) {
			handleError('Invalid CurseForge project ID')
			loading.value = false
			return
		}

		const projectData = await fetchCfProject(modId)

		mod.value = projectData.mod
		description.value = projectData.description
		files.value = projectData.files.sort(
			(a, b) => dayjs(b.fileDate) - dayjs(a.fileDate),
		)

		// Fetch instance data if context provided
		if (route.query.i) {
			;[instance.value, instanceProjects.value] = await Promise.all([
				getInstance(route.query.i).catch(handleError),
				getInstanceProjects(route.query.i).catch(handleError),
			])
		}

		// Check if already installed in instance
		if (instanceProjects.value) {
			const installedFile = Object.values(instanceProjects.value).find(
				(x) =>
					x.metadata &&
					x.metadata.curseforge_id === mod.value.id,
			)
			if (installedFile) {
				installed.value = true
				installedFileId.value = installedFile.metadata.version_id
			}
		}

		breadcrumbs.setName('CfProject', mod.value.name)
	} catch (err) {
		handleError(err)
		mod.value = null
	} finally {
		loading.value = false
	}
}

await fetchProjectData()

watch(
	() => route.params.id,
	async () => {
		if (route.params.id && route.path.startsWith('/cf-project')) {
			await fetchProjectData()
		}
	},
)

async function install(fileId) {
	if (!mod.value) return

	installing.value = true
	try {
		const modId = mod.value.id

		// If we have an instance context, install directly
		if (instance.value) {
			let file
			if (fileId) {
				file = files.value.find((f) => f.id === fileId)
			} else {
				file = findPreferredFile(files.value, instance.value)
			}

			if (!file) {
				file = files.value[0]
			}

			if (!file) {
				handleError('No compatible file found')
				installing.value = false
				return
			}

			// Check if compatible, show warning if not
			if (!isFileCompatible(file, instance.value)) {
				const installStore = useInstall()
				// Pass native mod and files data
				installStore.showCfIncompatibilityWarningModal(
					instance.value,
					mod.value,
					files.value,
					file,
					async (installedId) => {
						installed.value = true
						installedFileId.value = installedId
					},
				)
				installing.value = false
				return
			}

			// Remove existing version if updating
			if (instanceProjects.value) {
				for (const [path, fileEntry] of Object.entries(instanceProjects.value)) {
					if (
						fileEntry.metadata &&
						fileEntry.metadata.curseforge_id === mod.value.id
					) {
						await remove_project(instance.value.path, path)
					}
				}
			}

			// Install the file
			await installCfFile(instance.value.path, modId, file.id)

			// Install dependencies
			await installCfDependencies(
				instance.value.path,
				file,
				instance.value,
				async (depModId) => {
					// Check if dependency is installed
					const installed = Object.values(instanceProjects.value || {}).some(
						(x) => x.metadata && x.metadata.curseforge_id === depModId,
					)
					return installed
				},
			)

			trackEvent('ProjectInstall', {
				loader: instance.value.loader,
				game_version: instance.value.game_version,
				id: mod.value.id,
				project_type: classIdToProjectType(mod.value.classId),
				file_id: file.id,
				title: mod.value.name,
				source: 'curseforge',
			})

			installed.value = true
			installedFileId.value = file.id
		} else {
			// No instance context - show modal to select instance
			const installStore = useInstall()
			installStore.showCfModInstallModal(mod.value, files.value, (fileId) => {
				installed.value = true
				installedFileId.value = fileId
			})
		}
	} catch (err) {
		handleError(err)
	} finally {
		installing.value = false
	}
}

const options = ref(null)
const _handleRightClick = (event) => {
	options.value.showMenu(event, mod.value, [
		{
			name: 'install',
		},
		{
			type: 'divider',
		},
		{
			name: 'open_link',
		},
		{
			name: 'copy_link',
		},
	])
}

const handleOptionsClick = (args) => {
	switch (args.option) {
		case 'install':
			install(null)
			break
		case 'open_link':
			openUrl(curseforgeUrl.value)
			break
		case 'copy_link':
			navigator.clipboard.writeText(curseforgeUrl.value)
			break
	}
}
</script>

<style scoped lang="scss">
.project-sidebar-section {
	@apply p-4 flex flex-col gap-2 border-0 border-b-[1px] border-[--brand-gradient-border] border-solid;
}
</style>
