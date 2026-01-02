<template>
	<div>
		<Card>
			<Breadcrumbs
				:current-title="version?.name || 'Loading...'"
				:link-stack="[
					{
						href: `/cf-project/${route.params.id}/versions${instance ? `?i=${encodeURIComponent(instance.path)}` : ''}`,
						label: 'Versions',
					},
				]"
			/>
			<div v-if="version" class="version-title">
				<h2>{{ version.name }}</h2>
			</div>
			<div v-if="version" class="button-group">
				<Button
					color="primary"
					:action="() => handleInstall()"
					:disabled="installing || (installed && installedVersion === version.id)"
				>
					<DownloadIcon v-if="!installed" />
					<SwapIcon v-else-if="installedVersion !== version.id" />
					<CheckIcon v-else />
					{{
						installing
							? 'Installing...'
							: installed && installedVersion === version.id
								? 'Installed'
								: 'Install'
					}}
				</Button>
				<a
					:href="version.changelog_url"
					rel="external"
					target="_blank"
					class="btn"
				>
					<ExternalIcon />
					CurseForge website
				</a>
			</div>
		</Card>
		<div v-if="version" class="version-container">
			<div class="description-cards">
				<Card>
					<h3 class="card-title">Files</h3>
					<Card
						v-for="file in version.files"
						:key="file.filename"
						:class="{ primary: file.primary }"
						class="file"
					>
						<span class="label">
							<FileIcon />
							<span>
								<span class="title">
									{{ file.filename }}
								</span>
								({{ formatBytes(file.size) }})
								<span v-if="file.primary" class="primary-label"> Primary </span>
							</span>
						</span>
						<Button
							class="download"
							:action="() => handleInstall()"
							:disabled="installed && installedVersion === version.id"
						>
							<DownloadIcon v-if="!installed || installedVersion !== version.id" />
							<CheckIcon v-else />
							{{ installed && installedVersion === version.id ? 'Installed' : 'Install' }}
						</Button>
					</Card>
				</Card>
				<Card v-if="displayDependencies.length > 0">
					<h2>Dependencies</h2>
					<div v-for="dependency in displayDependencies" :key="dependency.title">
						<router-link v-if="dependency.link" class="btn dependency" :to="dependency.link">
							<Avatar size="sm" :src="dependency.icon" />
							<div>
								<span class="title"> {{ dependency.title }} </span> <br />
								<span> {{ dependency.subtitle }} </span>
							</div>
						</router-link>
						<div v-else class="dependency disabled" disabled="">
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
				<h3 class="card-title">Metadata</h3>
				<div class="metadata">
					<div class="metadata-item">
						<span class="metadata-label">Release Channel</span>
						<span class="metadata-value"
							><Badge
								:color="releaseColor(version.version_type)"
								:type="
									version.version_type.charAt(0).toUpperCase() + version.version_type.slice(1)
								"
						/></span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">Version Name</span>
						<span class="metadata-value">{{ version.version_number }}</span>
					</div>
					<div v-if="version.loaders.length > 0" class="metadata-item">
						<span class="metadata-label">Loaders</span>
						<span class="metadata-value">{{
							version.loaders
								.map((loader) => loader.charAt(0).toUpperCase() + loader.slice(1))
								.join(', ')
						}}</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">Game Versions</span>
						<span class="metadata-value"> {{ version.game_versions.join(', ') }} </span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">Downloads</span>
						<span class="metadata-value">{{ formatNumber(version.downloads) }}</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">Publication Date</span>
						<span class="metadata-value">
							{{
								new Date(version.date_published).toLocaleString('en-US', {
									month: 'long',
									day: 'numeric',
									year: 'numeric',
								})
							}}
							at
							{{
								new Date(version.date_published).toLocaleString('en-US', {
									hour: 'numeric',
									minute: 'numeric',
									second: 'numeric',
									hour12: true,
								})
							}}
						</span>
					</div>
					<div class="metadata-item">
						<span class="metadata-label">File ID</span>
						<span class="metadata-value"><CopyCode class="copycode" :text="String(version.curseforge_file_id)" /></span>
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
import { CheckIcon, DownloadIcon, ExternalIcon, FileIcon } from '@oxide/assets'
import { AnimatedLogo, Avatar, Badge, Breadcrumbs, Button, Card, CopyCode, injectNotificationManager } from '@oxide/ui'
import { formatBytes } from '@oxide/utils'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { SwapIcon } from '@/assets/icons'
import { get_mods } from '@/helpers/curseforge.ts'
import { releaseColor } from '@/helpers/utils'
import { useBreadcrumbs } from '@/store/breadcrumbs'

