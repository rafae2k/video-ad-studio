import { draftVideoPath } from "./variant-media.js";
import { normalizeWorkspaceIdeas } from "./workspace-ideas.js";
const $ = (s, el = document) => el.querySelector(s);
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const seed = [
  {
    id: "idea-ritual",
    title: "Pequenos rituais, grandes começos",
    hook: "Sua rotina começa com uma escolha.",
    style: "Legendas cinéticas",
    duration: 15,
    note: "Abrir com uma frase curta. Usar grupos de 1–3 palavras e manter o texto fora da área do rosto.",
    status: "draft",
    ref: "Legendas com hierarquia",
  },
  {
    id: "idea-pausa",
    title: "Um instante para desacelerar",
    hook: "E se você começasse por uma pausa?",
    style: "Foto com profundidade",
    duration: 15,
    note: "Foto própria com zoom suave, vinheta opcional e produto legível. Conferir detalhes em tamanho de celular.",
    status: "draft",
    ref: "Profundidade em fotos",
  },
  {
    id: "idea-collage",
    title: "Sua rotina, do seu jeito",
    hook: "Não existe uma única forma de começar.",
    style: "Colagem editorial",
    duration: 30,
    note: "Separar assets de produto, pessoa e fundo. Aprovar a composição antes de adicionar movimento.",
    status: "draft",
    ref: "Colagem em camadas",
  },
];
let state;
try {
  state = JSON.parse(localStorage.getItem("frame-studio-v1"));
} catch {}
if (!state || !Array.isArray(state.ideas) || !Array.isArray(state.variants))
  state = { ideas: structuredClone(seed), variants: [] };
let workspaceIdeas = [];
const allIdeas = () => [...workspaceIdeas, ...state.ideas];
let refs = [],
  projects = [],
  filter = "all",
  query = "",
  frameId = 0,
  renderer = null,
  finals = [];
const labels = {
  ideas: "Ideias",
  variants: "Variações",
  finals: "Versões finais",
  library: "Referências",
  workflow: "Fluxo de produção",
};
const page = () =>
  location.hash.slice(1) in labels ? location.hash.slice(1) : "ideas";
