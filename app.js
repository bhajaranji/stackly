// script.js - final robust header interactions (desktop + mobile)
(function() {
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobileOverlay');
  const mobileClose = document.getElementById('mobileClose');

  // ---------- Mobile overlay handlers ----------
  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (hamburger) {
      hamburger.querySelectorAll('.lines span').forEach((s, i) => {
        if (i === 0) s.style.transform = 'translateY(7px) rotate(45deg)';
        if (i === 1) s.style.opacity = '0';
        if (i === 2) s.style.transform = 'translateY(-7px) rotate(-45deg)';
      });
    }
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (hamburger) {
      hamburger.querySelectorAll('.lines span').forEach((s) => {
        s.style.transform = '';
        s.style.opacity = '';
      });
    }
  }

  if (hamburger) hamburger.addEventListener('click', () => {
    const isOpen = overlay && overlay.classList.contains('open');
    if (isOpen) closeOverlay(); else openOverlay();
  });
  if (mobileClose) mobileClose.addEventListener('click', closeOverlay);
  if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
  }

  // ESC closes everything
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
      document.querySelectorAll('.nav-desktop li.open').forEach(li => li.classList.remove('open'));
    }
  });

  // Mobile accordion toggles
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = btn.closest('.item');
      if (!parent) return;
      parent.classList.toggle('open');
    });
  });
  document.querySelectorAll('[data-subtoggle]').forEach(st => {
    st.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = st.closest('.sub-item');
      if (!parent) return;
      parent.classList.toggle('open');
    });
  });

  // ---------- Desktop click-to-toggle dropdowns with reliable pointer handling ----------
  (function desktopDropdowns() {
    const desktopNav = document.querySelector('.nav-desktop');
    if (!desktopNav) return;
    const topParents = Array.from(desktopNav.querySelectorAll(':scope > ul > li'));

    const CLOSE_DELAY = 1500    ; // ms - long enough to avoid flash
    const closeTimers = new WeakMap();

    function clearCloseTimer(li) {
      const t = closeTimers.get(li);
      if (t) {
        clearTimeout(t);
        closeTimers.delete(li);
      }
    }
    function startCloseTimer(li) {
      clearCloseTimer(li);
      const timer = setTimeout(() => {
        li.classList.remove('open');
        closeTimers.delete(li);
      }, CLOSE_DELAY);
      closeTimers.set(li, timer);
    }

    topParents.forEach(li => {
      const trigger = li.querySelector('a[aria-haspopup="true"], a');
      const dropdown = li.querySelector('.dropdown');
      if (!trigger || !dropdown) return;

      // click toggles
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = li.classList.contains('open');
        // close others
        topParents.forEach(other => { if (other !== li) other.classList.remove('open'); });
        if (isOpen) li.classList.remove('open'); else {
          li.classList.add('open');
          const first = dropdown.querySelector('a, button');
          if (first) first.focus();
        }
      });

      // keyboard
      trigger.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          li.classList.add('open');
          const first = dropdown.querySelector('a, button');
          if (first) first.focus();
        }
      });

      // stop clicks inside dropdown from bubbling up
      dropdown.addEventListener('click', function(e) { e.stopPropagation(); });

      // pointer events: cancel timer on enter, start on leave
      li.addEventListener('pointerenter', function() { clearCloseTimer(li); });
      li.addEventListener('pointerleave', function() { if (li.classList.contains('open')) startCloseTimer(li); });

      dropdown.addEventListener('pointerenter', function() { clearCloseTimer(li); });
      dropdown.addEventListener('pointerleave', function() { if (li.classList.contains('open')) startCloseTimer(li); });

      // touchstart to cancel timers on touch devices
      trigger.addEventListener('touchstart', function() { clearCloseTimer(li); });
      dropdown.addEventListener('touchstart', function() { clearCloseTimer(li); });
    });

    // clicking outside nav closes all
    document.addEventListener('click', function(e) {
      const inside = e.target.closest('.nav-desktop');
      if (!inside) topParents.forEach(li => li.classList.remove('open'));
    });
  })();

  // fallback to guarantee hamburger/nav visibility
  (function mobileNavFallback() {
    const nav = document.querySelector('.nav-desktop');
    const hamb = document.querySelector('.hamburger');
    if (!nav || !hamb) return;
    function apply() {
      if (window.innerWidth <= 900) { nav.style.display = 'none'; hamb.style.display = 'flex'; }
      else { nav.style.display = ''; hamb.style.display = ''; }
    }
    window.addEventListener('resize', apply);
    window.addEventListener('load', apply);
    apply();
  })();

})();




