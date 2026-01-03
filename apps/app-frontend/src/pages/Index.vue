<script setup lang="ts">
import { defineMessages, injectNotificationManager, useVIntl } from '@oxide/ui'
import type { SearchResult } from '@oxide/utils'
import dayjs from 'dayjs'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import RowDisplay from '@/components/RowDisplay.vue'
import ProviderToggle from '@/components/ui/ProviderToggle.vue'
import RecentWorldsList from '@/components/ui/world/RecentWorldsList.vue'
import {
    normalizeCachedCurseForgeResult,
    useContentProvider,
    type NormalizedSearchResult,
} from '@/composables/useContentProvider'
import { get_search_results } from '@/helpers/cache.js'
import {
    ClassId,
    get_categories_cached as cfGetCategoriesCached,
    search_cached,
    type CfCachedCategory,
} from '@/helpers/curseforge'
import { profile_listener } from '@/helpers/events'
import { list } from '@/helpers/profile.js'
import type { GameInstance } from '@/helpers/types'
import { useBreadcrumbs } from '@/store/breadcrumbs'

const { handleError } = injectNotificationManager()
const { formatMessage } = useVIntl()
const route = useRoute()
const breadcrumbs = useBreadcrumbs()

breadcrumbs.setRootContext({ name: 'Home', link: route.path })

const { provider, isModrinth } = useContentProvider()

const messages = defineMessages({
	welcomeBack: {
		id: 'home.welcome-back',
		defaultMessage: 'Welcome back!',
	},
	welcomeNew: {
		id: 'home.welcome-new',
		defaultMessage: 'Welcome to Oxide Launcher!',
	},
	discoverModpack: {
		id: 'home.discover-modpack',
		defaultMessage: 'Discover a modpack',
	},
	discoverMods: {
		id: 'home.discover-mods',
		defaultMessage: 'Discover mods',
	},
	popularModpacks: {
		id: 'home.popular-modpacks',
		defaultMessage: 'Popular modpacks',
	},
	popularMods: {
		id: 'home.popular-mods',
		defaultMessage: 'Popular mods',
	},
})

const instances = ref<GameInstance[]>([])

const featuredModpacks = ref<SearchResult[] | NormalizedSearchResult[]>([])
const featuredMods = ref<SearchResult[] | NormalizedSearchResult[]>([])
const installedModpacksFilter = ref('')
const loading = ref(false)

const recentInstances = computed(() =>
	instances.value
		.filter((x) => x.last_played)
		.slice()
		.sort((a, b) => dayjs(b.last_played).diff(dayjs(a.last_played))),
)

const hasFeaturedProjects = computed(
	() => (featuredModpacks.value?.length ?? 0) + (featuredMods.value?.length ?? 0) > 0,
)

const offline = ref<boolean>(!navigator.onLine)
window.addEventListener('offline', () => {
	offline.value = true
})
window.addEventListener('online', () => {
	offline.value = false
})

async function fetchInstances() {
	instances.value = await list().catch(handleError)

	const filters = []
	for (const instance of instances.value) {
		if (instance.linked_data && instance.linked_data.project_id) {
			filters.push(`NOT"project_id"="${instance.linked_data.project_id}"`)
		}
	}
	installedModpacksFilter.value = filters.join(' AND ')
}

async function fetchFeaturedModpacks() {
	const response = await get_search_results(
		`?facets=[["project_type:modpack"]]&limit=10&index=follows&filters=${installedModpacksFilter.value}`,
	)

	if (response) {
		featuredModpacks.value = response.result.hits
	} else {
		featuredModpacks.value = []
	}
}

async function fetchFeaturedMods() {
	const response = await get_search_results('?facets=[["project_type:mod"]]&limit=10&index=follows')

	if (response) {
		featuredMods.value = response.result.hits
	} else {
		featuredMods.value = []
	}
}

async function fetchCurseForgeFeatured() {
	try {
		// Fetch categories for lookup
		const cfCategories = await cfGetCategoriesCached()
		const cfCategoryMap = new Map<number, CfCachedCategory>()
		if (cfCategories) {
			for (const cat of cfCategories) {
				cfCategoryMap.set(cat.id, cat)
			}
		}

		// Use cached search for both modpacks and mods (sorted by popularity)
		const [modpacksResult, modsResult] = await Promise.all([
			search_cached({
				class_id: ClassId.Modpacks,
				sort_field: 'Popularity',
				sort_order: 'desc',
				page_size: 10,
			}),
			search_cached({
				class_id: ClassId.Mods,
				sort_field: 'Popularity',
				sort_order: 'desc',
				page_size: 10,
			}),
		])

		// Normalize results and resolve category slugs
		const resolveCfCategories = (result: NormalizedSearchResult) => {
			if (result.cf_category_ids && result.cf_category_ids.length > 0) {
				const resolvedCategories = result.cf_category_ids
					.map((id) => cfCategoryMap.get(id))
					.filter((cat): cat is CfCachedCategory => cat != null)
					.map((cat) => cat.slug)
				result.categories = resolvedCategories
				result.display_categories = resolvedCategories
			}
			return result
		}

		featuredModpacks.value = modpacksResult.results
			.map(normalizeCachedCurseForgeResult)
			.map(resolveCfCategories)
		featuredMods.value = modsResult.results
			.map(normalizeCachedCurseForgeResult)
			.map(resolveCfCategories)
	} catch (error) {
		handleError(error)
		featuredModpacks.value = []
		featuredMods.value = []
	}
}

async function refreshFeaturedProjects() {
	loading.value = true
	try {
		if (isModrinth.value) {
			await Promise.all([fetchFeaturedModpacks(), fetchFeaturedMods()])
		} else {
			await fetchCurseForgeFeatured()
		}
	} finally {
		loading.value = false
	}
}

watch(provider, () => {
	refreshFeaturedProjects()
})

await fetchInstances()
await refreshFeaturedProjects()

const unlistenProfile = await profile_listener(
	async (e: { event: string; profile_path_id: string }) => {
		await fetchInstances()

		if (e.event === 'added' || e.event === 'created' || e.event === 'removed') {
			await refreshFeaturedProjects()
		}
	},
)

onUnmounted(() => {
	unlistenProfile()
})
</script>

<template>
	<div class="p-6 flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<h1 v-if="recentInstances?.length > 0" class="m-0 text-2xl font-extrabold">
				{{ formatMessage(messages.welcomeBack) }}
			</h1>
			<h1 v-else class="m-0 text-2xl font-extrabold">
				{{ formatMessage(messages.welcomeNew) }}
			</h1>
			<ProviderToggle />
		</div>
		<RecentWorldsList :recent-instances="recentInstances" />
		<RowDisplay
			v-if="hasFeaturedProjects && !loading"
			:instances="[
				{
					label: isModrinth
						? formatMessage(messages.discoverModpack)
						: formatMessage(messages.popularModpacks),
					route: '/browse/modpack',
					instances: featuredModpacks,
					downloaded: false,
				},
				{
					label: isModrinth
						? formatMessage(messages.discoverMods)
						: formatMessage(messages.popularMods),
					route: '/browse/mod',
					instances: featuredMods,
					downloaded: false,
				},
			]"
			:can-paginate="true"
		/>
		<div v-else-if="loading" class="flex justify-center py-8">
			<div class="animate-spin w-8 h-8 border-4 border-brand border-t-transparent rounded-full" />
		</div>
	</div>
</template>
