import { invoke } from '@tauri-apps/api/core'

// Types
export interface ModSearchParams {
	game_id?: number
	class_id?: number
	category_id?: number
	category_ids?: number[]
	game_version?: string
	game_versions?: string[]
	search_filter?: string
	sort_field?: ModsSearchSortField
	sort_order?: SortOrder
	mod_loader_type?: ModLoaderType
	mod_loader_types?: ModLoaderType[]
	game_version_type_id?: number
	author_id?: number
	primary_author_id?: number
	slug?: string
	index?: number
	page_size?: number
}

export type ModsSearchSortField =
	| 'Featured'
	| 'Popularity'
	| 'LastUpdated'
	| 'Name'
	| 'Author'
	| 'TotalDownloads'
	| 'Category'
	| 'GameVersion'
	| 'EarlyAccess'
	| 'FeaturedReleased'
	| 'ReleasedDate'
	| 'Rating'

export type SortOrder = 'asc' | 'desc'

export type ModLoaderType =
	| 'Any'
	| 'Forge'
	| 'Cauldron'
	| 'LiteLoader'
	| 'Fabric'
	| 'Quilt'
	| 'NeoForge'

export interface CurseForgeMod {
	id: number
	gameId: number
	name: string
	slug: string
	links: ModLinks
	summary: string
	status: number
	downloadCount: number
	isFeatured: boolean
	primaryCategoryId: number
	categories: Category[]
	classId?: number
	authors: ModAuthor[]
	logo: ModAsset
	screenshots: ModAsset[]
	mainFileId?: number
	latestFiles: CurseForgeFile[]
	latestFilesIndexes?: FileIndex[]
	latestEarlyAccessFilesIndexes?: FileIndex[]
	dateCreated: string
	dateModified: string
	dateReleased: string
	allowModDistribution?: boolean
	gamePopularityRank: number
	isAvailable: boolean
	thumbsUpCount: number
	rating?: number
}

export interface ModLinks {
	websiteUrl?: string
	wikiUrl?: string
	issuesUrl?: string
	sourceUrl?: string
}

export interface ModAuthor {
	id: number
	name: string
	url?: string
}

export interface ModAsset {
	id: number
	modId: number
	title: string
	description: string
	thumbnailUrl?: string
	url: string
}

export interface Category {
	id: number
	gameId: number
	name: string
	slug: string
	url: string
	iconUrl?: string
	dateModified: string
	isClass?: boolean
	classId?: number
	parentCategoryId?: number
	displayIndex?: number
}

export interface CurseForgeFile {
	id: number
	gameId: number
	modId: number
	isAvailable: boolean
	displayName: string
	fileName: string
	releaseType: number
	fileStatus: number
	hashes: FileHash[]
	fileDate: string
	fileLength: number
	downloadCount: number
	fileFingerprint: number
	modules: FileModule[]
	sortableGameVersions: SortableGameVersion[]
	dependencies: FileDependency[]
	exposeAsAlternative?: boolean
	parentProjectFileId?: number
	alternateFileId?: number
	isServerPack?: boolean
	serverPackFileId?: number
	isEarlyAccessContent?: boolean
	earlyAccessEndDate?: string
	gameVersions: string[]
	downloadUrl?: string
}

export interface FileHash {
	value: string
	algo: number
}

export interface FileModule {
	name: string
	fingerprint: number
}

export interface SortableGameVersion {
	gameVersionName: string
	gameVersionPadded: string
	gameVersion: string
	gameVersionReleaseDate: string
	gameVersionTypeId?: number
}

export interface FileDependency {
	modId: number
	relationType: number
}

export interface FileIndex {
	gameVersion: string
	fileId: number
	filename: string
	releaseType: number
	gameVersionTypeId?: number
	modLoader?: number
}

export interface Pagination {
	index: number
	pageSize: number
	resultCount: number
	totalCount: number
}

