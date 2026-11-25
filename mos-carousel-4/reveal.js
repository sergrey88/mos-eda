if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealTargets = fairsDetails.querySelectorAll(
    '.offers-heading, .offer-card, .fairs-news-content h2, .news-article'
  );

  const visibleRatio = 0.1;
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio < visibleRatio) continue;

      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -36px 0px', threshold: visibleRatio });

  for (const target of revealTargets) {
    target.classList.add('scroll-reveal');
    revealObserver.observe(target);
  }
}