/* Robust single script to reliably attempt autoplay for the bg video.
   - Does NOT reference any missing controls.
   - Respects prefers-reduced-motion and small-device data-savings.
   - Logs helpful messages to console for debugging. */
(function(){
  const video = document.getElementById('bgVideo');
  if (!video) {
    console.warn('bgVideo element not found.');
    return;
  }

  // Helper: try to play and report result
  async function tryPlayVideo() {
    try {
      await video.play();
      console.log('Background video playing (autoplay succeeded).');
    } catch (err) {
      console.warn('Autoplay blocked or failed:', err);
      // video stays paused — that's OK on some browsers/devices
    }
  }

  // 1) Respect user's reduced motion preference
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    console.log('prefers-reduced-motion is set — video will remain paused.');
    video.pause();
    video.removeAttribute('autoplay');
    return;
  }

  // 2) For small devices, avoid forcing autoplay (saves data)
  const smallDevice = window.matchMedia && window.matchMedia('(max-width:560px)').matches;
  if (smallDevice) {
    console.log('Small device detected — pausing background video to save bandwidth.');
    video.pause();
    // keep poster visible; do NOT remove autoplay attribute so users with desktop UA overrides still autoplay
    return;
  }

  // 3) If video element has a poster and is ready, attempt to play after DOM ready
  function onReadyTryPlay() {
    // If metadata hasn't loaded, wait for 'loadedmetadata' to ensure dimensions/codec ready
    if (video.readyState >= 2) return tryPlayVideo();
    const onLoaded = () => { video.removeEventListener('loadedmetadata', onLoaded); tryPlayVideo(); };
    video.addEventListener('loadedmetadata', onLoaded);
    // also set a timeout fallback in case loadedmetadata doesn't fire
    setTimeout(() => {
      if (video.paused) tryPlayVideo();
    }, 800);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') onReadyTryPlay();
  else document.addEventListener('DOMContentLoaded', onReadyTryPlay);

  // 4) If the video fails to load due to network issues, provide debugging info
  video.addEventListener('error', (e) => {
    console.error('Video element error:', e);
    // Show a visual fallback if you want: add a CSS class, notify user, etc.
  });

  // Optional: pause video when user scrolls far away to reduce CPU/battery
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > window.innerHeight && !video.paused) {
          video.pause();
          console.log('Paused bg video to save CPU (scrolled away).');
        } else if (window.scrollY <= window.innerHeight && video.paused) {
          // try resume only if autoplay likely allowed
          tryPlayVideo();
        }
        ticking = false;
      });
      ticking = true;
    }
  });
})();



(function(){
  const hero = document.querySelector('.about-hero');
  const inner = document.querySelector('.about-inner');
  const pill  = document.querySelector('.about-box');
  const us    = document.querySelector('.about-us');

  if (!hero || !inner) return;

  // Don't animate if user requests reduced motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    inner.classList.add('inview');
    pill && pill.classList.add('inview');
    us && us.classList.add('inview');
    return;
  }

  // IntersectionObserver to trigger when visible
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          inner.classList.add('inview');
          pill && pill.classList.add('inview');
          us && us.classList.add('inview');
          // small delay to start bg pan for nicer effect
          setTimeout(()=> hero.classList.add('animate-bg'), 220);
          obs.disconnect();
        }
      });
    }, { threshold: 0.12 });
    io.observe(hero);
  } else {
    // fallback: just add classes after DOM ready
    document.addEventListener('DOMContentLoaded', () => {
      inner.classList.add('inview');
      pill && pill.classList.add('inview');
      us && us.classList.add('inview');
      hero.classList.add('animate-bg');
    });
  }
})();






