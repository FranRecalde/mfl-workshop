// Builds the MFL Workshop site into ./dist. No dependencies: run `node build.mjs`.
// Edit content in src/data/*.json and src/config.json, then rebuild.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const SRC = "src", OUT = "dist";
const read = p => readFileSync(join(SRC, p), "utf8");
const json = p => JSON.parse(read(p));
const config = json("config.json");
const tools = json("data/tools.json");
const resources = json("data/resources.json");
const products = json("data/products.json");

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const abs = p => config.siteUrl.replace(/\/$/, "") + p;
const fmtDate = d => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const TYPES = { all: "All tools", paste: "Paste and generate", plan: "Planning", cover: "Cover work", other: "Other" };

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
      ${link("/resources/", "resources", "Free resources")}
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
      <span>Better tools. Less friction. A Kindstack project.</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <nav class="links" aria-label="Footer"><a href="/tools/">Tools</a><a href="/resources/">Free resources</a><a href="/blog/">Blog</a><a href="/shop/">Shop</a><a href="/privacy/">Privacy</a></nav>
      <span class="small">Contact: <span style="user-select:all">${esc(config.contactEmail)}</span> · © ${new Date().getFullYear()} Kindstack</span>
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

function toolCard(t) {
  const live = t.status === "live";
  const href = t.url && t.url.startsWith("#") ? t.url : t.url;
  const ext = t.url && /^https?:/.test(t.url);
  const flow = t.paste ? `<p class="flow"><b>Paste:</b> ${esc(t.paste)} &nbsp;→&nbsp; <b>Get:</b> ${esc(t.get)}</p>` : "";
  const btn = t.url
    ? `<a class="btn ${live ? "btn-primary" : "btn-secondary"} btn-sm" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${live ? "Open tool" : "Find out more"}</a>`
    : `<span class="note">Not ready to open yet</span>`;
  return `<article class="card" data-type="${esc(t.type)}">
      <div class="meta"><span class="tag">${TYPES[t.type] || ""}</span><span class="badge ${live ? "b-live" : "b-soon"}">${live ? "Live" : "Coming soon"}</span></div>
      <h3 class="h3">${esc(t.name)}</h3>
      <p class="muted">${esc(t.desc)}</p>${flow}
      <div class="foot">${btn}</div></article>`;
}

function chips(values, attr, label) {
  return `<div class="filters" role="group" aria-label="${label}">${values.map(([k, v], i) => `<button type="button" class="chip" data-${attr}="${esc(k)}" aria-pressed="${i === 0}">${esc(v)}</button>`).join("")}</div>`;
}

const filterScript = (attr, sel) => `<script>
document.querySelectorAll('[data-${attr}]').forEach(function (b) {
  b.addEventListener('click', function () {
    var v = b.getAttribute('data-${attr}');
    document.querySelectorAll('[data-${attr}]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    document.querySelectorAll('${sel}').forEach(function (c) { c.hidden = v !== 'all' && c.getAttribute('data-group').split(' ').indexOf(v) < 0; });
  });
});
</script>`;

function resourceCard(r) {
  const groups = [r.level, r.language].map(x => String(x).toLowerCase()).join(" ");
  return `<article class="card res-card" data-group="${esc(groups)}">
      <a class="thumb" href="/resources/${esc(r.slug)}/" tabindex="-1" aria-hidden="true">${r.image ? `<img src="/images/${esc(r.image)}" alt="" loading="lazy">` : ""}</a>
      <div class="chips"><span>${esc(r.language)}</span><span>${esc(r.years)}</span><span>${esc(r.topic)}</span></div>
      <h3 class="h3"><a href="/resources/${esc(r.slug)}/" style="color:inherit;text-decoration:none">${esc(r.title)}</a></h3>
      <p class="muted">${esc(r.summary)}</p>
      <div class="foot actions"><a class="btn btn-primary btn-sm" href="/resources/${esc(r.slug)}/">View and download</a></div>
    </article>`;
}

