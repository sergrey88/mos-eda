(() => {
  'use strict';

  const artboard = document.querySelector('.artboard');
  const hero = document.querySelector('.hero');
  const cards = [...document.querySelectorAll('.card-wrap')];
  const title = document.querySelector('.hover-title');
  const cursor = document.querySelector('.cursor');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const measure = document.createElement('canvas').getContext('2d');
  const titleItems = new Map(cards.map(wrap => {
    const item = document.createElement('span');
    item.className = 'hover-title-item';
    item.textContent = wrap.querySelector('.card').dataset.title;
    title.append(item);
    return [wrap, item];
  }));
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const pointer = { x: -1000, y: -1000, inside: false };
  let scale = 1;
  let frame = 0;
  let lastTime = 0;
  let active = null;

  function fitTitle() {
    const fontSize = window.innerWidth * .12;
    measure.font = `400 ${fontSize}px "Dela Gothic One"`;
    // Choose one size against the longest title, shared by all five sections.
    const maxWidth = Math.max(...[...titleItems.values()].map(item =>
      measure.measureText(item.textContent.toUpperCase()).width));
    title.style.fontSize = `${Math.min(fontSize, fontSize * (window.innerWidth - 32) / maxWidth)}px`;
  }

  function activate(wrap, fromPointer = false) {
    if (active !== wrap) {
      active?.classList.remove('is-active');
      titleItems.get(active)?.classList.remove('is-visible');
      active = wrap;
      active?.classList.add('is-active');
      titleItems.get(active)?.classList.add('is-visible');
    }
    cursor.classList.toggle('is-visible', !!active && fromPointer);
  }

  function render() {
    for (const wrap of cards) {
      wrap.style.setProperty('--move-x', `${current.x * Number(wrap.dataset.depthX)}px`);
      wrap.style.setProperty('--move-y', `${current.y * Number(wrap.dataset.depthY)}px`);
    }
  }

  function animate(time) {
    frame = 0;
    // Snog uses 90% smoothing: 10% of the remaining distance per 60 Hz frame.
    const elapsed = lastTime ? Math.min(time - lastTime, 64) : 1000 / 60;
    lastTime = time;
    const step = 1 - Math.pow(.9, elapsed / (1000 / 60));
    current.x += (target.x - current.x) * step;
    current.y += (target.y - current.y) * step;
    const moving = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > .02;
    if (!moving) {
      current.x = target.x;
      current.y = target.y;
    }
    render();
    // Recheck underneath a stationary pointer as the scene eases past it.
    if (pointer.inside) {
      const hit = document.elementFromPoint(pointer.x, pointer.y)?.closest('.card-wrap');
      activate(hit || null, !!hit);
    }
    if (moving) frame = requestAnimationFrame(animate);
    else lastTime = 0;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(animate);
  }

  function reset() {
    pointer.inside = false;
    target.x = 0;
    target.y = 0;
    activate(null);
    schedule();
  }

  function resize() {
    // Preserve the composition's scale, but let its scene fill the viewport.
    scale = Math.min(window.innerWidth / 1600, window.innerHeight / 1210);
    artboard.style.setProperty('--scale', scale);
    artboard.style.width = `${window.innerWidth / scale}px`;
    artboard.style.height = `${window.innerHeight / scale}px`;
    fitTitle();
    reset();
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.inside = true;
    // Match the reference's ±30vw / ±30vh movement, opposite the pointer.
    if (!reducedMotion.matches) {
      target.x = (.5 - event.clientX / window.innerWidth) * .6 * window.innerWidth / scale;
      target.y = (.5 - event.clientY / window.innerHeight) * .6 * window.innerHeight / scale;
    }
    cursor.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    activate(event.target.closest('.card-wrap'), !!event.target.closest('.card-wrap'));
    schedule();
  });

  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset();
  });
  window.addEventListener('resize', resize);
  reducedMotion.addEventListener('change', reset);

  for (const wrap of cards) {
    const button = wrap.querySelector('.card');
    button.addEventListener('focus', () => {
      if (button.matches(':focus-visible')) activate(wrap);
    });
    button.addEventListener('blur', () => activate(null));
    // These are buttons, not links: click and Enter never navigate.
  }

  document.fonts.ready.then(fitTitle);
  resize();
})();
