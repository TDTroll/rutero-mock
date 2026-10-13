# rutero-mock

Mock online del Roadmap 192x32 (MPC80T como principal) + web RUTERO.

- `GET /status` — estado del mock (healthcheck).
- `GET /api/state` / `GET /roadmap.json` — estado principal (lo reporta el MPC80T).
- `GET /api/mod?since=<seq>` — mods pendientes para el MPC80T (el `since` es el ack).
- `POST /api/report` — el MPC80T reporta su estado.
- `POST /api/push` — la web encola cambios.
- `GET /rutero` — pagina web con los widgets.

## Despliegue (Render, gratis)

Blueprint con `render.yaml`:

- Build: `pip install -r requirements.txt`
- Start: `gunicorn wsgi:app --workers 1 --threads 8 --bind 0.0.0.0:$PORT`
- 1 worker a proposito: el estado vive en memoria.
