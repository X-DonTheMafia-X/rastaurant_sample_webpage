/* ============================================================
   MAYUR FINE NEPALI CUISINES — script.js
   Sections:
     1. Scroll reveal (IntersectionObserver)
     2. Food slider (drag, touch, momentum, auto-scroll, dots)
============================================================ */


/* ===================== 1. SCROLL REVEAL ===================== */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      } else {
        entry.target.classList.remove("show");
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  }
);

document.querySelectorAll(".hidden").forEach((el) => {
  revealObserver.observe(el);
});


/* ===================== 2. FOOD SLIDER ===================== */

(function initSlider() {

  const container   = document.getElementById("sliderContainer");
  const track       = document.getElementById("sliderTrack");
  const dotsWrapper = document.getElementById("sliderDots");

  if (!container || !track || !dotsWrapper) return;

  const cards      = track.querySelectorAll(".slide-card");
  const totalCards = cards.length;
  const GAP        = 20;
  const CARD_W     = 220;
  const STEP       = CARD_W + GAP;

  // ── Measure how many cards are visible and how far we can scroll ──

  function getScrollableCount() {
    const visibleCards = Math.floor((container.offsetWidth + GAP) / STEP);
    return Math.max(0, totalCards - visibleCards);
  }

  let scrollableCards = getScrollableCount();
  let minOffset       = -(scrollableCards * STEP);
  const maxOffset     = 0;

  // ── State ──────────────────────────────────────────────
  let currentOffset   = 0;
  let isDragging      = false;
  let dragStartX      = 0;
  let dragStartOffset = 0;
  let velocity        = 0;
  let lastX           = 0;
  let lastTimestamp   = 0;
  let rafId           = null;
  let autoTimer       = null;

  // ── Helpers ────────────────────────────────────────────

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function activeIndex() {
    return Math.round(-currentOffset / STEP);
  }

  function applyOffset(offset, animated) {
    currentOffset = clamp(offset, minOffset, maxOffset);
    track.style.transition = animated ? "transform 0.35s ease" : "none";
    track.style.transform  = `translateX(${currentOffset}px)`;
    updateDots();
  }

  function goToSlide(index) {
    const clamped = clamp(index, 0, scrollableCards);
    applyOffset(-(clamped * STEP), true);
  }

  // ── Dot indicators ─────────────────────────────────────

  function buildDots() {
    dotsWrapper.innerHTML = "";
    const dotCount = scrollableCards + 1;
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("div");
      dot.classList.add("slider-dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        goToSlide(i);
        resetAutoScroll();
      });
      dotsWrapper.appendChild(dot);
    }
  }

  function updateDots() {
    const idx = clamp(activeIndex(), 0, scrollableCards);
    dotsWrapper.querySelectorAll(".slider-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === idx);
    });
  }

  buildDots();

  // ── Momentum loop ──────────────────────────────────────

  function momentumLoop() {
    if (Math.abs(velocity) < 0.5) {
      goToSlide(activeIndex());
      return;
    }

    const next = clamp(currentOffset + velocity, minOffset, maxOffset);

    if (next === minOffset || next === maxOffset) {
      velocity = -(velocity * 0.3);
    }

    currentOffset = next;
    velocity      = velocity * 0.92;

    track.style.transition = "none";
    track.style.transform  = `translateX(${currentOffset}px)`;
    updateDots();

    rafId = requestAnimationFrame(momentumLoop);
  }

  function stopMomentum() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ── Auto scroll ────────────────────────────────────────

  function startAutoScroll() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      if (isDragging) return;
      const next = activeIndex() + 1;
      goToSlide(next > scrollableCards ? 0 : next);
    }, 3000);
  }

  function resetAutoScroll() {
    clearInterval(autoTimer);
    startAutoScroll();
  }

  // ── Mouse events ───────────────────────────────────────

  container.addEventListener("mousedown", (e) => {
    isDragging      = true;
    dragStartX      = e.clientX;
    dragStartOffset = currentOffset;
    velocity        = 0;
    lastX           = e.clientX;
    lastTimestamp   = performance.now();
    stopMomentum();
    clearInterval(autoTimer);
    track.style.transition = "none";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const now = performance.now();
    const dt  = now - lastTimestamp || 1;
    const dx  = e.clientX - dragStartX;

    velocity      = ((e.clientX - lastX) / dt) * 16;
    lastX         = e.clientX;
    lastTimestamp = now;

    const next = clamp(dragStartOffset + dx, minOffset, maxOffset);
    track.style.transform = `translateX(${next}px)`;
    currentOffset = next;
    updateDots();
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    rafId = requestAnimationFrame(momentumLoop);
    resetAutoScroll();
  });

  // ── Touch events ───────────────────────────────────────

  container.addEventListener("touchstart", (e) => {
    isDragging      = true;
    dragStartX      = e.touches[0].clientX;
    dragStartOffset = currentOffset;
    velocity        = 0;
    lastX           = e.touches[0].clientX;
    lastTimestamp   = performance.now();
    stopMomentum();
    clearInterval(autoTimer);
    track.style.transition = "none";
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const now = performance.now();
    const dt  = now - lastTimestamp || 1;
    const dx  = e.touches[0].clientX - dragStartX;

    velocity      = ((e.touches[0].clientX - lastX) / dt) * 16;
    lastX         = e.touches[0].clientX;
    lastTimestamp = now;

    const next = clamp(dragStartOffset + dx, minOffset, maxOffset);
    track.style.transform = `translateX(${next}px)`;
    currentOffset = next;
    updateDots();
  }, { passive: true });

  container.addEventListener("touchend", () => {
    if (!isDragging) return;
    isDragging = false;
    rafId = requestAnimationFrame(momentumLoop);
    resetAutoScroll();
  });

  // ── Keyboard accessibility ─────────────────────────────

  container.setAttribute("tabindex", "0");
  container.setAttribute("aria-label", "Food gallery, use arrow keys to navigate");

  container.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      goToSlide(activeIndex() - 1);
      resetAutoScroll();
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      goToSlide(activeIndex() + 1);
      resetAutoScroll();
      e.preventDefault();
    }
  });

  // ── Pause auto-scroll on hover ─────────────────────────

  container.addEventListener("mouseenter", () => clearInterval(autoTimer));
  container.addEventListener("mouseleave", () => {
    if (!isDragging) resetAutoScroll();
  });

  // ── Resize handler ─────────────────────────────────────

  window.addEventListener("resize", () => {
    scrollableCards = getScrollableCount();
    minOffset       = -(scrollableCards * STEP);
    buildDots();
    goToSlide(Math.min(activeIndex(), scrollableCards));
  });

  // ── Kick things off ────────────────────────────────────

  startAutoScroll();

})();