import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

function fileUrl(relativePath) {
  return pathToFileURL(path.join(root, relativePath)).href;
}

const publicPages = [
  'index.html',
  'demo.html',
  'documentation.html',
  'installation.html',
  'contact.html',
  'icones.html',
  'themes.html',
  'mentions-legales-zenstyle.html'
];

test.describe('ZenStyle public pages', () => {
  for (const pageName of publicPages) {
    test(`${pageName} loads zenstyle.css without broken images or horizontal overflow`, async ({ page }) => {
      await page.goto(fileUrl(pageName));

      await expect(page.locator('link[href$="zenstyle.css"]').first()).toHaveCount(1);
      await expect(page.locator('header nav a[href="#"]')).toHaveCount(0);

      const brokenImages = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.currentSrc && (!img.complete || img.naturalWidth === 0))
          .map((img) => img.getAttribute('src'))
      );

      expect(brokenImages).toEqual([]);

      const hasHorizontalOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > window.innerWidth + 1
      );

      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

for (const pageName of ['index.html', 'documentation.html', 'themes.html', 'contact.html']) {
  test(`${pageName} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(fileUrl(pageName));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const seriousViolations = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
    expect(seriousViolations).toEqual([]);
  });
}

test('core CSS classes expose usable styles', async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
      <head></head>
      <body>
        <main class="zs-container">
          <button class="zs-btn zs-btn-primary">Primary</button>
          <article class="zs-card">
            <header class="zs-card-header">Card</header>
            <div class="zs-card-body">Content</div>
          </article>
          <div class="zs-alert zs-alert-success">Saved</div>
        </main>
      </body>
    </html>
  `);

  await page.addStyleTag({ path: path.join(root, 'zenstyle.css') });

  const buttonStyles = await page.locator('.zs-btn').evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      display: styles.display,
      backgroundColor: styles.backgroundColor,
      borderRadius: styles.borderRadius
    };
  });

  expect(buttonStyles.display).toBe('inline-flex');
  expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(buttonStyles.borderRadius).not.toBe('0px');

  await expect(page.locator('.zs-card')).toBeVisible();
  await expect(page.locator('.zs-alert')).toBeVisible();
});

test('home page exposes working primary navigation', async ({ page }) => {
  await page.goto(fileUrl('index.html'));

  const navigation = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(navigation).toBeVisible();
  const mobileToggle = page.locator('[data-zs-nav-toggle]');
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();
  }
  await expect(navigation.getByRole('link', { name: 'Accueil', exact: true })).toHaveAttribute('aria-current', 'page');

  const expectedLinks = {
    Documentation: 'documentation.html',
    Installation: 'installation.html',
    Composants: 'Zenstyle_framework/css/layout/composants.html',
    Thèmes: 'themes.html',
    Icônes: 'icones.html',
    Contact: 'contact.html'
  };

  for (const [label, href] of Object.entries(expectedLinks)) {
    await expect(navigation.getByRole('link', { name: label })).toHaveAttribute('href', href);
  }

  await navigation.getByRole('link', { name: 'Installation' }).click();
  await expect(page).toHaveURL(/installation\.html$/);
  await page.goto(fileUrl('index.html'));

  await page.getByRole('link', { name: 'Voir la démo' }).click();
  await expect(page).toHaveURL(/demo\.html$/);
});

test('mobile navigation opens and closes accessibly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(fileUrl('index.html'));

  const toggle = page.getByRole('button', { name: 'Ouvrir le menu' });
  const links = page.locator('.zs-nav-links');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(links).toBeHidden();

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true');
  await expect(links).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/zs-nav-lock/);

  await page.keyboard.press('Escape');
  await expect(links).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/zs-nav-lock/);
});

test('optional helpers provide theme, copy and download interactions', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} }
    });
  });
  await page.goto(fileUrl('index.html'));

  const mobileToggle = page.locator('[data-zs-nav-toggle]');
  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();
  }

  const themeToggle = page.getByRole('button', { name: 'Thème sombre' });
  await expect(themeToggle).toHaveAttribute('aria-pressed', 'false');

  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-zs-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Thème clair' })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  const reloadedMobileToggle = page.locator('[data-zs-nav-toggle]');
  if (await reloadedMobileToggle.isVisible()) {
    await reloadedMobileToggle.click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-zs-theme', 'dark');

  await page.getByRole('button', { name: 'Copier le code' }).click();
  await expect(page.locator('[data-zs-copy-status]')).toHaveText('Code copié dans le presse-papiers.');
  await expect(page.locator('a[download]')).toHaveAttribute('href', 'dist/zenstyle.min.css');
});

