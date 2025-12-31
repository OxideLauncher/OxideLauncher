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
	project: {
		type: Object,
		default: () => ({}),
	},
})

const sanitizedDescription = computed(() => {
	if (!props.project?.body) return ''
	// Sanitize the HTML from CurseForge to prevent XSS
	return DOMPurify.sanitize(props.project.body, {
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
