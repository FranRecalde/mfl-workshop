// Builds the MFL Workshop site into ./dist. No dependencies: run `node build.mjs`.
// Edit content in src/data/*.json and src/config.json, then rebuild.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const SRC = "src", OUT = "dist";
const read = p => readFileSync(join(SRC, p), "utf8");
const json = p => JSON.parse(read(p));
const config = json("config.json");
const tools = json("data/tools.json");
const shop = json("data/shop.json");

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const abs = p => config.siteUrl.replace(/\/$/, "") + p;
const fmtDate = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const isExt = u => /^https?:/.test(u || "");

const TYPES = { all: "All tools", paste: "Paste and generate", plan: "Planning", cover: "Cover work", other: "Other" };
const isFree = i => i.price === "free";
const isReady = i => (isFree(i) && i.file) || (!isFree(i) && i.payhipUrl);

const ICONS = {
  paste: '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z"/><path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2"/><path d="M9 12h6M9 16h4"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3"/>',
  cover: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2Z"/><path d="M8 8h6M8 12h6"/>',
  other: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  pictures: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="m4 10 3-3 3 3M14 10l2-2 4 2"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.other}</svg>`;

function layout({ title, description, path, nav, body, image, scripts = "" }) {
  const full = title ? `${title} · ${config.siteName}` : config.siteName;
  const img = image ? `<meta property="og:image" content="${esc(abs(image))}">\n<meta name="twitter:card" content="summary_large_image">` : `<meta name="twitter:card" content="summary">`;
  const link = (href, key, label) => `<a href="${href}"${nav === key ? ' aria-current="page"' : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(path))}">
<meta property="og:site_name" content="${esc(config.siteName)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title || config.siteName)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
${img}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/site.css">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top gutter">
  <div class="wide">
    <a class="brand" href="/" aria-label="${esc(config.siteName)} home">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect x="3" y="20" width="28" height="9" rx="2.5" fill="var(--action-primary)"/><rect x="6" y="11" width="22" height="8" rx="2.5" fill="var(--marigold)"/><rect x="10" y="3" width="14" height="7" rx="2.5" fill="var(--plum)"/></svg>
      <span class="brand-word">${esc(config.siteName)}</span>
    </a>
    <nav class="nav" aria-label="Main">
      ${link("/tools/", "tools", "Tools")}
      ${link("/blog/", "blog", "Blog")}
      ${link("/shop/", "shop", "Shop")}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="gutter">
  <div class="wide">
    <div style="display:flex;flex-direction:column;gap:8px">
      <span class="brand-word">${esc(config.siteName)}</span>
      <span>Better tools. Less friction.</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <nav class="links" aria-label="Footer"><a href="/tools/">Tools</a><a href="/blog/">Blog</a><a href="/shop/">Shop</a><a href="/privacy/">Privacy</a></nav>
      <span class="small">Contact: <span style="user-select:all">${esc(config.contactEmail)}</span> · © ${new Date().getFullYear()} ${esc(config.siteName)}</span>
    </div>
  </div>
