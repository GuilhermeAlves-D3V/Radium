# Radium

Radium e um ecossistema pessoal para radio online: PWA, backend, grelha, programas, playlists seed e base operacional para ligar mais tarde a um stream real.

## Stack

- `apps/api`: Fastify + TypeScript, dados locais em JSON.
- `apps/web`: React + Vite + TypeScript, PWA instalavel.
- `ops`: notas para AzuraCast, reverse proxy e deploy.

## Arranque local

```bash
npm install
npm run dev
```

URLs principais:

- PWA: `http://localhost:5173`
- API: `http://localhost:4100`
- Healthcheck: `http://localhost:4100/health`

## Ligar um stream real

Enquanto `RADIUM_STREAM_URL` estiver vazio, a PWA fica em modo demo: mostra a rotacao e a grelha, mas nao toca audio.

Cria `apps/api/.env` a partir de `apps/api/.env.example` e define:

```bash
RADIUM_STREAM_URL=https://teu-servidor/radio/8000/radio.mp3
RADIUM_PUBLIC_URL=http://localhost:5173
```

Depois reinicia:

```bash
npm run dev
```

## Build

```bash
npm run build
npm run start
```

Em producao, a API serve tambem o build da PWA em `apps/web/dist`.

## Deploy na Vercel

O repo inclui `vercel.json` e endpoints serverless em `api/*`, por isso a PWA consegue usar `/api/bootstrap`, `/api/now-playing`, `/api/schedule` e restantes rotas tambem na Vercel.

Config recomendada na Vercel:

- Framework Preset: `Vite`
- Build Command: `npm run build -w @radium/web`
- Output Directory: `apps/web/dist`
- Install Command: `npm install`

Variavel opcional para ligar audio real:

```bash
RADIUM_STREAM_URL=http://localhost:8000/radio/8000/radio.mp3
```

Para um deploy publico real, usa um URL acessivel pela internet, nao `localhost`.

Mais detalhes: `docs/deploy-vercel.md`.

## Conteudo inicial

Os dados seed vivem em `apps/api/data`:

- `station.json`: identidade e configuracao da Radium.
- `tracks.json`: faixas placeholder, sem audio incluido.
- `playlists.json`: rotacoes iniciais.
- `programs.json`: programas.
- `schedule.json`: grelha semanal.

## Nota legal

O projeto esta configurado como hobby pessoal. Antes de uma emissao publica com musica comercial, confirma licencas e enquadramento com as entidades relevantes em Portugal. Mantem o stream privado ou usa conteudo autorizado ate isso estar resolvido.