test('playground updates the live component and generated markup', async ({ page }) => {
  await page.goto(fileUrl('index.html'));

  await page.getByLabel('Composant à tester').selectOption('alert');
  await page.getByLabel('Variante').selectOption('warning');
  await page.getByLabel('Texte du composant').fill('Attention en direct');
  await page.getByLabel('Rayon des bordures').fill('20');

  await expect(page.locator('[data-zs-playground-stage] .zs-alert-warning')).toBeVisible();
  await expect(page.locator('[data-zs-playground-stage]')).toContainText('Attention en direct');
  await expect(page.locator('[data-zs-playground-snippet]')).toContainText('zs-alert zs-alert-warning');
  await expect(page.locator('[data-zs-playground-radius-output]')).toHaveText('20 px');

  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.getByLabel('Composant à tester')).toHaveValue('button');
  await expect(page.locator('[data-zs-playground-stage] .zs-btn-primary')).toBeVisible();
});

test('component examples are interactive', async ({ page }) => {
  await page.goto(fileUrl('Zenstyle_framework/css/layout/composants.html'));
  await expect(page.locator('header nav a[href="#"]')).toHaveCount(0);

  await expect(page.locator('.accordion').first()).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.accordion').first().click();
  await expect(page.locator('.panel').first()).toBeVisible();
  await expect(page.locator('.accordion').first()).toHaveAttribute('aria-expanded', 'true');

  await page.locator('.accordion').first().press('ArrowDown');
  await expect(page.locator('#accordion-2')).toBeFocused();

  await page.locator('.tab-btn', { hasText: 'Onglet 2' }).click();
  await expect(page.locator('#tab2')).toBeVisible();
  await expect(page.locator('#tab1')).toBeHidden();
  await expect(page.locator('.tab-btn', { hasText: 'Onglet 2' })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.tab-btn', { hasText: 'Onglet 2' }).press('ArrowLeft');
  await expect(page.locator('.tab-btn', { hasText: 'Onglet 1' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.tab-btn', { hasText: 'Onglet 1' })).toBeFocused();

  await page.locator('button', { hasText: 'Ouvrir la modale' }).click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.getByRole('button', { name: 'Fermer la modale' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fermer la modale' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('button', { hasText: 'Ouvrir la modale' })).toBeFocused();
});

test('toast notifications support HTML triggers and the JavaScript API', async ({ page }) => {
  await page.goto(fileUrl('demo.html'));

  await page.getByRole('button', { name: 'Afficher un succès' }).click();
  const successToast = page.locator('.zs-toast-success');
  await expect(successToast).toBeVisible();
  await expect(successToast).toHaveAttribute('role', 'status');
  await expect(successToast).toContainText('Votre modification a été enregistrée.');

  await successToast.getByRole('button', { name: 'Fermer la notification' }).click();
  await expect(successToast).toBeHidden();

  await page.evaluate(() => {
    window.ZenStyle.toast('Échec du traitement.', { type: 'error', duration: 0 });
  });
  const errorToast = page.locator('.zs-toast-error');
  await expect(errorToast).toBeVisible();
  await expect(errorToast).toHaveAttribute('role', 'alert');
  await expect(errorToast).toContainText('Échec du traitement.');
});

test('dropdown, tooltip and spinner components are usable', async ({ page }) => {
  await page.goto(fileUrl('demo.html'));

  const dropdownToggle = page.getByRole('button', { name: 'Actions' });
  const dropdownMenu = page.locator('[data-zs-dropdown-menu]');
  await expect(dropdownToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(dropdownMenu).toBeHidden();

  await dropdownToggle.click();
  await expect(dropdownToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(dropdownMenu).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Voir le profil' })).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Modifier' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dropdownMenu).toBeHidden();
  await expect(dropdownToggle).toBeFocused();

  await expect(page.getByRole('button', { name: 'Survolez-moi' })).toHaveAttribute(
    'data-zs-tooltip',
    'Une information courte et utile'
  );
  await expect(page.locator('.zs-spinner')).toBeVisible();
  await expect(page.getByRole('status', { name: 'Chargement en cours' })).toBeVisible();
});

test('form validation reports errors and accepts valid values', async ({ page }) => {
  await page.goto(fileUrl('contact.html'));

  await page.getByRole('button', { name: 'Valider le formulaire' }).click();
  const summary = page.locator('[data-zs-error-summary]');
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('erreurs');
  await expect(page.getByLabel('Nom')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');

  await page.getByLabel('Nom').fill('Magaly');
  await page.getByLabel('Adresse e-mail').fill('magaly@example.com');
  await page.getByLabel('Message').fill('Bonjour, ceci est un message de test.');
  await page.getByLabel('J’accepte que mes informations soient utilisées pour répondre à ma demande.').check();
  await page.getByRole('button', { name: 'Valider le formulaire' }).click();

  await expect(summary).toBeHidden();
  await expect(page.getByLabel('Adresse e-mail')).toHaveAttribute('aria-invalid', 'false');
  await expect(page.locator('.zs-toast-success')).toContainText('Formulaire valide');
});

test('responsive table, pagination and breadcrumb expose semantic navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(fileUrl('demo.html'));

  const tableRegion = page.getByRole('region', { name: 'Liste des projets' });
  await expect(tableRegion).toBeVisible();
  await expect(tableRegion.getByRole('table', { name: 'Avancement des projets' })).toBeVisible();
  const overflow = await tableRegion.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    overflowX: getComputedStyle(element).overflowX
  }));
  expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
  expect(overflow.overflowX).toBe('auto');

  await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' }).locator('[aria-current="page"]')).toHaveText('Tableaux');
  await expect(page.getByRole('navigation', { name: 'Pagination des projets' }).getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Page précédente' })).toHaveAttribute('aria-disabled', 'true');
});

test('progress bars expose values and support JavaScript updates', async ({ page }) => {
  await page.goto(fileUrl('demo.html'));

  const progress = page.getByRole('progressbar', { name: 'Téléchargement' });
  await expect(progress).toHaveAttribute('aria-valuenow', '65');
  await page.evaluate(() => {
    window.ZenStyle.progress(document.querySelector('[data-zs-progress]'), 80);
  });
  await expect(progress).toHaveAttribute('aria-valuenow', '80');
  await expect(progress.locator('.zs-progress-bar')).toHaveCSS('width', /.+/);
  await expect(page.getByRole('progressbar', { name: 'Traitement en cours' })).not.toHaveAttribute('aria-valuenow');
});

test('CSS utilities provide spacing, layout, typography and responsive visibility', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(`
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <div id="utility" class="zs-flex zs-flex-col zs-items-center zs-justify-between zs-gap-3 zs-px-4 zs-mt-2 zs-w-full zs-text-lg zs-font-bold zs-text-center">
      <span>Utilitaire</span>
    </div>
    <span id="mobile-only" class="zs-desktop-hidden">Mobile</span>
    <span id="desktop-only" class="zs-mobile-hidden">Desktop</span>
    <span id="accessible" class="zs-sr-only">Texte accessible</span>
  `);
  await page.addStyleTag({ path: path.join(root, 'zenstyle.css') });

  const styles = await page.locator('#utility').evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      display: computed.display,
      direction: computed.flexDirection,
      align: computed.alignItems,
      width: computed.width,
      fontSize: computed.fontSize,
      weight: computed.fontWeight,
      textAlign: computed.textAlign
    };
  });
  expect(styles.display).toBe('flex');
  expect(styles.direction).toBe('column');
  expect(styles.align).toBe('center');
  expect(styles.fontSize).toBe('18px');
  expect(styles.weight).toBe('700');
  expect(styles.textAlign).toBe('center');
  await expect(page.locator('#mobile-only')).toBeVisible();
  await expect(page.locator('#desktop-only')).toBeHidden();
  await expect(page.locator('#accessible')).toBeAttached();
  const accessibleSize = await page.locator('#accessible').evaluate((element) => ({
    width: getComputedStyle(element).width,
    height: getComputedStyle(element).height,
    overflow: getComputedStyle(element).overflow
  }));
  expect(accessibleSize).toEqual({ width: '1px', height: '1px', overflow: 'hidden' });

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#mobile-only')).toBeHidden();
  await expect(page.locator('#desktop-only')).toBeVisible();
});

test('theme builder applies presets and generates reusable CSS', async ({ page }) => {
  await page.goto(fileUrl('themes.html'));

  const primaryColor = page.getByLabel('Couleur principale');
  await expect(primaryColor).toHaveValue('#2563eb');
  await page.getByRole('button', { name: 'Doux' }).click();
  await expect(primaryColor).toHaveValue('#8b5cf6');
  await expect(page.locator('html')).toHaveCSS('--zs-color-primary', '#8b5cf6');
  await expect(page.locator('[data-zs-theme-output]')).toContainText('--zs-color-primary: #8b5cf6');

  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(primaryColor).toHaveValue('#2563eb');

  const smallButton = page.getByRole('button', { name: 'Petit' });
  const largeButton = page.getByRole('button', { name: 'Grand' });
  const sizes = await Promise.all([
    smallButton.evaluate((element) => element.getBoundingClientRect().height),
    largeButton.evaluate((element) => element.getBoundingClientRect().height)
  ]);
  expect(sizes[1]).toBeGreaterThan(sizes[0]);
});

test('documentation search filters sections and announces results', async ({ page }) => {
  await page.goto(fileUrl('documentation.html'));

  const search = page.getByLabel('Rechercher dans la documentation');
  await search.fill('validation de formulaire');
  await expect(page.locator('[data-zs-doc-search-status]')).toContainText('1 section trouvée');
  await expect(page.getByRole('heading', { name: 'Validation de formulaire' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Notifications toast' })).toBeHidden();

  await search.fill('');
  await expect(page.getByRole('heading', { name: 'Notifications toast' })).toBeVisible();
});