export interface PaginatedResponse<T> {
	data: T[]
	pagination: Pagination
}

export interface FeaturedModsResponse {
	featured: CurseForgeMod[]
	popular: CurseForgeMod[]
	recentlyUpdated: CurseForgeMod[]
}

export interface FingerprintMatch {
	id: number
	file: CurseForgeFile
	latestFiles: CurseForgeFile[]
}

export interface FingerprintsMatchesResult {
	is_cache_built: boolean
	exact_matches: FingerprintMatch[]
	exact_fingerprints: number[]
	partial_matches: FingerprintMatch[]
	partial_match_fingerprints: Record<string, number[]>
	additional_properties?: number[]
	installed_fingerprints: number[]
	unmatchedFingerprints: number[]
}

export interface GameVersionsByType {
	type: number
	versions: string[]
}

export interface GameVersionType {
	id: number
	game_id: number
	name: string
	slug: string
	is_syncable: boolean
	status: number
}

// CurseForge Class IDs
export const ClassId = {
	Mods: 6,
	Modpacks: 4471,
	ResourcePacks: 12,
	Worlds: 17,
	BukkitPlugins: 5,
	Customization: 4546,
	Shaders: 6552,
	DataPacks: 6945,
} as const

export type ClassIdType = (typeof ClassId)[keyof typeof ClassId]

// Convert loader string to CurseForge ModLoaderType
export function loaderToModLoaderType(loader: string): ModLoaderType {
	const loaderLower = loader.toLowerCase()
	switch (loaderLower) {
		case 'forge':
			return 'Forge'
		case 'fabric':
			return 'Fabric'
		case 'quilt':
			return 'Quilt'
		case 'neoforge':
			return 'NeoForge'
		case 'liteloader':
			return 'LiteLoader'
		default:
			return 'Any'
	}
}

// Convert project type to ClassId
export function projectTypeToClassId(projectType: string): number | null {
	switch (projectType) {
		case 'mod':
			return ClassId.Mods
		case 'modpack':
			return ClassId.Modpacks
		case 'resourcepack':
			return ClassId.ResourcePacks
		case 'shader':
			return ClassId.Shaders
		case 'datapack':
			return ClassId.DataPacks
		case 'plugin':
			return ClassId.BukkitPlugins
		default:
			return null
	}
}

// API functions
export async function search_mods(
	params: ModSearchParams,
): Promise<PaginatedResponse<CurseForgeMod>> {
	return await invoke('plugin:curseforge|curseforge_search_mods', { params })
}

export async function get_mod(modId: number): Promise<CurseForgeMod> {
	return await invoke('plugin:curseforge|curseforge_get_mod', { modId })
}

export async function get_mods(modIds: number[]): Promise<CurseForgeMod[]> {
	return await invoke('plugin:curseforge|curseforge_get_mods', { modIds })
}

export async function get_mod_files(
	modId: number,
	gameVersion?: string,
	modLoaderType?: string,
	index?: number,
	pageSize?: number,
): Promise<PaginatedResponse<CurseForgeFile>> {
	return await invoke('plugin:curseforge|curseforge_get_mod_files', {
		modId,
		gameVersion,
		modLoaderType,
		index,
		pageSize,
	})
}

export async function get_mod_file(
	modId: number,
	fileId: number,
): Promise<CurseForgeFile> {
	return await invoke('plugin:curseforge|curseforge_get_mod_file', { modId, fileId })
}

export async function get_categories(classId?: number): Promise<Category[]> {
	return await invoke('plugin:curseforge|curseforge_get_categories', { classId })
}

export async function get_featured_mods(
	gameVersionTypeId?: number,
	excludedModIds?: number[],
): Promise<FeaturedModsResponse> {
	return await invoke('plugin:curseforge|curseforge_get_featured_mods', {
		gameVersionTypeId,
		excludedModIds,
	})
}

