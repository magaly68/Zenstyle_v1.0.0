import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'test-results' || entry.name === 'playwright-report') {
      continue;
    }

    if (fullPath.includes(`Framework CSS personnalisÃ©_files${path.sep}`)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isExternal(ref) {
  return /^(https?:)?\/\//i.test(ref) || /^(mailto:|tel:|#)/i.test(ref);
}

function normalizeRef(ref) {
  return ref.split('#')[0].split('?')[0];
}

const files = walk(root);
const cssFiles = files.filter((file) => file.endsWith('.css'));
const expectedCss = path.join(root, 'zenstyle.css');

if (cssFiles.length !== 1 || cssFiles[0] !== expectedCss) {
  failures.push(`Expected exactly one public CSS file (${expectedCss}), found: ${cssFiles.join(', ') || 'none'}`);
}

if (!fs.existsSync(expectedCss)) {
  failures.push('Missing zenstyle.css at project root.');
} else {
  const css = fs.readFileSync(expectedCss, 'utf8');
  const invalidCssPatterns = [
    { label: 'nested pseudo selector &:...', pattern: /&:/ },
    { label: 'nested modifier &--...', pattern: /&--/ },
    { label: 'nested element &__...', pattern: /&__/ },
    { label: 'Sass darken(...) function', pattern: /darken\(/ },
    { label: 'CSS variable used without var(...)', pattern: /(?:background-color|border-color)\s*:\s*--/ }
  ];

  for (const { label, pattern } of invalidCssPatterns) {
    if (pattern.test(css)) {
      failures.push(`Invalid CSS syntax detected in zenstyle.css: ${label}`);
    }
  }
}

const htmlFiles = files.filter((file) => file.endsWith('.html') && path.basename(file) !== 'Framework CSS personnalisÃ©.html');

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.trim()) {
    continue;
  }

  const relative = path.relative(root, file);
  const localCssLinks = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => !isExternal(href));

  if (localCssLinks.length === 0) {
    failures.push(`${relative}: missing local stylesheet link to zenstyle.css`);
  }

  for (const href of localCssLinks) {
    if (!href.endsWith('zenstyle.css')) {
      failures.push(`${relative}: local stylesheet must point to zenstyle.css, got ${href}`);
    }

    const resolved = path.resolve(path.dirname(file), normalizeRef(href));
    if (!fs.existsSync(resolved)) {
      failures.push(`${relative}: stylesheet not found: ${href}`);
    }
  }

  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    const ref = match[1];
    const cleanRef = normalizeRef(ref);
    if (!cleanRef || isExternal(cleanRef) || cleanRef.startsWith('javascript:')) {
      continue;
    }

    const resolved = path.resolve(path.dirname(file), cleanRef);
    if (!fs.existsSync(resolved)) {
      failures.push(`${relative}: local reference not found: ${ref}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`ZenStyle checks passed: ${htmlFiles.length} HTML files, 1 CSS entry point.`);