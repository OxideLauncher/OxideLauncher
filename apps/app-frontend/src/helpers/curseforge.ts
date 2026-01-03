import { invoke } from '@tauri-apps/api/core'

// ============================================================================
// CurseForge Native Types
// ============================================================================

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
	logo?: ModAsset
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
	fileSizeOnDisk?: number
	fileFingerprint?: number
	downloadUrl?: string
	gameVersions: string[]
	sortableGameVersions: SortableGameVersion[]
	dependencies: FileDependency[]
	exposeAsAlternative?: boolean
	parentProjectFileId?: number
	alternateFileId?: number
	isServerPack?: boolean
	serverPackFileId?: number
	isEarlyAccessContent?: boolean
	earlyAccessEndDate?: string
	fileFingerprint64?: number
	modules: FileModule[]
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

// ============================================================================
// Cached CurseForge Types
// ============================================================================

export type CacheBehaviour =
	| 'stale_while_revalidate_skip_offline'
	| 'stale_while_revalidate'
	| 'must_revalidate'
	| 'bypass'

export interface CfCachedProject {
	id: number
	name: string
	slug: string
	summary: string
	download_count: number
	is_featured: boolean
	class_id?: number
	authors: CfCachedAuthor[]
	logo_url?: string
	logo_thumbnail_url?: string
	featured_image_url?: string
	main_file_id: number
	date_created: string
	date_modified: string
	date_released: string
	allow_mod_distribution?: boolean
	is_available: boolean
	thumbs_up_count: number
	rating?: number
	website_url?: string
	wiki_url?: string
	issues_url?: string
	source_url?: string
	categories: number[]
	primary_category_id: number
}

export interface CfCachedFile {
	id: number
	mod_id: number
	display_name: string
	file_name: string
	release_type: number
	file_status: number
	file_date: string
	file_length: number
	download_count: number
	download_url?: string
	game_versions: string[]
	dependencies: CfCachedDependency[]
	is_available: boolean
	sha1_hash?: string
	fingerprint?: number
}

export interface CfCachedDependency {
	mod_id: number
	relation_type: number
}

export interface CfCachedAuthor {
	id: number
	name: string
	url: string
}

export interface CfSearchResults {
	query: string
	results: CfCachedProject[]
	total_count: number
	index: number
	page_size: number
}

export interface CfCachedFingerprint {
	fingerprint: number
	mod_id: number
	file_id: number
}

export interface CfCachedCategory {
	id: number
	name: string
	slug: string
	icon_url: string
	class_id?: number
	parent_category_id?: number
}

// ============================================================================
// Search & Filter Types
// ============================================================================

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

// ============================================================================
// Constants
// ============================================================================

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

// Release type mapping
export const ReleaseType = {
	Release: 1,
	Beta: 2,
	Alpha: 3,
} as const

// Dependency relation types
export const DependencyType = {
	EmbeddedLibrary: 1,
	OptionalDependency: 2,
	RequiredDependency: 3,
	Tool: 4,
	Incompatible: 5,
	Include: 6,
} as const

// ============================================================================
// Utility Functions
// ============================================================================

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

export function classIdToProjectType(classId?: number): string {
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

export function getClassSlugFromProjectType(projectType: string): string {
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
		case 'world':
			return 'worlds'
		default:
			return 'mc-mods'
	}
}

export function getCurseForgeUrl(mod: CurseForgeMod): string {
	const projectType = classIdToProjectType(mod.classId)
	const classSlug = getClassSlugFromProjectType(projectType)
	return `https://www.curseforge.com/minecraft/${classSlug}/${mod.slug}`
}

export function getFileUrl(mod: CurseForgeMod, fileId: number): string {
	const projectType = classIdToProjectType(mod.classId)
	const classSlug = getClassSlugFromProjectType(projectType)
	return `https://www.curseforge.com/minecraft/${classSlug}/${mod.slug}/files/${fileId}`
}

export function getReleaseTypeString(releaseType: number): 'release' | 'beta' | 'alpha' {
	switch (releaseType) {
		case ReleaseType.Release:
			return 'release'
		case ReleaseType.Beta:
			return 'beta'
		case ReleaseType.Alpha:
			return 'alpha'
		default:
			return 'release'
	}
}