// Simple lazy loader + staggered reveal animation
document.addEventListener('DOMContentLoaded', function(){
const cards = document.querySelectorAll('.service-card');
cards.forEach((card, i)=>{
const delay = Number(card.getAttribute('data-delay')) || (i*80);
// stagger reveal
setTimeout(()=> card.classList.add('visible'), delay);


// lazy-load image
const img = card.querySelector('img[data-src]');
if(img){
const real = img.getAttribute('data-src');
const tmp = new Image();
tmp.onload = ()=> img.src = real;
tmp.src = real;
}
});
});


// testimonials.js
// Simple autoplay slider (right -> left) that advances one slide at a time.
// Uses a cloned first slide to make the loop seamless.

(function () {
  const viewport = document.getElementById('testimonialViewport');
  const track = document.getElementById('testimonialTrack');
  let slides = Array.from(track.children);
  if (slides.length === 0) return;

  // clone first slide and append - used to create continuous transition
  const firstClone = slides[0].cloneNode(true);
  firstClone.classList.add('clone');
  track.appendChild(firstClone);

  let index = 0;
  const slideCount = slides.length; // original count (6)
  const interval = 1500; // ms between moves
  let timer = null;
  let isPaused = false;

  function goToIndex(i) {
    track.style.transition = 'transform 0.6s ease';
    track.style.transform = `translateX(-${i * 100}%)`;
  }

  function next() {
    index++;
    goToIndex(index);
    // if moved to clone (index === slideCount), wait for transitionend then snap to 0
    if (index === slideCount) {
      track.addEventListener('transitionend', onTransitionEnd);
    }
  }

  function onTransitionEnd() {
    // remove transition to snap back
    track.style.transition = 'none';
    index = 0;
    track.style.transform = `translateX(0)`;
    // force reflow then re-enable transition for next moves
    void track.offsetWidth;
    track.style.transition = 'transform 0.6s ease';
    track.removeEventListener('transitionend', onTransitionEnd);
  }

  function start() {
    timer = setInterval(()=> {
      if (!isPaused) next();
    }, interval);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  // Pause on hover for usability
  const container = document.querySelector('.testimonial-viewport');
  container.addEventListener('mouseenter', () => { isPaused = true; });
  container.addEventListener('mouseleave', () => { isPaused = false; });

  // start autoplay
  start();

  // optional: visibility change stop when tab hidden (saves CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isPaused = true;
    } else {
      isPaused = false;
    }
  });

})();



// Small UX touches: keyboard focus ripple and accessible hover effect
document.addEventListener('DOMContentLoaded', function(){

  // Add keyboard focus outline on buttons for accessibility
  document.querySelectorAll('.btn').forEach(btn=>{
    btn.addEventListener('focus', ()=> btn.classList.add('focus'));
    btn.addEventListener('blur', ()=> btn.classList.remove('focus'));
  });

  // Simple image lazy-ish effect (fade in when in view)
  const imgs = document.querySelectorAll('.product-card .media img');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.transition = 'opacity 700ms ease, transform 700ms ease';
        e.target.style.opacity = '1';
        obs.unobserve(e.target);
      }
    });
  }, {threshold: 0.2});

  imgs.forEach(img=>{
    img.style.opacity = '0';
    obs.observe(img);
  });

});




