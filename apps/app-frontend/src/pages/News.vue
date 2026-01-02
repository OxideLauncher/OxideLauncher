<script setup lang="ts">
import {
    CalendarIcon,
    ExternalIcon,
    LeftArrowIcon,
    NewspaperIcon,
    RefreshCwIcon,
    UserIcon,
} from '@oxide/assets'
import {
    ButtonStyled,
    Card,
    defineMessages,
    injectNotificationManager,
    LoadingIndicator,
    useVIntl
} from '@oxide/ui'
import { renderString } from '@oxide/utils'
import { openUrl } from '@tauri-apps/plugin-opener'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import {
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    clearNewsCache,
    fetchArticleContent,
    fetchNewsIndex,
    type NewsArticle,
} from '@/helpers/news'
import { useBreadcrumbs } from '@/store/breadcrumbs'

const { handleError } = injectNotificationManager()
const { formatMessage } = useVIntl()
const route = useRoute()
const breadcrumbs = useBreadcrumbs()

breadcrumbs.setRootContext({ name: 'News', link: route.path })

const messages = defineMessages({
	newsTitle: {
		id: 'news.title',
		defaultMessage: 'News',
	},
	newsSubtitle: {
		id: 'news.subtitle',
		defaultMessage: 'Updates, announcements, and community highlights',
	},
	refreshButton: {
		id: 'news.refresh',
		defaultMessage: 'Refresh',
	},
	noArticles: {
		id: 'news.no-articles',
		defaultMessage: 'No news yet',
	},
	noArticlesDescription: {
		id: 'news.no-articles-description',
		defaultMessage: 'Check back later for updates and announcements.',
	},
	readMore: {
		id: 'news.read-more',
		defaultMessage: 'Read more',
	},
	backToNews: {
		id: 'news.back-to-list',
		defaultMessage: 'Back to news',
	},
	errorLoading: {
		id: 'news.error-loading',
		defaultMessage: 'Failed to load news. Please try again later.',
	},
	viewOnWebsite: {
		id: 'news.view-on-website',
		defaultMessage: 'View on website',
	},
})

