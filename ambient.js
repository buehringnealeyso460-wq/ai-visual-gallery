(() => {
  const canvas = document.querySelector('.ambient-canvas');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const context = canvas.getContext('2d');
  const mobile = matchMedia('(max-width: 720px)').matches;
  const particleCount = mobile ? 18 : 42;
  let width = 0;
  let height = 0;
  let frame = 0;
  let particles = [];

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

  function draw() {
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
        if (distance < 115) {
          context.strokeStyle = `rgba(192,150,255,${(1 - distance / 115) * .1})`;
          context.lineWidth = .6;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }
    });
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