function save() {
  try {
    localStorage.setItem("frame-studio-v1", JSON.stringify(state));
  } catch {
    toast("Não foi possível salvar no navegador. Exporte o projeto.");
  }
  updateCounts();
}
function updateCounts() {
  $("#idea-count").textContent = allIdeas().length;
  $("#variant-count").textContent = state.variants.length + projects.length;
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function download(data, name) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">SEU ESPAÇO DE CRIAÇÃO</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;
}
function art(i) {
  return `<div class="card-art art-${i % 3}"><span class="art-label">DIREÇÃO ${["01", "02", "03"][i % 3]} · ESTUDO VISUAL</span><div class="poster"><small>FRAME / STUDIO</small>${['um novo<br><em>começo.</em><span class="squiggle"></span>', "menos<br>pressa.<br><em>mais você.</em>", "do seu<br><em>jeito.</em>"][i % 3]}</div><span class="art-format">9:16 · CONCEITO</span></div>`;
}
function workspaceStatus(status) {
  return (
    {
      proposed: "Proposta",
      approved: "Aprovada",
      rejected: "Descartada",
      draft: "Rascunho",
    }[status] ||
    status ||
    "Sem status"
  );
}
function ideaCard(idea, i) {
  return `<article class="card"><div data-open="${escape(idea.id)}" role="button" tabindex="0" aria-label="Abrir ${escape(idea.title)}">${art(i)}</div><div class="card-body"><span class="card-status"><span class="dot"></span>${idea.origin === "workspace" ? escape(workspaceStatus(idea.sourceStatus)) : idea.status === "approved" ? "Conceito aprovado" : "Em exploração"}</span><h3>${escape(idea.title)}</h3><p>${escape(idea.hook)}</p><span class="idea-origin">${idea.origin === "workspace" ? "Arquivo · " + escape(idea.projectTitle) : "Rascunho do navegador"}</span><div class="card-meta"><span>${escape(idea.style)}${idea.duration ? ` · ${idea.duration}s` : ""}</span><button data-open="${escape(idea.id)}">Explorar ↗</button></div></div></article>`;
}
function render() {
  cancelAnimationFrame(frameId);
  const route = page();
  $("#breadcrumb").textContent = labels[route];
  document.querySelectorAll("[data-nav]").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === route);
    a.setAttribute("aria-current", a.dataset.nav === route ? "page" : "false");
  });
  updateCounts();
  if (route === "ideas") {
    $("#main").innerHTML =
      heading(
        "Ideias que merecem ganhar vida.",
        "Explore caminhos, encontre o hook e dê forma ao próximo anúncio.",
        '<button class="button primary" id="new-idea">+ Nova ideia</button>',
      ) +
      `<section class="hero"><div class="hero-copy"><p class="eyebrow">DO REPERTÓRIO À CRIAÇÃO</p><h2>O próximo bom criativo<br>começa com uma possibilidade.</h2><p>16 referências analisadas. Transforme o que faz sentido em uma direção própria, um frame de cada vez.</p><a href="#library" class="button">Explorar referências <span>↗</span></a></div><div class="hero-art" aria-hidden="true"><div class="mini-board"><span>01 / INSIGHT</span><strong>e se<br>fosse<br>assim?</strong><span>EXPLORE A IDEIA</span></div><div class="mini-board"><span>02 / DIREÇÃO</span><strong class="orbit">✳</strong><span>ENCONTRE A FORMA</span></div><div class="mini-board"><span>03 / CRIAÇÃO</span><strong>faça<br>sentir.</strong><span>DÊ VIDA AO FRAME</span></div></div></section><div class="section-line"><h2>Seu mural de ideias <small>${allIdeas().length} conceitos</small></h2><div class="filters"><button class="filter ${filter === "all" ? "active" : ""}" data-filter="all">Todas</button><button class="filter ${filter === "draft" ? "active" : ""}" data-filter="draft">Em exploração</button><button class="filter ${filter === "approved" ? "active" : ""}" data-filter="approved">Aprovadas</button></div></div><div class="cards">${
        allIdeas()
          .filter((i) => filter === "all" || i.status === filter)
          .map(ideaCard)
          .join("") ||
        '<p class="subtitle">Nenhuma ideia neste estágio ainda.</p>'
      }</div><div class="insight"><span class="insight-icon">✳</span><p><strong>Uma direção antes de muitas versões.</strong><br>Aprove o conceito e compare variações de hook, ritmo e motion antes de produzir o vídeo.</p><a href="#workflow">Conhecer o fluxo ↗</a></div>`;
    $("#new-idea").onclick = () => $("#editor").showModal();
    document.querySelectorAll("[data-filter]").forEach(
      (b) =>
        (b.onclick = () => {
          filter = b.dataset.filter;
          render();
        }),
    );
    document.querySelectorAll("[data-open]").forEach((b) => {
      b.onclick = () => openIdea(b.dataset.open);
      b.onkeydown = (e) => {
        if (e.key === "Enter") openIdea(b.dataset.open);
      };
    });
  }
  if (route === "library") {
    const visible = refs.filter(
      (r) =>
        (filter === "all" || r.type === filter) &&
        `${r.title} ${r.creator}`.toLowerCase().includes(query.toLowerCase()),
    );
    $("#main").innerHTML =
      heading(
        "Repertório para ir além.",
        "16 vídeos estudados. Referências de linguagem, ritmo e processo — com a fonte ao lado.",
      ) +
      `<div class="section-line"><div class="filters">${["all", "Tutorial", "Processo", "Motion"].map((t) => `<button data-filter="${t}" class="filter ${filter === t ? "active" : ""}">${t === "all" ? "Todas as referências" : t}</button>`).join("")}</div><input class="search" aria-label="Buscar referências" placeholder="Buscar uma referência…" value="${escape(query)}"></div><div class="cards">${visible.map((r) => `<article class="card reference-card" data-ref="${escape(r.id)}" tabindex="0" role="button" aria-label="Assistir ${escape(r.title)}"><div class="reference-art"><img loading="lazy" src="${encodeURI(r.image)}" alt="Frame de ${escape(r.title)}"><span class="play">▶</span></div><div class="card-body"><span class="card-status">${r.type} · @${escape(r.creator)}</span><h3>${escape(r.title)}</h3><p>${escape(r.description)}</p><div class="card-meta"><span>Fonte original + análise</span><span>Assistir ↗</span></div></div></article>`).join("") || '<p class="subtitle">Nenhuma referência encontrada.</p>'}</div>`;
    $(".search").oninput = (e) => {
      const pos = e.target.selectionStart;
      query = e.target.value;
      render();
      $(".search").focus();
      $(".search").setSelectionRange(pos, pos);
    };
    document.querySelectorAll("[data-filter]").forEach(
      (b) =>
        (b.onclick = () => {
          filter = b.dataset.filter;
          render();
        }),
    );
    document.querySelectorAll("[data-ref]").forEach((b) => {
      b.onclick = () => openRef(b.dataset.ref);
      b.onkeydown = (e) => {
        if (e.key === "Enter") openRef(b.dataset.ref);
      };
    });
  }
  if (route === "variants") {
    const all = [...state.variants, ...projects];
    $("#main").innerHTML =
      heading(
        "Uma ideia. Novas possibilidades.",
        "Compare previews e vídeos draft. Assista às versões renderizadas com áudio antes da revisão final.",
      ) +
      (all.length
        ? `<div class="cards">${all.map((v, i) => `<article class="card">${v.videoPath ? `<div class="variant-art"><video class="draft-card-video" controls playsinline preload="metadata" src="${escape(v.videoPath)}" aria-label="Vídeo draft de ${escape(v.name || v.id)}"></video></div>` : `<div class="variant-art"><canvas data-thumbnail="${i}" width="${v.width || 1080}" height="${v.height || 1920}" aria-label="Frame do projeto ${escape(v.name || v.id)}"></canvas><span class="thumbnail-label">${v.layers ? "FRAME DE PREVIEW" : "MÍDIA INDISPONÍVEL"}</span></div>`}<div class="card-body"><span class="card-status">${v.videoPath ? "MP4 draft · revisão pendente" : "Preview"} · ${v.origin === "workspace" ? "Arquivo do workspace" : "Rascunho local"}</span><h3>${escape(v.name || v.id)}</h3><p>${v.videoPath ? "Vídeo renderizado com controles de áudio. Ainda não é uma entrega final aprovada." : `${v.duration || "—"}s · ${v.width || "—"} × ${v.height || "—"} · ${v.layers?.length || 0} camadas`}</p>${v.videoUnavailable ? "<p>MP4 ainda indisponível. Recarregue após o render terminar.</p>" : ""}<div class="card-meta"><span>${escape(v.ideaTitle || "Versão para revisão")}</span><button data-preview="${i}">${v.videoPath ? "Assistir draft" : "Abrir preview"} ↗</button></div>${v.videoPath ? `<a class="button draft-download" href="${escape(v.videoPath)}" download>Baixar MP4 draft ↓</a>` : ""}</div></article>`).join("")}</div>`
        : empty(
            "▧",
            "A primeira variação começa por uma ideia.",
            "Abra um conceito, aprove a direção e crie sua primeira variação.",
            "#ideas",
            "Explorar ideias",
          ));
    document
      .querySelectorAll("[data-preview]")
      .forEach((b) => (b.onclick = () => openPreview(all[+b.dataset.preview])));
    paintThumbnails(all);
  }
  if (route === "finals") {
    $("#main").innerHTML =
      heading(
        "O que está pronto para sair do estúdio.",
        "Importe um vídeo renderizado e revise antes de marcar como final. Arquivos permanecem nesta sessão.",
      ) +
      `<label class="button primary" style="display:inline-flex;cursor:pointer">+ Importar vídeo renderizado<input type="file" id="final-upload" accept="video/mp4,video/webm" hidden style="display:none"></label><div class="section-line"><h2>Revisão e entrega <small>${finals.length} arquivos disponíveis</small></h2></div>` +
      (finals.length
        ? `<div class="cards">${finals.map((f, i) => `<article class="card"><video controls preload="metadata" src="${f.url}" style="width:100%;height:240px;background:#1d251c"></video><div class="card-body"><span class="card-status">${f.approved ? "Revisado · final" : "Aguardando revisão"}</span><h3>${escape(f.name)}</h3><p>${f.size ? (f.size / 1024 / 1024).toFixed(1) + " MB · vídeo importado" : "Arquivo do workspace"}</p><button class="button" data-review="${i}">Revisar entrega ↗</button></div></article>`).join("")}</div>`
        : empty(
            "▣",
            "Ainda não há um vídeo final.",
            "Os conceitos e previews são estudos. A versão final entra aqui depois de renderizada e revisada.",
            "#variants",
            "Ver variações",
          ));
    $("#final-upload").onchange = (e) => {
      for (const file of e.target.files)
        if (file.type.startsWith("video/"))
          finals.push({
            name: file.name,
            size: file.size,
            url: URL.createObjectURL(file),
            approved: false,
          });
      render();
    };
    document
      .querySelectorAll("[data-review]")
      .forEach((b) => (b.onclick = () => reviewFinal(+b.dataset.review)));
  }
  if (route === "workflow") {
    $("#main").innerHTML =
      heading(
        "Um processo que dá espaço à criação.",
        "Da referência ao arquivo final, cada etapa tem uma saída clara.",
      ) +
      `<div class="workflow">${[
        [
          "01",
          "Repertório e intenção",
          "Escolha uma referência, identifique a decisão visual que vale reaproveitar e escreva uma ideia própria.",
          "Referências analisadas",
        ],
        [
          "02",
          "Conceito e direção",
          "Revise hook, fatos e assets. Aprove uma direção antes de investir na produção.",
          "Aprovação do conceito",
        ],
        [
          "03",
          "Variações e animatic",
          "Compare abertura, cor e ritmo em previews. Camadas de texto e motion continuam editáveis no manifesto.",
          "Manifesto JSON + preview",
        ],
        [
          "04",
          "Produção e acabamento",
          "Use takes aprovados, voz revisada e trilhas separadas. Ajuste cortes, legendas, composição e mix.",
          "Vídeo renderizado",
        ],
        [
          "05",
          "Revisão final",
          "Assista em tamanho de celular. Confira produto, texto, áudio, áreas seguras e direitos dos assets.",
          "Checklist humano",
        ],
        [
          "06",
          "Versão final e aprendizado",
          "Importe a entrega revisada. Exporte o manifesto para preservar as decisões e produzir novas versões.",
          "Arquivo + histórico",
        ],
      ]
        .map(
          ([n, t, p, tag]) =>
            `<article class="step"><span class="step-number">ETAPA ${n}</span><h3>${t}</h3><p>${p}</p><span class="tag">${tag}</span></article>`,
        )
        .join("")}</div>`;
  }
}
function empty(icon, title, description, href, label) {
  return `<section class="empty"><span class="empty-icon">${icon}</span><h2>${title}</h2><p>${description}</p><a href="${href}" class="button">${label} ↗</a></section>`;
}
function dialog(title, body, actions = "") {
  cancelAnimationFrame(frameId);
  $("#detail").innerHTML =
    `<div class="dialog-heading"><div><p class="eyebrow">FRAME CREATIVE STUDIO</p><h2>${escape(title)}</h2></div><button class="icon-button" id="close-detail" aria-label="Fechar">×</button></div>${body}<div class="detail-actions">${actions}</div>`;
  $("#close-detail").onclick = () => $("#detail").close();
  if (!$("#detail").open) $("#detail").showModal();
}
function openIdea(id) {
  const idea = allIdeas().find((i) => i.id === id);
  if (!idea) return;
  if (idea.origin === "workspace") return openWorkspaceIdea(idea);
  dialog(
    idea.title,
    `<span class="tag">${escape(idea.style)} · ${idea.duration}s · ${idea.status === "approved" ? "Conceito aprovado" : "Em exploração"}</span><div class="detail-block"><strong>Hook de abertura</strong><p>${escape(idea.hook)}</p></div><div class="detail-content"><strong>Direção de produção</strong><p>${escape(idea.note || "Defina os assets e cuidados antes de produzir.")}</p><p>Referência: ${escape(idea.ref || "Conceito próprio")}. Este exemplo não contém promessa de eficácia ou peça final produzida.</p></div>`,
    `<button class="button primary" id="approve-idea">${idea.status === "approved" ? "Criar variação" : "Aprovar conceito e criar variação"} ↗</button><button class="button" id="edit-hook">Editar conceito</button>`,
  );
  $("#approve-idea").onclick = () => {
    idea.status = "approved";
    const v = createVariant(idea);
    state.variants.push(v);
    save();
    $("#detail").close();
    location.hash = "variants";
    render();
    openPreview(v);
  };
  $("#edit-hook").onclick = () => {
    dialog(
      "Editar conceito",
      `<form id="edit-form"><label>Nome<input name="title" required maxlength="90" value="${escape(idea.title)}"></label><label>Hook<textarea name="hook" required maxlength="280">${escape(idea.hook)}</textarea></label><label>Nota de produção<textarea name="note" maxlength="500">${escape(idea.note)}</textarea></label><button class="button primary">Salvar alterações</button></form>`,
    );
    $("#edit-form").onsubmit = (e) => {
      e.preventDefault();
      const d = new FormData(e.target);
      Object.assign(idea, {
        title: d.get("title"),
        hook: d.get("hook"),
        note: d.get("note"),
        status: "draft",
      });
      save();
      $("#detail").close();
      render();
    };
  };
}
function createVariant(idea) {
  const num = state.variants.filter((v) => v.ideaId === idea.id).length + 1;
  return {
    id: crypto.randomUUID(),
    name: `${idea.title} · V${num}`,
    ideaId: idea.id,
    ideaTitle: idea.title,
    width: 1080,
    height: 1920,
    fps: 30,
    duration: Number(idea.duration),
    background: "#e8eddf",
    accent: "#416246",
    layers: [
      {
        id: "hook",
        type: "title",
        start: 0,
        duration: Math.min(6, idea.duration),
        text: idea.hook,
        x: 0.5,
        y: 0.35,
        w: 0.82,
        h: 0.3,
        effect: "slide_up",
        color: "#36533a",
        fontSize: 92,
      },
      {
        id: "support",
        type: "caption",
        start: 2,
        duration: Math.min(7, idea.duration - 2),
        text: "Um novo começo. Do seu jeito.",
        x: 0.5,
        y: 0.62,
        w: 0.8,
        h: 0.12,
        effect: "fade",
        color: "#57734a",
        fontSize: 48,
      },
      {
        id: "cta",
        type: "cta",
        start: Math.max(0, idea.duration - 4),
        duration: 4,
        text: "Conheça a marca",
        x: 0.5,
        y: 0.72,
        w: 0.76,
        h: 0.1,
        effect: "pop",
        color: "#ffffff",
        accent: "#416246",
        fontSize: 48,
      },
    ],
    audio: [],
  };
}
function openRef(id) {
  const r = refs.find((r) => r.id === id);
  dialog(
    r.title,
    `<video class="detail-video" controls playsinline src="${encodeURI(r.video)}"></video><p class="detail-content">${escape(r.description)}. Fonte de inspiração estudada; não é uma peça produzida neste projeto.</p>`,
    `<a class="button" target="_blank" rel="noopener" href="${encodeURI(r.analysis)}">Abrir análise ↗</a><button class="button primary" id="inspire">Criar ideia a partir desta referência</button>`,
  );
  $("#inspire").onclick = () => {
    $("#detail").close();
    $("#editor").showModal();
    $("#idea-form [name=note]").value =
      `Referência: ${r.title}. Adaptar a linguagem visual com assets próprios.`;
  };
}
async function openPreview(project) {
  if (project.videoPath) return openDraftVideo(project);
  if (!Array.isArray(project.layers)) {
    toast("O vídeo ainda não está disponível. Recarregue após o render.");
    return;
  }
  dialog(
    project.name || project.id,
    `<span class="tag">PREVIEW VISUAL · SEM ÁUDIO</span><canvas id="preview-canvas" width="${project.width}" height="${project.height}" style="display:block;max-width:100%;width:240px;max-height:48vh;object-fit:contain;margin:18px auto;border-radius:9px;background:#e8eddf"></canvas><div class="detail-content"><label>Tempo <input id="scrub" type="range" min="0" max="${project.duration}" value="0" step="0.05"></label><span id="time-label">0.0s / ${project.duration}s</span><p>Visualização das camadas do manifesto. A exportação abaixo salva o projeto editável; não gera MP4.</p></div>`,
    `<button class="button primary" id="play-preview">▶ Reproduzir</button><button class="button" id="download-variant">Exportar manifesto ↗</button><button class="button" id="duplicate-variant">Duplicar variação</button>`,
  );
  $("#download-variant").onclick = () =>
    download(project, `${project.id}.json`);
  $("#duplicate-variant").onclick = () => {
    const clone = structuredClone(project);
    clone.id = crypto.randomUUID();
    clone.name = (project.name || project.id) + " · cópia";
    clone.background = clone.background === "#e8eddf" ? "#eee6d9" : "#e8eddf";
    delete clone.origin;
    state.variants.push(clone);
    save();
    render();
    openPreview(clone);
    toast("Variação criada com uma nova cor de fundo.");
  };
  let playing = false,
    time = 0,
    last = 0;
  const canvas = $("#preview-canvas");
  const draw = () => {
    if (!canvas.isConnected) return;
    renderer(canvas.getContext("2d"), project, time);
    $("#scrub").value = time;
    $("#time-label").textContent = `${time.toFixed(1)}s / ${project.duration}s`;
  };
  try {
    if (!renderer)
      renderer = (await import("/packages/video/index.js")).renderFrame;
    draw();
  } catch (error) {
    $(".detail-content").insertAdjacentHTML(
      "afterbegin",
      "<p>Renderer indisponível. O manifesto continua disponível para exportação.</p>",
    );
    $("#play-preview").disabled = true;
    return;
  }
  $("#scrub").oninput = (e) => {
    time = +e.target.value;
    draw();
  };
  function tick(now) {
    if (!playing || !canvas.isConnected) return;
    time = (time + (now - last) / 1000) % project.duration;
    last = now;
    draw();
    frameId = requestAnimationFrame(tick);
  }
  $("#play-preview").onclick = () => {
    playing = !playing;
    $("#play-preview").textContent = playing ? "Ⅱ Pausar" : "▶ Reproduzir";
    cancelAnimationFrame(frameId);
    if (playing) {
      last = performance.now();
      frameId = requestAnimationFrame(tick);
    }
  };
}
function reviewFinal(i) {
  const f = finals[i];
  dialog(
    "Revisar entrega",
    `<video class="detail-video" controls src="${f.url}"></video><p class="detail-content">${escape(f.name)}</p><form id="review-form">${["Texto e alegações revisados", "Produto e identidade visual conferidos", "Áudio e legendas conferidos", "Formato, áreas seguras e direitos conferidos"].map((t, n) => `<div class="review-row"><input type="checkbox" id="check-${n}" required><label for="check-${n}">${t}</label></div>`).join("")}<button class="button primary" style="margin-top:15px">Marcar como final revisado</button></form>`,
  );
  $("#review-form").onsubmit = (e) => {
    e.preventDefault();
    f.approved = true;
    $("#detail").close();
    render();
    toast("Entrega marcada como revisada nesta sessão.");
  };
}
$("#idea-form").onsubmit = (e) => {
  if (e.submitter?.value === "cancel") return;
  e.preventDefault();
  const d = new FormData(e.target);
  state.ideas.push({
    id: crypto.randomUUID(),
    title: d.get("title"),
    hook: d.get("hook"),
    style: d.get("style"),
    duration: +d.get("duration"),
    note: d.get("note"),
    status: "draft",
  });
  save();
  $("#editor").close();
  e.target.reset();
  filter = "all";
  location.hash = "ideas";
  render();
  toast("Ideia salva no mural.");
};
$("#export").onclick = () =>
  download(
    {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      ideas: state.ideas,
      variants: state.variants,
    },
    "frame-creative-studio.json",
  );
