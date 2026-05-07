# frontend-astro-demo/ - contract for AI

A **headless** rendering of the same WordPress backend that `backend/` and `frontend/` consume. Astro reads the WP site over WPGraphQL and produces a fully static `dist/` for Netlify. WordPress becomes a content API; this folder is the public site.

## Commands

```bash
cp .env.example .env   # WP_GRAPHQL_URL + WP_PUBLIC_URL
npm install
npm run dev            # local dev server
npm run build          # static HTML in dist/
npm run preview        # serve dist/
```

## How a page reaches the browser

1. `src/pages/index.astro` calls `loadPage("/")` -> Homepage.
2. `src/pages/[...slug].astro` calls `getStaticPaths()` -> `pages` query, prerenders one HTML file per page.
3. `src/layouts/Base.astro` runs `GET_LAYOUT` (general settings + three menus by slug) and wraps with `Header` + `Footer`.
4. `PageContent` parses the JSON returned by the bridge mu-plugin and hands it to `SectionRenderer`.
5. `SectionRenderer` is a switch over `section.type` -> the matching component in `components/sections/`.

## The Carbon Fields bridge (required for full headless)

Backend file: **`backend/web/app/mu-plugins/wpgraphql-carbon-fields.php`**.

It adds two fields to the `Page` GraphQL type:

- `sectionsJson: String` - JSON list of `{type, data}` from `content_sections` (Carbon Fields complex repeater).
- `headerJson: String` - JSON `{type, data}` from `content_header` (max 1).

Inside `data`, the resolver pre-resolves theme tokens (`section_padding_top`, `headline_size`, button `style`, ...) into the same css class strings the Blade theme uses, applies `the_content` to rich-text-looking values, and replaces image attachment IDs with `{url, alt, width, height}`. Astro receives a JSON shape that needs no further translation - just renders.

`loadPage()` in `src/lib/page-loader.ts` tries the full query first; if WPGraphQL replies "Cannot query field sectionsJson", it falls back to a basic query without sections (and prints a one-time warning). So **the build works either way** - just renders less when the mu-plugin isn't deployed.

## Project layout

```
src/
├── lib/
│   ├── wp.ts              # fetch wrapper + WpQueryError + url rewriter
│   ├── queries.ts         # GET_LAYOUT, GET_PAGE_SLUGS, full + basic page queries
│   ├── page-loader.ts     # tries full query, falls back to basic on missing field
│   ├── section-helpers.ts # className builders mirroring Blade's helpers
│   └── types.ts
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── PageContent.astro
│   └── sections/
│       ├── SectionRenderer.astro    # switch over section.type
│       ├── HeaderHero.astro
│       ├── Section100.astro
│       ├── Section5050.astro
│       ├── Section333333.astro
│       ├── SectionLogos.astro
│       ├── SectionMarquee.astro
│       ├── SectionQuote.astro
│       ├── SectionNewsletter.astro
│       ├── SectionServices.astro
│       ├── SectionAbout.astro
│       ├── SectionCourses.astro
│       ├── SectionBlog.astro        # placeholder - needs separate posts query
│       └── Buttons.astro
├── layouts/
│   └── Base.astro                   # <html>, Header, <slot/>, Footer
├── pages/
│   ├── index.astro                  # Homepage
│   └── [...slug].astro              # any other Page by URI
└── styles/
    └── global.css                   # Tailwind v4 + project tokens + safelist
```

## Tailwind safelist for dynamic classes

`global.css` has `@source inline(...)` lines for the colour/padding/alignment classes that get built by string concatenation (e.g. `bg-${data.section_background_colour}`). Tailwind only emits classes it scans as literals; without the safelist these would be missing from the final CSS. **When you add a new value to `backend/.../config/theme.php`, mirror it in the safelist.**

## Section convention (matches the Blade theme 1:1)

Same name in `config/content-templates.php` (backend) -> same component name in `src/components/sections/` (frontend). Add a new section in three steps:

1. **Backend**: drop `section-X.php` in `resources/views/content/config/` and register it in `content-templates.php`. The bridge picks it up automatically.
2. **Frontend**: add `SectionX.astro` and a `case "section-X":` in `SectionRenderer.astro`.
3. If the field shape introduces a new theme token (e.g. a new `section_*` select), add it to `TOKEN_MAP` in the mu-plugin AND to the safelist in `global.css`.

## URL rewriting

`rewriteWpUrl()` in `lib/wp.ts` strips `WP_PUBLIC_URL` from menu and button hrefs so internal links stay relative on Netlify. External links pass through unchanged.

## Netlify deployment

`netlify.toml` declares `npm run build` -> `dist/`. Two follow-ups for production:

1. **Build hook on publish.** In Netlify, create a build hook URL. In WordPress, on `save_post` / `wp_update_nav_menu`, fire `wp_remote_post($hook_url)`. Every page edit rebuilds the site.
2. **Cache the GraphQL endpoint at the edge** (Cloudflare in front of `wp.example.com/wp/graphql`) so the build itself is fast.

For previews of unpublished/scheduled pages, switch to `output: 'hybrid'` and add `@astrojs/netlify`. The demo skips this.

## What we do not do

- We do not duplicate the Blade theme's logic in JS. Helpers (`responsive_image`, `background_colour`, etc.) belong in the backend; the bridge serializes their *output*, not their source.
- We do not hand-write menu structures. They come from WPGraphQL by slug.
- We do not call WP REST. WPGraphQL is the contract.
- We do not ship the Netlify adapter (`@astrojs/netlify`) unless we need SSR. Static SSG is the default and works on Netlify with no adapter.