/* ---------- build ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
if (existsSync(join(SRC, "files"))) cpSync(join(SRC, "files"), join(OUT, "files"), { recursive: true });
if (existsSync(join(SRC, "images"))) cpSync(join(SRC, "images"), join(OUT, "images"), { recursive: true });

// Home
page("/", { title: "", nav: "", description: config.tagline + ". Paste your words and get classroom activities, or download free resources.", body: read("pages/home.html") });

// Tools
const usedTypes = Object.entries(TYPES).filter(([k]) => k === "all" || tools.some(t => t.type === k));
const toolsBody = read("pages/tools.html")
  .replace("{{TOOL_FILTERS}}", chips(usedTypes, "f", "Filter tools"))
  .replace("{{TOOL_GRID}}", `<div class="grid">${tools.map(t => toolCard(t).replace('data-type=', 'data-group=')).join("\n")}</div>`)
  .replace("{{EASYCOVER_URL}}", esc(config.easyCoverUrl));
page("/tools/", { title: "Tools", nav: "tools", description: "Free tools for language teachers. Paste your words or sentences and get gap fills, match ups, flashcards and sentence builders.", body: toolsBody, scripts: filterScript("f", ".grid .card") + `\n<script src="/assets/activity-maker.js"></script>` });

// Resources list
const levels = [...new Set(resources.map(r => r.level))];
const resBody = `  <section class="phead gutter">
    <div class="wide">
      <span class="over">Free resources</span>
      <h1 class="h1">Free resources to download</h1>
      <p class="lead muted">Worksheets, sentence builders and revision sheets made for real lessons. Download them free. No account, no email needed.</p>
    </div>
  </section>
  <section class="gutter" aria-label="Resource list" style="padding-top:24px">
    <div class="wide" style="display:flex;flex-direction:column;gap:20px">
      ${levels.length > 1 ? chips([["all", "All"], ...levels.map(l => [l.toLowerCase(), l])], "lv", "Filter by level") : ""}
      <div class="grid">${resources.map(resourceCard).join("\n")}</div>
    </div>
  </section>
${signup()}`;
page("/resources/", { title: "Free resources", nav: "resources", description: "Free Spanish teaching resources to download: sentence builders, worksheets and GCSE revision sheets.", body: resBody, scripts: levels.length > 1 ? filterScript("lv", ".grid .card") : "" });

// Resource detail pages (one per resource, each with its own Facebook preview)
for (const r of resources) {
  const body = `  <section class="gutter" style="padding-block:40px 24px">
    <div class="wide" style="display:flex;flex-direction:column;gap:24px">
      <p class="crumbs"><a href="/resources/">Free resources</a> › ${esc(r.title)}</p>
      <div class="detail">
        <div class="preview">${r.image ? `<img src="/images/${esc(r.image)}" alt="First page of ${esc(r.title)}">` : ""}</div>
        <div class="info">
          <div class="chips"><span>${esc(r.language)}</span><span>${esc(r.level)}</span><span>${esc(r.topic)}</span></div>
          <h1 class="h1">${esc(r.title)}</h1>
          <p class="lead">${esc(r.summary)}</p>
          <dl class="facts">
            <dt>For</dt><dd>${esc(r.years)}</dd>
            <dt>Pages</dt><dd>${esc(r.pages)}, including an answer page</dd>
            <dt>Format</dt><dd>PDF, ready to print</dd>
            <dt>Added</dt><dd>${fmtDate(r.added)}</dd>
          </dl>
          <div class="actions"><a class="btn btn-primary" href="/files/${esc(r.file)}" download>Download free PDF</a><a class="btn btn-secondary" href="/resources/">More free resources</a></div>
          <p class="note-box">Free to use and copy in your own classroom and school. Please do not sell it or upload it to other sites.</p>
        </div>
      </div>
    </div>
  </section>
${signup()}`;
  page(`/resources/${r.slug}/`, { title: r.title, nav: "resources", description: `Free ${r.language} resource for ${r.years}. ${r.summary}`, image: r.image ? `/images/${r.image}` : "", body });
}

// Blog
page("/blog/", { title: "Blog", nav: "blog", description: "Practical writing on GCSE Spanish, sentence builders, retrieval practice and leading a languages department.", body: read("pages/blog.html").replace("{{SIGNUP}}", signup()) });

// Shop
const shopGrid = products.map(p => `<article class="product">
  <div class="cover-art" aria-hidden="true"><span>${esc(p.name)}</span></div>
  <h2 class="h4">${esc(p.name)}</h2>
  <ul>${p.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
  <div class="foot">${p.payhipUrl ? `<a class="btn btn-primary btn-sm" href="${esc(p.payhipUrl)}">Buy</a>` : `<span class="price">Price to follow</span><span class="badge b-soon">Coming soon</span>`}</div></article>`).join("\n");
page("/shop/", { title: "Shop", nav: "shop", description: "Printable and editable Spanish teaching packs for KS3 and GCSE.", body: read("pages/shop.html").replace("{{SHOP_GRID}}", shopGrid) });

// Privacy
page("/privacy/", { title: "Privacy", nav: "", description: "How MFL Workshop handles your information.", body: `  <section class="phead gutter"><div class="wide" style="max-width:760px;display:flex;flex-direction:column;gap:16px">
    <h1 class="h1">Privacy</h1>
    <p class="lead">The free tools on MFL Workshop run in your browser. Nothing you paste into a tool is sent to us or stored by us.</p>
    <p>Downloads need no account and no email address. If you subscribe to the email list, that sign up is handled by Substack under its own privacy policy. Purchases are handled by our shop provider under its own policy.</p>
    <p>Do not paste pupil names or other personal data into any tool.</p>
    <p>Questions: <span style="user-select:all">${esc(config.contactEmail)}</span></p>
  </div></section>` });

// 404
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "404.html"), layout({ path: "/404.html", title: "Page not found", nav: "", description: "This page could not be found.", body: `  <section class="phead gutter"><div class="wide" style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
    <h1 class="h1">Page not found</h1><p class="lead muted">The link may be old, or the page may have moved.</p>
    <div class="actions"><a class="btn btn-primary" href="/">Go to the home page</a><a class="btn btn-secondary" href="/resources/">Browse free resources</a></div>
  </div></section>` }));

// Sitemap and robots
const paths = ["/", "/tools/", "/resources/", ...resources.map(r => `/resources/${r.slug}/`), "/blog/", "/shop/", "/privacy/"];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${esc(abs(p))}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);

console.log(`Built ${paths.length} pages into ${OUT}/`);