</footer>
${scripts}
</body>
</html>
`;
}

function page(path, opts) {
  const file = join(OUT, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, layout({ path, ...opts }));
}

/* ---------- partials ---------- */
const signup = () => {
  const live = !!config.substackUrl;
  const sub = live ? config.substackUrl.replace(/\/$/, "") : "";
  return `  <section class="gutter" aria-labelledby="signup-h">
    <div class="wide notify">
      <div style="display:flex;flex-direction:column;gap:10px">
        ${live ? "" : '<span class="badge b-soon" style="align-self:flex-start">Coming soon</span>'}
        <h2 id="signup-h" class="h3">Get new resources by email</h2>
        <p>${live ? "One short email when new free resources, tools or blog posts go up. Unsubscribe any time." : "The email list is not open yet. When it is, you can sign up here."}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-start">
        ${live ? `<a class="btn btn-primary" href="${esc(sub)}/subscribe">Subscribe for free</a><a href="${esc(sub)}">Read the blog on Substack</a>` : `<span class="btn btn-secondary" aria-disabled="true" style="opacity:.6;cursor:default">Subscribe for free</span>`}
      </div>
    </div>
  </section>`;
};

const chips = (values, label) => `<div class="filters" role="group" aria-label="${label}">${values.map(([k, v], i) => `<button type="button" class="chip" data-filter="${esc(k)}" aria-pressed="${i === 0}">${esc(v)}</button>`).join("")}</div>`;

const filterScript = `<script>
document.querySelectorAll('[data-filter]').forEach(function (b) {
  b.addEventListener('click', function () {
    var v = b.getAttribute('data-filter');
    document.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    document.querySelectorAll('[data-group]').forEach(function (c) { c.hidden = v !== 'all' && c.getAttribute('data-group').split(' ').indexOf(v) < 0; });
  });
});
</script>`;

/* Tool cards: same layout as shop cards. Live tools open their own page. */
const toolPage = t => t.status === "live" ? `/tools/${t.slug}/` : "";
function toolCard(t) {
  const live = t.status === "live";
  const href = toolPage(t);
  const art = `<div class="cover-art tool-art t-${esc(t.type)}" aria-hidden="true"><span class="art-icon">${icon(t.icon || t.type)}</span><span>${esc(t.name)}</span></div>`;
  const flow = t.paste ? `<p class="flow"><b>Paste:</b> ${esc(t.paste)} &nbsp;→&nbsp; <b>Get:</b> ${esc(t.get)}</p>` : "";
  return `<article class="product${live ? " is-link" : ""}" data-group="${esc(t.type)}">
  ${live ? `<a class="art-link" href="${href}" tabindex="-1">${art}</a>` : art}
  <div class="meta"><span class="tag">${TYPES[t.type] || ""}</span><span class="badge ${live ? "b-live" : "b-soon"}">${live ? "Live" : "Coming soon"}</span></div>
  <h2 class="h4">${live ? `<a class="stretch" href="${href}">${esc(t.name)}</a>` : esc(t.name)}</h2>
  <p class="muted small">${esc(t.desc)}</p>${flow}
  <div class="foot">${live ? `<span class="go">Open ${esc(t.name)} →</span>` : `<span class="price">Not ready yet</span>`}</div></article>`;
}

/* Shop cards: free and paid items together. */
function shopCard(i) {
  const free = isFree(i), ready = isReady(i);
  const href = ready ? `/shop/${i.slug}/` : "";
  const art = i.image
    ? `<div class="cover-art has-img" aria-hidden="true"><img src="/images/${esc(i.image)}" alt="" loading="lazy"></div>`
    : `<div class="cover-art" aria-hidden="true"><span>${esc(i.title)}</span></div>`;
  const label = free ? `<span class="badge b-free">Free resource</span>` : ready ? `<span class="price">${esc(i.price)}</span>` : `<span class="price">Price to follow</span><span class="badge b-soon">Coming soon</span>`;
  const tags = [i.language, i.years, i.topic].filter(Boolean);
  return `<article class="product${ready ? " is-link" : ""}" data-group="${free ? "free" : "paid"}">
  ${ready ? `<a class="art-link" href="${href}" tabindex="-1">${art}</a>` : art}
  ${tags.length ? `<div class="chips">${tags.map(t => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
  <h2 class="h4">${ready ? `<a class="stretch" href="${href}">${esc(i.title)}</a>` : esc(i.title)}</h2>
  ${i.summary ? `<p class="muted small">${esc(i.summary)}</p>` : ""}
  ${i.includes ? `<ul>${i.includes.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
  <div class="foot">${label}</div></article>`;
}

/* ---------- build ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
for (const d of ["files", "images"]) if (existsSync(join(SRC, d))) cpSync(join(SRC, d), join(OUT, d), { recursive: true });

// Home
page("/", { title: "", nav: "", description: config.tagline + ". A growing set of classroom tools, plus free resources to download.", body: read("pages/home.html") });

// Tools
const usedTypes = Object.entries(TYPES).filter(([k]) => k === "all" || tools.some(t => t.type === k));
const toolsBody = read("pages/tools.html")
  .replace("{{TOOL_FILTERS}}", chips(usedTypes, "Filter tools"))
  .replace("{{TOOL_GRID}}", `<div class="shopgrid">${tools.map(toolCard).join("\n")}</div>`)
  .replace("{{EASYCOVER_URL}}", esc(config.easyCoverUrl));
page("/tools/", { title: "Tools", nav: "tools", description: "Free tools for language teachers. Paste your words or sentences and get gap fills, match ups, flashcards and sentence builders.", body: toolsBody, scripts: filterScript + `\n<script src="/assets/activity-maker.js"></script>` });

// One page per live tool
for (const t of tools.filter(t => t.status === "live")) {
  const ext = isExt(t.url);
  const body = `  <section class="gutter" style="padding-block:40px 24px">
    <div class="wide" style="display:flex;flex-direction:column;gap:24px">
      <p class="crumbs"><a href="/tools/">Tools</a> › ${esc(t.name)}</p>
      <div class="detail">
        <div class="preview">${t.image ? `<img src="/images/${esc(t.image)}" alt="${esc(t.name)} screenshot">` : `<div class="cover-art tool-art big t-${esc(t.type)}" aria-hidden="true"><span class="art-icon">${icon(t.icon || t.type)}</span><span>${esc(t.name)}</span></div>`}</div>
        <div class="info">
          <div class="chips"><span>${TYPES[t.type]}</span><span>Free</span><span>No login</span></div>
          <h1 class="h1">${esc(t.name)}</h1>
          <p class="lead">${esc(t.desc)}</p>
          ${t.paste ? `<p class="flow"><b>Paste:</b> ${esc(t.paste)} &nbsp;→&nbsp; <b>Get:</b> ${esc(t.get)}</p>` : ""}
          ${t.how ? `<div style="display:flex;flex-direction:column;gap:8px"><h2 class="h4">How it works</h2><ol class="how">${t.how.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>` : ""}
          <div class="actions"><a class="btn btn-primary" href="${esc(t.url)}"${ext ? ' target="_blank" rel="noopener"' : ""}>Open ${esc(t.name)}</a><a class="btn btn-secondary" href="/tools/">All tools</a></div>
          ${t.note ? `<p class="note-box">${esc(t.note)}</p>` : ""}
        </div>
      </div>
    </div>
  </section>`;
  page(`/tools/${t.slug}/`, { title: t.name, nav: "tools", description: t.desc, image: t.image ? `/images/${t.image}` : "", body });
}

// Shop: free and paid together
const hasFree = shop.some(isFree), hasPaid = shop.some(i => !isFree(i));
const shopBody = `  <section class="phead gutter">
    <div class="wide">
      <span class="over">Shop</span>
      <h1 class="h1">Resources ready for Monday</h1>
      <p class="lead muted">Free resources to download now, and paid packs for Spanish teaching and GCSE revision. Free resources need no account and no email.</p>
    </div>
  </section>
  <section class="gutter" aria-label="Resources" style="padding-top:24px">
    <div class="wide" style="display:flex;flex-direction:column;gap:20px">
      ${hasFree && hasPaid ? chips([["all", "All"], ["free", "Free"], ["paid", "Paid"]], "Filter resources") : ""}
      <div class="shopgrid">${[...shop.filter(isFree), ...shop.filter(i => !isFree(i))].map(shopCard).join("\n")}</div>
    </div>
  </section>
${signup()}`;
page("/shop/", { title: "Shop", nav: "shop", description: "Free and paid Spanish teaching resources for KS3 and GCSE: sentence builders, worksheets and revision packs.", body: shopBody, scripts: hasFree && hasPaid ? filterScript : "" });

// One page per ready item
for (const i of shop.filter(isReady)) {
  const free = isFree(i);
  const facts = [["For", i.years], ["Pages", i.pages && `${i.pages}, including an answer page`], ["Format", free ? "PDF, ready to print" : i.format], ["Added", i.added && fmtDate(i.added)]].filter(f => f[1]);
  const body = `  <section class="gutter" style="padding-block:40px 24px">
    <div class="wide" style="display:flex;flex-direction:column;gap:24px">
      <p class="crumbs"><a href="/shop/">Shop</a> › ${esc(i.title)}</p>
      <div class="detail">
        <div class="preview">${i.image ? `<img src="/images/${esc(i.image)}" alt="First page of ${esc(i.title)}">` : ""}</div>
        <div class="info">
          <div class="chips">${free ? '<span class="badge b-free">Free resource</span>' : ""}${[i.language, i.level, i.topic].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join("")}</div>
          <h1 class="h1">${esc(i.title)}</h1>
          ${i.summary ? `<p class="lead">${esc(i.summary)}</p>` : ""}
          <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
          <div class="actions">${free ? `<a class="btn btn-primary" href="/files/${esc(i.file)}" download>Download free PDF</a>` : `<a class="btn btn-primary" href="${esc(i.payhipUrl)}">Buy for ${esc(i.price)}</a>`}<a class="btn btn-secondary" href="/shop/">Back to the shop</a></div>
          ${free ? `<p class="note-box">Free to use and copy in your own classroom and school. Please do not sell it or upload it to other sites.</p>` : ""}
        </div>
      </div>
    </div>
  </section>
${signup()}`;
  page(`/shop/${i.slug}/`, { title: i.title, nav: "shop", description: `${free ? "Free" : ""} ${i.language || ""} resource for ${i.years || "teachers"}. ${i.summary || ""}`.trim(), image: i.image ? `/images/${i.image}` : "", body });
}

// Blog
page("/blog/", { title: "Blog", nav: "blog", description: "Practical writing on GCSE Spanish, sentence builders, retrieval practice and leading a languages department.", body: read("pages/blog.html").replace("{{SIGNUP}}", signup()) });

// Privacy
page("/privacy/", { title: "Privacy", nav: "", description: `How ${config.siteName} handles your information.`, body: `  <section class="phead gutter"><div class="wide" style="max-width:760px;display:flex;flex-direction:column;gap:16px">
    <h1 class="h1">Privacy</h1>
    <p class="lead">The free tools on ${esc(config.siteName)} run in your browser. Nothing you paste into a tool is sent to us or stored by us.</p>
    <p>Free downloads need no account and no email address. If you subscribe to the email list, that sign up is handled by Substack under its own privacy policy. Purchases are handled by our shop provider under its own policy.</p>
    <p>Do not paste pupil names or other personal data into any tool.</p>
    <p>Questions: <span style="user-select:all">${esc(config.contactEmail)}</span></p>
  </div></section>` });

// 404
writeFileSync(join(OUT, "404.html"), layout({ path: "/404.html", title: "Page not found", nav: "", description: "This page could not be found.", body: `  <section class="phead gutter"><div class="wide" style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
    <h1 class="h1">Page not found</h1><p class="lead muted">The link may be old, or the page may have moved.</p>
    <div class="actions"><a class="btn btn-primary" href="/">Go to the home page</a><a class="btn btn-secondary" href="/shop/">Browse the shop</a></div>
  </div></section>` }));

// Old /resources/ links keep working
writeFileSync(join(OUT, "_redirects"), "/resources /shop/ 301\n/resources/ /shop/ 301\n/resources/* /shop/:splat 301\n");

// Sitemap and robots
const paths = ["/", "/tools/", ...tools.filter(t => t.status === "live").map(t => `/tools/${t.slug}/`), "/shop/", ...shop.filter(isReady).map(i => `/shop/${i.slug}/`), "/blog/", "/privacy/"];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${esc(abs(p))}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);

console.log(`Built ${paths.length} pages into ${OUT}/`);