export async function match_fingerprints(
	fingerprints: number[],
): Promise<FingerprintsMatchesResult> {
	return await invoke('plugin:curseforge|curseforge_match_fingerprints', { fingerprints })
}

export async function get_mod_description(modId: number): Promise<string> {
	return await invoke('plugin:curseforge|curseforge_get_mod_description', { modId })
}

export async function get_game_versions(): Promise<GameVersionsByType[]> {
	return await invoke('plugin:curseforge|curseforge_get_game_versions', {})
}

export async function get_game_version_types(): Promise<GameVersionType[]> {
	return await invoke('plugin:curseforge|curseforge_get_game_version_types', {})
}

// Helper to convert CurseForge mod to a normalized format similar to Modrinth projects
export interface NormalizedProject {
	id: string
	slug: string
	title: string
	description: string
	icon_url?: string
	downloads: number
	follows: number
	project_type: string
	categories: string[]
	author: string
	date_created: string
	date_modified: string
	versions: string[]
	loaders: string[]
	client_side?: string
	server_side?: string
	source: 'modrinth' | 'curseforge'
	// Original data for provider-specific actions
	curseforge_data?: CurseForgeMod
}

export function normalizeCurseForgeMod(mod: CurseForgeMod): NormalizedProject {
	// Extract unique loaders from latest files
	const loaders = new Set<string>()
	const latestFilesIndexes = mod.latestFilesIndexes || []
	for (const fileIndex of latestFilesIndexes) {
		if (fileIndex.modLoader !== undefined && fileIndex.modLoader !== null) {
			const loaderName = getLoaderNameFromId(fileIndex.modLoader)
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
	const projectType = getProjectTypeFromClassId(mod.classId)

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
		author: mod.authors[0]?.name ?? 'Unknown',
		date_created: mod.dateCreated,
		date_modified: mod.dateModified,
		versions: Array.from(versions),
		loaders: Array.from(loaders),
		source: 'curseforge',
		curseforge_data: mod,
	}
}

function getLoaderNameFromId(loaderId: number): string | null {
	switch (loaderId) {
		case 1:
			return 'forge'
		case 2:
			return 'cauldron'
		case 3:
			return 'liteloader'
		case 4:
			return 'fabric'
		case 5:
			return 'quilt'
		case 6:
			return 'neoforge'
		default:
			return null
	}
}

function getProjectTypeFromClassId(classId?: number): string {
	switch (classId) {
		case ClassId.Mods:
			return 'mod'
		case ClassId.Modpacks:
			return 'modpack'
		case ClassId.ResourcePacks:
			return 'resourcepack'
		case ClassId.Shaders:
			return 'shader'
		case ClassId.DataPacks:
			return 'datapack'
		case ClassId.BukkitPlugins:
			return 'plugin'
		case ClassId.Worlds:
			return 'world'
		default:
			return 'mod'
	}
}

// Normalized project format for UI components (matching Modrinth structure)
export interface NormalizedCfProject {
	// Core identifiers
	id: string
	slug: string
	project_type: string
	team: string

	// Display info
	title: string
	description: string
	body: string // HTML description
	icon_url?: string
	color?: number

	// Stats
	downloads: number
	followers: number

	// Dates
	published: string
	updated: string

	// Categories and tags
	categories: string[]
	additional_categories: string[]
	loaders: string[]
	game_versions: string[]

	// Environment
	client_side?: string
	server_side?: string

	// URLs and links
	issues_url?: string
	source_url?: string
	wiki_url?: string
	discord_url?: string
	donation_urls: Array<{ id: string; platform: string; url: string }>

	// Gallery
	gallery: Array<{
		url: string
		raw_url: string
		title: string
		description: string
		created: string
		ordering: number
	}>

	// Versions (file IDs)
	versions: string[]

	// License (CurseForge doesn't provide this)
	license?: { id: string; name: string; url?: string }

	// Authors
	authors: Array<{ id: number; name: string; url?: string }>

	// Source indicator
	source: 'curseforge'
	curseforge_id: number
}

// Normalized version/file format for UI components
export interface NormalizedCfVersion {
	id: string
	project_id: string
	author_id?: number
	featured: boolean
	name: string
	version_number: string
	changelog?: string
	changelog_url?: string
	date_published: string
	downloads: number
	version_type: 'release' | 'beta' | 'alpha'
	status: string
	requested_status?: string
	files: Array<{
		hashes: { sha1?: string; sha512?: string }
		url?: string
		filename: string
		primary: boolean
		size: number
		file_type?: string
	}>
	dependencies: Array<{
		version_id?: string
		project_id?: string
		file_name?: string
		dependency_type: string
	}>
	game_versions: string[]
	loaders: string[]
	// Source indicator
	source: 'curseforge'
	curseforge_mod_id: number
	curseforge_file_id: number
}

// Release type mapping
function getReleaseType(releaseType: number): 'release' | 'beta' | 'alpha' {
	switch (releaseType) {
		case 1:
			return 'release'
		case 2:
			return 'beta'
		case 3:
			return 'alpha'
		default:
			return 'release'
	}
}

// Dependency type mapping
function getDependencyType(relationType: number): string {
	switch (relationType) {
		case 1:
			return 'embedded'
		case 2:
			return 'optional'
		case 3:
			return 'required'
		case 4:
			return 'tool'
		case 5:
			return 'incompatible'
		case 6:
			return 'include'
		default:
			return 'optional'
	}
}

// Normalize a CurseForge mod to project format for UI
export async function normalizeCfProject(
	mod: CurseForgeMod,
	description?: string,
): Promise<NormalizedCfProject> {
	// Extract unique loaders
	const loaders = new Set<string>()
	const latestFilesIndexes = mod.latestFilesIndexes || []
	for (const fileIndex of latestFilesIndexes) {
		if (fileIndex.modLoader !== undefined && fileIndex.modLoader !== null) {
			const loaderName = getLoaderNameFromId(fileIndex.modLoader)
			if (loaderName) {
				loaders.add(loaderName)
			}
		}
	}

	// Extract unique game versions
	const gameVersions = new Set<string>()
	for (const fileIndex of latestFilesIndexes) {
		if (fileIndex.gameVersion) {
			gameVersions.add(fileIndex.gameVersion)
		}
	}

	// Get project type from class ID
	const projectType = getProjectTypeFromClassId(mod.classId)

	// Transform screenshots to gallery format
	const gallery = (mod.screenshots || []).map((screenshot, index) => ({
		url: screenshot.thumbnailUrl || screenshot.url,
		raw_url: screenshot.url,
		title: screenshot.title || `Screenshot ${index + 1}`,
		description: screenshot.description || '',
		created: mod.dateModified,
		ordering: index,
	}))

	// Extract file IDs as version strings
	const versions = (mod.latestFiles || []).map((file) => `cf-${file.id}`)

	// Build donation URLs from links
	const donationUrls: Array<{ id: string; platform: string; url: string }> = []

	return {
		id: `cf-${mod.id}`,
		slug: mod.slug,
		project_type: projectType,
		team: `cf-team-${mod.id}`,
		title: mod.name,
		description: mod.summary,
		body: description || mod.summary,
		icon_url: mod.logo?.url,
		downloads: mod.downloadCount,
		followers: mod.thumbsUpCount,
		published: mod.dateCreated,
		updated: mod.dateModified,
		categories: mod.categories.map((c) => c.slug),
		additional_categories: [],
		loaders: Array.from(loaders),
		game_versions: Array.from(gameVersions),
		client_side: undefined,
		server_side: undefined,
		issues_url: mod.links?.issuesUrl,
		source_url: mod.links?.sourceUrl,
		wiki_url: mod.links?.wikiUrl,
		discord_url: undefined,
		donation_urls: donationUrls,
		gallery,
		versions,
		license: undefined,
		authors: mod.authors.map((author) => ({
			id: author.id,
			name: author.name,
			url: author.url,
		})),
		source: 'curseforge',
		curseforge_id: mod.id,
	}
}

// Normalize a CurseForge file to version format for UI
export function normalizeCfFile(
	file: CurseForgeFile,
	modId: number,
): NormalizedCfVersion {
	// Extract loaders from sortable game versions or modules
	const loaders = new Set<string>()
	for (const sgv of file.sortableGameVersions || []) {
		// Check if it's a loader version
		const loaderMatch = sgv.gameVersionName.toLowerCase()
		if (
			loaderMatch.includes('forge') ||
			loaderMatch.includes('fabric') ||
			loaderMatch.includes('quilt') ||
			loaderMatch.includes('neoforge')
		) {
			if (loaderMatch.includes('neoforge')) loaders.add('neoforge')
			else if (loaderMatch.includes('forge')) loaders.add('forge')
			else if (loaderMatch.includes('fabric')) loaders.add('fabric')
			else if (loaderMatch.includes('quilt')) loaders.add('quilt')
		}
	}

	// If no loaders found from sortable versions, try to detect from filename
	if (loaders.size === 0) {
		const filename = file.fileName.toLowerCase()
		if (filename.includes('fabric')) loaders.add('fabric')
		if (filename.includes('forge') && !filename.includes('neoforge')) loaders.add('forge')
		if (filename.includes('neoforge')) loaders.add('neoforge')
		if (filename.includes('quilt')) loaders.add('quilt')
	}

	// Extract game versions
	const gameVersions = file.gameVersions.filter((v) => /^\d+\.\d+/.test(v))

	// Build file info
	const files = [
		{
			hashes: {
				sha1: file.hashes.find((h) => h.algo === 1)?.value,
			},
			url: file.downloadUrl,
			filename: file.fileName,
			primary: true,
			size: file.fileLength,
			file_type: undefined,
		},
	]

	// Map dependencies
	const dependencies = (file.dependencies || []).map((dep) => ({
		version_id: undefined,
		project_id: `cf-${dep.modId}`,
		file_name: undefined,
		dependency_type: getDependencyType(dep.relationType),
	}))

	return {
		id: `cf-${file.id}`,
		project_id: `cf-${modId}`,
		author_id: undefined,
		featured: false,
		name: file.displayName,
		version_number: file.displayName,
		changelog: undefined,
		changelog_url: `https://www.curseforge.com/minecraft/mc-mods/${modId}/files/${file.id}`,
		date_published: file.fileDate,
		downloads: file.downloadCount,
		version_type: getReleaseType(file.releaseType),
		status: file.isAvailable ? 'listed' : 'unlisted',
		requested_status: undefined,
		files,
		dependencies,
		game_versions: gameVersions,
		loaders: Array.from(loaders),
		source: 'curseforge',
		curseforge_mod_id: modId,
		curseforge_file_id: file.id,
	}
}

// Fetch and normalize a complete CurseForge project with all data
export async function fetchNormalizedCfProject(modId: number): Promise<{
	project: NormalizedCfProject
	versions: NormalizedCfVersion[]
	members: Array<{ user: { id: number; username: string; avatar_url?: string }; role: string }>
}> {
	// Fetch mod data, description, and files in parallel
	const [mod, description, filesResponse] = await Promise.all([
		get_mod(modId),
		get_mod_description(modId),
		get_mod_files(modId, undefined, undefined, 0, 50),
	])

	// Normalize the project
	const project = await normalizeCfProject(mod, description)

	// Normalize files to versions
	const versions = filesResponse.data.map((file) => normalizeCfFile(file, modId))

	// Create simplified members from authors
	const members = mod.authors.map((author) => ({
		user: {
			id: author.id,
			username: author.name,
			avatar_url: undefined,
		},
		role: 'Owner',
	}))

	return { project, versions, members }
}
