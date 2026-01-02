import { getVersion } from '@tauri-apps/api/app'
import { fetch } from '@tauri-apps/plugin-http'

export type ArticleCategory = 'minecraft' | 'launcher' | 'mods' | 'community'

export interface NewsArticle {
	id: string
	slug: string
	title: string
	summary: string
	date: string
	category: ArticleCategory
	author?: string
	image?: string
}

export interface NewsIndex {
	articles: NewsArticle[]
	lastUpdated: string
}

const NEWS_BASE_URL =
	'https://raw.githubusercontent.com/OxideLauncher/OxideLauncherWeb/refs/heads/main/public/news'

// Cache for news data
let cachedNewsIndex: NewsIndex | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

const articleContentCache = new Map<string, string>()

async function fetchWithUserAgent(url: string): Promise<Response> {
	const version = await getVersion()
	return fetch(url, {
		method: 'GET',
		headers: { 'User-Agent': `oxide-launcher/${version} (support@modrinth.com)` },
	})
}

export async function fetchNewsIndex(forceRefresh = false): Promise<NewsIndex> {
	const now = Date.now()

	// Return cached data if valid and not forcing refresh
	if (!forceRefresh && cachedNewsIndex && now - cacheTimestamp < CACHE_DURATION_MS) {
		return cachedNewsIndex
	}

	try {
		console.log('[News] Fetching news index from:', `${NEWS_BASE_URL}/index.json`)
		const response = await fetchWithUserAgent(`${NEWS_BASE_URL}/index.json`)
		console.log('[News] Response status:', response.status, response.ok)
		if (!response.ok) {
			throw new Error(`Failed to fetch news: ${response.status}`)
		}
		const data = await response.json()
		console.log('[News] Fetched articles:', data.articles?.length ?? 0)

		// Update cache
		cachedNewsIndex = data
		cacheTimestamp = now

		return data
	} catch (error) {
		console.error('[News] Error fetching news index:', error)

		// Return cached data if available, even if stale
		if (cachedNewsIndex) {
			return cachedNewsIndex
		}

		return {
			articles: [],
			lastUpdated: new Date().toISOString(),
		}
	}
}

export async function fetchArticleContent(slug: string): Promise<string | null> {
	// Check cache first
	if (articleContentCache.has(slug)) {
		return articleContentCache.get(slug) ?? null
	}

	try {
		const response = await fetchWithUserAgent(`${NEWS_BASE_URL}/articles/${slug}.md`)
		if (!response.ok) {
			return null
		}
		const text = await response.text()
		// Remove frontmatter (content between --- markers)
		const frontmatterEnd = text.indexOf('---', 3)
		let content: string
		if (frontmatterEnd !== -1) {
			content = text.slice(frontmatterEnd + 3).trim()
		} else {
			content = text
		}

		// Cache the content
		articleContentCache.set(slug, content)

		return content
	} catch (error) {
		console.error('[News] Error fetching article:', error)
		return null
	}
}

export function clearNewsCache(): void {
	cachedNewsIndex = null
	cacheTimestamp = 0
	articleContentCache.clear()
}

export async function prefetchNews(): Promise<void> {
	console.log('[News] Prefetching news articles on app launch...')
	const index = await fetchNewsIndex()

	// Prefetch the first few articles' content
	const articlesToPreload = index.articles.slice(0, 3)
	await Promise.allSettled(
		articlesToPreload.map((article) => fetchArticleContent(article.slug)),
	)
	console.log('[News] Prefetch complete:', index.articles.length, 'articles loaded')
}

export const CATEGORY_COLORS: Record<ArticleCategory, { bg: string; text: string; border: string }> = {
	minecraft: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' },
	launcher: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.4)' },
	mods: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.4)' },
	community: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' },
}

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
	minecraft: 'Minecraft',
	launcher: 'Launcher',
	mods: 'Mods',
	community: 'Community',
}
