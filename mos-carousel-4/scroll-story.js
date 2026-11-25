const story = document.querySelector('.scroll-story');
const scene = story.querySelector('.scene');
const heroVideo = scene.querySelector('.hero-photo video');
const fairsVideo = scene.querySelector('.fairs-photo video');
const fairsDetails = document.querySelector('.fairs-details');
const newsPhoto = fairsDetails.querySelector('.fairs-news-photo');
const fairsLink = document.querySelector('.anchor-first');
const backToTop = document.querySelector('.back-to-top');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopStory = matchMedia('(min-width: 761px)');
const panelTransitionDuration = 900;
const storyboardDuration = 2600;

const wheelGestureGap = 180;
const verticalEaseTime = 92;

document.documentElement.classList.add('has-scroll-story');

function scrollRange() {
  return story.offsetHeight - scene.offsetHeight;
}

function documentScrollEnd() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

function scrollProgress() {
  return Math.max(0, Math.min(1, window.scrollY / scrollRange()));
}

let progress = scrollProgress();
let frame = 0;
let previousTime = 0;
let fairsActive = false;
let previousWheelTime = -Infinity;
let wheelInStory = false;
let panelTransition = null;
let verticalScroll = null;

function renderStoryboard(position) {
  const textPanelWidth = 49.875;
  const offscreenStart = 125;
  const introRemaining = (1 - position) ** 2.5;
  const introTravel = 1 - introRemaining;
  const textX = -50.833 * introTravel;
  const introPhotoX = 20.833 - 25 * introTravel - 36 * position;
  const fairsPanelX = offscreenStart * (1 - position ** 1.3);
  const fairsPhotoRemaining = .65 * (1 - position) + .35 * introRemaining;
  const fairsPhotoX = textPanelWidth + (offscreenStart - textPanelWidth) * fairsPhotoRemaining;

  // The moving panel reveals the second photo along its right edge.
  const fairsPhotoClip = Math.max(0, fairsPanelX + textPanelWidth - fairsPhotoX);
  scene.style.setProperty('--hero-text-x', `${textX}vw`);
  scene.style.setProperty('--hero-photo-clip', `${textPanelWidth + textX}%`);
  scene.style.setProperty('--hero-photo-x', `${introPhotoX}vw`);
  scene.style.setProperty('--fairs-panel-x', `${fairsPanelX}vw`);
  scene.style.setProperty('--fairs-photo-x', `${fairsPhotoX}vw`);
  scene.style.setProperty('--fairs-photo-clip', `${fairsPhotoClip}vw`);
}

function syncBackgroundVideo(video, shouldPlay) {
  if (video.autoplay === shouldPlay) return;

  video.autoplay = shouldPlay;
  if (shouldPlay) video.play().catch(() => {});
  else video.pause();
}