const articles = ref<NewsArticle[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedArticle = ref<NewsArticle | null>(null)
const articleContent = ref<string | null>(null)
const loadingArticle = ref(false)

async function loadNews(forceRefresh = false) {
	loading.value = true
	error.value = null
	try {
		const index = await fetchNewsIndex(forceRefresh)
		articles.value = index.articles
	} catch (e) {
		error.value = formatMessage(messages.errorLoading)
		handleError(e as Error)
	} finally {
		loading.value = false
	}
}

function refreshNews() {
	clearNewsCache()
	loadNews(true)
}

async function openArticle(article: NewsArticle) {
	selectedArticle.value = article
	loadingArticle.value = true
	try {
		const content = await fetchArticleContent(article.slug)
		articleContent.value = content
	} catch (e) {
		handleError(e as Error)
		articleContent.value = null
	} finally {
		loadingArticle.value = false
	}
}

function closeArticle() {
	selectedArticle.value = null
	articleContent.value = null
}

const renderedContent = computed(() => {
	if (!articleContent.value) return ''
	return renderString(articleContent.value)
})

onMounted(() => {
	loadNews()
})
</script>

<template>
	<div class="p-6 flex flex-col gap-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="p-2 rounded-xl bg-brand-highlight">
					<NewspaperIcon class="h-6 w-6 text-brand" />
				</div>
				<div>
					<h1 class="m-0 text-2xl font-extrabold">{{ formatMessage(messages.newsTitle) }}</h1>
					<p class="m-0 text-secondary text-sm">{{ formatMessage(messages.newsSubtitle) }}</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<ButtonStyled v-if="selectedArticle" type="transparent">
					<button @click="closeArticle">
						<LeftArrowIcon class="w-4 h-4" />
						{{ formatMessage(messages.backToNews) }}
					</button>
				</ButtonStyled>
				<ButtonStyled>
					<button :disabled="loading" @click="refreshNews">
						<RefreshCwIcon :class="{ 'animate-spin': loading }" class="w-4 h-4" />
						{{ formatMessage(messages.refreshButton) }}
					</button>
				</ButtonStyled>
			</div>
		</div>

		<!-- Error State -->
		<Card v-if="error" class="border-red-500/50 bg-red-500/10">
			<div class="p-4">
				<p class="text-red-400 m-0">{{ error }}</p>
			</div>
		</Card>

		<!-- Loading State -->
		<div v-else-if="loading" class="flex flex-col gap-4">
			<div v-for="i in 3" :key="i" class="card-shadow rounded-2xl bg-bg-raised p-4 animate-pulse">
				<div class="h-6 w-3/4 bg-surface-5 rounded mb-2" />
				<div class="h-4 w-24 bg-surface-5 rounded mb-4" />
				<div class="h-4 w-full bg-surface-5 rounded mb-2" />
				<div class="h-4 w-4/5 bg-surface-5 rounded" />
			</div>
		</div>

		<!-- Empty State -->
		<Card v-else-if="articles.length === 0" class="border-dashed">
			<div class="py-16 text-center flex flex-col items-center">
				<NewspaperIcon class="h-12 w-12 text-secondary mb-4" />
				<h2 class="text-xl font-semibold mb-2 m-0">{{ formatMessage(messages.noArticles) }}</h2>
				<p class="text-secondary m-0">{{ formatMessage(messages.noArticlesDescription) }}</p>
			</div>
		</Card>

		<!-- Article Detail View -->
		<template v-else-if="selectedArticle">
			<article>
				<div class="space-y-2 mb-4">
					<div class="flex items-center gap-3">
						<h2 class="text-2xl font-bold m-0">{{ selectedArticle.title }}</h2>
						<span
							class="rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap"
							:style="{
								backgroundColor: CATEGORY_COLORS[selectedArticle.category].bg,
								color: CATEGORY_COLORS[selectedArticle.category].text,
								border: `1px solid ${CATEGORY_COLORS[selectedArticle.category].border}`,
							}"
						>
							{{ CATEGORY_LABELS[selectedArticle.category] }}
						</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-secondary">
						<CalendarIcon class="h-4 w-4" />
						<time :datetime="selectedArticle.date">
							{{ dayjs(selectedArticle.date).format('MMMM D, YYYY') }}
						</time>
						<template v-if="selectedArticle.author">
							<span>•</span>
							<UserIcon class="h-4 w-4" />
							<span>{{ selectedArticle.author }}</span>
						</template>
						<span>•</span>
						<button
							class="inline-flex items-center gap-1 hover:text-brand transition-colors bg-transparent border-none p-0 font-inherit text-inherit cursor-pointer"
							@click.stop="openUrl(`https://oxidelauncher.org/news/${selectedArticle.slug}`)"
						>
							<ExternalIcon class="h-4 w-4" />
							{{ formatMessage(messages.viewOnWebsite) }}
						</button>
					</div>
				</div>

				<div v-if="loadingArticle" class="py-8 flex justify-center">
					<LoadingIndicator />
				</div>
				<div v-else-if="articleContent" class="markdown-body" v-html="renderedContent" />
				<p v-else class="text-secondary">{{ selectedArticle.summary }}</p>
			</article>
		</template>

		<!-- Article List -->
		<div v-else class="flex flex-col gap-4">
			<article v-for="article in articles" :key="article.id">
				<Card
					class="hover:border-brand/50 transition-colors cursor-pointer"
					@click="openArticle(article)"
				>
					<div class="p-4">
						<div class="space-y-1 mb-2">
							<div class="flex items-center gap-2">
								<h3 class="text-lg font-semibold m-0 hover:text-brand transition-colors">
									{{ article.title }}
								</h3>
								<span
									class="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
									:style="{
										backgroundColor: CATEGORY_COLORS[article.category].bg,
										color: CATEGORY_COLORS[article.category].text,
										border: `1px solid ${CATEGORY_COLORS[article.category].border}`,
									}"
								>
									{{ CATEGORY_LABELS[article.category] }}
								</span>
							</div>
							<div class="flex items-center gap-2 text-sm text-secondary">
								<CalendarIcon class="h-3.5 w-3.5" />
								<time :datetime="article.date">
									{{ dayjs(article.date).format('MMMM D, YYYY') }}
								</time>
								<template v-if="article.author">
									<span>•</span>
									<span>{{ article.author }}</span>
								</template>
								<span>•</span>
								<button
									class="inline-flex items-center gap-1 hover:text-brand transition-colors bg-transparent border-none p-0 font-inherit text-inherit cursor-pointer"
									@click.stop="openUrl(`https://oxidelauncher.org/news/${article.slug}`)"
								>
									<ExternalIcon class="h-3.5 w-3.5" />
									{{ formatMessage(messages.viewOnWebsite) }}
								</button>
							</div>
						</div>
						<p class="text-sm text-primary m-0 mb-3 leading-relaxed">
							{{ article.summary }}
						</p>
						<span class="text-sm text-brand hover:underline">
							{{ formatMessage(messages.readMore) }} →
						</span>
					</div>
				</Card>
			</article>
		</div>
	</div>
</template>

<style scoped>
.markdown-body {
	@apply text-primary;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
	@apply text-contrast font-bold mt-6 mb-4;
}

.markdown-body :deep(h1) {
	@apply text-2xl;
}

.markdown-body :deep(h2) {
	@apply text-xl;
}

.markdown-body :deep(h3) {
	@apply text-lg;
}

.markdown-body :deep(p) {
	@apply mb-4 leading-relaxed;
}

.markdown-body :deep(a) {
	@apply text-brand hover:underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
	@apply mb-4 pl-6;
}

.markdown-body :deep(li) {
	@apply mb-2;
}

.markdown-body :deep(ul) {
	@apply list-disc;
}

.markdown-body :deep(ol) {
	@apply list-decimal;
}

.markdown-body :deep(code) {
	@apply bg-surface-5 px-1.5 py-0.5 rounded text-sm;
}

.markdown-body :deep(pre) {
	@apply bg-surface-5 p-4 rounded-xl mb-4 overflow-x-auto;
}

.markdown-body :deep(pre code) {
	@apply bg-transparent p-0;
}

.markdown-body :deep(blockquote) {
	@apply border-l-4 border-brand pl-4 italic text-secondary mb-4;
}

.markdown-body :deep(hr) {
	@apply border-divider my-6;
}

.markdown-body :deep(img) {
	@apply rounded-xl max-w-full h-auto;
}
</style>
