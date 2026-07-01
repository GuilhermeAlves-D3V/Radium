# AzuraCast

AzuraCast e a opcao recomendada para a camada de streaming/automaDJ da Radium. Nao vale a pena reconstruir esta parte de raiz no MVP.

## Estado local

Instalado localmente em Windows via Docker Desktop + WSL2:

- Distro WSL: `Ubuntu-22.04`
- Diretorio AzuraCast: `/var/azuracast`
- Canal: `stable`
- Painel local: `http://localhost`
- HTTP: `80`
- HTTPS: `443`
- SFTP: `2022`
- Primeiro porto de stream: `8000`

Na primeira visita a `http://localhost`, cria a conta de administrador do AzuraCast.

## Fluxo

```text
AzuraCast / AutoDJ -> Icecast -> RADIUM_STREAM_URL -> API Radium -> PWA
```

## Passos

1. Instalar AzuraCast num VPS ou maquina dedicada seguindo a documentacao oficial.
2. Criar uma estacao chamada `Radium`.
3. Ativar AutoDJ.
4. Carregar apenas audio autorizado.
5. Copiar o URL publico do mount point.
6. Definir esse URL em `RADIUM_STREAM_URL`.
7. Reiniciar a API.

## Comandos locais

Executar a partir do PowerShell:

```powershell
wsl -d Ubuntu-22.04 -u root -- bash -lc "cd /var/azuracast && docker compose ps"
```

Parar AzuraCast:

```powershell
wsl -d Ubuntu-22.04 -u root -- bash -lc "cd /var/azuracast && docker compose down"
```

Arrancar AzuraCast:

```powershell
wsl -d Ubuntu-22.04 -u root -- bash -lc "cd /var/azuracast && docker compose up -d"
```

Ver logs:

```powershell
wsl -d Ubuntu-22.04 -u root -- bash -lc "cd /var/azuracast && docker compose logs -f --tail=120"
```

Atualizar AzuraCast:

```powershell
wsl -d Ubuntu-22.04 -u root -- bash -lc "cd /var/azuracast && ./docker.sh update"
```

## Exemplo de URL

```bash
RADIUM_STREAM_URL=https://radio.exemplo.com/radio/8000/radium.mp3
```

## Notas

- Mantem o painel de AzuraCast protegido.
- Usa HTTPS no dominio final.
- Ativa backups do AzuraCast.
- Se o stream for publico, resolve licenciamento antes de promover a radio.
