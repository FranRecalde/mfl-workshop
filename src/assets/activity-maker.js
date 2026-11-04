const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* ===== Activity maker ===== */
const SAMPLES = {
  sent: `Me gusta el instituto porque es divertido.
Estudio español y ciencias los lunes.
Mi asignatura favorita es la historia.
No me gustan las matemáticas porque son difíciles.
En el recreo como un bocadillo con mis amigos.
Después del colegio voy a jugar al fútbol.`,
  words: `el instituto = school
la asignatura = subject
divertido = fun
aburrido = boring
difícil = difficult
el recreo = break time
los deberes = homework
el profesor = teacher
la pizarra = whiteboard
el horario = timetable`
};
const ACTS = {
  sent: [["gap","Gap fill"],["jumble","Jumbled sentences"],["halves","Match the halves"],["missing","Missing letters"],["builder","Sentence builder"]],
  words:[["gap","Gap fill"],["match","Match up"],["missing","Missing letters"],["recall","Recall challenge"],["builder","Word bank grid"]]
};
let act = "gap", seed = 7, showAns = false, plain = "";

function rng(s){ return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function shuffle(a, r){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function shuffleNot(a, r){ if (a.length < 2) return a; let b; let n = 0; do { b = shuffle(a, r); n++; } while (n < 8 && b.every((x,i) => x === a[i])); return b; }

function parse(text){
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sep = /\s*(?:==|=|\t|\s-\s|\s–\s)\s*/;
  const pairs = lines.map(l => { const m = l.split(sep); return m.length === 2 && m[0] && m[1] ? m : null; });
  const commaPairs = lines.map(l => { const m = l.split(/\s*,\s*/); return m.length === 2 && m[0].split(" ").length <= 4 && m[1].split(" ").length <= 4 ? m : null; });
  if (lines.length && pairs.filter(Boolean).length >= lines.length * 0.7) return { mode:"words", items: pairs.filter(Boolean) };
  if (lines.length && commaPairs.filter(Boolean).length === lines.length) return { mode:"words", items: commaPairs };
  return { mode:"sent", items: lines };
}
const words = s => s.split(/\s+/).filter(Boolean);
const core = w => w.replace(/^[¿¡"'(]+|[.,;:!?"')]+$/g, "");
function blankLetters(w, r){
  return [...w].map((c,i) => (i === 0 || !/\p{L}/u.test(c)) ? c : (/[aeiouáéíóúü]/i.test(c) || r() < .25 ? "_" : c)).join("");
}

function build(){
  const p = parse($("#input").value);
  const r = rng(seed);
  const n = p.items.length;
  $("#detected").innerHTML = n ? `Found <b>${n} ${p.mode === "sent" ? "sentence" : "word pair"}${n === 1 ? "" : "s"}</b>. ${p.mode === "words" ? "Word list mode." : "Sentence mode."}` : "Paste at least two lines to start.";
  const list = ACTS[p.mode];
  if (!list.some(a => a[0] === act)) act = list[0][0];
  $("#acts").innerHTML = list.map(([k,v]) => `<button type="button" data-a="${k}" aria-pressed="${k===act}">${v}</button>`).join("");
  if (!n){ $("#sheet").innerHTML = `<p class="muted">Your activity will appear here.</p>`; plain = ""; return; }

  const title = list.find(a => a[0] === act)[1];
  let html = "", txt = [];
  const A = s => showAns ? ` <span class="ans">(${esc(s)})</span>` : "";

  if (p.mode === "sent"){
    if (act === "gap"){
      const rows = p.items.map(s => { const ws = words(s); let bi = 0, best = 0; ws.forEach((w,i) => { const c = core(w); if (c.length > best){ best = c.length; bi = i; } }); const target = core(ws[bi]); return { s: ws.map((w,i) => i === bi ? w.replace(target, "\u0000") : w).join(" "), a: target }; });
      html += `<div class="bank">${shuffle(rows.map(x => x.a), r).map(w => `<span>${esc(w)}</span>`).join("")}</div>`;
      html += `<ol>${rows.map(x => `<li>${esc(x.s).replace("\u0000", '<span class="gap"></span>')}${A(x.a)}</li>`).join("")}</ol>`;
      txt = ["Word bank: " + rows.map(x => x.a).join(", ")].concat(rows.map((x,i) => `${i+1}. ${x.s.replace("\u0000","________")}`));
      if (showAns) txt.push("", "Answers: " + rows.map((x,i) => `${i+1} ${x.a}`).join(", "));
    } else if (act === "jumble"){
      const rows = p.items.map(s => ({ j: shuffleNot(words(s), r).join("  /  "), a: s }));
      html += `<ol>${rows.map(x => `<li>${esc(x.j)}${showAns ? `<br><span class="ans">${esc(x.a)}</span>` : ""}</li>`).join("")}</ol>`;
      txt = rows.map((x,i) => `${i+1}. ${x.j}` + (showAns ? `\n   ${x.a}` : ""));
    } else if (act === "halves"){
      const rows = p.items.map(s => { const ws = words(s); const m = Math.max(1, Math.ceil(ws.length / 2)); return [ws.slice(0,m).join(" "), ws.slice(m).join(" ")]; });
      const right = shuffleNot(rows.map((x,i) => ({ t:x[1], i })), r);
      const L = "abcdefghijklmnopqrstuvwxyz";
      html += `<div class="match">${rows.map((x,i) => `<div>${i+1}. ${esc(x[0])}…</div><div>${L[i]}. …${esc(right[i].t)}</div>`).join("")}</div>`;
      if (showAns) html += `<p class="ans">${rows.map((x,i) => `${i+1}${L[right.findIndex(y => y.i === i)]}`).join(" · ")}</p>`;
      txt = rows.map((x,i) => `${i+1}. ${x[0]}...      ${L[i]}. ...${right[i].t}`);
      if (showAns) txt.push("", "Answers: " + rows.map((x,i) => `${i+1}${L[right.findIndex(y => y.i === i)]}`).join(", "));
    } else if (act === "missing"){
      const rows = p.items.map(s => words(s).map(w => { const c = core(w); return c.length > 3 ? w.replace(c, blankLetters(c, r)) : w; }).join(" "));
      html += `<ol>${rows.map((x,i) => `<li>${esc(x)}${showAns ? `<br><span class="ans">${esc(p.items[i])}</span>` : ""}</li>`).join("")}</ol>`;
      txt = rows.map((x,i) => `${i+1}. ${x}` + (showAns ? `\n   ${p.items[i]}` : ""));
    } else if (act === "builder"){
      const cols = 4, grid = [[],[],[],[]];
      p.items.forEach(s => { const ws = words(s); const size = Math.ceil(ws.length / cols); for (let c = 0; c < cols; c++){ const part = ws.slice(c*size, (c+1)*size).join(" "); if (part && !grid[c].includes(part)) grid[c].push(part); } });
      const h = Math.max(...grid.map(g => g.length));
      html += `<div class="sbwrap"><table class="sb"><thead><tr>${grid.map((_,i) => `<td>Column ${i+1}</td>`).join("")}</tr></thead><tbody>${Array.from({length:h}, (_,r0) => `<tr>${grid.map(g => `<td>${esc(g[r0] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      html += `<p class="small muted">Pupils build new sentences by taking one box from each column.</p>`;
      txt = Array.from({length:h}, (_,r0) => grid.map(g => g[r0] || "").join("\t"));
    }
  } else {
    const pairs = p.items;
    if (act === "gap"){
      html += `<ol>${pairs.map(([es,en]) => { const c = es.split(" "); const last = c.pop(); return `<li>${esc(en)} = ${esc(c.join(" "))} ${esc(last[0])}<span class="gap"></span>${A(es)}</li>`; }).join("")}</ol>`;
      txt = pairs.map(([es,en],i) => { const c = es.split(" "); const last = c.pop(); return `${i+1}. ${en} = ${c.join(" ")} ${last[0]}________` + (showAns ? `  (${es})` : ""); });
    } else if (act === "match"){
      const right = shuffleNot(pairs.map((x,i) => ({ t:x[1], i })), r);
      const L = "abcdefghijklmnopqrstuvwxyz";
      html += `<div class="match">${pairs.map((x,i) => `<div>${i+1}. ${esc(x[0])}</div><div>${L[i]}. ${esc(right[i].t)}</div>`).join("")}</div>`;
      if (showAns) html += `<p class="ans">${pairs.map((x,i) => `${i+1}${L[right.findIndex(y => y.i === i)]}`).join(" · ")}</p>`;
      txt = pairs.map((x,i) => `${i+1}. ${x[0]}      ${L[i]}. ${right[i].t}`);
      if (showAns) txt.push("", "Answers: " + pairs.map((x,i) => `${i+1}${L[right.findIndex(y => y.i === i)]}`).join(", "));
    } else if (act === "missing"){
      html += `<ol>${pairs.map(([es,en]) => `<li>${esc(es.split(" ").map(w => w.length > 3 ? blankLetters(w, r) : w).join(" "))} = ${esc(en)}${A(es)}</li>`).join("")}</ol>`;
      txt = pairs.map(([es,en],i) => `${i+1}. ${es.split(" ").map(w => w.length > 3 ? blankLetters(w, r) : w).join(" ")} = ${en}` + (showAns ? `  (${es})` : ""));
    } else if (act === "recall"){
      const order = shuffle(pairs, r);
      html += `<ol>${order.map(([es,en]) => `<li><span class="gap" style="min-width:140px"></span> = ${esc(en)}${A(es)}</li>`).join("")}</ol>`;
      html += `<p class="small muted">Cover the word bank. How many can pupils remember?</p>`;
      txt = order.map(([es,en],i) => `${i+1}. ____________ = ${en}` + (showAns ? `  (${es})` : ""));
    } else if (act === "builder"){
      const half = Math.ceil(pairs.length / 2);
      html += `<div class="sbwrap"><table class="sb"><thead><tr><td>Spanish</td><td>English</td><td>Spanish</td><td>English</td></tr></thead><tbody>${Array.from({length:half}, (_,i) => { const a = pairs[i], b = pairs[i+half]; return `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td><td>${b ? esc(b[0]) : ""}</td><td>${b ? esc(b[1]) : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
      txt = pairs.map(([es,en]) => `${es}\t${en}`);
    }
  }
  $("#sheet").innerHTML = `<div class="sheet-head"><span class="h4">${title}</span><span class="small muted">Name: ____________</span></div>${html}`;
  plain = title + "\n\n" + txt.join("\n");
}

$("#input").addEventListener("input", build);
$("#acts").addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b) return; act = b.dataset.a; build(); });
$("#shuffle").addEventListener("click", () => { seed = (seed * 48271) % 2147483647 || 11; build(); });
$("#answers").addEventListener("click", e => { showAns = !showAns; e.currentTarget.setAttribute("aria-pressed", showAns); e.currentTarget.textContent = showAns ? "Hide answers" : "Show answers"; build(); });
document.querySelectorAll("[data-sample]").forEach(b => b.addEventListener("click", () => { $("#input").value = SAMPLES[b.dataset.sample]; act = "gap"; build(); }));
$("#copy").addEventListener("click", () => {
  const done = m => { $("#toast").textContent = m; setTimeout(() => $("#toast").textContent = "", 2500); };
  if (!plain) return done("Paste some words first.");
  try {
    navigator.clipboard.writeText(plain).then(() => done("Copied. Paste it into Word or Google Docs."), () => { selectSheet(); done("Copy blocked here. The sheet is selected: press Ctrl+C."); });
  } catch (_) { selectSheet(); done("Copy blocked here. The sheet is selected: press Ctrl+C."); }
});
function selectSheet(){ const s = window.getSelection(); const rg = document.createRange(); rg.selectNodeContents($("#sheet")); s.removeAllRanges(); s.addRange(rg); }

$("#input").value = SAMPLES.sent;
build();
