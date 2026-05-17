# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zenstyle.spec.mjs >> ZenStyle public pages >> icÃ´nes.html loads zenstyle.css without broken images or horizontal overflow
- Location: tests\zenstyle.spec.mjs:23:5

# Error details

```
Error: page.goto: net::ERR_FILE_NOT_FOUND at file:///C:/Users/Standard/Documents/framework/Zen/ic%C3%83%C2%B4nes.html
Call log:
  - navigating to "file:///C:/Users/Standard/Documents/framework/Zen/ic%C3%83%C2%B4nes.html", waiting until "load"

```

# Test source

```ts
  1  | import path from 'node:path';
  2  | import { fileURLToPath, pathToFileURL } from 'node:url';
  3  | import { expect, test } from '@playwright/test';
  4  | 
  5  | const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  6  | 
  7  | function fileUrl(relativePath) {
  8  |   return pathToFileURL(path.join(root, relativePath)).href;
  9  | }
  10 | 
  11 | const publicPages = [
  12 |   'index.html',
  13 |   'demo.html',
  14 |   'documentation.html',
  15 |   'contact.html',
  16 |   'icÃ´nes.html',
  17 |   'thÃ¨mes.html',
  18 |   'mentions-legales-zenstyle.html'
  19 | ];
  20 | 
  21 | test.describe('ZenStyle public pages', () => {
  22 |   for (const pageName of publicPages) {
  23 |     test(`${pageName} loads zenstyle.css without broken images or horizontal overflow`, async ({ page }) => {
> 24 |       await page.goto(fileUrl(pageName));
     |                  ^ Error: page.goto: net::ERR_FILE_NOT_FOUND at file:///C:/Users/Standard/Documents/framework/Zen/ic%C3%83%C2%B4nes.html
  25 | 
  26 |       await expect(page.locator('link[href$="zenstyle.css"]').first()).toHaveCount(1);
  27 | 
  28 |       const brokenImages = await page.evaluate(() =>
  29 |         Array.from(document.images)
  30 |           .filter((img) => img.currentSrc && (!img.complete || img.naturalWidth === 0))
  31 |           .map((img) => img.getAttribute('src'))
  32 |       );
  33 | 
  34 |       expect(brokenImages).toEqual([]);
  35 | 
  36 |       const hasHorizontalOverflow = await page.evaluate(() =>
  37 |         document.documentElement.scrollWidth > window.innerWidth + 1
  38 |       );
  39 | 
  40 |       expect(hasHorizontalOverflow).toBe(false);
  41 |     });
  42 |   }
  43 | });
  44 | 
  45 | test('core CSS classes expose usable styles', async ({ page }) => {
  46 |   await page.setContent(`
  47 |     <!doctype html>
  48 |     <html>
  49 |       <head></head>
  50 |       <body>
  51 |         <main class="zs-container">
  52 |           <button class="zs-btn zs-btn-primary">Primary</button>
  53 |           <article class="zs-card">
  54 |             <header class="zs-card-header">Card</header>
  55 |             <div class="zs-card-body">Content</div>
  56 |           </article>
  57 |           <div class="zs-alert zs-alert-success">Saved</div>
  58 |         </main>
  59 |       </body>
  60 |     </html>
  61 |   `);
  62 | 
  63 |   await page.addStyleTag({ path: path.join(root, 'zenstyle.css') });
  64 | 
  65 |   const buttonStyles = await page.locator('.zs-btn').evaluate((element) => {
  66 |     const styles = getComputedStyle(element);
  67 |     return {
  68 |       display: styles.display,
  69 |       backgroundColor: styles.backgroundColor,
  70 |       borderRadius: styles.borderRadius
  71 |     };
  72 |   });
  73 | 
  74 |   expect(buttonStyles.display).toBe('inline-flex');
  75 |   expect(buttonStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  76 |   expect(buttonStyles.borderRadius).not.toBe('0px');
  77 | 
  78 |   await expect(page.locator('.zs-card')).toBeVisible();
  79 |   await expect(page.locator('.zs-alert')).toBeVisible();
  80 | });
  81 | 
  82 | test('component examples are interactive', async ({ page }) => {
  83 |   await page.goto(fileUrl('Zenstyle_framework/css/layout/composants.html'));
  84 | 
  85 |   await page.locator('.accordion').first().click();
  86 |   await expect(page.locator('.panel').first()).toBeVisible();
  87 | 
  88 |   await page.locator('.tab-btn', { hasText: 'Onglet 2' }).click();
  89 |   await expect(page.locator('#tab2')).toBeVisible();
  90 |   await expect(page.locator('#tab1')).toBeHidden();
  91 | 
  92 |   await page.locator('button', { hasText: 'Ouvrir la modale' }).click();
  93 |   await expect(page.locator('#modal')).toBeVisible();
  94 | });
```