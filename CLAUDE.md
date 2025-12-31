# Architecture

Use TAB instead of spaces.

## Frontend

There is a frontend for the Oxide Launcher app in apps/app-frontend.

It uses Tailwind v3, and the config can be seen at `tailwind.config.ts`.

It utilizes shared and common components from `@oxide/ui` which can be found at `packages/ui`, and stylings from `@oxide/assets` which can be found at `packages/assets`.

It can utilize icons from `@oxide/assets`, which are automatically generated based on what's available within the `icons` folder of the `packages/assets` directory. You can see the generated icons list in `generated-icons.ts`.

It has access to our dependency injection framework, examples as seen in `packages/ui/src/providers/`. Ideally any state which is shared between a page and its subpages should be shared using this dependency injection framework.

### App Frontend (apps/app-frontend)

Before a pull request can be opened for the app frontend, run `pnpm prepr:frontend:app` from the root folder, otherwise CI will fail.

To run a development version of the app frontend, you must first copy over the relevant `.env` template file (prod, staging or local, usually prod) within `packages/app-lib` into `packages/app-lib/.env`. Then you must run the app itself by running `pnpm app:dev` in the root folder.

### Localization

Refer to `.github/instructions/i18n-convert.instructions.md` if the user asks you to perform any i18n conversion work on a component, set of components, pages or sets of pages.

# Guidelines

- Do not create new non-source code files (e.g. Bash scripts, SQL scripts) unless explicitly prompted to.
