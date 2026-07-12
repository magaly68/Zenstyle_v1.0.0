import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

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
  await expect(page.locator('a[download]')).toHaveAttribute('href', 'zenstyle.css');
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

  await page.locator('.tab-btn', { hasText: 'Onglet 2' }).click();
  await expect(page.locator('#tab2')).toBeVisible();
  await expect(page.locator('#tab1')).toBeHidden();
  await expect(page.locator('.tab-btn', { hasText: 'Onglet 2' })).toHaveAttribute('aria-selected', 'true');

  await page.locator('button', { hasText: 'Ouvrir la modale' }).click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
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
