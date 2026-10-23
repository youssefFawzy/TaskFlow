document.addEventListener('DOMContentLoaded', function () {

  // ─── Apply saved theme ─────────────────────────────────────────────
  applyTheme();

  // ─── Scroll reveal ─────────────────────────────────────────────────
  // Every element with class "reveal" fades up when it enters the screen.
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // only animate once
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(function (element) {
    observer.observe(element);
  });

  // ─── Header background on scroll ──────────────────────────────────
  const header = document.getElementById('site-header');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ─── Mobile nav toggle ─────────────────────────────────────────────
  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close the menu when a link is clicked
    siteNav.querySelectorAll('.site-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  // ─── Count-up animation for stats ─────────────────────────────────
  // <strong data-count="7">0</strong>  →  counts from 0 to 7
  // <strong data-count="100" data-suffix="%">0</strong>  →  counts to 100%
  const counters = document.querySelectorAll('[data-count]');

  const counterObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);

      const element = entry.target;
      const target = parseInt(element.dataset.count, 10);
      const suffix = element.dataset.suffix || '';
      const duration = 1500; // milliseconds
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out (starts fast, ends slow)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        element.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }, { threshold: 0.5 });

  counters.forEach(function (counter) {
    counterObserver.observe(counter);
  });

  // ─── Footer year ───────────────────────────────────────────────────
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // ─── Smooth scroll for anchor links ────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
