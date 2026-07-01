# Modelo de conteudo

## Entidades

- Estacao: identidade, estado, stream e informacao operacional.
- Faixa: metadados editoriais, duracao, genero, energia e origem.
- Playlist: agrupamento de faixas para rotacao.
- Programa: bloco editorial com host, descricao e playlist padrao.
- Grelha: associacao entre dia, hora, programa e playlist.
- Evento de escuta: play, pause, heartbeat, install e erro.

## Principio atual

O MVP usa JSON para ser simples de editar. A API ja isola esse detalhe, por isso migrar para base de dados mais tarde nao exige reescrever a PWA.

## Migracao futura para PostgreSQL

Tabelas provaveis:

- `stations`
- `tracks`
- `playlists`
- `playlist_tracks`
- `programs`
- `schedule_blocks`
- `listener_events`
- `users`
- `sponsors`

