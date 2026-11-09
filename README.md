# MFL Workshop

Free tools and resources for language teachers.

The site is plain HTML, built by a small script with no dependencies, and hosted on Cloudflare Workers.

## What is where

| You want to change | Edit this file |
|---|---|
| Site name, domain, Substack, Easy Cover link | `src/config.json` |
| Tool cards | `src/data/tools.json` |
| Shop: free resources and paid packs | `src/data/shop.json` plus the files in `src/files/` and `src/images/` |
| Page text (home, tools, blog) | `src/pages/*.html` |
| Colours and layout | `src/assets/site.css` |
| Activity maker | `src/assets/activity-maker.js` |

Every live tool gets its own page at `/tools/<slug>/`, and every shop item that is ready gets its own page at `/shop/<slug>/` with its own Facebook and WhatsApp preview picture. Old `/resources/` links redirect to `/shop/`.

## Add a free resource

1. Put the PDF in `src/files/` and a preview picture (1200 x 630 PNG works best for Facebook) in `src/images/`.
2. Add an entry to `src/data/shop.json` with `"price": "free"`:

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
  "added": "2026-11-12",
  "price": "free"
}
```

3. Commit to `main`. Cloudflare rebuilds the site in about a minute.

The link to share is `https://themflworkshop.co.uk/shop/family-members-gap-fill/`.

## Add a tool

Add an entry to `src/data/tools.json` with a `slug`, `name`, `type` (`paste`, `plan`, `cover` or `other`), `status` (`live` or `soon`), `desc` and `url`. Optional: `paste` and `get` for the Paste → Get line, `how` (a list of steps), `note`, and `image` (a screenshot in `src/images/`). Each tool lives in its own repo and its own Cloudflare Worker, at its own address such as `https://pictorio.themflworkshop.co.uk`.

## Sell a pack

Create the product on Payhip. In `src/data/shop.json`, set that pack's `price` (for example `"£4"`) and paste its link into `payhipUrl`. The card then links to its own page with a Buy button.

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

## Visitor analytics (PostHog)

Paste your PostHog project key (starts with `phc_`) into `posthogKey` in `src/config.json`. If your PostHog project is in the US region, also change `posthogHost` to `https://us.i.posthog.com`. While the key is empty, there is no banner and no tracking.

Visitors see a cookie banner. PostHog only loads for people who choose Accept. "Cookie settings" in the footer lets them change their mind. The code is in `src/assets/analytics.js`.

Named events, on top of PostHog's own page views and clicks:

| Event | When |
|---|---|
| `tool_opened` | Open button on a tool's page (`tool` = slug) |
| `resource_downloaded` | Download free PDF (`item` = slug) |
| `buy_clicked` | Buy button (`item`, `price`) |
| `subscribe_clicked` | Subscribe button |
| `activity_copied` | Copy activity in the Activity maker (`activity`) |

To track a new button, add `data-track="event_name"` to it. Any other `data-*` on it is sent along.

To track a tool that lives in its own repo, add this line before `</body>` in its HTML. The banner and the choice are shared with the main site:

```html
<script src="https://themflworkshop.co.uk/assets/analytics.js" data-mask="all" defer></script>
```

`data-mask="all"` hides all page text in session recordings, so words teachers paste never show up there.
