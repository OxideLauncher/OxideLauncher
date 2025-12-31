<script setup lang="ts">
import { KeyIcon, ServerIcon } from '@oxide/assets'
import { defineMessages, useVIntl } from '@oxide/ui'
import { ref, watch } from 'vue'

import { get, set } from '@/helpers/settings.ts'

const { formatMessage } = useVIntl()

const settings = ref(await get())

watch(
	settings,
	async () => {
		await set(settings.value)
	},
	{ deep: true },
)

const messages = defineMessages({
	curseforgeTitle: {
		id: 'app.settings.advanced.curseforge-api-key.title',
		defaultMessage: 'CurseForge API Key',
	},
	curseforgeDescription: {
		id: 'app.settings.advanced.curseforge-api-key.description',
		defaultMessage:
			'Enter your custom CurseForge API key. Leave empty to use the default key (if available).',
	},
	curseforgeApiKeyPlaceholder: {
		id: 'app.settings.advanced.curseforge-api-key.placeholder',
		defaultMessage: 'Enter your CurseForge API key',
	},
	curseforgeNote: {
		id: 'app.settings.advanced.curseforge-api-key.note',
		defaultMessage:
			'You can get an API key from the CurseForge developer console at https://console.curseforge.com/',
	},
	defaultProviderTitle: {
		id: 'app.settings.advanced.default-provider.title',
		defaultMessage: 'Default Content Provider',
	},
	defaultProviderDescription: {
		id: 'app.settings.advanced.default-provider.description',
		defaultMessage: 'Choose which content provider to use by default when browsing.',
	},
})
</script>

<template>
	<div>
		<h2 class="m-0 text-lg font-extrabold text-contrast">
			{{ formatMessage(messages.curseforgeTitle) }}
		</h2>
		<p class="m-0 mt-1 mb-2 leading-tight text-secondary">
			{{ formatMessage(messages.curseforgeDescription) }}
		</p>

		<div class="m-1 my-2">
			<div class="iconified-input w-full">
				<KeyIcon />
				<input
					id="curseforgeApiKey"
					v-model="settings.curseforge_api_key"
					type="password"
					class="input"
					:placeholder="formatMessage(messages.curseforgeApiKeyPlaceholder)"
				/>
			</div>
		</div>

		<p class="m-0 mt-2 text-xs text-secondary">
			{{ formatMessage(messages.curseforgeNote) }}
		</p>

		<h2 class="m-0 mt-6 text-lg font-extrabold text-contrast">
			{{ formatMessage(messages.defaultProviderTitle) }}
		</h2>
		<p class="m-0 mt-1 mb-2 leading-tight text-secondary">
			{{ formatMessage(messages.defaultProviderDescription) }}
		</p>

		<div class="flex gap-2 mt-2">
			<button
				class="btn"
				:class="{ 'btn-primary': settings.default_content_provider === 'modrinth' }"
				@click="settings.default_content_provider = 'modrinth'"
			>
				<ServerIcon />
				Modrinth
			</button>
			<button
				class="btn"
				:class="{ 'btn-primary': settings.default_content_provider === 'curseforge' }"
				@click="settings.default_content_provider = 'curseforge'"
			>
				<ServerIcon />
				CurseForge
			</button>
		</div>
	</div>
</template>
