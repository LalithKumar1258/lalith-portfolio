// Portfolio interactions — vanilla JS, no trackers.
(() => {
  const P = window.PROJECTS;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const K = { blue: "#2864FF", cyan: "#00D9FF", lime: "#D9FF43", orange: "#FF6238", red: "#FF4D5E" };

  /* ---------------- animated flow diagram ---------------- */
  const flowSVG = (flow, tipEl) => {
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
        d = `M${x1},${y1} C${x1},${330} ${x2},${330} ${x2},${y2}`;
      } else if (kind === "dash" && Math.abs(A.x - B.x) < 60) {
        d = `M${A.x + A.w / 2},${A.y + A.h} L${B.x + B.w / 2},${B.y}`;
      } else {
        const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2, mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("id", `e${Math.random().toString(36).slice(2)}`);
      path.classList.add("wire");
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
    flow.nodes.forEach((n) => {
      const g = document.createElementNS(NS, "g");
      g.classList.add("node");
      g.setAttribute("tabindex", "0");
      g.style.setProperty("--k", K[n.k] || "#6B7BA8");
      const r = document.createElementNS(NS, "rect");
      Object.entries({ x: n.x, y: n.y, width: n.w, height: n.h, rx: 14 }).forEach(([k, v]) => r.setAttribute(k, v));
      g.appendChild(r);
      const lines = [[n.t, "t-main"], n.s && [n.s, "t-sub"], n.m && [n.m, "t-mono"]].filter(Boolean);
      const total = lines.length;
      lines.forEach(([txt, cls], j) => {
        const t = document.createElementNS(NS, "text");
        t.setAttribute("x", n.x + n.w / 2);
        t.setAttribute("y", n.y + n.h / 2 + (j - (total - 1) / 2) * 22 + 6);
        t.classList.add(cls);
        t.textContent = txt;
        g.appendChild(t);
      });
      const on = () => {
        svg.querySelectorAll(".node").forEach((x) => x.classList.remove("on"));
        g.classList.add("on");
        tipEl.innerHTML = `<b>${n.t}</b> — ${n.tip}`;
      };
      g.addEventListener("mouseenter", on);
      g.addEventListener("click", on);
      g.addEventListener("focus", on);
      nodeLayer.appendChild(g);
    });
    if (flow.foot) {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", 500);
      t.setAttribute("y", 334);
      t.classList.add("t-foot");
      t.textContent = flow.foot;
      svg.appendChild(t);
    }
    return svg;
  };

  /* ---------------- STAR tabs ---------------- */
  const starBox = (p, autoplay) => {
    const box = document.createElement("div");
    box.className = "star";
    const words = { S: "Situation", T: "Task", A: "Action", R: "Result" };
    box.innerHTML = `<div class="star-tabs" role="tablist">${["S", "T", "A", "R"]
      .map((k, i) => `<button class="${i === 0 ? "on" : ""}" data-k="${k}" role="tab"><b>${k}</b> ${words[k]}</button>`)
      .join("")}</div><div class="star-body">${["S", "T", "A", "R"]
      .map((k, i) => `<div class="pane ${i === 0 ? "on" : ""}" data-k="${k}"><p>${p.star[k]}</p></div>`)
      .join("")}</div>`;
    const tabs = [...box.querySelectorAll("button")];
    const panes = [...box.querySelectorAll(".pane")];
    let auto = autoplay && !reduce;
    const show = (k) => {
      tabs.forEach((t) => t.classList.toggle("on", t.dataset.k === k));
      panes.forEach((x) => x.classList.toggle("on", x.dataset.k === k));
    };
    tabs.forEach((t) => t.addEventListener("click", () => { auto = false; show(t.dataset.k); }));
    if (auto) {
      let i = 0;
      setInterval(() => {
        if (!auto) return;
        const r = box.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) { i = (i + 1) % 4; show(tabs[i].dataset.k); }
      }, 7000);
    }
    return box;
  };

  /* ---------------- full explainer (used inline + in the sheet) ---------------- */
  const explainer = (p, { autoplay = false, inSheet = false } = {}) => {
    const el = document.createElement("div");
    el.className = "exp";
    el.style.setProperty("--acc", p.accent);
    el.innerHTML = `
      ${inSheet ? `<div class="exp-hero"><img src="${p.img}" alt="3D render: ${p.name}" loading="lazy" /><div class="exp-hero-txt">
        <div class="tag ${p.statusKind}">/${p.status}</div><h3 id="sheet-title">${p.name}</h3><p>${p.tagline}</p>
        <div class="slashes">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div></div></div>` : `<div class="exp-render"><img src="${p.img}" alt="3D render: ${p.name}" loading="lazy" /><span class="cap">3D render from the film</span></div>`}
      <div class="exp-star"></div>
      <div class="exp-flow"><div class="flow-head"><span class="mono">/HOW IT WORKS</span><span class="hint">tap a block</span></div><div class="flow-box"></div><div class="tip">Tap or hover any block to see what it does.</div></div>
      ${p.metrics.length ? `<div class="metrics">${p.metrics.map((m) => `<div class="m c-${m.c}"><b>${m.v.replace("<", '<span class="lt">&lt;</span>')}</b><span>${m.l}</span></div>`).join("")}</div>` : ""}
      <p class="stack">${p.stack}</p>`;
    el.querySelector(".exp-star").appendChild(starBox(p, autoplay));
    const tip = el.querySelector(".tip");
    el.querySelector(".flow-box").appendChild(flowSVG(p.flow, tip));
    return el;
  };

  // featured AskCM inline
  const featured = document.getElementById("featured");
  featured.appendChild(explainer(P[0], { autoplay: true }));

  // grid cards
  const grid = document.getElementById("grid");
  P.slice(1).forEach((p, i) => {
    const c = document.createElement("button");
    c.className = "card reveal";
    c.style.setProperty("--acc", p.accent);
    c.style.transitionDelay = `${(i % 3) * 0.08}s`;
    c.innerHTML = `
      <div class="card-img"><img src="${p.poster}" alt="" loading="lazy" /><div class="shade"></div></div>
      <div class="card-txt">
        <div class="tag ${p.statusKind}">/${p.status}</div>
        <h3>${p.name}</h3>
        <p>${p.tagline}</p>
        <span class="open">Open the story →</span>
      </div>`;
    c.addEventListener("click", () => openSheet(p.id));
    c.addEventListener("pointermove", (e) => {
      if (reduce) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    c.addEventListener("pointerleave", () => (c.style.transform = ""));
    grid.appendChild(c);
  });

  /* ---------------- sheet (dialog) ---------------- */
  const sheet = document.getElementById("sheet");
  const body = sheet.querySelector(".sheet-body");
  const openSheet = (id) => {
    const p = P.find((x) => x.id === id);
    if (!p) return;
    body.innerHTML = "";
    body.appendChild(explainer(p, { inSheet: true }));
    sheet.showModal();
    sheet.scrollTop = 0;
    document.body.classList.add("lock");
    history.replaceState(null, "", `#p-${id}`);
  };
  const closeSheet = () => {
    sheet.classList.add("closing");
    setTimeout(() => { sheet.close(); sheet.classList.remove("closing"); }, 280);
  };
  sheet.addEventListener("close", () => { document.body.classList.remove("lock"); history.replaceState(null, "", "#work"); });
  sheet.querySelector(".close").addEventListener("click", closeSheet);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  // deep links: #p-sql etc.
  const m = location.hash.match(/^#p-(\w+)/);
  if (m) setTimeout(() => openSheet(m[1]), 400);

  /* ---------------- reveal + progress ---------------- */
  const io = new IntersectionObserver(
    (en) => en.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  const bar = document.querySelector(".progress span");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
