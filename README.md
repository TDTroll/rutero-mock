# rutero-mock

Mock online del Roadmap 192x32 (MPC80T como principal) + web RUTERO.

El repositorio está organizado como monorepo de servicios. De momento solo
existe `rutero`; la idea es añadir después la base de datos, un servicio para
otras modificaciones de UI y un WAR de autenticación sin mezclar su código.

## Estructura

```text
.
├── services/
│   └── rutero/                  # Servicio actual (backend + web + config)
│       ├── roadmapMockOnline.py # Flask: API y estado en memoria
│       ├── wsgi.py              # Entrada para gunicorn
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── requirements-windows.txt
│       ├── serve_windows.py     # Arranque con waitress en Windows
│       ├── web/                 # Menú /rutero, panel /rutero/panel y assets
│       └── config/
│           └── template1.json
├── docker-compose.yml           # Entorno local
├── render.yaml                  # Despliegue Render (runtime Docker)
├── wsgi.py                      # Shim temporal para el Render Python anterior
├── requirements.txt             # Shim temporal para el Render Python anterior
├── run_windows.bat
└── run_windows_dev.bat
```

`wsgi.py` y `requirements.txt` de la raíz son solo compatibilidad transitoria:
permiten que el servicio Python que ya existe en Render siga arrancando aunque
todavía no se haya cambiado a Docker. El entrypoint real es
`services/rutero/wsgi.py`.

Cada servicio es autocontenido: su Dockerfile usa como contexto su propia
carpeta. Así se pueden añadir `services/ui`, `services/auth`, etc. sin tocar el
contenedor de `rutero`.

## Endpoints

- `GET /status` — estado del mock (healthcheck).
- `GET /api/state` / `GET /roadmap.json` — estado principal (lo reporta el MPC80T).
- `GET /api/mod?since=<seq>` — mods pendientes para el MPC80T (el `since` es el ack).
- `POST /api/report` — el MPC80T reporta su estado.
- `POST /api/push` — la web encola cambios.
- `GET /api/config` — configuración del dashboard RUTERO.
- `GET /rutero` — menú de módulos.
- `GET /rutero/panel` — página web con los widgets y el control del RUTERO.

## Docker local

```bash
docker compose up --build
```

Luego:

- Web: `http://localhost:8080/rutero`
- Health: `http://localhost:8080/status`

Para cambiar el puerto local: `RUTERO_PORT=9090 docker compose up --build`.

El contenedor sirve HTTP plano; en Render el TLS lo termina la plataforma. Para
TLS en el propio mock se puede usar el servidor de desarrollo con certificados
(ver más abajo).

## Render (Docker)

`render.yaml` define el servicio `rutero-mock` con runtime Docker:

- Build context: `services/rutero`
- Dockerfile: `services/rutero/Dockerfile`
- Healthcheck: `/status`
- Misma URL y misma ruta: `https://rutero-mock.onrender.com/rutero`

Notas:

- Se mantiene **1 worker** a propósito: el estado del mock vive en memoria.
  Para escalar a varios workers o instancias habrá que mover el estado a la
  base de datos.
- Si el servicio de Render ya existe y no está gestionado por el Blueprint,
  hay que cambiar su runtime a Docker en el dashboard (o redesplegar el
  servicio desde el Blueprint).
- Mientras siga en runtime Python, los shims `wsgi.py` y `requirements.txt` de
  la raíz permiten que el servicio anterior siga funcionando durante la
  transición.
- Las variables `RUTERO_WEB_DIR`, `RUTERO_TEMPLATE_FILE` y
  `RUTERO_PENTAGON_FILE` permiten sobrescribir las rutas; por defecto ya
  apuntan a las carpetas del contenedor.

## Variables de entorno

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `8080` | Puerto de gunicorn en Docker/Render. |
| `RUTERO_WEB_DIR` | `web/` | Carpeta de la web `/rutero`. |
| `RUTERO_TEMPLATE_FILE` | `config/template1.json` | Template del dashboard. |
| `RUTERO_PENTAGON_FILE` | `<web>/pentagon.png` | Imagen de fondo. |
| `RUTERO_CERT_FILE` | `cert.pem` | Certificado TLS (CLI). |
| `RUTERO_KEY_FILE` | `key.pem` | Clave TLS (CLI). |
| `MOCK_HOST` | `0.0.0.0` | Host de waitress en Windows. |
| `MOCK_PORT` | `8080` | Puerto de waitress en Windows. |

Las rutas relativas se resuelven contra `services/rutero` (o `/app` dentro del
contenedor).

### TLS en local

El CLI sigue aceptando certificados:

```bash
cd services/rutero
python roadmapMockOnline.py --host 0.0.0.0 --port 8443 --cert cert.pem --key key.pem
```

Los ficheros `cert.pem` y `key.pem` no se versionan.

## Windows

En Windows **gunicorn no existe**; el equivalente es `waitress` (mismo modelo:
un proceso con varios hilos, porque el estado vive en memoria).

Requisitos: **Python 3.9+** instalado y en el PATH.

Forma fácil (doble clic desde la raíz del repo):

- `run_windows.bat` → instala Flask+waitress y arranca en `http://0.0.0.0:8080/rutero`.
- `run_windows_dev.bat` → servidor de desarrollo de Flask, mismo comando que el
  original en Linux: `python roadmapMockOnline.py --host 0.0.0.0 --port 8080 --no-tls`.

Forma manual (PowerShell / CMD):

```bat
cd services\rutero
py -3 -m pip install -r requirements-windows.txt
py -3 serve_windows.py 8080
```

Luego, desde el MPC80T o un navegador:

- Web: `http://<IP-DEL-PC-WINDOWS>:8080/rutero`
- Health: `http://<IP-DEL-PC-WINDOWS>:8080/status`

Notas:

- **Firewall**: la primera vez Windows preguntará o bloqueará el puerto 8080;
  permite "Redes privadas" (o abre el puerto manualmente). Si el MPC80T no
  conecta, casi siempre es esto. Para abrirlo:
  `netsh advfirewall firewall add rule name="rutero-mock 8080" dir=in action=allow protocol=TCP localport=8080`
- Para cambiar el puerto: `py -3 serve_windows.py 9090` (y ajusta la URL del APK).
- No hace falta configurar rutas: `template1.json`, `pentagon.png` y `web/`
  viven dentro de `services/rutero`.

## Futuro (modular)

La estructura está pensada para crecer sin rehacer el servicio actual:

- `services/ui` — otras modificaciones de UI.
- `services/auth` — WAR de autenticación (por ejemplo, Tomcat).
- `db` — PostgreSQL en `docker-compose.yml` y Render Postgres en producción.
- En Render, cada contenedor es un servicio independiente; la base de datos
  puede ser un recurso gestionado y `auth` puede desplegarse como su propio
  servicio Docker con el WAR.
