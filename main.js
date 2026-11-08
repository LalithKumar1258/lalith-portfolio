// Portfolio interactions — no frameworks, no trackers.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // scroll reveal
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // scroll progress
  const bar = document.querySelector(".progress span");
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // cursor glow (desktop only)
  const glow = document.querySelector(".cursor-glow");
  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", (e) => {
      glow.style.opacity = 1;
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    });
  }

  // STAR tabs (auto-advance until the visitor clicks)
  document.querySelectorAll("[data-star]").forEach((box) => {
    const tabs = [...box.querySelectorAll(".star-tabs button")];
    const panes = [...box.querySelectorAll(".pane")];
    let auto = !reduce;
    const show = (k) => {
      tabs.forEach((t) => t.classList.toggle("on", t.dataset.k === k));
      panes.forEach((p) => p.classList.toggle("on", p.dataset.k === k));
    };
    tabs.forEach((t) => t.addEventListener("click", () => { auto = false; show(t.dataset.k); }));
    let i = 0;
    const tick = () => {
      if (!auto) return;
      const r = box.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) { i = (i + 1) % tabs.length; show(tabs[i].dataset.k); }
    };
    setInterval(tick, 6500); // generous reading time per beat
  });

  // architecture tooltips
  const tip = document.querySelector(".tip");
  document.querySelectorAll(".node").forEach((n) => {
    const on = () => {
      document.querySelectorAll(".node").forEach((x) => x.classList.remove("on"));
      n.classList.add("on");
      tip.textContent = n.dataset.tip;
    };
    n.addEventListener("mouseenter", on);
    n.addEventListener("click", on);
  });

  // flip cards (click / Enter / Space)
  document.querySelectorAll(".card").forEach((c) => {
    const flip = () => c.classList.toggle("flipped");
    c.addEventListener("click", flip);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
  });

  // monitoring card: 14 schema groups of dots
  const dots = document.querySelector(".ico .dots");
  if (dots) {
    const ns = "http://www.w3.org/2000/svg";
    for (let g = 0; g < 14; g++) {
      for (let k = 0; k < 6; k++) {
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", 14 + (g % 7) * 26 + (k % 3) * 6);
        c.setAttribute("cy", 22 + Math.floor(g / 7) * 46 + Math.floor(k / 3) * 8);
        c.setAttribute("r", 2.6);
        c.style.opacity = 0.25;
        c.style.transition = "opacity .4s";
        dots.appendChild(c);
      }
    }
    if (!reduce) {
      const all = [...dots.children];
      let i = 0;
      setInterval(() => { all.forEach((c, j) => (c.style.opacity = j <= i ? 1 : 0.25)); i = (i + 3) % (all.length + 12); }, 120);
    }
  }
})();