// Contact form client-side behavior
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const mailtoBtn = document.getElementById('mailtoBtn');
  const formMessage = document.getElementById('formMessage');

  // Basic validators
  function isEmail(v){ return /\S+@\S+\.\S+/.test(v); }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    formMessage.textContent = '';

    const data = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      project: form.project.value.trim(),
      budget: form.budget.value.trim(),
      date: form.date.value,
      consent: form.consent.checked,
    };

    // validation
    let hasError = false;
    if(!data.name){ showError('err-name','Please enter your name'); hasError = true; }
    if(!data.email || !isEmail(data.email)){ showError('err-email','Please enter a valid email'); hasError = true; }

    if(hasError) return;

    // If action is "#" or missing, use mailto fallback
    const action = form.getAttribute('action') || '#';
    if(action === '#' || action === '' || action === '/contact' && !window._hasServer) {
      // prepare mailto
      const subject = encodeURIComponent(`Stackly inquiry from ${data.name}`);
      const body = encodeURIComponent(
        `Name: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\nPhone: ${data.phone}\nBudget: ${data.budget}\nDesired delivery: ${data.date}\n\nProject details:\n${data.project}`
      );
      // open user's mail client
      window.location.href = `mailto:info@stackly.example?subject=${subject}&body=${body}`;
      return;
    }

    // Otherwise try to POST to your endpoint (action)
    try {
      const resp = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(data),
      });
      if(resp.ok) {
        success('Thanks — we received your inquiry. We will contact you shortly.');
        form.reset();
      } else {
        const text = await resp.text().catch(()=>null);
        error('Sorry, something went wrong. Please try again or email us directly.');
        console.error('Contact form error', resp.status, text);
      }
    } catch(err) {
      console.error(err);
      error('Network error. Please try again or use "Open email client" button.');
    }
  });

  // Open email client fallback
  mailtoBtn.addEventListener('click', () => {
    const name = form.name.value.trim() || 'Customer';
    const body = encodeURIComponent(`Hello Stackly,\n\nI would like to enquire about... \n\nRegards,\n${name}`);
    window.location.href = `mailto:info@stackly.example?subject=${encodeURIComponent('Inquiry from ' + name)}&body=${body}`;
  });

  function showError(id, msg){
    const el = document.getElementById(id);
    if(el) el.textContent = msg;
  }
  function clearErrors(){
    document.querySelectorAll('.error').forEach(e=> e.textContent = '');
    formMessage.textContent = '';
  }
  function success(msg){
    formMessage.style.color = '#c7f464';
    formMessage.textContent = msg;
  }
  function error(msg){
    formMessage.style.color = '#ffb4b4';
    formMessage.textContent = msg;
  }
});





 // HERO SECTION JS
(function(){
  const light = document.querySelector('.hero-light');
  const hero = document.querySelector('.hero-section');

  // PARALLAX ONLY ON DESKTOP
  const isTouch = ('ontouchstart' in window);
  if(!isTouch && hero && light){
    hero.addEventListener('mousemove', (e)=>{
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;

      const tx = (px - 0.5) * 40;
      const ty = (py - 0.5) * 30;

      light.style.transform = `translate(${tx}px, ${ty}px)`;
    });

    hero.addEventListener('mouseleave', ()=>{
      light.style.transform = `translate(0,0)`;
    });
  }

  // BUTTON ACTIONS
  const viewBtn = document.getElementById('heroViewProjects');
  const sampleBtn = document.getElementById('heroRequestSample');

  // Scroll to projects
  if(viewBtn){
    viewBtn.addEventListener('click', ()=>{
      const section = document.getElementById('projects');
      if(section){
        section.scrollIntoView({behavior:"smooth"});
      }
    });
  }

  // Note: DO NOT use the fragile single-line open here.
  // The robust sample-panel controller below will wire heroRequestSample automatically.
})();

