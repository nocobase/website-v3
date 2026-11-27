// Quick-start modal dialog and copy button (shared across site via Base.astro).
(function () {
  var timers = new WeakMap();
  var lastMessage = '';

  function isZh() {
    return (document.documentElement.lang || '').toLowerCase().startsWith('zh');
  }

  function legacyCopy(text) {
    var previousFocus = document.activeElement;
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;inset-block-start:0;opacity:0';
    document.body.append(field);
    field.select();
    try {
      return document.execCommand('copy');
    } finally {
      field.remove();
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
    }
  }

  function report(button, ok) {
    var tip = button.nextElementSibling;
    clearTimeout(timers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    var message = ok
      ? (button.dataset.copiedLabel || (isZh() ? '已复制' : 'Copied'))
      : (button.dataset.failedLabel || (isZh() ? '复制失败' : 'Copy failed'));
    if (message === lastMessage) message += '\u00A0';
    lastMessage = message;
    if (tip) tip.textContent = '';
    void button.offsetWidth;
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    if (tip) {
      requestAnimationFrame(function () {
        tip.textContent = message;
      });
    }
    timers.set(button, setTimeout(function () {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (tip) tip.textContent = '';
    }, 2000));
  }

  async function copy(button, target) {
    var text = target.matches('input, textarea')
      ? target.value
      : target.innerText.trim();
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!legacyCopy(text)) {
        throw new Error('Copy failed');
      }
      report(button, true);
    } catch (_) {
      try {
        if (legacyCopy(text)) {
          report(button, true);
          return;
        }
      } catch (__) {}
      report(button, false);
    }
  }

  // Register only one command path: native Invoker Commands when supported, click fallback otherwise.
  if ('CommandEvent' in window) {
    document.addEventListener('command', function (event) {
      if (event.command === '--copy' && event.source && event.target) {
        copy(event.source, event.target);
      }
    }, true);
  } else {
    document.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      var button = event.target.closest('button[command][commandfor]');
      if (!button) return;
      var cmd = button.getAttribute('command');
      var target = document.getElementById(button.getAttribute('commandfor'));
      if (!target) return;
      if (cmd === '--copy') {
        copy(button, target);
      } else if (cmd === 'show-modal' && typeof target.showModal === 'function') {
        if (!target.open) target.showModal();
      } else if (cmd === 'close' && typeof target.close === 'function') {
        target.close();
      }
    });
  }

  // Clear returnValue on close so stale values never leak across opens.
  document.querySelectorAll('dialog.qs-modal').forEach(function (dialog) {
    dialog.addEventListener('close', function () {
      dialog.returnValue = '';
    });
  });

  // Fallback click-outside dismissal for browsers without native dialog closedby="any" (e.g. Safari).
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    var isOutside = function (e, dialog) {
      var r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    document.querySelectorAll('dialog.qs-modal[closedby="any"]').forEach(function (dialog) {
      var pressedOutside = false;
      dialog.addEventListener('pointerdown', function (e) {
        pressedOutside = isOutside(e, dialog);
      });
      dialog.addEventListener('pointerup', function (e) {
        if (pressedOutside && isOutside(e, dialog)) dialog.close();
        pressedOutside = false;
      });
    });
  }
})();
