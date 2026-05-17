# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zenstyle.spec.mjs >> ZenStyle public pages >> index.html loads zenstyle.css without broken images or horizontal overflow
- Location: tests\zenstyle.spec.mjs:23:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e3]:
      - img "Visuel" [ref=e4]
      - link "Accueil" [ref=e5] [cursor=pointer]:
        - /url: "#"
      - link "Documentation" [ref=e6] [cursor=pointer]:
        - /url: "#"
      - link "Téléchargement" [ref=e7] [cursor=pointer]:
        - /url: "#"
      - link "Composants" [ref=e8] [cursor=pointer]:
        - /url: "#"
      - link "Thèmes" [ref=e9] [cursor=pointer]:
        - /url: "#"
      - link "Icônes" [ref=e10] [cursor=pointer]:
        - /url: "#"
      - link "Contact" [ref=e11] [cursor=pointer]:
        - /url: "#"
  - generic [ref=e12]:
    - generic [ref=e13]:
      - heading "Mon framework css" [level=1] [ref=e14]
      - paragraph [ref=e15]:
        - text: Bienvenue sur mon framework css qui est conçu pour être léger et facile à utiliser. Il est basé sur les meilleures pratiques de développement web et est compatible avec tous les navigateurs modernes.
        - text: Il est également responsive et s'adapte à toutes les tailles d'écran. Il est livré avec une documentation complète et des exemples de code pour vous aider à démarrer rapidement.
        - text: Le framework est conçu pour être utilisé avec des préprocesseurs CSS tels que Sass ou Less, mais il peut également être utilisé avec du CSS pur. Il est également compatible avec les systèmes de gestion de contenu tels que WordPress et Joomla.
    - button "plus d'infos" [ref=e17] [cursor=pointer]
  - generic [ref=e18]:
    - heading "Installation" [level=2] [ref=e19]
    - paragraph [ref=e20]:
      - text: Pour installer le framework, il vous suffir de télécharger le fichier zip suivant et de l'extraire dans votre projet. Ensuite, il vous suffit d'inclure le fichier CSS dans votre projet.
      - text: Vous pouvez également utiliser le gestionnaire de paquets npm pour l'installer facilement dans votre projet. vous pouveez aussi utiliser le lien cdn pour l'utiliser directement dans votre projet sans l'installer.
      - text: Pour le moment, utilisez le fichier local
      - code [ref=e21]: zenstyle.css
      - text: . Un CDN pourra etre ajoute apres publication.
    - button "Installer" [ref=e22] [cursor=pointer]
  - generic [ref=e23]:
    - heading "Documentation" [level=2] [ref=e24]
    - paragraph [ref=e25]:
      - text: La documentation est disponible en ligne et est mise à jour régulièrement. Vous pouvez consulter la documentation pour en savoir plus sur les différentes classes et composants disponibles dans le framework.
      - text: Vous pouvez également consulter les exemples de code pour voir comment utiliser le framework dans vos projets.
    - button "plus d'infos" [ref=e26] [cursor=pointer]
    - img "documentation" [ref=e27]
  - contentinfo [ref=e28]:
    - navigation [ref=e29]:
      - paragraph [ref=e31]: © 2025 ZenStyle — Tous droits réservés
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
  24 |       await page.goto(fileUrl(pageName));
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
> 40 |       expect(hasHorizontalOverflow).toBe(false);
     |                                     ^ Error: expect(received).toBe(expected) // Object.is equality
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