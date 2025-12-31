<script setup lang="ts">
import { defineMessages, useVIntl } from '@oxide/ui'
import { computed } from 'vue'

import { useContentProvider, type ContentProvider } from '@/composables/useContentProvider'

const { provider, setProvider } = useContentProvider()
const { formatMessage } = useVIntl()

const messages = defineMessages({
	modrinth: {
		id: 'provider-toggle.modrinth',
		defaultMessage: 'Modrinth',
	},
	curseforge: {
		id: 'provider-toggle.curseforge',
		defaultMessage: 'CurseForge',
	},
})

const options: { value: ContentProvider; label: string }[] = [
	{ value: 'modrinth', label: 'Modrinth' },
	{ value: 'curseforge', label: 'CurseForge' },
]

const selectedIndex = computed(() => (provider.value === 'modrinth' ? 0 : 1))
</script>

<template>
	<div class="provider-toggle">
		<button
			v-for="(option, index) in options"
			:key="option.value"
			class="provider-option"
			:class="{ active: provider === option.value }"
			@click="setProvider(option.value)"
		>
			{{ option.label }}
		</button>
	</div>
</template>

<style scoped>
.provider-toggle {
	display: inline-flex;
	background: var(--color-bg);
	border-radius: var(--radius-md);
	padding: 0.25rem;
	gap: 0.25rem;
	border: 1px solid var(--color-divider);
}

.provider-option {
	padding: 0.5rem 1rem;
	border: none;
	background: transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	font-weight: 500;
	color: var(--color-text-secondary);
	transition:
		background 0.15s ease,
		color 0.15s ease;
}

.provider-option:hover {
	background: var(--color-button-bg);
}

.provider-option.active {
	background: var(--color-brand);
	color: var(--color-brand-inverted);
}
</style>
