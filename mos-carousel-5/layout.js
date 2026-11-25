const frame = document.querySelector(".hero-frame");
const page = frame.parentElement;
const hero = frame.querySelector(".hero");
const markets = document.querySelector(".markets");
const marketsDish = markets.querySelector(".markets-dish");
const scrollMotionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let parallaxFrame = 0;

function fitPage() {
  const scale = Math.min(frame.clientWidth / hero.offsetWidth, frame.clientHeight / hero.offsetHeight);
  page.style.setProperty("--page-scale", scale);
  requestScrollParallax();
}

function requestScrollParallax() {
  if (parallaxFrame || scrollMotionPreference.matches) return;

  parallaxFrame = requestAnimationFrame(() => {
    parallaxFrame = 0;
    const heroProgress = Math.max(0, Math.min(1, scrollY / frame.clientHeight));
    const marketsBounds = markets.getBoundingClientRect();
    const marketsProgress = marketsBounds.height ? -marketsBounds.top / marketsBounds.height : 0;
    const marketsOffset = Math.max(-24, Math.min(112, 112 * marketsProgress));

    hero.style.setProperty("--hero-parallax-y", `${128 * heroProgress}px`);
    marketsDish.style.setProperty("--parallax-y", `${marketsOffset}px`);
  });
}

addEventListener("scroll", requestScrollParallax, { passive: true });
scrollMotionPreference.addEventListener("change", requestScrollParallax);
fitPage();
new ResizeObserver(fitPage).observe(frame);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;

      target.classList.add("is-revealed");
      observer.unobserve(target);
    }
  }, { rootMargin: "0px 0px -28px", threshold: 0.05 });

  document.documentElement.classList.add("has-scroll-reveal");
  document.querySelectorAll("[data-scroll-reveal]").forEach((element) => revealObserver.observe(element));
}
