import { computed, type Ref, ref } from 'vue'

import type { CfCachedProject, CurseForgeMod } from '@/helpers/curseforge'
import { classIdToProjectType, getClassSlugFromProjectType, getLoaderNameFromId } from '@/helpers/curseforge'

// Content provider types
export type ContentProvider = 'modrinth' | 'curseforge'

/**
 * Minimal normalized search result for displaying in search cards.
 * Only includes fields genuinely shared between Modrinth and CurseForge.
 */
export interface NormalizedSearchResult {
	// Identifiers
	id: string
	slug: string
	source: ContentProvider

	// Display info
	title: string
	description: string
	icon_url?: string
	author: string

	// Stats
	downloads: number
	follows: number // thumbsUpCount for CurseForge

	// Classification
	project_type: string
	categories: string[]
	display_categories: string[]

	// CurseForge-specific: raw category IDs for lookup
	cf_category_ids?: number[]

	// Compatibility
	versions: string[]
	loaders: string[]

	// Modrinth-specific (only used when source is modrinth)
	client_side?: string
	server_side?: string

	// Dates
	date_created: string
	date_modified: string

	// Gallery
	gallery: string[]
	featured_gallery?: string
	color?: number

	// Original data - keeps native types for provider-specific actions
	modrinth_data?: ModrinthSearchResult
	curseforge_data?: CurseForgeMod

	// Installation tracking
	installed?: boolean
}

// Modrinth search result type
export interface ModrinthSearchResult {
	project_id: string
	slug: string
	title: string
	description: string
	icon_url?: string
	downloads: number
	follows: number
	project_type: string
	categories: string[]
	display_categories: string[]
	author: string
	date_created: string
	date_modified: string
	versions: string[]
	loaders: string[]
	client_side?: string
	server_side?: string
	gallery?: string[]
	featured_gallery?: string
	color?: number
}

/**
 * Normalize a Modrinth search result for display.
 * This is a direct mapping since our normalized format is Modrinth-like.
 */
export function normalizeModrinthResult(result: ModrinthSearchResult): NormalizedSearchResult {
	return {
		id: result.project_id,
		slug: result.slug,
		title: result.title,
		description: result.description,
		icon_url: result.icon_url,
		downloads: result.downloads,
		follows: result.follows,
		project_type: result.project_type,
		categories: result.categories,
		display_categories: result.display_categories,
		author: result.author,
		date_created: result.date_created,
		date_modified: result.date_modified,
		versions: result.versions,
		loaders: result.loaders,
		client_side: result.client_side,
		server_side: result.server_side,
		source: 'modrinth',
		gallery: result.gallery ?? [],
		featured_gallery: result.featured_gallery,
		color: result.color,
		modrinth_data: result,
	}
}

/**
 * Normalize a CurseForge mod for display in search cards.
 * Keeps cf_id as string for consistency but preserves native data.
 */
export function normalizeCurseForgeResult(mod: CurseForgeMod): NormalizedSearchResult {
	// Extract loaders from latest files indexes
	const loaders = new Set<string>()
	for (const fileIndex of mod.latestFilesIndexes || []) {
		if (fileIndex.modLoader !== undefined && fileIndex.modLoader !== null) {
			const loaderName = getLoaderNameFromId(fileIndex.modLoader)
			if (loaderName) {
				loaders.add(loaderName)
			}
		}
	}

	// Extract game versions from latest files indexes
	const versions = new Set<string>()
	for (const fileIndex of mod.latestFilesIndexes || []) {
		if (fileIndex.gameVersion) {
			versions.add(fileIndex.gameVersion)
		}
	}

	// Get project type from class ID
	const projectType = classIdToProjectType(mod.classId)

	// Extract gallery from screenshots
	const gallery = (mod.screenshots ?? []).map((s) => s.url)

	return {
		// Use cf- prefix only for the normalized ID to differentiate in mixed lists
		// The native mod.id is preserved in curseforge_data
		id: `cf-${mod.id}`,
		slug: mod.slug,
		title: mod.name,
		description: mod.summary,
		icon_url: mod.logo?.url,
		downloads: mod.downloadCount,
		follows: mod.thumbsUpCount,
		project_type: projectType,
		categories: mod.categories.map((c) => c.slug),
		display_categories: mod.categories.map((c) => c.slug),
		author: mod.authors[0]?.name ?? 'Unknown',
		date_created: mod.dateCreated,
		date_modified: mod.dateModified,
		versions: Array.from(versions),
		loaders: Array.from(loaders),
		source: 'curseforge',
		gallery: gallery,
		featured_gallery: gallery[0],
		curseforge_data: mod,
	}
}

/**
 * Normalize a cached CurseForge project for display in search cards.
 * Uses snake_case fields from the cache format.
 */
export function normalizeCachedCurseForgeResult(project: CfCachedProject): NormalizedSearchResult {
	const projectType = classIdToProjectType(project.class_id)
	const gallery = project.featured_image_url ? [project.featured_image_url] : []

	return {
		id: `cf-${project.id}`,
		slug: project.slug,
		title: project.name,
		description: project.summary,
		icon_url: project.logo_url,
		downloads: project.download_count,
		follows: project.thumbs_up_count,
		project_type: projectType,
		categories: [], // Will be resolved by caller using cf_category_ids
		display_categories: [],
		cf_category_ids: project.categories, // Raw IDs for lookup
		author: project.authors[0]?.name ?? 'Unknown',
		date_created: project.date_created,
		date_modified: project.date_modified,
		versions: [], // Not stored in cached format
		loaders: [], // Not stored in cached format
		source: 'curseforge',
		gallery: gallery,
		featured_gallery: project.featured_image_url,
	}
}

// Content provider state - shared across the app
const currentProvider: Ref<ContentProvider> = ref('modrinth')

/**
 * Composable for managing the current content provider (Modrinth vs CurseForge).
 */
export function useContentProvider() {
	const setProvider = (provider: ContentProvider) => {
		currentProvider.value = provider
	}

	const toggleProvider = () => {
		currentProvider.value = currentProvider.value === 'modrinth' ? 'curseforge' : 'modrinth'
	}

	const isModrinth = computed(() => currentProvider.value === 'modrinth')
	const isCurseForge = computed(() => currentProvider.value === 'curseforge')

	return {
		provider: currentProvider,
		setProvider,
		toggleProvider,
		isModrinth,
		isCurseForge,
	}
}

/**
 * Get the external URL for a project based on its source.
 */
export function getProjectUrl(result: NormalizedSearchResult): string {
	if (result.source === 'modrinth') {
		return `https://modrinth.com/${result.project_type}/${result.slug}`
	} else {
		const classSlug = getClassSlugFromProjectType(result.project_type)
		return `https://www.curseforge.com/minecraft/${classSlug}/${result.slug}`
	}
}

/**
 * Get the original ID for a project (number for CurseForge, string for Modrinth).
 */
export function getOriginalId(result: NormalizedSearchResult): string | number {
	if (result.source === 'modrinth') {
		return result.modrinth_data?.project_id ?? result.id
	} else {
		return result.curseforge_data?.id ?? parseInt(result.id.replace('cf-', ''))
	}
}

/**
 * Get the CurseForge mod ID from a normalized result.
 * Returns undefined if not a CurseForge result.
 */
export function getCurseForgeId(result: NormalizedSearchResult): number | undefined {
	if (result.source === 'curseforge' && result.curseforge_data) {
		return result.curseforge_data.id
	}
	return undefined
}
