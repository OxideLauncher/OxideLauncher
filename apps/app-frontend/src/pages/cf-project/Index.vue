<template>
	<div>
		<Teleport to="#sidebar-teleport-target">
			<ProjectSidebarCompatibility
				:project="normalizedProject"
				:tags="{ loaders: allLoaders, gameVersions: allGameVersions }"
				class="project-sidebar-section"
			/>
			<ProjectSidebarLinks
				link-target="_blank"
				:project="normalizedProject"
				class="project-sidebar-section"
			/>
			<div class="project-sidebar-section">
				<h3 class="m-0 text-contrast text-base font-bold">
					{{ formatMessage(messages.authors) }}
				</h3>
				<div class="flex flex-col gap-2">
					<a
						v-for="author in normalizedProject?.authors"
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
			<ProjectSidebarDetails
				:project="normalizedProject"
				:has-versions="versions.length > 0"
				:link-target="`_blank`"
				class="project-sidebar-section"
			/>
		</Teleport>
		<div class="flex flex-col gap-4 p-6">
			<InstanceIndicator v-if="instance" :instance="instance" />
			<template v-if="normalizedProject">
				<Teleport
					v-if="themeStore.featureFlags.project_background"
					to="#background-teleport-target"
				>
					<ProjectBackgroundGradient :project="normalizedProject" />
				</Teleport>
				<ProjectHeader :project="normalizedProject" @contextmenu.prevent.stop="handleRightClick">
					<template #badge>
						<span
							class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-[#F16436]/20 text-[#F16436]"
						>
							<CurseForgeIcon class="w-3.5 h-3.5" />
							CurseForge
						</span>
					</template>
					<template #actions>
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
										id: 'follow',
										disabled: true,
									},
									{
										id: 'save',
										disabled: true,
									},
									{
										id: 'open-in-curseforge',
										link: curseforgeUrl,
										external: true,
									},
								]"
								:aria-label="formatMessage(messages.moreOptions)"
							>
								<MoreVerticalIcon aria-hidden="true" />
								<template #open-in-curseforge>
									<ExternalIcon /> {{ formatMessage(messages.openInCurseforge) }}
								</template>
								<template #follow> <HeartIcon /> {{ formatMessage(messages.follow) }} </template>
								<template #save> <BookmarkIcon /> {{ formatMessage(messages.save) }} </template>
							</OverflowMenu>
						</ButtonStyled>
					</template>
				</ProjectHeader>
				<NavTabs
					:links="[
						{
							label: formatMessage(messages.description),
							href: `/cf-project/${$route.params.id}`,
						},
						{
							label: formatMessage(messages.versions),
							href: `/cf-project/${$route.params.id}/versions`,
						},
						{
							label: formatMessage(messages.gallery),
							href: `/cf-project/${$route.params.id}/gallery`,
							shown: normalizedProject.gallery && normalizedProject.gallery.length > 0,
						},
					]"
				/>
				<RouterView
					:project="normalizedProject"
					:versions="versions"
					:members="members"
					:instance="instance"
					:install="install"
					:installed="installed"
					:installing="installing"
					:installed-version="installedVersion"
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
    BookmarkIcon,
    CheckIcon,
    ClipboardCopyIcon,
    CurseForgeIcon,
    DownloadIcon,
    ExternalIcon,
    HeartIcon,
    MoreVerticalIcon,
} from '@oxide/assets'
import {
    AnimatedLogo,
    Avatar,
    ButtonStyled,
    defineMessages,
    injectNotificationManager,
    OverflowMenu,
    ProjectBackgroundGradient,
    ProjectHeader,
    ProjectSidebarCompatibility,
    ProjectSidebarDetails,
    ProjectSidebarLinks,
    useVIntl,
} from '@oxide/ui'
import { openUrl } from '@tauri-apps/plugin-opener'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ContextMenu from '@/components/ui/ContextMenu.vue'
import InstanceIndicator from '@/components/ui/InstanceIndicator.vue'
import NavTabs from '@/components/ui/NavTabs.vue'
import { fetchNormalizedCfProject } from '@/helpers/curseforge.ts'
import { get as getInstance, get_projects as getInstanceProjects } from '@/helpers/profile'
import { get_game_versions, get_loaders } from '@/helpers/tags'
import { useBreadcrumbs } from '@/store/breadcrumbs'
import { useTheming } from '@/store/state.js'

