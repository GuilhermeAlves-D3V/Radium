# Deploy na Vercel

Este repo esta preparado para publicar a PWA da Radium na Vercel.

## O que vai para a Vercel

- Frontend PWA: `apps/web`
- Build output: `apps/web/dist`
- API serverless: `api/*`
- Dados seed: `apps/api/data/*.json`

O servidor Fastify em `apps/api` continua util para desenvolvimento local e para uma futura API persistente. Na Vercel, as rotas serverless em `api/*` expõem uma versao compativel dos mesmos dados.

## Configuracao do projeto

Quando importares o repo na Vercel, usa:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build -w @radium/web
Output Directory: apps/web/dist
```

O ficheiro `vercel.json` ja define estes valores.

## Variaveis de ambiente

Para publicar em modo demo, nao precisas de variaveis.

Para ligar a um stream real:

```bash
RADIUM_STREAM_URL=https://teu-dominio-ou-ip/radio/8000/radio.mp3
```

Opcional:

```bash
RADIUM_PUBLIC_URL=https://radium.vercel.app
```

Nao uses `localhost` na Vercel para o stream, porque `localhost` dentro da Vercel aponta para a propria funcao serverless, nao para o teu PC.

## Fluxo recomendado

1. Publicar o repo no GitHub.
2. Importar o repo na Vercel.
3. Fazer primeiro deploy em modo demo.
4. Configurar AzuraCast local ou num VPS.
5. Obter o URL publico do stream.
6. Definir `RADIUM_STREAM_URL` na Vercel.
7. Fazer redeploy.

## Limites atuais

- Os eventos de escuta em `api/listener-events` sao aceites, mas nao ficam persistidos na Vercel.
- Para analytics real, usa uma base de dados externa ou Vercel KV/Postgres.
- Para conteudo editavel, substitui os JSON por uma base de dados ou CMS.

