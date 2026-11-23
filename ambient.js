(() => {
  const canvas = document.querySelector('.ambient-canvas');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const context = canvas.getContext('2d');
  const mobile = matchMedia('(max-width: 720px)').matches;
  const particleCount = mobile ? 28 : 68;
  let width = 0;
  let height = 0;
  let frame = 0;
  let particles = [];
  let meteors = [];
  let lastMeteor = 0;
  let nextMeteorDelay = 900;

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: particleCount }, createParticle);
    meteors = [];
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .32,
      vy: -.12 - Math.random() * .34,
      radius: .7 + Math.random() * 1.8,
      hue: Math.random() > .5 ? 278 : 28,
      alpha: .25 + Math.random() * .55
    };
  }

  function createMeteor() {
    const speed = mobile ? 7 + Math.random() * 3 : 10 + Math.random() * 5;
    return {
      x: -120 + Math.random() * width * .7,
      y: -40 + Math.random() * height * .32,
      vx: speed,
      vy: speed * (.42 + Math.random() * .18),
      length: 9 + Math.random() * 8,
      life: 1,
      decay: .012 + Math.random() * .006,
      width: 1.2 + Math.random() * 1.4
    };
  }

  function drawMeteors(time) {
    if (time - lastMeteor > nextMeteorDelay) {
      meteors.push(createMeteor());
      if (!mobile && Math.random() > .72) meteors.push(createMeteor());
      lastMeteor = time;
      nextMeteorDelay = mobile ? 1900 + Math.random() * 2200 : 900 + Math.random() * 1700;
    }
    meteors = meteors.filter(meteor => meteor.life > 0 && meteor.x < width + 240 && meteor.y < height + 180);
    meteors.forEach(meteor => {
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.life -= meteor.decay;
      const tailX = meteor.x - meteor.vx * meteor.length;
      const tailY = meteor.y - meteor.vy * meteor.length;
      const trail = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      trail.addColorStop(0, 'rgba(137,103,255,0)');
      trail.addColorStop(.72, `rgba(205,182,255,${meteor.life * .45})`);
      trail.addColorStop(1, `rgba(255,246,225,${meteor.life})`);
      context.save();
      context.strokeStyle = trail;
      context.lineWidth = meteor.width;
      context.lineCap = 'round';
      context.shadowColor = '#e7c8ff';
      context.shadowBlur = 10;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(meteor.x, meteor.y);
      context.stroke();
      context.fillStyle = `rgba(255,250,235,${meteor.life})`;
      context.beginPath();
      context.arc(meteor.x, meteor.y, meteor.width * 1.45, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  function draw(time = performance.now()) {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.y < -10 || particle.x < -10 || particle.x > width + 10) particles[index] = createParticle();
      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 7);
      glow.addColorStop(0, `hsla(${particle.hue},100%,78%,${particle.alpha})`);
      glow.addColorStop(1, `hsla(${particle.hue},100%,60%,0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * 7, 0, Math.PI * 2);
      context.fill();
      for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
        const other = particles[otherIndex];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < 105) {
          context.strokeStyle = `rgba(192,150,255,${(1 - distance / 105) * .13})`;
          context.lineWidth = .6;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }
    });
    drawMeteors(time);
    frame = requestAnimationFrame(draw);
  }

  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', event => {
    document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) draw();
  });
  resize();
  draw();
})();
