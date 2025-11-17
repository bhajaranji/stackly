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



// FAQ Accordion: smooth height animation + accessible toggles
(function(){
  const list = document.querySelectorAll('.faq-item');
  if(!list.length) return;

  // Set to true if you want only one open at a time
  const singleOpen = false;

  list.forEach(item => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');

    // ensure panel has aria attributes correctly (hidden initially)
    panel.hidden = true;

    // click handler
    btn.addEventListener('click', () => toggle(item, btn, panel));
    // keyboard (Enter/Space)
    btn.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(item, btn, panel);
      }
    });
  });

  function toggle(item, btn, panel) {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      close(panel, btn);
    } else {
      if(singleOpen) {
        // close others
        document.querySelectorAll('.faq-item .faq-q[aria-expanded="true"]').forEach(openBtn=>{
          const parent = openBtn.closest('.faq-item');
          const openPanel = parent.querySelector('.faq-a');
          close(openPanel, openBtn);
        });
      }
      open(panel, btn);
    }
  }

  function open(panel, btn) {
    // prepare
    panel.hidden = false;
    const height = panel.scrollHeight;
    panel.style.height = '0px';
    panel.style.opacity = '0';
    panel.classList.add('showing');

    // force reflow before animating
    requestAnimationFrame(() => {
      panel.style.transition = 'height 320ms cubic-bezier(.22,.9,.3,1), opacity 220ms ease';
      panel.style.height = height + 'px';
      panel.style.opacity = '1';
    });

    // cleanup after animation
    const tidy = () => {
      panel.style.height = 'auto';
      panel.style.transition = '';
      panel.classList.remove('showing');
      panel.removeEventListener('transitionend', tidy);
    };
    panel.addEventListener('transitionend', tidy);

    btn.setAttribute('aria-expanded', 'true');
  }

  function close(panel, btn) {
    // set fixed height then animate to 0
    const height = panel.scrollHeight;
    panel.style.height = height + 'px';
    panel.style.opacity = '1';

    requestAnimationFrame(() => {
      panel.style.transition = 'height 260ms cubic-bezier(.2,.9,.3,1), opacity 200ms ease';
      panel.style.height = '0px';
      panel.style.opacity = '0';
    });

    const tidy = () => {
      panel.hidden = true;
      panel.style.transition = '';
      panel.style.height = '';
      panel.style.opacity = '';
      panel.removeEventListener('transitionend', tidy);
    };
    panel.addEventListener('transitionend', tidy);

    btn.setAttribute('aria-expanded', 'false');
  }

  // optional: reveal items on scroll with IntersectionObserver
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((e, i) => {
      if(e.isIntersecting) {
        e.target.style.transition = `opacity 420ms ease ${ (parseInt(e.target.dataset.index||0) * 60) }ms, transform 420ms cubic-bezier(.2,.9,.3,1) ${ (parseInt(e.target.dataset.index||0) * 60) }ms`;
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.faq-item').forEach((it, idx) => {
    it.style.opacity = '0';
    it.style.transform = 'translateY(8px)';
    it.dataset.index = idx;
    observer.observe(it);
  });

  // Respect reduced motion preference
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(mq.matches) {
    document.querySelectorAll('.faq-item').forEach(it => {
      it.style.transition = 'none';
      it.style.opacity = '1';
      it.style.transform = 'none';
    });
  }

})();



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