dayjs.extend(relativeTime)

const messages = defineMessages({
	authors: { id: 'cf-project.authors', defaultMessage: 'Authors' },
	install: { id: 'cf-project.install', defaultMessage: 'Install' },
	installing: { id: 'cf-project.installing', defaultMessage: 'Installing...' },
	installed: { id: 'cf-project.installed', defaultMessage: 'Installed' },
	alreadyInstalled: { id: 'cf-project.already-installed', defaultMessage: 'This project is already installed' },
	moreOptions: { id: 'cf-project.more-options', defaultMessage: 'More options' },
	openInCurseforge: { id: 'cf-project.open-in-curseforge', defaultMessage: 'Open in CurseForge' },
	follow: { id: 'cf-project.follow', defaultMessage: 'Follow' },
	save: { id: 'cf-project.save', defaultMessage: 'Save' },
	copyLink: { id: 'cf-project.copy-link', defaultMessage: 'Copy link' },
	description: { id: 'cf-project.description', defaultMessage: 'Description' },
	versions: { id: 'cf-project.versions', defaultMessage: 'Versions' },
	gallery: { id: 'cf-project.gallery', defaultMessage: 'Gallery' },
	loadError: { id: 'cf-project.load-error', defaultMessage: "Project data couldn't be loaded." },
})

const { formatMessage } = useVIntl()
const { handleError } = injectNotificationManager()
const route = useRoute()
const router = useRouter()
const breadcrumbs = useBreadcrumbs()
const themeStore = useTheming()

const loading = ref(true)
const installing = ref(false)
const normalizedProject = shallowRef(null)
const versions = shallowRef([])
const members = shallowRef([])
const instance = ref(null)
const instanceProjects = ref(null)

const installed = ref(false)
const installedVersion = ref(null)

const curseforgeUrl = computed(() => {
	if (!normalizedProject.value) return ''
	const projectType = normalizedProject.value.project_type
	let classSlug = 'mc-mods'
	switch (projectType) {
		case 'mod':
			classSlug = 'mc-mods'
			break
		case 'modpack':
			classSlug = 'modpacks'
			break
		case 'resourcepack':
			classSlug = 'texture-packs'
			break
		case 'shader':
			classSlug = 'shaders'
			break
		case 'datapack':
			classSlug = 'data-packs'
			break
		case 'plugin':
			classSlug = 'bukkit-plugins'
			break
	}
	return `https://www.curseforge.com/minecraft/${classSlug}/${normalizedProject.value.slug}`
})

const [allLoaders, allGameVersions] = await Promise.all([
	get_loaders().catch(handleError).then(ref),
	get_game_versions().catch(handleError).then(ref),
])

async function fetchProjectData() {
	loading.value = true
	installed.value = false
	installedVersion.value = null

	try {
		const modId = parseInt(route.params.id)
		if (isNaN(modId)) {
			handleError('Invalid CurseForge project ID')
			loading.value = false
			return
		}

		const { project, versions: projectVersions, members: projectMembers } =
			await fetchNormalizedCfProject(modId)

		normalizedProject.value = project
		versions.value = projectVersions.sort(
			(a, b) => dayjs(b.date_published) - dayjs(a.date_published),
		)
		members.value = projectMembers

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
					(x.metadata.project_id === normalizedProject.value.id ||
						x.metadata.curseforge_id === normalizedProject.value.curseforge_id),
			)
			if (installedFile) {
				installed.value = true
				installedVersion.value = installedFile.metadata.version_id
			}
		}

		breadcrumbs.setName('CfProject', normalizedProject.value.title)
	} catch (err) {
		handleError(err)
		normalizedProject.value = null
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
	// CurseForge installation is not yet supported via API
	// Open CurseForge page in browser for manual installation
	installing.value = true
	try {
		// Open download URL in browser
		let downloadUrl = curseforgeUrl.value
		if (fileId) {
			downloadUrl = `${curseforgeUrl.value}/files/${fileId}`
		}
		await openUrl(downloadUrl)
	} catch (err) {
		handleError(err)
	} finally {
		installing.value = false
	}
}

const options = ref(null)
const handleRightClick = (event) => {
	options.value.showMenu(event, normalizedProject.value, [
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
