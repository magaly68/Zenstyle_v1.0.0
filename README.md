# ZenStyle

ZenStyle est un framework CSS leger, en un seul fichier public : `zenstyle.css`.

## Utilisation

Ajoute le fichier CSS dans ton projet :

```html
<link rel="stylesheet" href="zenstyle.css">
```

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

## Convention

Les classes publiques du framework utilisent le prefixe `zs-` pour limiter les collisions avec les styles des projets utilisateurs.

Classes principales :

- `zs-container`, `zs-row`, `zs-col`, `zs-grid`
- `zs-btn`, `zs-btn-primary`, `zs-btn-secondary`, `zs-btn-success`, `zs-btn-danger`
- `zs-card`, `zs-card-header`, `zs-card-body`, `zs-card-footer`
- `zs-input`, `zs-textarea`, `zs-select`, `zs-form-group`
- `zs-alert`, `zs-badge`, `zs-modal`, `zs-accordion`, `zs-tabs`

## Fiabilisation

Installe les outils de test :

```powershell
npm install
npm install -D @playwright/test
npx playwright install
```

Puis lance les controles :

```powershell
npm run check
npm test
```

`npm run check` verifie que le framework garde un seul fichier CSS public et que les pages HTML ne pointent pas vers d'anciens chemins CSS.

`npm test` ouvre les pages avec Playwright, controle le chargement de `zenstyle.css`, les images cassees, le debordement horizontal et les composants interactifs.

## Structure recommandee

- `zenstyle.css` : fichier public du framework.
- `README.md` : documentation d'installation et d'usage.
- `tests/` : tests Playwright.
- `scripts/check-framework.mjs` : controles statiques sans dependance.

Avant publication, supprimer les exports temporaires, les pages vides et les doublons historiques.
## Noms de fichiers

Les pages publiques utilisent des noms ASCII (icones.html, 	hemes.html) pour eviter les problemes d'encodage dans les outils, les URLs et les systemes de fichiers.
