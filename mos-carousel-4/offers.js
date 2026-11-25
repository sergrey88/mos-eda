for (const offersCarousel of document.querySelectorAll('.offers-carousel')) {
  const offersList = offersCarousel.querySelector('.offers-list');
  const previousOffer = offersCarousel.querySelector('.offers-prev');
  const nextOffer = offersCarousel.querySelector('.offers-next');

  function setArrowVisibility(arrow, visible) {
    arrow.disabled = !visible;
    arrow.classList.toggle('is-visible', visible);
  }

  function updateOfferArrows() {
    const hasPrevious = offersList.scrollLeft > 1;
    const hasNext = offersList.scrollLeft + offersList.clientWidth < offersList.scrollWidth - 1;
    setArrowVisibility(previousOffer, hasPrevious);
    setArrowVisibility(nextOffer, hasNext);
    offersCarousel.classList.toggle('has-next', hasNext);
  }

  function moveOffers(direction) {
    const cardWidth = offersList.firstElementChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(offersList).columnGap);
    offersList.scrollBy({
      left: direction * (cardWidth + gap),
      behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
  }

  previousOffer.addEventListener('click', () => moveOffers(-1));
  nextOffer.addEventListener('click', () => moveOffers(1));
  offersList.addEventListener('scroll', updateOfferArrows, { passive: true });
  new ResizeObserver(updateOfferArrows).observe(offersList);
}
