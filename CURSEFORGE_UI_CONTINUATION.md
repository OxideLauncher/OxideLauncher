# Task: Complete CurseForge UI Integration in Oxide Launcher

## Status: COMPLETED

The CurseForge UI integration has been implemented. The following changes were made:

### Backend (Rust):
- `packages/app-lib/src/api/curseforge/types.rs` - CurseForge API types
- `packages/app-lib/src/api/curseforge/mod.rs` - API client with wrapper functions using State::get()
- `packages/app-lib/migrations/20260115000000_add_curseforge_settings.sql` - DB migration
- `apps/app/src/api/curseforge.rs` - Tauri plugin with commands:
  - `curseforge_search_mods`
  - `curseforge_get_mod`
  - `curseforge_get_mods`
  - `curseforge_get_mod_files`
  - `curseforge_get_mod_file`
  - `curseforge_get_categories`
  - `curseforge_get_featured_mods`
  - `curseforge_match_fingerprints`
  - `curseforge_get_mod_description`
  - `curseforge_get_game_versions`
  - `curseforge_get_game_version_types`

### Frontend (TypeScript/Vue):
- `apps/app-frontend/src/helpers/curseforge.ts` - API helper functions with full TypeScript types
- `apps/app-frontend/src/composables/useContentProvider.ts` - Content provider abstraction with:
  - `ContentProvider` type ('modrinth' | 'curseforge')
  - `NormalizedSearchResult` unified type
  - `normalizeModrinthResult()` and `normalizeCurseForgeResult()` functions
  - `useContentProvider()` composable returning provider state and setters
  - `getProjectUrl()` helper for generating URLs
- `apps/app-frontend/src/components/ui/ProviderToggle.vue` - Toggle component

## Remaining Tasks

### 1. Update Index.vue (Home Page)
File: `apps/app-frontend/src/pages/Index.vue`

Requirements:
- Add ProviderToggle component to switch between providers
- When Modrinth is selected: Keep existing behavior (featured modpacks/mods from Modrinth)
- When CurseForge is selected: Fetch and display CurseForge featured content using `get_featured_mods` from curseforge.ts
- Normalize CurseForge results using `normalizeCurseForgeResult()` before passing to RowDisplay
- Handle loading and error states appropriately

Key CurseForge API function:
```typescript
import { get_featured_mods } from '@/helpers/curseforge'

// Returns { featured: CurseForgeMod[], popular: CurseForgeMod[], recently_updated: CurseForgeMod[] }
const cfFeatured = await get_featured_mods(null, [])
```

### 2. Update Browse.vue (Search Page)
File: `apps/app-frontend/src/pages/Browse.vue`

Requirements:
- Add ProviderToggle above search input
- When provider changes, switch between search implementations
- For Modrinth: Keep existing `get_search_results` behavior
- For CurseForge: Use `search_mods` from curseforge.ts with appropriate parameters:
  ```typescript
  import { search_mods, ClassId, type ModSearchParams } from '@/helpers/curseforge'

  const params: ModSearchParams = {
    class_id: ClassId.Mods, // or Modpacks, ResourcePacks, Shaders, DataPacks based on route
    search_filter: query,
    game_version: selectedGameVersion,
    mod_loader_type: selectedLoader, // 'Forge', 'Fabric', 'Quilt', 'NeoForge'
    sort_field: currentSortType, // Map to CurseForge: 'Popularity', 'TotalDownloads', 'LastUpdated', etc.
    sort_order: 'Descending',
    index: (currentPage - 1) * maxResults,
    page_size: maxResults,
  }
  const cfResults = await search_mods(params)
  ```
- Normalize results before displaying using `normalizeCurseForgeResult()`
- Map project types to CurseForge ClassIds:
  - mod → ClassId.Mods (6)
  - modpack → ClassId.Modpacks (4471)
  - resourcepack → ClassId.ResourcePacks (12)
  - shader → ClassId.Shaders (6552)
  - datapack → ClassId.DataPacks (6945)
- Map sort types:
  - relevance → 'Featured'
  - downloads → 'TotalDownloads'
  - follows → 'Popularity'
  - newest → 'ReleasedDate'
  - updated → 'LastUpdated'
- Map loader names to CurseForge ModLoaderType strings

### 3. Update SearchCard.vue (Optional Enhancement)
File: `apps/app-frontend/src/components/ui/SearchCard.vue`

Requirements:
- Handle both Modrinth and CurseForge project links
- Use `getProjectUrl()` from useContentProvider to generate correct external links
- Display appropriate provider badge/indicator if desired

### 4. Update Context Menu in Browse.vue
The context menu currently hardcodes Modrinth URLs. Update to use the provider-aware URL:
```typescript
import { getProjectUrl } from '@/composables/useContentProvider'

// In handleOptionsClick:
case 'open_link':
  openUrl(getProjectUrl(args.item))
  break
case 'copy_link':
  navigator.clipboard.writeText(getProjectUrl(args.item))
  break
```

## CurseForge API Notes
- Minecraft Game ID: 432 (hardcoded in types)
- All search results are paginated with `{ data: T[], pagination: { index, page_size, result_count, total_count } }`
- Featured mods endpoint returns `{ featured, popular, recently_updated }` arrays
- Categories endpoint requires classId parameter to filter by content type
- Sort fields are different from Modrinth (use ModsSearchSortField enum values)
- ModLoaderType must be string: 'Forge', 'Fabric', 'Quilt', 'NeoForge', 'Any'

## i18n Requirements
Follow the i18n instructions in `.github/instructions/i18n-convert.instructions.md`:
- Use `defineMessages` from `@oxide/ui` for new strings
- Use `formatMessage()` for rendering
- Message IDs should follow pattern: `browse.provider.{id}`

## Testing Considerations
- Verify both providers work independently
- Test switching between providers mid-search
- Test with instance context (installing to specific instance)
- Verify normalized results display correctly in SearchCard
- Test context menu links for both providers

## Files to Review Before Starting
1. `apps/app-frontend/src/pages/Index.vue` - Current home page implementation
2. `apps/app-frontend/src/pages/Browse.vue` - Current search page implementation
3. `apps/app-frontend/src/helpers/curseforge.ts` - CurseForge API helpers
4. `apps/app-frontend/src/composables/useContentProvider.ts` - Provider abstraction
5. `apps/app-frontend/src/components/ui/ProviderToggle.vue` - Toggle component
6. `apps/app-frontend/src/components/ui/SearchCard.vue` - Search result card
7. `packages/ui/src/utils/search.ts` - Search composable (for understanding filter system)