// Robust Sample / Quote slide-in panel controller
(function(){
  if (window.__stacklySamplePanelInit) return;
  window.__stacklySamplePanelInit = true;

  const panel = document.getElementById('sample-panel');
  if (!panel) return;

  const openClass = 'open';
  const inner = panel.querySelector('.sample-inner');
  const closeBtn = document.getElementById('sample-close');
  const cancelBtn = document.getElementById('sample-cancel');
  const form = document.getElementById('sample-form');
  const feedback = document.getElementById('sample-feedback');
  let lastActive = null;

  // lock / unlock body scroll
  function lockScroll(){ document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }
  function unlockScroll(){ document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }

  // focusable selector for simple focus trap
  const FOCUS_SELECTORS = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    if (!panel.classList.contains(openClass)) return;
    const focusable = Array.from(panel.querySelectorAll(FOCUS_SELECTORS)).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    if (!panel.contains(document.activeElement)) {
      focusable[0].focus();
      return;
    }
    if (e.key === 'Tab') {
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey && idx === 0) {
        e.preventDefault();
        focusable[focusable.length -1].focus();
      } else if (!e.shiftKey && idx === focusable.length -1) {
        e.preventDefault();
        focusable[0].focus();
      }
    }
  }

  function openSample() {
    if (panel.classList.contains(openClass)) return;
    lastActive = document.activeElement;
    panel.classList.add(openClass);
    panel.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(()=> {
      const first = panel.querySelector(FOCUS_SELECTORS);
      if (first) first.focus();
    }, 120);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focus', onDocumentFocus, true);
  }

  function closeSample() {
    if (!panel.classList.contains(openClass)) return;
    panel.classList.remove(openClass);
    panel.setAttribute('aria-hidden', 'true');
    unlockScroll();
    if (lastActive && lastActive.focus) lastActive.focus();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('focus', onDocumentFocus, true);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSample();
      return;
    }
    if (e.key === 'Tab') trapFocus(e);
  }

  function onDocumentFocus(e){
    if (!panel.classList.contains(openClass)) return;
    if (!panel.contains(e.target)) {
      e.stopPropagation();
      const first = panel.querySelector(FOCUS_SELECTORS);
      if (first) first.focus();
    }
  }

  // close when clicking on overlay background only
  panel.addEventListener('click', function(e){
    if (e.target === panel) {
      if (e._sampleHandled) return;
      closeSample();
    }
  });

  // stop inner clicks from bubbling
  if (inner) inner.addEventListener('click', (e)=> e.stopPropagation());

  // close buttons
  if (closeBtn) closeBtn.addEventListener('click', (e)=> { e.preventDefault(); closeSample(); });
  if (cancelBtn) cancelBtn.addEventListener('click', (e)=> { e.preventDefault(); closeSample(); });

  // wire any [data-open-sample] buttons and legacy heroRequestSample
  document.querySelectorAll('[data-open-sample]').forEach(el=>{
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      openSample();
    });
  });
  const legacyOpen = document.getElementById('heroRequestSample');
  if (legacyOpen) legacyOpen.addEventListener('click', (e)=> { e.preventDefault(); openSample(); });

  // handle form submit safely (no navigation)
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const formData = new FormData(form);
      const name = (formData.get('name') || '').toString().trim();
      const email = (formData.get('email') || '').toString().trim();
      if (!name || !email) {
        if (feedback) { feedback.textContent = 'Please fill name and email.'; feedback.style.color = '#ffb4b4'; }
        return;
      }
      if (feedback) { feedback.textContent = 'Request sent — we will contact you shortly.'; feedback.style.color = '#c7f464'; }
      setTimeout(()=> {
        form.reset();
        closeSample();
      }, 900);
    });
  }

  // MutationObserver: protect panel from accidental aria-hidden toggles by other scripts
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'aria-hidden') {
        const attr = panel.getAttribute('aria-hidden');
        if (panel.classList.contains(openClass) && attr === 'true') {
          panel.setAttribute('aria-hidden','false');
        }
      }
    });
  });
  mo.observe(panel, { attributes: true });

  // expose API for debugging/programmatic control
  window.stacklySample = { open: openSample, close: closeSample, panel };

})();








/* Robust single-run FAQ accordion.
   Replace the old inline script with this. Make sure the same code is NOT also in app.js. */
