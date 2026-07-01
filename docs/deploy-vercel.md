# Deploy na Vercel

Este repo esta preparado para publicar a PWA da Radium na Vercel.

## O que vai para a Vercel

- Frontend PWA: `apps/web`
- Build output: `apps/web/dist`
- API serverless: `api/*`
- Dados seed: `apps/api/data/*.json`

O servidor Fastify em `apps/api` continua util para desenvolvimento local e para uma futura API persistente. Na Vercel, as rotas serverless em `api/*` expoem uma versao compativel dos mesmos dados.

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
AZURACAST_NOW_PLAYING_URL=https://teu-azuracast-publico/api/nowplaying/radium
```

Se nao quiseres usar os metadados do AzuraCast e quiseres so forcar audio:

```bash
RADIUM_STREAM_URL=https://teu-azuracast-publico/listen/radium/radio.mp3
```

Opcional:

```bash
RADIUM_PUBLIC_URL=https://radium.vercel.app
```

Nao uses `localhost` na Vercel para o stream ou para `AZURACAST_NOW_PLAYING_URL`, porque `localhost` dentro da Vercel aponta para a propria funcao serverless, nao para o teu PC.

## Fluxo recomendado

1. Publicar o repo no GitHub.
2. Importar o repo na Vercel.
3. Fazer primeiro deploy em modo demo.
4. Configurar AzuraCast local ou num VPS.
5. Obter o endpoint publico `api/nowplaying/radium`.
6. Definir `AZURACAST_NOW_PLAYING_URL` na Vercel.
7. Fazer redeploy.

## Limites atuais

- Os eventos de escuta em `api/listener-events` sao aceites, mas nao ficam persistidos na Vercel.
- O modo festa com pedidos/admin e local-first. Na Vercel, os pedidos nao sao uma fila partilhada persistente sem uma base de dados externa.
- Para analytics real, usa uma base de dados externa ou Vercel KV/Postgres.
- Para conteudo editavel, substitui os JSON por uma base de dados ou CMS.
