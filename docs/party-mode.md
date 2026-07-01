# Party mode local

Radium esta pensado para uma festa em casa: o AzuraCast toca a radio, a PWA e a API Radium correm no teu PC, e os convidados entram pelo telemovel enquanto estiverem na tua rede Wi-Fi.

## Como arrancar

1. Liga o AzuraCast no Docker.
2. Confirma que o stream abre no PC: `http://192.168.0.12/listen/radium/radio.mp3`.
3. Confirma `apps/api/.env`:

```bash
HOST=0.0.0.0
PORT=4100
RADIUM_PUBLIC_URL=http://192.168.0.12:5173
RADIUM_STREAM_URL=http://192.168.0.12/listen/radium/radio.mp3
AZURACAST_NOW_PLAYING_URL=http://localhost/api/nowplaying/radium
AZURACAST_BASE_URL=http://localhost
AZURACAST_STATION_ID=radium
RADIUM_ADMIN_PIN=2468
```

4. Arranca a app:

```bash
npm run dev
```

5. No telemovel, ligado ao mesmo Wi-Fi, abre:

```text
http://192.168.0.12:5173
```

## Pedidos de musica

Qualquer pessoa pode enviar uma sugestao pela PWA. O pedido fica guardado em `apps/api/data/party-queue.json`, que nao entra no Git.

No painel `Admin deck`, o PIN local permite:

- aprovar pedidos para a fila social;
- subir/descer pedidos;
- marcar como tocado;
- remover pedidos;
- limpar a fila;
- fazer skip real no AzuraCast, se houver `AZURACAST_API_KEY`.

## Limite importante

A fila social do Radium controla a ordem dos pedidos dentro da PWA. Ela nao reordena automaticamente a fila interna do AzuraCast, porque a API do AzuraCast exposta nesta instalacao permite ver/apagar fila e fazer skip, mas nao oferece uma acao simples para reordenar qualquer faixa.

Para controlo real total tens duas opcoes:

- usar a fila social como lista de DJ e adicionar/tocar manualmente no AzuraCast;
- configurar uma API key do AzuraCast para pelo menos permitir `skip live` pela PWA.

## O que nao fazer

- Nao uses Vercel para o modo festa local. Vercel nao consegue falar com o teu `localhost` nem com `192.168.x.x` da tua casa.
- Nao mudes de rede Wi-Fi durante a festa; se o IP do PC mudar, o link deixa de funcionar.
- Nao feches o Docker, o AzuraCast, o terminal do `npm run dev`, nem desligues/suspende o PC.
- Nao uses musicas comerciais fora de contexto privado sem confirmares licenciamento.