export function getDependencyTypeString(relationType: number): string {
	switch (relationType) {
		case DependencyType.EmbeddedLibrary:
			return 'embedded'
		case DependencyType.OptionalDependency:
			return 'optional'
		case DependencyType.RequiredDependency:
			return 'required'
		case DependencyType.Tool:
			return 'tool'
		case DependencyType.Incompatible:
			return 'incompatible'
		case DependencyType.Include:
			return 'include'
		default:
			return 'optional'
	}
}

export function isRequiredDependency(dep: FileDependency): boolean {
	return dep.relationType === DependencyType.RequiredDependency
}

export function isOptionalDependency(dep: FileDependency): boolean {
	return dep.relationType === DependencyType.OptionalDependency
}

export function isIncompatible(dep: FileDependency): boolean {
	return dep.relationType === DependencyType.Incompatible
}

export function getLoaderNameFromId(loaderId: number): string | null {
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

export function getFileSha1(file: CurseForgeFile): string | undefined {
	return file.hashes.find((h) => h.algo === 1)?.value
}

/**
 * Extract loaders from a CurseForge file
 */
export function getFileLoaders(file: CurseForgeFile): string[] {
	const loaders = new Set<string>()

	// Try to extract from sortable game versions
	for (const sgv of file.sortableGameVersions || []) {
		const loaderMatch = sgv.gameVersionName.toLowerCase()
		if (loaderMatch.includes('neoforge')) loaders.add('neoforge')
		else if (loaderMatch.includes('forge')) loaders.add('forge')
		else if (loaderMatch.includes('fabric')) loaders.add('fabric')
		else if (loaderMatch.includes('quilt')) loaders.add('quilt')
	}

	// Fallback: detect from filename
	if (loaders.size === 0) {
		const filename = file.fileName.toLowerCase()
		if (filename.includes('fabric')) loaders.add('fabric')
		if (filename.includes('neoforge')) loaders.add('neoforge')
		else if (filename.includes('forge')) loaders.add('forge')
		if (filename.includes('quilt')) loaders.add('quilt')
	}

	return Array.from(loaders)
}

/**
 * Extract Minecraft game versions from a CurseForge file (excluding loader versions)
 */
export function getFileGameVersions(file: CurseForgeFile): string[] {
	return file.gameVersions.filter((v) => /^\d+\.\d+/.test(v))
}

/**
 * Extract unique loaders from a mod's latest files indexes
 */
export function getModLoaders(mod: CurseForgeMod): string[] {
	const loaders = new Set<string>()
	for (const fileIndex of mod.latestFilesIndexes || []) {
		if (fileIndex.modLoader !== undefined && fileIndex.modLoader !== null) {
			const loaderName = getLoaderNameFromId(fileIndex.modLoader)
			if (loaderName) {
				loaders.add(loaderName)
			}
		}
	}
	return Array.from(loaders)
}

/**
 * Extract unique game versions from a mod's latest files indexes
 */
export function getModGameVersions(mod: CurseForgeMod): string[] {
	const versions = new Set<string>()
	for (const fileIndex of mod.latestFilesIndexes || []) {
		if (fileIndex.gameVersion) {
			versions.add(fileIndex.gameVersion)
		}
	}
	return Array.from(versions)
}

// ============================================================================
// API Functions
// ============================================================================

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

export async function get_file_changelog(modId: number, fileId: number): Promise<string> {
	return await invoke('plugin:curseforge|curseforge_get_file_changelog', { modId, fileId })
}

export async function get_game_versions(): Promise<GameVersionsByType[]> {
	return await invoke('plugin:curseforge|curseforge_get_game_versions', {})
}

export async function get_game_version_types(): Promise<GameVersionType[]> {
	return await invoke('plugin:curseforge|curseforge_get_game_version_types', {})
}

export async function get_file_download_url(modId: number, fileId: number): Promise<string> {
	return await invoke('plugin:curseforge|curseforge_get_file_download_url', { modId, fileId })
}

export async function install_file(
	profilePath: string,
	modId: number,
	fileId: number,
): Promise<string> {
	return await invoke('plugin:curseforge|curseforge_install_file', {
		profilePath,
		modId,
		fileId,
	})
}

// ============================================================================
// Cached API Functions
// ============================================================================

/**
 * Get a single mod by ID with caching support
 */
export async function get_mod_cached(
	modId: number,
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedProject | null> {
	return await invoke('plugin:curseforge|curseforge_get_mod_cached', {
		modId,
		cacheBehaviour,
	})
}

/**
 * Get multiple mods by ID with caching support
 */
export async function get_mods_cached(
	modIds: number[],
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedProject[]> {
	return await invoke('plugin:curseforge|curseforge_get_mods_cached', {
		modIds,
		cacheBehaviour,
	})
}

/**
 * Get a single file by ID with caching support
 */
export async function get_file_cached(
	fileId: number,
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedFile | null> {
	return await invoke('plugin:curseforge|curseforge_get_file_cached', {
		fileId,
		cacheBehaviour,
	})
}

/**
 * Get multiple files by ID with caching support
 */
export async function get_files_cached(
	fileIds: number[],
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedFile[]> {
	return await invoke('plugin:curseforge|curseforge_get_files_cached', {
		fileIds,
		cacheBehaviour,
	})
}

/**
 * Get fingerprint match with caching support (for file matching)
 */
export async function get_fingerprint_cached(
	fingerprint: number,
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedFingerprint | null> {
	return await invoke('plugin:curseforge|curseforge_get_fingerprint_cached', {
		fingerprint,
		cacheBehaviour,
	})
}

/**
 * Get multiple fingerprint matches with caching support
 */
export async function get_fingerprints_cached(
	fingerprints: number[],
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedFingerprint[]> {
	return await invoke('plugin:curseforge|curseforge_get_fingerprints_cached', {
		fingerprints,
		cacheBehaviour,
	})
}

/**
 * Get CurseForge categories with caching support
 */
export async function get_categories_cached(
	cacheBehaviour?: CacheBehaviour,
): Promise<CfCachedCategory[] | null> {
	return await invoke('plugin:curseforge|curseforge_get_categories_cached', {
		cacheBehaviour,
	})
}

/**
 * Search for mods with caching support
 * Results are cached by query string
 */
export async function search_cached(
	params: ModSearchParams,
	cacheBehaviour?: CacheBehaviour,
): Promise<CfSearchResults> {
	return await invoke('plugin:curseforge|curseforge_search_cached', {
		params,
		cacheBehaviour,
	})
}

// ============================================================================
// High-level Helper Functions
// ============================================================================

export interface CfProjectData {
	mod: CurseForgeMod
	description: string
	files: CurseForgeFile[]
	totalFiles: number
}

/**
 * Fetch complete project data for a CurseForge mod
 */
export async function fetchCfProject(modId: number): Promise<CfProjectData> {
	const [mod, description, filesResponse] = await Promise.all([
		get_mod(modId),
		get_mod_description(modId),
		get_mod_files(modId, undefined, undefined, 0, 50),
	])

	return {
		mod,
		description,
		files: filesResponse.data,
		totalFiles: filesResponse.pagination.totalCount,
	}
}

/**
 * Find the best matching file for a profile
 */
export function findPreferredFile(
	files: CurseForgeFile[],
	profile: { loader: string; game_version: string },
): CurseForgeFile | undefined {
	// First try exact match for both game version and loader
	let file = files.find((f) => {
		const gameVersions = getFileGameVersions(f)
		const loaders = getFileLoaders(f)
		return gameVersions.includes(profile.game_version) && loaders.includes(profile.loader)
	})

	if (!file) {
		// Fall back to just game version match
		file = files.find((f) => {
			const gameVersions = getFileGameVersions(f)
			return gameVersions.includes(profile.game_version)
		})
	}

	if (!file && files.length > 0) {
		// Return the latest file as a last resort
		file = files[0]
	}

	return file
}

/**
 * Check if a file is compatible with a profile
 */
export function isFileCompatible(
	file: CurseForgeFile,
	profile: { loader: string; game_version: string },
): boolean {
	const gameVersions = getFileGameVersions(file)
	const loaders = getFileLoaders(file)

	const gameVersionMatch = gameVersions.includes(profile.game_version)
	const loaderMatch =
		loaders.length === 0 ||
		loaders.includes(profile.loader) ||
		loaders.includes('datapack')

	return gameVersionMatch && loaderMatch
}

/**
 * Install dependencies for a CurseForge file
 */
export async function installCfDependencies(
	profilePath: string,
	file: CurseForgeFile,
	profile: { loader: string; game_version: string },
	checkInstalled: (modId: number) => Promise<boolean>,
): Promise<void> {
	for (const dep of file.dependencies) {
		if (!isRequiredDependency(dep)) continue

		// Check if already installed
		if (await checkInstalled(dep.modId)) continue

		try {
			// Fetch available files for the dependency
			const filesResponse = await get_mod_files(dep.modId, profile.game_version, profile.loader)

			if (filesResponse.data.length === 0) {
				// Try without loader filter
				const allFilesResponse = await get_mod_files(dep.modId, profile.game_version)
				if (allFilesResponse.data.length > 0) {
					const latestFile = allFilesResponse.data[0]
					await install_file(profilePath, dep.modId, latestFile.id)
				}
			} else {
				const latestFile = filesResponse.data[0]
				await install_file(profilePath, dep.modId, latestFile.id)
			}
		} catch (e) {
			console.warn(`Failed to install CurseForge dependency ${dep.modId}:`, e)
		}
	}
}

// ============================================================================
// Modal Compatibility Types & Functions
// ============================================================================

/**
 * Normalized version format for ModInstallModal compatibility
 * The modal needs versions with loaders/game_versions arrays
 */
export interface NormalizedCfVersion {
	id: string
	name: string
	loaders: string[]
	game_versions: string[]
	curseforge_mod_id: number
	curseforge_file_id: number
	// Original file reference for native operations
	_file: CurseForgeFile
}

/**
 * Normalized project format for modal compatibility
 */
export interface NormalizedCfProject {
	id: string
	title: string
	project_type: string
	icon_url?: string
	source: 'curseforge'
	curseforge_id: number
	// Original mod reference for native operations
	_mod: CurseForgeMod
}

/**
 * Convert native CurseForge files to normalized versions for modal use
 */
export function normalizeCfFilesForModal(files: CurseForgeFile[]): NormalizedCfVersion[] {
	return files.map((file) => ({
		id: `cf-${file.id}`,
		name: file.displayName,
		loaders: getFileLoaders(file),
		game_versions: getFileGameVersions(file),
		curseforge_mod_id: file.modId,
		curseforge_file_id: file.id,
		_file: file,
	}))
}

/**
 * Convert native CurseForge mod to normalized project for modal use
 */
export function normalizeCfModForModal(mod: CurseForgeMod): NormalizedCfProject {
	return {
		id: `cf-${mod.id}`,
		title: mod.name,
		project_type: classIdToProjectType(mod.classId),
		icon_url: mod.logo?.thumbnailUrl,
		source: 'curseforge',
		curseforge_id: mod.id,
		_mod: mod,
	}
}

/**
 * Check if a normalized CF version is compatible with a profile
 * Used by ModInstallModal to filter compatible instances
 */
export function isCfVersionCompatible(
	version: { game_versions: string[]; loaders: string[] },
	profile: { loader: string; game_version: string },
): boolean {
	const gameVersionMatch = version.game_versions.includes(profile.game_version)
	const loaderMatch =
		version.loaders.length === 0 ||
		version.loaders.includes(profile.loader) ||
		version.loaders.includes('datapack')

	return gameVersionMatch && loaderMatch
}

/**
 * Find the best matching normalized CF version for a profile
 * Used by ModInstallModal to pick a version to install
 */
export function findPreferredCfVersion(
	versions: NormalizedCfVersion[],
	profile: { loader: string; game_version: string },
): NormalizedCfVersion | undefined {
	// First try exact match for both game version and loader
	let version = versions.find(
		(v) =>
			v.game_versions.includes(profile.game_version) &&
			v.loaders.includes(profile.loader),
	)

	if (!version) {
		// Fall back to just game version match
		version = versions.find((v) => v.game_versions.includes(profile.game_version))
	}

	if (!version && versions.length > 0) {
		// Return the first version as a last resort
		version = versions[0]
	}

	return version
}
