import type { AbstractModrinthClient } from '@oxide/api-client'

import { createContext } from './index'

export const [injectModrinthClient, provideModrinthClient] = createContext<AbstractModrinthClient>(
	'root',
	'modrinthClient',
)
