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
  await expect(navigation.getByRole('link', { name: 'Accueil', exact: true })).toHaveAttribute('aria-current', 'page');

  const expectedLinks = {
    Documentation: 'documentation.html',
    Installation: 'README.md',
    Composants: 'Zenstyle_framework/css/layout/composants.html',
    Thèmes: 'themes.html',
    Icônes: 'icones.html',
    Contact: 'contact.html'
  };

  for (const [label, href] of Object.entries(expectedLinks)) {
    await expect(navigation.getByRole('link', { name: label })).toHaveAttribute('href', href);
  }

  await page.getByRole('link', { name: 'Voir la démo' }).click();
  await expect(page).toHaveURL(/demo\.html$/);
});

test('component examples are interactive', async ({ page }) => {
  await page.goto(fileUrl('Zenstyle_framework/css/layout/composants.html'));

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