$("#detail").addEventListener("close", () => {
  cancelAnimationFrame(frameId);
  $("#detail video")?.pause();
});
window.addEventListener("hashchange", () => {
  filter = "all";
  query = "";
  render();
});
render();
try {
  const response = await fetch("/web/references.json");
  if (response.ok) refs = await response.json();
} catch {
  toast("Não foi possível carregar as referências.");
}
try {
  const response = await fetch("/api/projects");
  if (response.ok) {
    const data = await response.json();
    const entries = Array.isArray(data) ? data : data.projects || [];
    for (const p of entries) {
      workspaceIdeas.push(...normalizeWorkspaceIdeas(p));
      if (p.ideasUnavailable)
        toast(
          `Ideias de ${p.title || p.id} indisponíveis. Confira ideas.json.`,
        );
      if (Array.isArray(p.layers)) projects.push({ ...p, origin: "workspace" });
      for (const v of p.variants || []) {
        let manifest = null;
        if (v.manifestPath) {
          try {
            const r = await fetch(v.manifestPath);
            if (r.ok) manifest = await r.json();
          } catch {}
        }
        const candidate = draftVideoPath(p.id, v.videoPath);
        let videoPath = null;
        if (candidate) {
          try {
            if ((await fetch(candidate, { method: "HEAD" })).ok)
              videoPath = candidate;
          } catch {}
        }
        if (manifest || candidate)
          projects.push({
            ...manifest,
            id: v.id || manifest?.id,
            name: p.title + " · " + (v.name || v.id),
            origin: "workspace",
            status: v.status || "draft",
            videoPath,
            videoUnavailable: Boolean(candidate && !videoPath),
          });
      }
      for (const f of p.finals || []) {
        const url = f.path || f.src || f.url;
        if (url)
          finals.push({
            name: f.name || f.id || p.title,
            url,
            size: 0,
            approved: f.status === "approved" || f.status === "final",
            origin: "workspace",
          });
      }
    }
  }
} catch {}
render();