function render() {
  const motionAllowed = !reducedMotion.matches;
  const position = motionAllowed ? progress : Math.round(progress);
  const fairsIntroEnd = scrollRange();
  const distance = window.scrollY - fairsIntroEnd;
  const fairsDetailsEnd = Math.round(fairsDetails.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
  const fairsProgress = Math.max(0, Math.min(1, distance / Math.max(1, fairsDetailsEnd - fairsIntroEnd)));
  if (motionAllowed) {
    const { top, height } = newsPhoto.getBoundingClientRect();
    const photoProgress = Math.max(0, Math.min(1, (window.innerHeight - top) / (window.innerHeight + height)));
    newsPhoto.style.setProperty('--news-photo-progress', photoProgress);
  }

  if (desktopStory.matches) {
    renderStoryboard(position);
  } else {
    scene.style.setProperty('--panel-offset', `${-100 * position}%`);
    scene.style.setProperty('--progress', position);
  }
  fairsLink.style.setProperty('--fairs-progress', `${fairsProgress * 100}%`);
  syncBackgroundVideo(heroVideo, motionAllowed && position < 1);
  syncBackgroundVideo(fairsVideo, motionAllowed && position > 0 && distance < scene.offsetHeight);

  const showFairs = position >= (desktopStory.matches ? 1 : 0.5);
  if (showFairs === fairsActive) return;

  fairsActive = showFairs;
  if (fairsActive) fairsLink.setAttribute('aria-current', 'location');
  else fairsLink.removeAttribute('aria-current');
  backToTop.hidden = !fairsActive;
}

function updateVerticalScroll(time) {
  if (!verticalScroll) return;

  // Let a separate scroll action take over.
  if (Math.abs(window.scrollY - verticalScroll.lastY) > 1) {
    verticalScroll = null;
    return;
  }

  const elapsed = verticalScroll.time ? time - verticalScroll.time : 16;
  const step = elapsed / verticalEaseTime;
  const decay = Math.exp(-step);
  const remaining = verticalScroll.target - verticalScroll.position;
  const targetLag = verticalScroll.target - verticalScroll.easedTarget;
  const settled = reducedMotion.matches || (Math.abs(remaining) < 0.75 && Math.abs(targetLag) < 0.75);

  // Smooth the destination as well as the position for gradual acceleration and braking.
  verticalScroll.easedTarget = verticalScroll.target - targetLag * decay;
  verticalScroll.position = settled
    ? verticalScroll.target
    : verticalScroll.target - (remaining + targetLag * step) * decay;
  window.scrollTo({ top: verticalScroll.position, behavior: 'instant' });

  if (settled) {
    verticalScroll = null;
    return;
  }

  verticalScroll.time = time;
  verticalScroll.lastY = window.scrollY;
  scheduleUpdate();
}

function update(time) {
  frame = 0;
  updateVerticalScroll(time);
  const target = scrollProgress();

  if (panelTransition && !reducedMotion.matches && Math.abs(target - panelTransition.to) < 0.002) {
    const { from, to, start, duration } = panelTransition;
    const t = Math.max(0, Math.min(1, (time - start) / duration));
    progress = from + (to - from) * t * t * (3 - 2 * t);
    render();

    if (t < 1) scheduleUpdate();
    else panelTransition = null;
    return;
  }

  panelTransition = null;
  const elapsed = previousTime ? time - previousTime : 16;
  const blend = 1 - Math.exp(-elapsed / 48);
  progress = reducedMotion.matches ? target : progress + (target - progress) * blend;

  if (Math.abs(target - progress) < 0.001) progress = target;
  render();

  previousTime = progress === target ? 0 : time;
  if (previousTime) scheduleUpdate();
}

function scheduleUpdate() {
  if (!frame) frame = requestAnimationFrame(update);
}

function scrollToPanel(showFairs) {
  const to = showFairs ? 1 : 0;
  if (panelTransition?.to === to) return;

  previousTime = 0;
  verticalScroll = null;
  panelTransition = reducedMotion.matches || progress === to
    ? null
    : {
        from: progress,
        to,
        start: performance.now(),
        duration: desktopStory.matches ? storyboardDuration : panelTransitionDuration
      };
  window.scrollTo({ top: showFairs ? scrollRange() : 0, behavior: 'instant' });
  scheduleUpdate();
}

function followAnchor(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  scrollToPanel(event.currentTarget === fairsLink);
}

function scrollVertically(delta, range) {
  const y = window.scrollY;
  const maxY = documentScrollEnd();

  if (!verticalScroll || Math.abs(y - verticalScroll.lastY) > 1) {
    verticalScroll = { position: y, lastY: y, target: y, easedTarget: y, time: 0 };
  }

  // Leave upward travel past the second screen to the horizontal transition.
  verticalScroll.target = Math.max(range, Math.min(maxY, verticalScroll.target + delta));
  scheduleUpdate();
}

function handleWheel(event) {
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;
  const { deltaMode, deltaX, deltaY } = event;
  if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

  const range = scrollRange();
  const y = window.scrollY;
  // Keep the complete trackpad burst in the mode where it started.
  const startsGesture = event.timeStamp - previousWheelTime > wheelGestureGap;
  previousWheelTime = event.timeStamp;

  if (startsGesture) {
    wheelInStory = panelTransition !== null || y < range || (y === range && deltaY < 0);
  }

  if (wheelInStory) {
    event.preventDefault();
    if (startsGesture) scrollToPanel(deltaY > 0);
    return;
  }

  const deltaInPixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? window.innerHeight : 1);
  if (!reducedMotion.matches) {
    event.preventDefault();
    scrollVertically(deltaInPixels, range);
  } else if (deltaY < 0 && y + deltaInPixels < range) {
    event.preventDefault();
    window.scrollTo({ top: range, behavior: 'instant' });
  }
}

fairsLink.addEventListener('click', followAnchor);
backToTop.addEventListener('click', followAnchor);
window.addEventListener('wheel', handleWheel, { passive: false });
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('pageshow', scheduleUpdate);
reducedMotion.addEventListener('change', scheduleUpdate);

if (window.location.hash === '#fairs') {
  window.scrollTo(0, scrollRange());
  progress = scrollProgress();
}
render();
