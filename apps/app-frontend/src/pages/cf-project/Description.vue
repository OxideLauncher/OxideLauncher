<template>
	<Card>
		<div class="cf-description markdown-body" v-html="sanitizedDescription"></div>
	</Card>
</template>

<script setup>
import { Card } from '@oxide/ui';
import DOMPurify from 'dompurify';
import { computed } from 'vue';

const props = defineProps({
	mod: {
		type: Object,
		default: () => ({}),
	},
	description: {
		type: String,
		default: '',
	},
})

const sanitizedDescription = computed(() => {
	if (!props.description) return ''
	// Sanitize the HTML from CurseForge to prevent XSS
	return DOMPurify.sanitize(props.description, {
		ADD_ATTR: ['target'],
		ADD_TAGS: ['iframe'],
		ALLOW_DATA_ATTR: true,
	})
})
</script>

<script>
export default {
	name: 'CfDescription',
}
</script>

<style scoped lang="scss">
.cf-description {
	:deep(a) {
		color: var(--color-blue);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	:deep(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
	}

	:deep(iframe) {
		max-width: 100%;
		border-radius: var(--radius-md);
	}
}
</style>