async function paintThumbnails(all) {
  try {
    if (!renderer)
      renderer = (await import("/packages/video/index.js")).renderFrame;
    document.querySelectorAll("[data-thumbnail]").forEach((canvas) => {
      const p = all[+canvas.dataset.thumbnail];
      if (Array.isArray(p?.layers))
        renderer(canvas.getContext("2d"), p, Math.min(2, p.duration / 2));
    });
  } catch {}
}

function openWorkspaceIdea(idea) {
  const fields = [
    ["Mensagem", idea.source.message],
    ["Direção visual", idea.source.visualDirection || idea.source.direction],
    ["Beats", idea.source.beats],
    ["CTA", idea.source.cta],
    ["Formato", idea.source.format],
    [
      "Referências",
      idea.source.sources || idea.source.source || idea.source.sourceSpan,
    ],
    ["Claims", idea.source.claimIds],
    ["Componentes reutilizáveis", idea.source.reuseCandidateIds],
    ["Assets necessários", idea.source.requiredAssets],
    ["Riscos e pendências", idea.source.risks || idea.source.pending],
  ];
  dialog(
    idea.title,
    `<span class="tag">Arquivo do workspace · somente leitura</span><p class="detail-content">${escape(idea.projectTitle)} · ${escape(idea.sourceId)} · status: ${escape(workspaceStatus(idea.sourceStatus))}</p><div class="detail-block"><strong>Hipótese do hook</strong><p>${escape(idea.hook || "Ainda não definida")}</p></div>${fields
      .filter(([, value]) => value != null)
      .map(
        ([name, value]) =>
          `<div class="detail-block"><strong>${name}</strong><p class="source-field">${escape(typeof value === "string" ? value : JSON.stringify(value, null, 2))}</p></div>`,
      )
      .join(
        "",
      )}<p class="detail-content">Fonte: projects/${escape(idea.projectId)}/ideas.json. Alterações e aprovações são registradas nos arquivos do projeto. Uma cópia local começa como rascunho.</p>`,
    '<button class="button primary" id="copy-workspace-idea">Explorar como rascunho local ↗</button>',
  );
  $("#copy-workspace-idea").onclick = () => {
    const clone = {
      id: crypto.randomUUID(),
      title: idea.title + " · exploração",
      hook: idea.hook,
      style: idea.style,
      duration: idea.duration || 15,
      note: idea.note,
      ref: `projects/${idea.projectId}/ideas.json · ${idea.sourceId}`,
      status: "draft",
    };
    state.ideas.push(clone);
    save();
    $("#detail").close();
    filter = "all";
    render();
    openIdea(clone.id);
    toast("Cópia local criada. A ideia versionada permanece intacta.");
  };
}

function openDraftVideo(project) {
  document
    .querySelectorAll(".draft-card-video")
    .forEach((video) => video.pause());
  dialog(
    project.name || project.id,
    `<span class="tag">MP4 DRAFT · REVISÃO PENDENTE</span><video id="draft-video" class="detail-video" controls playsinline preload="metadata" src="${escape(project.videoPath)}"></video><p class="detail-content" id="draft-video-status">Vídeo renderizado para revisão de imagem e áudio. Esta versão ainda não é um final aprovado.</p>`,
    `<a class="button primary" href="${escape(project.videoPath)}" download>Baixar MP4 draft ↓</a>`,
  );
  $("#draft-video").addEventListener("error", () => {
    $("#draft-video-status").textContent =
      "Não foi possível carregar o MP4. Confira se o render terminou e recarregue a página.";
  });
}
