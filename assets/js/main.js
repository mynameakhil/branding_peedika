/* ==========================================================================
   Branding Peedika — site behaviour
   --------------------------------------------------------------------------
   Vanilla ES6+. No dependencies. Every feature degrades gracefully:
   the page content is complete in the initial HTML response and works
   without JavaScript.
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = window.BP_CONFIG || {};
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------------- */
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function on(eventName, handler, element) {
    (element || document).addEventListener(eventName, handler, { passive: eventName === 'scroll' });
  }

  /* ---------------------------------------------------------------------
     1. Inject configured business details
        Any element with data-bp="email|phone|whatsapp|address|hours|tagline"
        gets its text (and href for links) filled in at runtime.
     --------------------------------------------------------------------- */
  function buildHref(type, value) {
    if (!value) return '';
    if (type === 'email') return 'mailto:' + value;
    if (type === 'phone') return 'tel:' + value.replace(/[^\d+]/g, '');
    if (type === 'whatsapp') return 'https://wa.me/' + value.replace(/\D/g, '');
    return value;
  }

  function hydrateConfig() {
    var map = {
      email: CONFIG.email,
      phone: CONFIG.phone,
      whatsapp: CONFIG.whatsapp,
      address: CONFIG.address,
      hours: CONFIG.businessHours,
      tagline: CONFIG.tagline,
      businessName: CONFIG.businessName
    };

    $$('[data-bp]').forEach(function (el) {
      var key = el.getAttribute('data-bp');
      var value = map[key];
      if (!value) {
        /* An unconfigured value must not behave like a live link: an
           <a href="#"> would jump to the top of the page when clicked and
           would announce a destination it does not have. */
        if (el.tagName === 'A' && el.getAttribute('href') === '#') {
          el.removeAttribute('href');
        }
        return;
      }

      if (el.tagName === 'A') {
        var href = buildHref(key, value);
        if (href) {
          if (el.getAttribute('href') !== href) el.setAttribute('href', href);
          /* The visible text has to match the destination. Otherwise the
             link would still read "Email address to be configured" while
             opening a real address. */
          if (el.textContent.trim() !== value) el.textContent = value;
        }
        return;
      }
      /* Writing the same text again would replace the text node for no
         reason and invalidate the style of the whole block. */
      if (el.textContent !== value) el.textContent = value;
    });

    /* Social links: hide the row entirely until profiles are configured. */
    var socialLinks = $$('[data-bp-social]');
    socialLinks.forEach(function (el) {
      var url = CONFIG.social && CONFIG.social[el.getAttribute('data-bp-social')];
      if (url) {
        el.setAttribute('href', url);
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
        if (el.hidden) el.hidden = false;
      } else if (!el.hidden) {
        el.hidden = true;
      }
    });

    /* An empty row of icons is just a gap, so the list itself goes too. */
    var socialList = $('.social');
    if (socialList && socialLinks.length) {
      var anyVisible = socialLinks.some(function (el) { return !el.hidden; });
      socialList.hidden = !anyVisible;
    }

    /* "Copy email address" only makes sense once there is an address. */
    $$('[data-copy-email]').forEach(function (button) {
      if (!CONFIG.email) button.hidden = true;
    });

    /* WhatsApp floating button: only show once a number exists. */
    var waCtas = $$('[data-bp-whatsapp-cta]');
    waCtas.forEach(function (el) {
      if (!CONFIG.whatsapp) {
        if (!el.hidden) el.hidden = true;
        return;
      }
      el.setAttribute('href', 'https://wa.me/' + CONFIG.whatsapp.replace(/\D/g, ''));
      if (el.hidden) el.hidden = false;
    });

    /* Copyright year */
    var year = String(new Date().getFullYear());
    $$('[data-bp-year]').forEach(function (el) {
      if (el.textContent !== year) el.textContent = year;
    });
  }

  /* ---------------------------------------------------------------------
     2. Mobile navigation
     --------------------------------------------------------------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    var openPanel = $('.nav-submenu', nav);

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      var label = $('[data-nav-label]', toggle);
      if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    }

    on('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    on('keydown', function (event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Close the panel when the viewport grows to the desktop layout. */
    var mq = window.matchMedia('(min-width: 1024px)');
    var onChange = function (e) {
      if (e.matches) setOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    /* Services dropdown trigger — works on every breakpoint. */
    var trigger = $('.nav-item__trigger', nav);
    if (trigger && openPanel) {
      var mqDesktop = window.matchMedia('(min-width: 1024px)');

      /* The submenu is open by default in the small-screen menu and closed
         on the desktop (where it opens on hover or focus). The button has
         to start from the matching state, otherwise a screen reader is told
         "collapsed" about a list that is on screen. */
      function syncTrigger() {
        trigger.setAttribute('aria-expanded', mqDesktop.matches ? 'false' : 'true');
      }
      syncTrigger();

      trigger.addEventListener('click', function () {
        var expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        /* On the desktop the panel is opened by the .is-open class, so the
           hidden attribute is only used for the small-screen menu. */
        if (!mqDesktop.matches) openPanel.hidden = expanded;
        var parent = trigger.parentNode;
        if (parent) parent.classList.toggle('is-open', !expanded);
      });

      /* Follow the breakpoint when the window is resized. */
      var onDesktopChange = function () {
        syncTrigger();
        openPanel.hidden = false;
        var parent = trigger.parentNode;
        if (parent) parent.classList.remove('is-open');
      };
      if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onDesktopChange);
      else if (mqDesktop.addListener) mqDesktop.addListener(onDesktopChange);
    }

    /* Close the mobile panel after following an in-page link. */
    $$('a[href]', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 1024) setOpen(false);
      });
    });
  }

  /* ---------------------------------------------------------------------
     3. Sticky header state (no layout shift — only shadow + border change)
     --------------------------------------------------------------------- */
  function initStickyHeader() {
    var header = $('.site-header');
    if (!header) return;
    var ticking = false;
    var stuck = false;

    function apply(next) {
      /* Only touch the class when it actually changes: an unnecessary class
         toggle invalidates the header's style for no reason. */
      if (next === stuck) return;
      stuck = next;
      header.classList.toggle('is-stuck', next);
    }

    function update() {
      ticking = false;
      apply(window.scrollY > 12);
    }

    on('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, window);

    /* Reading window.scrollY makes the browser lay the page out, so the first
       check is deferred to the next frame. Doing it inside the script task
       would force a synchronous layout and delay the first paint. */
    window.requestAnimationFrame(update);
  }

  /* ---------------------------------------------------------------------
     4. Accordion (FAQ)
     --------------------------------------------------------------------- */
  function initAccordions() {
    $$('[data-accordion]').forEach(function (root) {
      var single = root.getAttribute('data-accordion') === 'single';
      var triggers = $$('.accordion__trigger', root);

      triggers.forEach(function (trigger) {
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!panel) return;

        trigger.addEventListener('click', function () {
          var expanded = trigger.getAttribute('aria-expanded') === 'true';

          if (single && !expanded) {
            triggers.forEach(function (other) {
              if (other === trigger) return;
              var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
              other.setAttribute('aria-expanded', 'false');
              if (otherPanel) otherPanel.hidden = true;
            });
          }

          trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          panel.hidden = expanded;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     5. Scroll reveal — progressive enhancement only
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    /* The reveal is running, so the safety net in the page head is not
       needed any more. */
    if (window.__bpRevealFallback) {
      window.clearTimeout(window.__bpRevealFallback);
      window.__bpRevealFallback = 0;
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    /* Observing an element makes the browser lay the page out so it can work
       out where the element is, so the observation starts in the next frame
       rather than inside the script task. The blocks fade in a frame later,
       which is invisible to the visitor, and the first paint is no longer
       held up. */
    window.requestAnimationFrame(function () {
      items.forEach(function (el, index) {
        el.setAttribute('data-reveal-delay', String(Math.min(index % 4, 3) * 80));
        observer.observe(el);
      });
    });
  }

  /* ---------------------------------------------------------------------
     6. Contact / enquiry form
        - client-side validation with accessible error messaging
        - submits only to a configured endpoint
        - never shows a false success state
     --------------------------------------------------------------------- */
  var ERROR_MESSAGES = {
    required: 'This field is required.',
    email: 'Enter a valid email address, for example name@business.com.',
    phone: 'Enter a valid phone number, including the country code.',
    consent: 'Please confirm that we may contact you about your enquiry.',
    short: 'Please add a little more detail (at least 20 characters).'
  };

  function fieldOf(input) {
    return input.closest('.field') || input.closest('.checkbox');
  }

  function errorNode(field) {
    if (!field) return null;
    var node = field.querySelector('.field__error');
    if (!node) {
      node = document.createElement('p');
      node.className = 'field__error';
      node.setAttribute('role', 'alert');
      node.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span></span>';
      field.appendChild(node);
    }
    return node;
  }

  function validateInput(input) {
    var value = (input.value || '').trim();
    var label = input.getAttribute('data-label') || 'This field';
    var message = '';

    if (input.type === 'checkbox') {
      if (input.required && !input.checked) message = ERROR_MESSAGES.consent;
    } else if (input.required && !value) {
      message = ERROR_MESSAGES.required;
    } else if (value && input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      message = ERROR_MESSAGES.email;
    } else if (value && input.type === 'tel' && !/^[+()\d][\d\s\-()]{6,}$/.test(value)) {
      message = ERROR_MESSAGES.phone;
    } else if (input.hasAttribute('minlength') && value && value.length < Number(input.getAttribute('minlength'))) {
      message = ERROR_MESSAGES.short;
    }

    var field = fieldOf(input);
    var error = errorNode(field);

    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (error) {
        error.querySelector('span').textContent = label + ': ' + message;
        error.classList.add('is-visible');
      }
    } else {
      input.removeAttribute('aria-invalid');
      if (error) {
        error.classList.remove('is-visible');
        error.querySelector('span').textContent = '';
      }
    }
    return !message;
  }

  function initForm() {
    var form = $('[data-enquiry-form]');
    if (!form) return;

    var status = $('[data-form-status]', form);
    var submit = $('[data-form-submit]', form);
    var endpoint = (CONFIG.formEndpoint || '').trim();

    function showStatus(kind, message) {
      if (!status) return;
      status.className = 'form-status is-visible form-status--' + kind;
      status.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (kind === 'success'
          ? '<circle cx="12" cy="12" r="10"/><polyline points="16 9 10.5 15 8 12.5"/>'
          : kind === 'error'
            ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
            : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>') +
        '</svg><div>' + message + '</div>';
      status.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    }

    function clearStatus() {
      if (!status) return;
      status.className = 'form-status';
      status.innerHTML = '';
      status.removeAttribute('role');
    }

    /* Live validation after the first interaction. */
    var inputs = $$('input, select, textarea', form).filter(function (el) {
      return el.type !== 'hidden' && el.type !== 'submit';
    });

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateInput(input);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateInput(input);
      });
    });

    /* Not connected yet: explain honestly instead of faking success. */
    if (!endpoint) {
      if (submit) {
        submit.disabled = true;
        submit.setAttribute('aria-disabled', 'true');
      }
      showStatus(
        'info',
        '<strong>Enquiry form not connected yet.</strong> ' +
          'This site is a static build, so the form has no server to deliver to. ' +
          'Add a form endpoint in <code>assets/js/config.js</code> to activate it, ' +
          'or email us directly using the address listed on this page.'
      );
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearStatus();

      var valid = true;
      var firstInvalid = null;

      inputs.forEach(function (input) {
        var ok = validateInput(input);
        if (!ok) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!valid) {
        showStatus('error', 'Please correct the highlighted fields and try again.');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!endpoint) {
        showStatus(
          'info',
          'The enquiry form is not connected to a service yet, so nothing was sent. ' +
            'Please email us using the address on this page and we will reply shortly.'
        );
        return;
      }

      var payload = {};
      inputs.forEach(function (input) {
        if (!input.name) return;
        payload[input.name] = input.type === 'checkbox' ? input.checked : input.value.trim();
      });
      payload._subject = 'New enquiry from brandingpeedika.com';

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }

      var request = endpoint.indexOf('formdata') > -1 || CONFIG.formEndpointType === 'formdata'
        ? fetch(endpoint, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new FormData(form)
          })
        : fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
          });

      request
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          showStatus(
            'success',
            'Thank you — your enquiry has been received. We will get back to you within one working day.'
          );
          form.reset();
          inputs.forEach(function (input) {
            input.removeAttribute('aria-invalid');
            var field = fieldOf(input);
            var error = field && field.querySelector('.field__error');
            if (error) error.classList.remove('is-visible');
          });
        })
        .catch(function () {
          showStatus(
            'error',
            'Sorry, we could not send your enquiry just now. Please try again, or email us directly using the address on this page.'
          );
        })
        .then(function () {
          if (submit) {
            submit.disabled = false;
            submit.textContent = submit.getAttribute('data-label') || 'Send enquiry';
          }
        });
    });
  }

  /* ---------------------------------------------------------------------
     7. Prefill the service field from ?service= on the contact page
     --------------------------------------------------------------------- */
  function initServicePrefill() {
    var select = $('[data-service-select]');
    if (!select) return;
    var params = new URLSearchParams(window.location.search);
    var requested = params.get('service');
    if (!requested) return;
    var match = $$('option', select).filter(function (option) {
      return option.value.toLowerCase() === requested.toLowerCase();
    })[0];
    if (match) select.value = match.value;
  }

  /* ---------------------------------------------------------------------
     8. Copy-to-clipboard for the contact email (progressive enhancement)
     --------------------------------------------------------------------- */
  function initCopyEmail() {
    $$('[data-copy-email]').forEach(function (button) {
      button.addEventListener('click', function () {
        var email = CONFIG.email;
        if (!email) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            var original = button.textContent;
            button.textContent = 'Copied';
            window.setTimeout(function () { button.textContent = original; }, 1800);
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function init() {
    hydrateConfig();
    initNav();
    initStickyHeader();
    initAccordions();
    initReveal();
    initForm();
    initServicePrefill();
    initCopyEmail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
