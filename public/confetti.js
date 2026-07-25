// Lightweight canvas confetti — no external library. window.confettiCelebrate(opts)
(function () {
  const COLORS = ["#e8749e", "#8fbf5c", "#f6d365", "#7c5cff", "#4b6ea0", "#ec4899", "#22c55e", "#f59e0b", "#6a9a3f"];

  function celebrate(opts) {
    opts = opts || {};
    const big = !!opts.big;
    const count = opts.count || (big ? 150 : 70);

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    let W = window.innerWidth, H = window.innerHeight;
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const ox = opts.x != null ? opts.x : W / 2;
    const oy = opts.y != null ? opts.y : H / 3;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * (big ? 12 : 8);
      parts.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 7 : 4),
        size: 5 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 90 + Math.random() * 50,
        rect: Math.random() < 0.55,
      });
    }

    let raf;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive = true;
        p.vy += 0.18;      // gravity
        p.vx *= 0.99;
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.rect) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
      else cleanup();
    }
    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (canvas.parentNode) canvas.remove();
    }
    frame();
    setTimeout(cleanup, 5000); // safety net
  }

  window.confettiCelebrate = celebrate;
})();
