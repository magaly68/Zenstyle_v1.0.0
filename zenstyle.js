(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-zs-theme-toggle]');
  const themeStorageKey = 'zenstyle-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  function readStoredTheme() {
    try {
      return window.localStorage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  }

  function resolveTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      return theme;
    }

    return systemTheme.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const resolvedTheme = resolveTheme(theme);
    const isDark = resolvedTheme === 'dark';

    root.dataset.zsTheme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    if (themeToggle) {
      themeToggle.textContent = isDark ? 'Thème clair' : 'Thème sombre';
      themeToggle.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
      themeToggle.setAttribute('aria-pressed', String(isDark));
    }
  }

  applyTheme(readStoredTheme() || 'system');

  themeToggle?.addEventListener('click', () => {
    const nextTheme = root.dataset.zsTheme === 'dark' ? 'light' : 'dark';

    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // The theme still applies when storage is unavailable.
    }

    applyTheme(nextTheme);
  });

  const handleSystemThemeChange = () => {
    if (!readStoredTheme()) {
      applyTheme('system');
    }
  };

  if (typeof systemTheme.addEventListener === 'function') {
    systemTheme.addEventListener('change', handleSystemThemeChange);
  } else {
    systemTheme.addListener(handleSystemThemeChange);
  }

  function selectText(element) {
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copyText(text, target) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Continue with the local fallback below.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;

    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    textarea.remove();

    if (!copied) {
      selectText(target);
    }

    return copied;
  }

  document.querySelectorAll('[data-zs-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = document.querySelector(button.dataset.zsCopy);
      const status = button.closest('[data-zs-copy-region]')?.querySelector('[data-zs-copy-status]');

      if (!target) {
        return;
      }

      try {
        const copied = await copyText(target.textContent.trim(), target);

        button.textContent = copied ? 'Copié' : 'Sélectionné';
        if (status) {
          status.textContent = copied
            ? 'Code copié dans le presse-papiers.'
            : 'Code sélectionné. Utilisez Ctrl+C pour le copier.';
        }
      } catch {
        if (status) {
          status.textContent = 'La copie automatique est indisponible.';
        }
      }

      window.setTimeout(() => {
        button.textContent = 'Copier le code';
        if (status) {
          status.textContent = '';
        }
      }, 1800);
    });
  });

  const playground = document.querySelector('[data-zs-playground]');

  if (playground) {
    const componentControl = playground.querySelector('[data-zs-playground-component]');
    const variantControl = playground.querySelector('[data-zs-playground-variant]');
    const labelControl = playground.querySelector('[data-zs-playground-label]');
    const radiusControl = playground.querySelector('[data-zs-playground-radius]');
    const radiusOutput = playground.querySelector('[data-zs-playground-radius-output]');
    const status = playground.querySelector('[data-zs-playground-status]');
    const stage = playground.querySelector('[data-zs-playground-stage]');
    const snippet = playground.querySelector('[data-zs-playground-snippet]');
    const announce = playground.querySelector('[data-zs-playground-announce]');
    const resetButton = playground.querySelector('[data-zs-playground-reset]');

    const variants = {
      button: [
        ['primary', 'Primaire'],
        ['secondary', 'Secondaire'],
        ['success', 'Succès'],
        ['danger', 'Danger']
      ],
      alert: [
        ['success', 'Succès'],
        ['info', 'Information'],
        ['warning', 'Avertissement'],
        ['error', 'Erreur']
      ],
      badge: [
        ['primary', 'Primaire'],
        ['success', 'Succès'],
        ['warning', 'Avertissement'],
        ['error', 'Erreur']
      ]
    };

    const componentLabels = {
      button: 'Bouton',
      alert: 'Alerte',
      badge: 'Badge'
    };

    const defaults = {
      component: 'button',
      variant: 'primary',
      label: 'Découvrir',
      radius: '8'
    };

    function updateVariantOptions() {
      const component = componentControl.value;
      const availableVariants = variants[component];
      const currentVariant = availableVariants.some(([value]) => value === variantControl.value)
        ? variantControl.value
        : availableVariants[0][0];

      variantControl.replaceChildren(...availableVariants.map(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = value === currentVariant;
        return option;
      }));
    }

    function renderPlayground() {
      const component = componentControl.value;
      const variant = variantControl.value;
      const label = labelControl.value.trim() || 'Découvrir';
      const radius = `${radiusControl.value}px`;
      const variantLabel = variantControl.selectedOptions[0]?.textContent || variant;
      const componentClass = component === 'button' ? 'btn' : component;
      const className = `zs-${componentClass} zs-${componentClass}-${variant}`;
      const tagName = component === 'button' ? 'button' : component === 'badge' ? 'span' : 'div';
      const element = document.createElement(tagName);

      element.className = className;
      element.textContent = label;
      if (component === 'button') {
        element.type = 'button';
      }

      stage.style.setProperty('--zs-playground-radius', radius);
      stage.replaceChildren(element);
      radiusOutput.textContent = radius.replace('px', ' px');
      status.textContent = `${componentLabels[component]} · ${variantLabel}`;
      snippet.textContent = `<${tagName} class="${className}">${label}</${tagName}>`;
      announce.textContent = `Aperçu mis à jour : ${componentLabels[component].toLowerCase()} ${variantLabel.toLowerCase()}.`;
    }

    componentControl.addEventListener('change', () => {
      updateVariantOptions();
      renderPlayground();
    });
    variantControl.addEventListener('change', renderPlayground);
    labelControl.addEventListener('input', renderPlayground);
    radiusControl.addEventListener('input', renderPlayground);
    resetButton.addEventListener('click', () => {
      componentControl.value = defaults.component;
      variantControl.value = defaults.variant;
      labelControl.value = defaults.label;
      radiusControl.value = defaults.radius;
      updateVariantOptions();
      renderPlayground();
    });

    updateVariantOptions();
    renderPlayground();
  }

  const toastTypes = new Set(['success', 'error', 'warning', 'info']);

  function getToastContainer() {
    let container = document.querySelector('[data-zs-toast-container]');

    if (!container) {
      container = document.createElement('div');
      container.className = 'zs-toast-container';
      container.dataset.zsToastContainer = '';
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }

    return container;
  }

  function removeToast(toast) {
    if (!toast || toast.classList.contains('is-leaving')) {
      return;
    }

    window.clearTimeout(toast.zsTimeout);
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 250);
  }

  function showToast(message, options = {}) {
    const text = String(message || '').trim();

    if (!text) {
      return null;
    }

    const requestedType = String(options.type || 'info').toLowerCase();
    const type = toastTypes.has(requestedType) ? requestedType : 'info';
    const requestedDuration = Number(options.duration);
    const duration = Number.isFinite(requestedDuration) && requestedDuration >= 0
      ? requestedDuration
      : 4000;
    const toast = document.createElement('div');
    const content = document.createElement('span');
    const closeButton = document.createElement('button');

    toast.className = `zs-toast zs-toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-atomic', 'true');
    content.className = 'zs-toast-message';
    content.textContent = text;
    closeButton.className = 'zs-toast-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Fermer la notification');
    closeButton.textContent = '\u00d7';
    closeButton.addEventListener('click', () => removeToast(toast));
    toast.append(content, closeButton);
    getToastContainer().appendChild(toast);

    if (duration > 0) {
      toast.zsTimeout = window.setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-zs-toast]');

    if (!trigger) {
      return;
    }

    showToast(trigger.dataset.zsToast, {
      type: trigger.dataset.zsToastType,
      duration: trigger.dataset.zsToastDuration
    });
  });

  window.ZenStyle = Object.assign(window.ZenStyle || {}, {
    toast: showToast,
    dismissToast: removeToast
  });
})();
