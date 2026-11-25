const fishTrigger = document.querySelector(".fish-market-trigger");
const fishPlate = document.querySelector(".fish-plate");
const forwardVideo = fishPlate.querySelector('[data-direction="forward"]');
const reverseVideo = fishPlate.querySelector('[data-direction="reverse"]');
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const motionSeconds = Number(getComputedStyle(fishPlate).getPropertyValue("--fish-motion-seconds"));

let pointerOverFish = false;
let fishActive = false;
let displayedVideo = null;
let playbackRequest = 0;

for (const video of [forwardVideo, reverseVideo]) {
  function setPlaybackRate() {
    video.playbackRate = video.duration / motionSeconds;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) setPlaybackRate();
  else video.addEventListener("loadedmetadata", setPlaybackRate, { once: true });
}

function showStillPlate() {
  displayedVideo = null;
  delete fishPlate.dataset.video;
  forwardVideo.pause();
  reverseVideo.pause();
  forwardVideo.currentTime = 0;
  reverseVideo.currentTime = 0;
  fishPlate.classList.toggle("is-active", fishActive);
}

async function playFishPlate() {
  // Ignore playback promises that finish after another change of direction.
  const request = ++playbackRequest;
  forwardVideo.pause();
  reverseVideo.pause();

  if (reduceMotion.matches || (!fishActive && !displayedVideo)) {
    showStillPlate();
    return;
  }

  const video = fishActive ? forwardVideo : reverseVideo;
  if (video === displayedVideo && video.ended) {
    fishPlate.classList.toggle("is-active", fishActive);
    return;
  }

  if (!displayedVideo) {
    video.currentTime = 0;
  } else if (video !== displayedVideo) {
    // The same pose is at the complementary time in the reversed clip.
    const elapsed = displayedVideo.currentTime / displayedVideo.duration;
    const progress = Math.max(0, Math.min(1, 1 - elapsed));
    if (progress === 1) {
      if (fishActive) fishPlate.classList.add("is-active");
      else showStillPlate();
      return;
    }
    video.currentTime = progress * (video.duration || displayedVideo.duration);
  }

  try {
    await video.play();
    if (request !== playbackRequest) return;

    displayedVideo = video;
    fishPlate.dataset.video = video.dataset.direction;
    fishPlate.classList.toggle("is-active", fishActive);
  } catch {
    if (request === playbackRequest) showStillPlate();
  }
}

function updateFishPlate() {
  const active = pointerOverFish || fishTrigger.matches(":focus-visible");
  if (active === fishActive) return;

  fishActive = active;
  fishTrigger.classList.toggle("is-active", active);
  playFishPlate();
}

for (const target of [fishTrigger, fishPlate]) {
  target.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    pointerOverFish = true;
    updateFishPlate();
  });

  target.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    const nextTarget = event.relatedTarget;
    pointerOverFish = fishTrigger.contains(nextTarget) || fishPlate.contains(nextTarget);
    updateFishPlate();
  });
}

fishTrigger.addEventListener("focus", updateFishPlate);
fishTrigger.addEventListener("blur", updateFishPlate);

reverseVideo.addEventListener("ended", () => {
  if (displayedVideo === reverseVideo && !fishActive) showStillPlate();
});

reduceMotion.addEventListener("change", () => {
  if (!reduceMotion.matches) return;
  playbackRequest++;
  showStillPlate();
});
