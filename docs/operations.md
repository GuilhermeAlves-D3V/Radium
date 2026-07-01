# Operacao Radium

## Checklist diaria

- Confirmar que a API responde em `/health`.
- Confirmar que a PWA carrega no browser e no telemovel.
- Confirmar que o stream toca quando `RADIUM_STREAM_URL` esta definido.
- Verificar grelha do dia em `apps/api/data/schedule.json`.
- Verificar conteudo novo antes de entrar em rotacao.
- Guardar copias dos ficheiros em `apps/api/data`.

## Falhas

- Se a PWA abre mas nao toca, verificar `RADIUM_STREAM_URL`.
- Se o player falha em mobile, confirmar HTTPS no dominio final.
- Se o telemovel nao abre a PWA local, confirmar que esta no mesmo Wi-Fi, que `npm run dev` esta ativo e que o firewall do Windows permite as portas `5173` e `4100`.
- Se o admin consegue ordenar pedidos mas a musica real nao muda, isso e esperado sem controlo manual no AzuraCast ou `AZURACAST_API_KEY` para skip.
- Se a API nao arranca, correr `npm run dev:api` e ler o erro.
- Se o build falha, correr `npm run typecheck`.

## Backups

Guardar regularmente:

- `apps/api/data/*.json`
- `apps/web/public/assets/*`
- `.env` de producao
- configuracao do AzuraCast

## Evolucao tecnica

Quando o projeto crescer, os proximos passos naturais sao:

- PostgreSQL para substituir JSON.
- Painel admin autenticado.
- Importador de playlists.
- Logs de audiencia agregados.
- Jobs para sincronizar metadados com AzuraCast.
- Backups automaticos.
