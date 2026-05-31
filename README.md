# Espressophia

Isometric coffee-town landing page (React + Vite).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy (Railway)

Railway uses the included `Dockerfile` (multi-stage: build with Vite, serve `dist/`
with `serve` on `$PORT`). `railway.json` selects the Dockerfile builder. No env vars
required.
