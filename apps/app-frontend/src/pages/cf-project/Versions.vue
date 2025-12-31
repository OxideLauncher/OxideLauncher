<template>
	<div>
		<ProjectPageVersions
			:loaders="loaders"
			:game-versions="gameVersions"
			:versions="normalizedVersions"
			:project="project"
			:version-link="(version) => version.changelog_url"
			version-link-external
		>
			<template #actions="{ version }">
				<ButtonStyled circular type="transparent">
					<button
						v-tooltip="formatMessage(messages.install)"
						:class="{
							'group-hover:!bg-brand group-hover:[&>svg]:!text-brand-inverted':
								!installed || version.id !== installedVersion,
						}"
						:disabled="installing || (installed && version.id === installedVersion)"
						@click.stop="() => handleInstall(version)"
					>
						<DownloadIcon v-if="!installed" />
						<SwapIcon v-else-if="installed && version.id !== installedVersion" />
						<CheckIcon v-else />
					</button>
				</ButtonStyled>
				<ButtonStyled circular type="transparent">
					<a
						v-tooltip="formatMessage(messages.openInBrowser)"
						class="group-hover:!bg-button-bg"
						:href="version.changelog_url"
						target="_blank"
					>
						<ExternalIcon />
					</a>
				</ButtonStyled>
			</template>
		</ProjectPageVersions>
	</div>
</template>

<script setup>
import { CheckIcon, DownloadIcon, ExternalIcon } from '@oxide/assets'
import {
    ButtonStyled,
    defineMessages,
    injectNotificationManager,
    ProjectPageVersions,
    useVIntl,
} from '@oxide/ui'
import { computed, ref } from 'vue'

import { SwapIcon } from '@/assets/icons/index.js'
import { get_game_versions, get_loaders } from '@/helpers/tags.js'

const messages = defineMessages({
	install: { id: 'cf-versions.install', defaultMessage: 'Install' },
	openInBrowser: { id: 'cf-versions.open-in-browser', defaultMessage: 'Open in browser' },
})

const { formatMessage } = useVIntl()

const props = defineProps({
	project: {
		type: Object,
		default: () => ({}),
	},
	versions: {
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
	installedVersion: {
		type: String,
		default: null,
	},
})

const { handleError } = injectNotificationManager()

const [loaders, gameVersions] = await Promise.all([
	get_loaders().catch(handleError).then(ref),
	get_game_versions().catch(handleError).then(ref),
])

// Normalize CF versions to match what ProjectPageVersions expects
const normalizedVersions = computed(() => {
	return props.versions.map((v) => ({
		...v,
		// Ensure proper format for ProjectPageVersions
		channel: v.version_type,
	}))
})

function handleInstall(version) {
	// Extract the CurseForge file ID from the version
	const fileId = version.curseforge_file_id
	props.install(fileId)
}
</script>

<script>
export default {
	name: 'CfVersions',
}
</script>

<style scoped lang="scss">
.filter-header {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
}

.table-row {
	grid-template-columns: min-content 1fr 1fr 1.5fr;
}

.card-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--color-raised-bg);
}

.mod-card {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	overflow: hidden;
	margin-top: 0.5rem;
}

.text-combo {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.version-link {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	text-wrap: wrap;

	.version-badge {
		display: flex;
		flex-wrap: wrap;

		.channel-indicator {
			margin-right: 0.5rem;
		}
	}
}

.stacked-text {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	align-items: flex-start;
}

.download-cell {
	width: 4rem;
	padding: 1rem;
}
</style>
