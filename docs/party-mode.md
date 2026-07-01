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
AZURACAST_API_KEY=<api-key-do-azuracast>
RADIUM_ADMIN_PIN=<codigo-admin>
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

O acesso de gestao fica em:

```text
http://192.168.0.12:5173/admin
```

O PIN local permite:

- aprovar pedidos para a fila social;
- subir/descer pedidos;
- marcar como tocado;
- remover pedidos;
- limpar a fila;
- fazer skip real no AzuraCast, se houver `AZURACAST_API_KEY`.

## Como uma sugestao passa a tocar

As sugestoes da PWA sao texto livre. Elas nao criam audio novo e nao fazem download de musica.

Para uma sugestao tocar automaticamente, a faixa tem de existir no AzuraCast como ficheiro na biblioteca da estacao e estar disponivel numa playlist/requestable queue que o AzuraCast consiga tocar.

Com `AZURACAST_API_KEY` configurada, a secao `Proximas 5` mostra a fila real do AzuraCast. A fila social fica no `/admin` como lista de pedidos aprovados pelo admin.

Quando a faixa ainda nao existe na biblioteca, o fluxo e manual:

1. convidado sugere a musica;
2. admin ve a sugestao em `/admin`;
3. admin adiciona/upload a faixa no AzuraCast, se for para tocar;
4. admin usa a fila social como ordem de referencia.

## Limite importante

A fila social do Radium controla a ordem dos pedidos dentro da PWA. Ela nao reordena automaticamente a fila interna do AzuraCast, porque a API do AzuraCast exposta nesta instalacao permite ver/apagar fila e fazer skip, mas nao oferece uma acao simples para reordenar qualquer faixa.

Para controlo real total tens duas opcoes:

- usar a fila social como lista de DJ e adicionar/tocar manualmente no AzuraCast;
- configurar uma API key do AzuraCast para permitir `skip live` pela PWA e ler a fila real quando a API permite.

## O que nao fazer

- Nao uses Vercel para o modo festa local. Vercel nao consegue falar com o teu `localhost` nem com `192.168.x.x` da tua casa.
- Nao mudes de rede Wi-Fi durante a festa; se o IP do PC mudar, o link deixa de funcionar.
- Nao feches o Docker, o AzuraCast, o terminal do `npm run dev`, nem desligues/suspende o PC.
- Nao uses musicas comerciais fora de contexto privado sem confirmares licenciamento.
