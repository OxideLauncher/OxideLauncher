<script setup>
import { DownloadIcon, FlameColorIcon, HeartIcon, ModrinthColorIcon, TagIcon } from '@oxide/assets'
import { Avatar, TagItem } from '@oxide/ui'
import { formatCategory, formatNumber } from '@oxide/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

dayjs.extend(relativeTime)

const router = useRouter()

const props = defineProps({
	project: {
		type: Object,
		default() {
			return {}
		},
	},
})

const featuredCategory = computed(() => {
	if (props.project.display_categories.includes('optimization')) {
		return 'optimization'
	}

	return props.project.display_categories[0] ?? props.project.categories[0]
})

const toColor = computed(() => {
	let color = props.project.color

	color >>>= 0
	const b = color & 0xff
	const g = (color >>> 8) & 0xff
	const r = (color >>> 16) & 0xff
	return 'rgba(' + [r, g, b, 1].join(',') + ')'
})

const toTransparent = computed(() => {
	let color = props.project.color

	color >>>= 0
	const b = color & 0xff
	const g = (color >>> 8) & 0xff
	const r = (color >>> 16) & 0xff
	return (
		'linear-gradient(rgba(' +
		[r, g, b, 0.03].join(',') +
		'), 65%, rgba(' +
		[r, g, b, 0.3].join(',') +
		'))'
	)
})

function handleCardClick() {
	if (props.project.source === 'curseforge') {
		const cfData = props.project.curseforge_data
		if (cfData) {
			router.push(`/cf-project/${cfData.id}`)
		}
	} else {
		router.push(`/project/${props.project.slug}`)
	}
}
</script>

<template>
	<div
		class="card-shadow bg-bg-raised rounded-xl overflow-clip cursor-pointer hover:brightness-90 transition-all"
		@click="handleCardClick"
	>
		<div
			class="w-full aspect-[2/1] bg-cover bg-center bg-no-repeat"
			:style="{
				'background-color': project.featured_gallery ?? project.gallery[0] ? null : toColor,
				'background-image': `url(${
					project.featured_gallery ??
					project.gallery[0] ??
					'https://launcher-files.modrinth.com/assets/maze-bg.png'
				})`,
			}"
		>
			<div
				class="badges-wrapper"
				:class="{
					'no-image': !project.featured_gallery && !project.gallery[0],
				}"
				:style="{
					background: !project.featured_gallery && !project.gallery[0] ? toTransparent : null,
				}"
			></div>
		</div>
		<div class="flex flex-col justify-center gap-2 px-4 py-3">
			<div class="flex gap-2 items-center">
				<div class="relative shrink-0">
					<Avatar size="48px" :src="project.icon_url" />
					<div
						v-if="project.source"
						class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-bg flex items-center justify-center shadow-sm"
						:title="project.source === 'curseforge' ? 'CurseForge' : 'Modrinth'"
					>
						<FlameColorIcon v-if="project.source === 'curseforge'" class="w-2.5 h-2.5" />
						<ModrinthColorIcon v-else class="w-2.5 h-2.5" />
					</div>
				</div>
				<div class="h-full flex items-center font-bold text-contrast leading-normal">
					<span class="line-clamp-2">{{ project.title }}</span>
				</div>
			</div>
			<p class="m-0 text-sm font-medium line-clamp-3 leading-tight h-[3.25rem]">
				{{ project.description }}
			</p>
			<div class="flex items-center gap-2 text-sm text-secondary font-semibold mt-auto">
				<div
					class="flex items-center gap-1 pr-2 border-0 border-r-[1px] border-solid border-button-border"
				>
					<DownloadIcon />
					{{ formatNumber(project.downloads) }}
				</div>
				<div
					v-if="project.source !== 'curseforge'"
					class="flex items-center gap-1 pr-2 border-0 border-r-[1px] border-solid border-button-border"
				>
					<HeartIcon />
					{{ formatNumber(project.follows) }}
				</div>
				<div class="flex items-center gap-1 pr-2">
					<TagIcon />
					<TagItem>
						{{ formatCategory(featuredCategory) }}
					</TagItem>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss"></style>
