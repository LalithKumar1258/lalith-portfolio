// Portfolio interactions — vanilla JS, no trackers.
(() => {
  const P = window.PROJECTS;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const K = { blue: "#2864FF", cyan: "#00D9FF", lime: "#D9FF43", orange: "#FF6238", red: "#FF4D5E" };

  /* ---------------- text effects ---------------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#*";
  const scramble = (el) => {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    const html = el.innerHTML;
    const text = el.textContent;
    let f = 0;
    const total = 26;
    const tick = () => {
      f++;
      const keep = Math.floor((f / total) * text.length);
      el.textContent = text
        .split("")
        .map((c, i) => (i < keep || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (f < total) requestAnimationFrame(tick);
      else el.innerHTML = html;
    };
    tick();
  };
  const typeLine = (el) => {
    const full = el.dataset.type.replace(/&gt;/g, ">");
    if (reduce) { el.textContent = full; return; }
    let i = 0;
    el.textContent = "";
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = "_";
    const t = setInterval(() => {
      el.textContent = full.slice(0, ++i);
      el.appendChild(caret);
      if (i >= full.length) clearInterval(t);
    }, 38);
  };
  document.querySelectorAll("[data-type]").forEach(typeLine);

  /* ---------------- animated flow + story mode ---------------- */
  const flowSVG = (flow, captionEl) => {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 340");
    svg.classList.add("flow");
    const byId = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
    const edgeLayer = document.createElementNS(NS, "g");
    const pktLayer = document.createElementNS(NS, "g");
    const nodeLayer = document.createElementNS(NS, "g");
    svg.append(edgeLayer, pktLayer, nodeLayer);
    flow.edges.forEach(([a, b, quiet, kind], i) => {
      const A = byId[a], B = byId[b];
      let d;
      if (kind === "back") {
        const x1 = A.x + A.w / 2, y1 = A.y + A.h, x2 = B.x + B.w / 2, y2 = B.y + B.h;
        d = `M${x1},${y1} C${x1},330 ${x2},330 ${x2},${y2}`;
      } else if (kind === "dash" && Math.abs(A.x - B.x) < 60) {
        d = `M${A.x + A.w / 2},${A.y + A.h} L${B.x + B.w / 2},${B.y}`;
      } else {
        const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.classList.add("wire");
      path.dataset.from = a;
      path.dataset.to = b;
      if (kind) path.classList.add(kind);
      edgeLayer.appendChild(path);
      if (!quiet && !reduce) {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("r", 6);
        c.classList.add("pkt");
        if (kind === "back") c.classList.add("ok");
        const am = document.createElementNS(NS, "animateMotion");
        am.setAttribute("dur", kind === "back" ? "3.2s" : "2.2s");
        am.setAttribute("begin", `${(i * 0.45) % 2.2}s`);
        am.setAttribute("repeatCount", "indefinite");
        am.setAttribute("path", d);
        c.appendChild(am);
        pktLayer.appendChild(c);
      }
    });
    const gs = flow.nodes.map((n, idx) => {
      const g = document.createElementNS(NS, "g");
      g.classList.add("node");
      g.setAttribute("tabindex", "0");
      g.dataset.id = n.id;
      g.style.setProperty("--k", K[n.k] || "#6B7BA8");
      const ring = document.createElementNS(NS, "rect");
      Object.entries({ x: n.x - 6, y: n.y - 6, width: n.w + 12, height: n.h + 12, rx: 18 }).forEach(([k, v]) => ring.setAttribute(k, v));
      ring.classList.add("halo");
      g.appendChild(ring);
      const r = document.createElementNS(NS, "rect");
      Object.entries({ x: n.x, y: n.y, width: n.w, height: n.h, rx: 14 }).forEach(([k, v]) => r.setAttribute(k, v));
      g.appendChild(r);
      const badge = document.createElementNS(NS, "text");
      badge.setAttribute("x", n.x + 10);
      badge.setAttribute("y", n.y + 18);
      badge.classList.add("t-step");
      badge.textContent = String(idx + 1);
      g.appendChild(badge);
      const lines = [[n.t, "t-main"], n.s && [n.s, "t-sub"], n.m && [n.m, "t-mono"]].filter(Boolean);
      lines.forEach(([txt, cls], j) => {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", n.x + n.w / 2);
        t.setAttribute("y", n.y + n.h / 2 + (j - (lines.length - 1) / 2) * 22 + 6);
        t.classList.add(cls);
        t.textContent = txt;
        g.appendChild(t);
      });
      nodeLayer.appendChild(g);
      return g;
    });
    if (flow.foot) {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", 500);
      t.setAttribute("y", 334);
      t.classList.add("t-foot");
      t.textContent = flow.foot;
      svg.appendChild(t);
    }

    // story controller
    const N = flow.nodes.length;
    let step = -1;
    let timer = null;
    const dots = captionEl.querySelector(".dots");
    const cap = captionEl.querySelector(".cap-txt");
    const btn = captionEl.querySelector(".play");
    dots.innerHTML = flow.nodes.map((_, i) => `<button aria-label="Step ${i + 1}" data-i="${i}"></button>`).join("");
    const show = (i) => {
      step = i;
      const n = flow.nodes[i];
      svg.classList.add("stepping");
      gs.forEach((g, j) => g.classList.toggle("on", j === i));
      svg.querySelectorAll(".wire").forEach((w) => w.classList.toggle("lit", w.dataset.to === n.id || w.dataset.from === n.id));
      cap.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}/${String(N).padStart(2, "0")}</span><b>${n.t}</b> ${n.tip}`;
      cap.classList.remove("swap");
      void cap.offsetWidth;
      cap.classList.add("swap");
      [...dots.children].forEach((d, j) => d.classList.toggle("on", j <= i));
    };
    const stop = () => { clearInterval(timer); timer = null; btn.innerHTML = "▶ Play the story"; btn.classList.remove("on"); };
    const play = () => {
      if (timer) return stop();
      btn.innerHTML = "❚❚ Pause";
      btn.classList.add("on");
      show(step >= N - 1 ? 0 : step + 1);
      timer = setInterval(() => {
        if (step >= N - 1) { stop(); return; }
        show(step + 1);
      }, 4200); // enough time to read each step
    };
    btn.addEventListener("click", play);
    dots.addEventListener("click", (e) => { const i = e.target.dataset.i; if (i !== undefined) { stop(); show(+i); } });
    gs.forEach((g, j) => {
      g.addEventListener("click", () => { stop(); show(j); });
      g.addEventListener("mouseenter", () => { if (!timer) show(j); });
      g.addEventListener("focus", () => { if (!timer) show(j); });
    });
    svg.autoplay = () => { if (!timer && !reduce) play(); };
    return svg;
  };

  /* ---------------- STAR tabs ---------------- */
  const starBox = (p, autoplay) => {
    const box = document.createElement("div");
    box.className = "star";
    const words = { S: "Situation", T: "Task", A: "Action", R: "Result" };
    const emoji = { S: "😵", T: "🎯", A: "🛠️", R: "📈" };
    box.innerHTML = `<div class="star-tabs" role="tablist">${["S", "T", "A", "R"]
      .map((k, i) => `<button class="${i === 0 ? "on" : ""}" data-k="${k}" role="tab"><b>${k}</b> ${words[k]} <span class="em">${emoji[k]}</span></button>`)
      .join("")}</div><div class="star-body">${["S", "T", "A", "R"]
      .map((k, i) => `<div class="pane ${i === 0 ? "on" : ""}" data-k="${k}"><p>${p.star[k]}</p></div>`)
      .join("")}</div><div class="star-bar"><span></span></div>`;
    const tabs = [...box.querySelectorAll("button")];
    const panes = [...box.querySelectorAll(".pane")];
    const bar = box.querySelector(".star-bar span");
    let auto = autoplay && !reduce;
    const show = (k) => {
      tabs.forEach((t) => t.classList.toggle("on", t.dataset.k === k));
      panes.forEach((x) => x.classList.toggle("on", x.dataset.k === k));
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = auto ? "" : "none";
      bar.style.width = auto ? "" : "0";
    };
    tabs.forEach((t) => t.addEventListener("click", () => { auto = false; show(t.dataset.k); }));
    if (auto) {
      let i = 0;
      setInterval(() => {
        if (!auto) return;
        const r = box.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) { i = (i + 1) % 4; show(tabs[i].dataset.k); }
      }, 8000);
    } else bar.parentElement.style.display = "none";
    return box;
  };

  /* ---------------- explainer (inline + sheet) ---------------- */
  const explainer = (p, { autoplay = false, inSheet = false } = {}) => {
    const el = document.createElement("div");
    el.className = "exp";
    el.style.setProperty("--acc", p.accent);
    el.innerHTML = `
      ${inSheet ? `<div class="exp-hero"><img src="${p.img}" alt="3D render: ${p.name}" /><div class="exp-hero-txt">
        <div class="tag ${p.statusKind}">/${p.status}</div><h3 id="sheet-title">${p.name}</h3><p>${p.tagline}</p>
        <div class="slashes">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div></div></div>` : `<div class="exp-render"><img src="${p.img}" alt="3D render: ${p.name}" loading="lazy" /><span class="cap">3D render from the film</span></div>`}
      <p class="tldr"><span>TL;DR</span> <mark>${p.tldr}</mark></p>
      <div class="exp-star"></div>
      <div class="exp-flow">
        <div class="flow-head"><span class="mono">/HOW IT WORKS</span><button class="play">▶ Play the story</button></div>
        <div class="flow-box"></div>
        <div class="story"><div class="cap-txt">Hit <b>▶ Play the story</b> — or tap any block — and I'll walk you through it, one step at a time.</div><div class="dots"></div></div>
      </div>
      ${p.metrics.length ? `<div class="metrics">${p.metrics.map((m, i) => `<div class="m c-${m.c}" style="--d:${i * 0.09}s"><b>${m.v.replace("<", '<span class="lt">&lt;</span>')}</b><span>${m.l}</span></div>`).join("")}</div>` : ""}
      <p class="stack">${p.stack}</p>`;
    el.querySelector(".exp-star").appendChild(starBox(p, autoplay));
    const svg = flowSVG(p.flow, el.querySelector(".exp-flow"));
    el.querySelector(".flow-box").appendChild(svg);
    el.startStory = () => svg.autoplay();
    return el;
  };

  // featured AskCM inline — story auto-plays when it scrolls into view
  const featured = document.getElementById("featured");
  const feat = explainer(P[0], { autoplay: true });
  featured.appendChild(feat);
  const flowIO = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { feat.startStory(); flowIO.disconnect(); } }), { threshold: 0.5 });
  flowIO.observe(feat.querySelector(".exp-flow"));

  // project cards
  const grid = document.getElementById("grid");
  P.slice(1).forEach((p, i) => {
    const c = document.createElement("button");
    c.className = "card reveal";
    c.style.setProperty("--acc", p.accent);
    c.style.transitionDelay = `${(i % 3) * 0.08}s`;
    c.innerHTML = `
      <div class="card-img"><img src="${p.poster}" alt="" loading="lazy" /><div class="shade"></div><span class="peek">tap to open ↗</span></div>
      <div class="card-txt">
        <div class="tag ${p.statusKind}">/${p.status}</div>
        <h3>${p.name}</h3>
        <p class="hook">${p.tagline}</p>
        <p class="plain">${p.tldr}</p>
        <span class="open">Open the story →</span>
      </div>`;
    c.addEventListener("click", () => openSheet(p.id));
    if (fine && !reduce) {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
      });
      c.addEventListener("pointerleave", () => (c.style.transform = ""));
    }
    grid.appendChild(c);
  });

  /* ---------------- sheet ---------------- */
  const sheet = document.getElementById("sheet");
  const body = sheet.querySelector(".sheet-body");
  const openSheet = (id) => {
    const p = P.find((x) => x.id === id);
    if (!p) return;
    body.innerHTML = "";
    const ex = explainer(p, { inSheet: true });
    body.appendChild(ex);
    sheet.showModal();
    sheet.scrollTop = 0;
    document.body.classList.add("lock");
    history.replaceState(null, "", `#p-${id}`);
    requestAnimationFrame(() => ex.querySelectorAll("mark, .m").forEach((m) => m.classList.add("in")));
    setTimeout(() => ex.startStory(), 1400);
  };
  const closeSheet = () => {
    sheet.classList.add("closing");
    setTimeout(() => { sheet.close(); sheet.classList.remove("closing"); }, 280);
  };
  sheet.addEventListener("close", () => { document.body.classList.remove("lock"); history.replaceState(null, "", "#work"); });
  sheet.querySelector(".close").addEventListener("click", closeSheet);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  const m = location.hash.match(/^#p-(\w+)/);
  if (m) setTimeout(() => openSheet(m[1]), 400);

  /* ---------------- reveal: blocks, headings, marks, metrics ---------------- */
  const io = new IntersectionObserver(
    (en) => en.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.matches("[data-scramble]")) scramble(e.target);
      e.target.querySelectorAll && e.target.querySelectorAll("[data-scramble]").forEach(scramble);
      io.unobserve(e.target);
    }),
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal, mark, .m, [data-scramble]").forEach((el) => io.observe(el));

  /* ---------------- progress + cursor trail ---------------- */
  const bar = document.querySelector(".progress span");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (fine && !reduce) {
    const trail = document.querySelector(".trail");
    const dotsT = Array.from({ length: 7 }, (_, i) => {
      const d = document.createElement("i");
      d.style.setProperty("--s", 1 - i * 0.12);
      trail.appendChild(d);
      return { el: d, x: 0, y: 0 };
    });
    let mx = -100, my = -100, hot = false;
    addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; hot = !!e.target.closest("a,button,.node,.card"); });
    const loop = () => {
      let x = mx, y = my;
      dotsT.forEach((d, i) => {
        d.x += (x - d.x) * (0.45 - i * 0.04);
        d.y += (y - d.y) * (0.45 - i * 0.04);
        d.el.style.transform = `translate(${d.x}px, ${d.y}px) scale(${hot && i === 0 ? 2.4 : 1})`;
        x = d.x; y = d.y;
      });
      requestAnimationFrame(loop);
    };
    loop();
  }
})();
