/* ==========================================================================
   IN //fluency — shared site behaviour
   Nav shadow, full-screen menu, scroll reveal, waitlist form.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------ sticky nav --- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --------------------------------------------------- overlay menu ---- */
  var menu = document.getElementById('menu');
  var menuBtn = document.getElementById('menuBtn');
  var menuClose = document.getElementById('menuClose');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    // Next frame so the transform transition actually runs.
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (menuClose) menuClose.focus();
  }

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, 380);
    if (menuBtn) menuBtn.focus();
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      if (menu && menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
  }
  if (menuClose) menuClose.addEventListener('click', closeMenu);

  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) closeMenu();
  });

  /* -------------------------------------------------- scroll reveal ---- */
  var revealables = document.querySelectorAll(
    '.section-head, .card, .journey__row, .stat, .quote, .panel, .progress-strip'
  );

  if ('IntersectionObserver' in window && revealables.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    revealables.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
      io.observe(el);
    });
  }

  /* ------------------------------------------------------ waitlist ----- */
  var form = document.getElementById('waitlistForm');
  var msg = document.getElementById('waitlistMsg');

  function say(text, kind) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'form-msg is-visible form-msg--' + kind;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var role = form.elements.role.value;

      if (!name) { say('Add your name so we know who to save the seat for.', 'err'); form.elements.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('That email looks off — mind checking it?', 'err'); form.elements.email.focus(); return; }
      if (!role) { say('Pick the role that fits closest.', 'err'); form.elements.role.focus(); return; }

      // Static site: nothing to POST to. Persist locally so the demo feels real.
      try {
        localStorage.setItem('ff.waitlist', JSON.stringify({
          name: name, email: email, role: role,
          cohort: form.elements.cohort.value,
          task: form.elements.task.value.trim(),
          at: new Date().toISOString()
        }));
      } catch (err) { /* private mode — not worth failing over */ }

      say('You’re on the list, ' + name.split(' ')[0] + '. Watch for a confirmation and your time-audit pre-work.', 'ok');
      form.querySelector('button[type="submit"]').disabled = true;
    });
  }

  /* ---------------------------------------------------------- misc ----- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