const breadcrumbs = useBreadcrumbs()
const route = useRoute()
const { handleError } = injectNotificationManager()

const props = defineProps({
	project: {
		type: Object,
		required: true,
	},
	versions: {
		type: Array,
		required: true,
	},
	members: {
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
	installedVersion: {
		type: String,
		default: null,
	},
	instance: {
		type: Object,
		default: null,
	},
})

function formatNumber(num) {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M'
	} else if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K'
	}
	return num.toString()
}

const version = ref(
	props.versions.find((v) => v.curseforge_file_id === parseInt(route.params.version)),
)

if (version.value) {
	breadcrumbs.setName('CfVersion', version.value.name)
}

watch(
	() => props.versions,
	async () => {
		if (route.params.version) {
			version.value = props.versions.find(
				(v) => v.curseforge_file_id === parseInt(route.params.version),
			)
			if (version.value) {
				await refreshDisplayDependencies()
				breadcrumbs.setName('CfVersion', version.value.name)
			}
		}
	},
)

watch(
	() => route.params.version,
	async () => {
		if (route.params.version) {
			version.value = props.versions.find(
				(v) => v.curseforge_file_id === parseInt(route.params.version),
			)
			if (version.value) {
				await refreshDisplayDependencies()
				breadcrumbs.setName('CfVersion', version.value.name)
			}
		}
	},
)

const displayDependencies = ref([])

async function refreshDisplayDependencies() {
	if (!version.value?.dependencies?.length) {
		displayDependencies.value = []
		return
	}

	const modIds = []
	for (const dep of version.value.dependencies) {
		if (dep.project_id) {
			const match = dep.project_id.match(/^cf-(\d+)$/)
			if (match) {
				modIds.push(parseInt(match[1]))
			}
		}
	}

	if (modIds.length === 0) {
		displayDependencies.value = version.value.dependencies.map((dep) => ({
			icon: null,
			title: dep.project_id || 'Unknown',
			subtitle: dep.dependency_type,
			link: null,
		}))
		return
	}

	try {
		const mods = await get_mods(modIds)
		const modMap = new Map(mods.map((m) => [`cf-${m.id}`, m]))

		displayDependencies.value = version.value.dependencies.map((dep) => {
			const mod = modMap.get(dep.project_id)
			if (mod) {
				return {
					icon: mod.logo?.url,
					title: mod.name,
					subtitle: dep.dependency_type,
					link: `/cf-project/${mod.id}${props.instance ? `?i=${encodeURIComponent(props.instance.path)}` : ''}`,
				}
			}
			return {
				icon: null,
				title: dep.project_id || 'Unknown',
				subtitle: dep.dependency_type,
				link: null,
			}
		})
	} catch (err) {
		handleError(err)
		displayDependencies.value = version.value.dependencies.map((dep) => ({
			icon: null,
			title: dep.project_id || 'Unknown',
			subtitle: dep.dependency_type,
			link: null,
		}))
	}
}

if (version.value) {
	await refreshDisplayDependencies()
}

function handleInstall() {
	if (version.value) {
		props.install(version.value.curseforge_file_id)
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
</style>
