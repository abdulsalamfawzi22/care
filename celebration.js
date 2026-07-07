// ===== محرك الألعاب النارية (وردي / أبيض / ذهبي) =====
// يعرض window.startCelebration(onDone, durationMs) — يشغّل العرض ثم ينادي onDone.
(function () {
  const PALETTE = ["#ff5fa2", "#ffffff", "#ffd24a", "#ff9ec9", "#ffe08a", "#ff8ac0"];

  let canvas, ctx, W, H, DPR;
  let particles = [];
  let rockets = [];
  let rafId = null;
  let launchTimer = null;
  let running = false;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function launchRocket() {
    rockets.push({
      x: rand(W * 0.2, W * 0.8),
      y: H + 10,
      vx: rand(-0.6, 0.6) * DPR,
      vy: -rand(9, 13) * DPR,
      ty: rand(H * 0.12, H * 0.45),
      color: pick(PALETTE),
    });
  }

  function explode(x, y, baseColor) {
    const n = 70 + ((Math.random() * 45) | 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(1.5, 7) * DPR;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        color: Math.random() < 0.55 ? baseColor : pick(PALETTE),
        life: 1,
        decay: rand(0.006, 0.014),
        size: rand(1.8, 3.6) * DPR,
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // الصواريخ الصاعدة
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.12 * DPR;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2.2 * DPR, 0, 7);
      ctx.fillStyle = r.color;
      ctx.fill();
      if (r.y <= r.ty || r.vy >= 0) {
        explode(r.x, r.y, r.color);
        rockets.splice(i, 1);
      }
    }

    // شرر الانفجار
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.vy += 0.05 * DPR;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 7);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (running || particles.length || rockets.length) {
      rafId = requestAnimationFrame(frame);
    }
  }

  window.startCelebration = function (onDone, durationMs) {
    canvas = document.getElementById("fw");
    if (!canvas) { if (onDone) onDone(); return; }
    ctx = canvas.getContext("2d");
    const duration = durationMs || 5200;

    particles = [];
    rockets = [];
    running = true;
    resize();
    window.addEventListener("resize", resize);

    // دفعة أولى مبهرة مباشرة (انفجارات فورية + صواريخ)
    explode(W * 0.5, H * 0.32, "#ffd24a");
    explode(W * 0.3, H * 0.4, "#ff5fa2");
    explode(W * 0.7, H * 0.4, "#ffffff");
    launchRocket();
    launchRocket();
    launchRocket();
    launchTimer = setInterval(() => {
      launchRocket();
      if (Math.random() < 0.7) launchRocket();
    }, 260);

    rafId = requestAnimationFrame(frame);

    // إيقاف الإطلاق بعد المدة، ثم إنهاء بعد ما يخفت الشرر
    setTimeout(() => {
      running = false;
      clearInterval(launchTimer);
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        if (onDone) onDone();
      }, 1400);
    }, duration);
  };
})();
