const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const backdrop = document.querySelector('.fairs-backdrop');
const items = document.querySelectorAll('[data-fairs-reveal]');
let observer;
let frame = 0;

function updateParallax() {
  frame = 0;
  if (reducedMotion.matches) {
    backdrop.style.removeProperty('--fairs-parallax');
    return;
  }

  const { top, height } = backdrop.getBoundingClientRect();
  // Shift up to 20% of the frame height in either direction. CSS adds 22% bleed per side.
  const progress = Math.min(1, Math.max(0, (innerHeight - top) / (innerHeight + height)));
  backdrop.style.setProperty('--fairs-parallax', `${(progress - .5) * height * .4}px`);
}

function scheduleParallax() {
  if (!frame) frame = requestAnimationFrame(updateParallax);
}

function configureMotion() {
  observer?.disconnect();
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add('is-revealed');
        target.classList.remove('is-awaiting-reveal');
        observer.unobserve(target);
      }
    }, { rootMargin: '0px 0px -24px', threshold: .08 });

    for (const item of items) {
      if (item.classList.contains('is-revealed')) continue;
      item.classList.add('is-awaiting-reveal');
      observer.observe(item);
    }
  } else {
    for (const item of items) item.classList.remove('is-awaiting-reveal');
  }
  scheduleParallax();
}

addEventListener('scroll', scheduleParallax, { passive: true });
addEventListener('resize', scheduleParallax);
reducedMotion.addEventListener('change', configureMotion);
configureMotion();
