# MFL Workshop

Free tools and resources for language teachers. A Kindstack project.

The site is plain HTML, built by a small script with no dependencies, and hosted on Cloudflare Workers.

## What is where

| You want to change | Edit this file |
|---|---|
| Site name, domain, Substack, Easy Cover link | `src/config.json` |
| Tool cards | `src/data/tools.json` |
| Free resources | `src/data/resources.json` plus the files in `src/files/` and `src/images/` |
| Shop packs and Payhip buttons | `src/data/products.json` |
| Page text (home, tools, blog, shop) | `src/pages/*.html` |
| Colours and layout | `src/assets/site.css` |
| Activity maker | `src/assets/activity-maker.js` |

Every resource gets its own page at `/resources/<slug>/` with its own Facebook and WhatsApp preview picture.

## Add a free resource

1. Put the PDF in `src/files/` and a preview picture (1200 x 630 PNG works best for Facebook) in `src/images/`.
2. Add an entry to `src/data/resources.json`:

```json
{
  "slug": "family-members-gap-fill",
  "title": "Family members gap fill",
  "summary": "One or two sentences that say what it is and what pupils do.",
  "language": "Spanish",
  "level": "KS3",
  "years": "Year 7",
  "topic": "Family",
  "pages": 2,
  "file": "family-members-gap-fill.pdf",
  "image": "family-members-gap-fill.png",
  "added": "2026-11-12"
}
```

3. Commit to `main`. Cloudflare rebuilds the site in about a minute.

The link to share is `https://<your domain>/resources/family-members-gap-fill/`.

## Add a tool

Add an entry to `src/data/tools.json`. `type` is one of `paste`, `plan`, `cover` or `other`; `status` is `live` or `soon`. Each tool lives in its own repo and its own Cloudflare Worker, at its own address such as `https://pictorio.<your domain>`.

## Sell a pack

Create the product on Payhip, then paste its link into `payhipUrl` for that pack in `src/data/products.json`. The card shows a Buy button.

## Preview on your computer

```bash
npm run build
```

Then open `dist/index.html`, or run `npm run dev` for a local Cloudflare preview.

## Cloudflare setup (once)

1. Cloudflare dashboard → Workers & Pages → Create → Import a repository → choose this repo.
2. Build command: `npm run build`. Deploy command: `npx wrangler deploy`. Leave the root directory empty.
3. After the first deploy: Settings → Domains & Routes → Add custom domain → your domain.
4. Set `siteUrl` in `src/config.json` to the real address, so Facebook previews and the sitemap use it.
