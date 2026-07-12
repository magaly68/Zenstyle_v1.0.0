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

  const mobileNavigations = document.querySelectorAll('.zs-navbar');

  function closeMobileNavigation(navbar, restoreFocus = false) {
    const toggle = navbar.querySelector('[data-zs-nav-toggle]');
    const links = navbar.querySelector('.zs-nav-links');

    navbar.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Ouvrir le menu');
    links?.setAttribute('aria-hidden', 'true');
    root.classList.remove('zs-nav-lock');

    if (restoreFocus) {
      toggle?.focus();
    }
  }

  mobileNavigations.forEach((navbar, index) => {
    const links = navbar.querySelector('.zs-nav-links');

    if (!links || navbar.querySelector('[data-zs-nav-toggle]')) {
      return;
    }

    const menuId = links.id || `zs-navigation-${index + 1}`;
    const toggle = document.createElement('button');

    links.id = menuId;
    if (window.matchMedia('(max-width: 768px)').matches) {
      links.setAttribute('aria-hidden', 'true');
    } else {
      links.removeAttribute('aria-hidden');
    }
    toggle.className = 'zs-nav-toggle';
    toggle.type = 'button';
    toggle.dataset.zsNavToggle = '';
    toggle.setAttribute('aria-controls', menuId);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ouvrir le menu');
    toggle.innerHTML = '<span class="zs-nav-toggle-icon" aria-hidden="true"></span>';
    navbar.insertBefore(toggle, links);
    navbar.classList.add('zs-navbar-enhanced');

    toggle.addEventListener('click', () => {
      const shouldOpen = !navbar.classList.contains('is-open');

      mobileNavigations.forEach((otherNavbar) => {
        if (otherNavbar !== navbar) {
          closeMobileNavigation(otherNavbar);
        }
      });
      navbar.classList.toggle('is-open', shouldOpen);
      toggle.setAttribute('aria-expanded', String(shouldOpen));
      toggle.setAttribute('aria-label', shouldOpen ? 'Fermer le menu' : 'Ouvrir le menu');
      links.setAttribute('aria-hidden', String(!shouldOpen));
      root.classList.toggle('zs-nav-lock', shouldOpen && window.matchMedia('(max-width: 768px)').matches);
    });

    navbar.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navbar.classList.contains('is-open')) {
        closeMobileNavigation(navbar, true);
      }
    });

    links.addEventListener('click', (event) => {
      if (event.target.closest('a') && window.matchMedia('(max-width: 768px)').matches) {
        closeMobileNavigation(navbar);
      }
    });
  });

  document.addEventListener('click', (event) => {
    mobileNavigations.forEach((navbar) => {
      if (navbar.classList.contains('is-open') && !navbar.contains(event.target)) {
        closeMobileNavigation(navbar);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      root.classList.remove('zs-nav-lock');
      mobileNavigations.forEach((navbar) => {
        navbar.querySelector('.zs-nav-links')?.removeAttribute('aria-hidden');
      });
    } else {
      mobileNavigations.forEach((navbar) => {
        const isOpen = navbar.classList.contains('is-open');
        navbar.querySelector('.zs-nav-links')?.setAttribute('aria-hidden', String(!isOpen));
      });
    }
  });

  const validatedForms = document.querySelectorAll('[data-zs-validate]');

  function getValidationMessage(field) {
    if (field.validity.valueMissing) {
      return field.dataset.zsErrorRequired || 'Ce champ est obligatoire.';
    }

    if (field.validity.typeMismatch) {
      return field.dataset.zsErrorType || 'Saisissez une valeur au format attendu.';
    }

    if (field.validity.tooShort) {
      return field.dataset.zsErrorMinlength || `Saisissez au moins ${field.minLength} caractères.`;
    }

    if (field.validity.tooLong) {
      return field.dataset.zsErrorMaxlength || `Saisissez au maximum ${field.maxLength} caractères.`;
    }

    if (field.validity.patternMismatch) {
      return field.dataset.zsErrorPattern || 'Le format de cette valeur est incorrect.';
    }

    return field.validationMessage || 'Vérifiez la valeur saisie.';
  }

  function getFieldError(field) {
    const group = field.closest('.zs-form-group, .form-group, .zs-check-group');
    let error = group?.querySelector('.zs-form-error, .form-error');

    if (!error && group) {
      error = document.createElement('span');
      error.className = 'zs-form-error';
      error.id = `${field.id || field.name || 'field'}-error`;
      error.setAttribute('aria-live', 'polite');
      group.appendChild(error);
    }

    return { group, error };
  }

  function validateField(field) {
    const { group, error } = getFieldError(field);
    const isValid = field.checkValidity();

    field.classList.toggle('is-invalid', !isValid);
    field.classList.toggle('is-valid', isValid && field.value !== '');
    field.setAttribute('aria-invalid', String(!isValid));
    group?.classList.toggle('has-error', !isValid);
    group?.classList.toggle('has-success', isValid && field.value !== '');

    if (error) {
      error.textContent = isValid ? '' : getValidationMessage(field);
      if (!isValid) {
        const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
        describedBy.add(error.id);
        field.setAttribute('aria-describedby', [...describedBy].join(' '));
      }
    }

    return isValid;
  }

  validatedForms.forEach((form) => {
    const fields = [...form.querySelectorAll('input, textarea, select')]
      .filter((field) => !field.disabled && !['hidden', 'submit', 'button'].includes(field.type));
    const summary = form.querySelector('[data-zs-error-summary]');

    form.noValidate = true;

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
          validateField(field);
        }
      });
      field.addEventListener('change', () => validateField(field));
    });

    form.addEventListener('submit', (event) => {
      const invalidFields = fields.filter((field) => !validateField(field));

      if (invalidFields.length > 0) {
        event.preventDefault();
        if (summary) {
          summary.hidden = false;
          summary.textContent = invalidFields.length === 1
            ? 'Le formulaire contient une erreur. Corrigez-la avant de continuer.'
            : `Le formulaire contient ${invalidFields.length} erreurs. Corrigez-les avant de continuer.`;
          summary.focus();
        } else {
          invalidFields[0].focus();
        }
        form.dispatchEvent(new CustomEvent('zs:invalid', { detail: { invalidFields } }));
        return;
      }

      if (summary) {
        summary.hidden = true;
        summary.textContent = '';
      }

      if (form.hasAttribute('data-zs-demo')) {
        event.preventDefault();
        showToast('Formulaire valide : prêt à être envoyé.', { type: 'success' });
      }

      form.dispatchEvent(new CustomEvent('zs:valid'));
    });
  });

  function setProgress(progress, value) {
    if (!progress) {
      return;
    }

    const numericValue = Math.min(100, Math.max(0, Number(value) || 0));
    const bar = progress.querySelector('.zs-progress-bar');

    progress.classList.remove('zs-progress-indeterminate');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', String(numericValue));
    progress.style.setProperty('--zs-progress', `${numericValue}%`);
    if (bar) {
      bar.style.width = `${numericValue}%`;
    }
    progress.dispatchEvent(new CustomEvent('zs:progress', { detail: { value: numericValue } }));
  }

  document.querySelectorAll('[data-zs-progress]').forEach((progress) => {
    setProgress(progress, progress.dataset.zsProgress);
  });

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

  const dropdowns = document.querySelectorAll('[data-zs-dropdown]');

  function closeDropdown(dropdown, restoreFocus = false) {
    const trigger = dropdown.querySelector('[data-zs-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-zs-dropdown-menu]');

    dropdown.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('hidden', '');

    if (restoreFocus) {
      trigger?.focus();
    }
  }

  function closeOtherDropdowns(currentDropdown) {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== currentDropdown) {
        closeDropdown(dropdown);
      }
    });
  }

  dropdowns.forEach((dropdown, index) => {
    const trigger = dropdown.querySelector('[data-zs-dropdown-toggle]');
    const menu = dropdown.querySelector('[data-zs-dropdown-menu]');

    if (!trigger || !menu) {
      return;
    }

    if (!menu.id) {
      menu.id = `zs-dropdown-menu-${index + 1}`;
    }

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-controls', menu.id);
    trigger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('hidden', '');
    menu.querySelectorAll('a, button').forEach((item) => item.setAttribute('role', 'menuitem'));

    trigger.addEventListener('click', () => {
      const shouldOpen = !dropdown.classList.contains('is-open');

      closeOtherDropdowns(dropdown);
      dropdown.classList.toggle('is-open', shouldOpen);
      trigger.setAttribute('aria-expanded', String(shouldOpen));
      menu.toggleAttribute('hidden', !shouldOpen);

      if (shouldOpen) {
        menu.querySelector('[role="menuitem"]')?.focus();
      }
    });

    dropdown.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown(dropdown, true);
      }
    });
  });

  document.addEventListener('click', (event) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        closeDropdown(dropdown);
      }
    });
  });

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
    dismissToast: removeToast,
    progress: setProgress
  });
})();
