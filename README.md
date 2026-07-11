# ZenStyle

ZenStyle est un framework CSS leger et reutilisable, expose en un seul fichier public : `zenstyle.css`.

## Utilisation

Copie `zenstyle.css` dans ton projet, puis charge-le dans tes pages HTML :

```html
<link rel="stylesheet" href="zenstyle.css">
```

Les fonctionnalités optionnelles utilisent le fichier `zenstyle.js` :

```html
<script src="zenstyle.js" defer></script>
```

Ajoutez `data-zs-theme-toggle` à un bouton pour activer le thème clair/sombre,
`data-zs-copy="#mon-code"` à un bouton pour copier le contenu d'un bloc de code,
ou `data-zs-toast="Message"` pour afficher une notification temporaire.

Exemple :

```html
<main class="zs-container">
  <button class="zs-btn zs-btn-primary">Action</button>

  <article class="zs-card">
    <header class="zs-card-header">Titre</header>
    <div class="zs-card-body">Contenu</div>
  </article>
</main>
```

Toast avec attributs HTML :

```html
<button data-zs-toast="Enregistrement réussi" data-zs-toast-type="success">
  Enregistrer
</button>
```

Toast avec l'API JavaScript :

```js
ZenStyle.toast('Enregistrement réussi', { type: 'success', duration: 4000 });
```

Types disponibles : `success`, `error`, `warning` et `info`. Une durée de `0`
conserve la notification jusqu'à sa fermeture manuelle.

## Convention

Les classes publiques utilisent le prefixe `zs-` pour limiter les collisions avec les styles des projets utilisateurs.

Classes principales :

- `zs-container`, `zs-row`, `zs-col`, `zs-grid`
- `zs-navbar`, `zs-navbar-brand`, `zs-navbar-menu`
- `zs-btn`, `zs-btn-primary`, `zs-btn-secondary`, `zs-btn-success`, `zs-btn-danger`
- `zs-card`, `zs-card-header`, `zs-card-body`, `zs-card-footer`
- `zs-input`, `zs-textarea`, `zs-select`, `zs-form-group`
- `zs-alert`, `zs-badge`, `zs-modal`, `zs-accordion`, `zs-tabs`

Fonctionnalités JavaScript optionnelles : thème clair/sombre mémorisé, copie de
code avec solution de repli, playground interactif et respect de la préférence système.

## Developpement et controles

Sous PowerShell, si `npm` est bloque par la politique d'execution, utilise `npm.cmd`.

Premiere installation :

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

Controles locaux :

```powershell
npm.cmd start
npm.cmd run check
npm.cmd test
```

`npm.cmd start` lance un serveur local sur
[`http://127.0.0.1:4173/`](http://127.0.0.1:4173/). Le port peut être changé
avec `PORT=4174 npm.cmd start`.

`npm.cmd run check` verifie que le framework garde un seul fichier CSS public et que les pages HTML ne pointent pas vers d'anciens chemins CSS.

`npm.cmd test` ouvre les pages avec Playwright, controle le chargement de `zenstyle.css`, les images cassees, le debordement horizontal et les composants interactifs.

## Structure

- `zenstyle.css` : fichier public du framework.
- `README.md` : documentation d'installation et d'usage.
- `tests/` : tests Playwright.
- `scripts/check-framework.mjs` : controles statiques sans dependance navigateur.

Les pages publiques utilisent des noms ASCII (`icones.html`, `themes.html`) pour eviter les problemes d'encodage dans les outils, les URLs et les systemes de fichiers.

## Publication

Pour une utilisation dans un autre projet, le fichier indispensable est `zenstyle.css`. Pour publier le framework, conserver aussi `README.md`, `LICENSE`, `package.json`, `package-lock.json`, `scripts/` et `tests/` afin de garder les controles reproductibles.
