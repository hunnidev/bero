const SCROLL_ANIMATION_TRIGGER_CLASSNAME = "scroll-trigger";
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = "scroll-trigger--offscreen";
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = "animate--zoom-in";
const SCROLL_ANIMATION_CANCEL_CLASSNAME = "scroll-trigger--cancel";

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (
        elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)
      ) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute("data-cascade"))
          elementTarget.setAttribute("style", `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(
  rootEl = document,
  isDesignModeEvent = false
) {
  const animationTriggerElements = Array.from(
    rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME)
  );
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add("scroll-trigger--design-mode");
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: "0px 0px -50px 0px",
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const animationTriggerElements = Array.from(
    document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME)
  );

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    const observer = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
      });
    });
    observer.observe(element);

    element.style.setProperty(
      "--zoom-in-ratio",
      1 + scaleAmount * percentageSeen(element)
    );

    window.addEventListener(
      "scroll",
      throttle(() => {
        if (!elementIsVisible) return;

        element.style.setProperty(
          "--zoom-in-ratio",
          1 + scaleAmount * percentageSeen(element)
        );
      }),
      { passive: true }
    );
  });
}

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const elementPositionY = element.getBoundingClientRect().top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    // If we haven't reached the image yet
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    // If we've completely scrolled past the image
    return 100;
  }

  // When the image is in the viewport
  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

window.addEventListener("DOMContentLoaded", () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
});

if (Shopify.designMode) {
  document.addEventListener("shopify:section:load", (event) =>
    initializeScrollAnimationTrigger(event.target, true)
  );
  document.addEventListener("shopify:section:reorder", () =>
    initializeScrollAnimationTrigger(document, true)
  );
}

  // HOME PAGE ANIMATION FOR HERO

// Function to apply the correct swiper class based on screen size
function applySwiperClass() {
  const swiperNextSlideImage = document.querySelector('.swiper-slide.product-carousel__item img');

  if (!swiperNextSlideImage) return; // If the image is not found, exit the function

  // Media query to detect screen size
  const mediaQuery = window.matchMedia('(min-width: 768px)');

  // Apply class based on screen size
  if (mediaQuery.matches) {
    // For screens over 768px
    swiperNextSlideImage.closest('.swiper-slide').classList.remove('swiper-slide-active');
  } else {
    // For screens under 768px, use swiper-slide-active

    //Commenting for now because the proper image on mobile is not the first slide
    
   /*  swiperNextSlideImage.closest('.swiper-slide').classList.add('swiper-slide-active');
    swiperNextSlideImage.closest('.swiper-slide').classList.remove('swiper-slide-next'); */

    let properImageMobile = document.querySelectorAll('.swiper-slide.product-carousel__item img')[1];

    properImageMobile.closest('.swiper-slide').classList.add('swiper-slide-active');
    properImageMobile.closest('.swiper-slide').classList.remove('swiper-slide-next');
  }
}

// Function to handle scroll-based animation for the element with the active class
function handleScrollAnimation() {
  // Detect the current swiper-slide element based on screen size
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  let swiperSlide;

  // Remove animation effects from all swiper slides to prevent conflicts
  const allSwiperSlides = document.querySelectorAll('.swiper-slide.product-carousel__item img');
  allSwiperSlides.forEach(slide => {
    slide.style.transform = '';  // Reset the transform for all slides
  });

  if (mediaQuery.matches) {
    // Target the element with .swiper-slide-next for larger screens
    swiperSlide = document.querySelector('.swiper-slide.product-carousel__item.swiper-slide-next img');
  } else {
    // Target the element with .swiper-slide-active for smaller screens
    swiperSlide = document.querySelector('.swiper-slide.product-carousel__item.swiper-slide-active img');
  }

  // If no swiperSlide is found, exit the function
  if (!swiperSlide) return;

  const swiperWrapper = document.querySelector('.swiper-wrapper');

  // Get the distance scrolled from the top
  const scrollPosition = window.scrollY || window.pageYOffset;

  // Start the animation only after scrolling 20px
  const startScroll = 20;

  // Define the trigger scroll point (you can adjust this for a smoother animation)
  const triggerPoint = 300; // Adjust this value based on how fast you want the animation

  // Only apply the animation if the scroll position is greater than the start point
  if (scrollPosition > startScroll) {
    // Calculate scale factor and translation based on scroll distance
    let scaleFactor = 3 - ((scrollPosition - startScroll) / triggerPoint); // Scaling from 3 to 1
    let translateY = 2 + (-2 * ((scrollPosition - startScroll) / triggerPoint)); // Moving from 2px to 0px

    // Clamp the values so they don’t go below the minimum
    if (scaleFactor < 1.5) scaleFactor = 1.5;
    if (translateY < 0) translateY = 0;

    // Apply the transform based on scroll position only to the targeted element
    swiperSlide.style.transform = `scale(${scaleFactor}) translateY(${translateY}px)`;

    // Optionally, add a 'scrolled' class to the parent to manage other styling when scrolling starts
    swiperWrapper.classList.add('scrolled');
  } else {
    // If we are less than the startScroll, keep the initial transform
    swiperSlide.style.transform = `scale(3) translateY(2px)`;
    swiperWrapper.classList.remove('scrolled');
  }
}

// Add event listener for window resize to apply the correct swiper class
window.addEventListener('resize', applySwiperClass);

// Add event listener for scroll to handle animation
window.addEventListener('scroll', handleScrollAnimation);

// Call the functions on page load
applySwiperClass();
handleScrollAnimation();



