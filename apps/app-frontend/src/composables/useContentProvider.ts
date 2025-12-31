import { computed, ref, type Ref } from 'vue'

// Content provider types
export type ContentProvider = 'modrinth' | 'curseforge'

export interface NormalizedSearchResult {
	id: string
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
	source: ContentProvider
	// Gallery images for project cards
	gallery: string[]
	featured_gallery?: string
	color?: number
	// Original data for provider-specific actions
	modrinth_data?: ModrinthSearchResult
	curseforge_data?: CurseForgeMod
	// For installation tracking
	installed?: boolean
}

// Modrinth types (simplified from existing)
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

// CurseForge types (from curseforge.ts)
export interface CurseForgeMod {
	id: number
	gameId: number
	name: string
	slug: string
	summary: string
	downloadCount: number
	thumbsUpCount: number
	classId?: number
	categories: CurseForgeCategory[]
	authors: CurseForgeAuthor[]
	logo?: CurseForgeAsset
	screenshots?: CurseForgeAsset[]
	latestFilesIndexes?: CurseForgeFileIndex[]
	dateCreated: string
	dateModified: string
}

export interface CurseForgeCategory {
	id: number
	name: string
	slug: string
}

export interface CurseForgeAuthor {
	id: number
	name: string
}

export interface CurseForgeAsset {
	url: string
}

export interface CurseForgeFileIndex {
	gameVersion: string
	modLoader?: number
}

// Loader ID to name mapping
const LOADER_ID_TO_NAME: Record<number, string> = {
	1: 'forge',
	2: 'cauldron',
	3: 'liteloader',
	4: 'fabric',
	5: 'quilt',
	6: 'neoforge',
}

// Class ID to project type mapping
const CLASS_ID_TO_PROJECT_TYPE: Record<number, string> = {
	6: 'mod',
	4471: 'modpack',
	12: 'resourcepack',
	6552: 'shader',
	6945: 'datapack',
	5: 'plugin',
	17: 'world',
}

// Normalize a Modrinth search result
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

// Normalize a CurseForge mod
export function normalizeCurseForgeResult(mod: CurseForgeMod): NormalizedSearchResult {
	// Extract unique loaders from latest files
	const loaders = new Set<string>()
	const latestFilesIndexes = mod.latestFilesIndexes || []
	for (const fileIndex of latestFilesIndexes) {
		if (fileIndex.modLoader !== undefined && fileIndex.modLoader !== null) {
			const loaderName = LOADER_ID_TO_NAME[fileIndex.modLoader]
			if (loaderName) {
				loaders.add(loaderName)
			}
		}
	}

	// Extract unique game versions
	const versions = new Set<string>()
	for (const fileIndex of latestFilesIndexes) {
		if (fileIndex.gameVersion) {
			versions.add(fileIndex.gameVersion)
		}
	}

	// Get project type from class ID
	const projectType = mod.classId ? CLASS_ID_TO_PROJECT_TYPE[mod.classId] || 'mod' : 'mod'

	// Extract gallery from screenshots
	const gallery = (mod.screenshots ?? []).map((s) => s.url)

	return {
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

// Content provider state
const currentProvider: Ref<ContentProvider> = ref('modrinth')

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

// Helper to get project URL based on provider
export function getProjectUrl(result: NormalizedSearchResult): string {
	if (result.source === 'modrinth') {
		return `https://modrinth.com/${result.project_type}/${result.slug}`
	} else {
		const cfId = result.curseforge_data?.id
		return `https://www.curseforge.com/minecraft/${getClassSlug(result.project_type)}/${result.slug}`
	}
}

function getClassSlug(projectType: string): string {
	switch (projectType) {
		case 'mod':
			return 'mc-mods'
		case 'modpack':
			return 'modpacks'
		case 'resourcepack':
			return 'texture-packs'
		case 'shader':
			return 'shaders'
		case 'datapack':
			return 'data-packs'
		case 'plugin':
			return 'bukkit-plugins'
		default:
			return 'mc-mods'
	}
}

// Helper to get the original ID for installation purposes
export function getOriginalId(result: NormalizedSearchResult): string | number {
	if (result.source === 'modrinth') {
		return result.modrinth_data?.project_id ?? result.id
	} else {
		return result.curseforge_data?.id ?? parseInt(result.id.replace('cf-', ''))
	}
}
