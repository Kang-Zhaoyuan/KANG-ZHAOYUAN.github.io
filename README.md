# Zhaoyuan Kang · Portfolio
Bilingual Astro portfolio based on [BracoZS/astro-starter-portfolio](https://github.com/BracoZS/astro-starter-portfolio), MIT licensed.

## Development
Requires Node.js 22 and pnpm 10.
```sh
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

## Pages
The repository's `main` branch is left untouched during development. Merging the development branch requires switching GitHub Pages source to **GitHub Actions** (Settings → Pages → Build and deployment). The `deploy.yml` workflow deploys `dist/`. Review the branch and verify before merging.

## Projects and tools
Project content: `src/content/work/*.md`. Shared header/footer and homepage: `src/`. Legacy encoder: `public/translator/`.

## Media
`public/media/flipo-simulation.gif` is the selected 3D PPT animation and `public/media/cumcm-fvm.png` is the selected FVM control-volume illustration. Do not publish CUMCM repository history before reviewing third-party PDFs and any confidential material.