(function(){
  // guard to avoid double initialization if this file accidentally loads twice
  if (window.__stacklyFaqInit) return;
  window.__stacklyFaqInit = true;

  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  const singleOpen = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  items.forEach((item, idx) => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');

    // defensive checks
    if (!btn || !panel) return;

    // ensure ids and aria-controls are present
    if (!panel.id) panel.id = `faq-panel-${idx}`;
    if (!btn.id) btn.id = `faq-btn-${idx}`;
    btn.setAttribute('aria-controls', panel.id);

    // initial attributes
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    panel.style.overflow = 'hidden'; // important for height animation

    // prevent double-binding (in case script runs twice)
    if (btn.dataset.faqInit === '1') return;
    btn.dataset.faqInit = '1';

    // click
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggle(item, btn, panel);
    });

    // keyboard: Enter or Space
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggle(item, btn, panel);
      }
    });

    // prepare reveal-on-scroll visuals (optional)
    item.style.opacity = '0';
    item.style.transform = 'translateY(8px)';
    item.dataset.index = idx;
  });

  function toggle(item, btn, panel) {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen) return close(panel, btn);
    if (singleOpen) {
      document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(openBtn => {
        const parent = openBtn.closest('.faq-item');
        const openPanel = parent && parent.querySelector('.faq-a');
        if (openPanel && openBtn !== btn) close(openPanel, openBtn);
      });
    }
    open(panel, btn);
  }

  function open(panel, btn) {
    if (reduced) { // instant mode
      panel.hidden = false;
      panel.style.height = 'auto';
      panel.style.opacity = '';
      panel.style.overflow = '';
      btn.setAttribute('aria-expanded', 'true');
      return;
    }

    panel.hidden = false;               // make visible so scrollHeight works
    panel.style.overflow = 'hidden';
    panel.style.height = '0px';
    panel.style.opacity = '0';

    // read natural height after visible
    const full = panel.scrollHeight;

    // animate to full height
    requestAnimationFrame(() => {
      panel.style.transition = 'height 320ms cubic-bezier(.22,.9,.3,1), opacity 220ms ease';
      panel.style.height = full + 'px';
      panel.style.opacity = '1';
    });

    // tidy only once, and only when the height transition ends
    const tidy = (ev) => {
      if (ev && ev.propertyName && ev.propertyName !== 'height') return;
      panel.style.height = 'auto';
      panel.style.transition = '';
      panel.style.overflow = '';
    };
    panel.addEventListener('transitionend', tidy, { once: true });

    btn.setAttribute('aria-expanded', 'true');
  }

  function close(panel, btn) {
    if (reduced) {
      panel.hidden = true;
      panel.style.height = '';
      panel.style.opacity = '';
      panel.style.overflow = '';
      btn.setAttribute('aria-expanded', 'false');
      return;
    }

    // lock height then animate to zero
    const full = panel.scrollHeight;
    panel.style.height = full + 'px';
    panel.style.opacity = '1';
    panel.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      panel.style.transition = 'height 260ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease';
      panel.style.height = '0px';
      panel.style.opacity = '0';
    });

    const tidy = (ev) => {
      if (ev && ev.propertyName && ev.propertyName !== 'height') return;
      panel.hidden = true;
      panel.style.transition = '';
      panel.style.height = '';
      panel.style.opacity = '';
      panel.style.overflow = '';
    };
    panel.addEventListener('transitionend', tidy, { once: true });

    btn.setAttribute('aria-expanded', 'false');
  }

  // reveal-on-scroll (optional)
  if ('IntersectionObserver' in window && !reduced) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = (parseInt(e.target.dataset.index || 0) * 60);
          e.target.style.transition = `opacity 420ms ease ${delay}ms, transform 420ms cubic-bezier(.2,.9,.3,1) ${delay}ms`;
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.faq-item').forEach(it => observer.observe(it));
  } else {
    document.querySelectorAll('.faq-item').forEach(it => {
      it.style.opacity = '1';
      it.style.transform = 'none';
    });
  }
})();
