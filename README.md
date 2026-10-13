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

## Windows

En Windows **gunicorn no existe**; el equivalente es `waitress` (mismo modelo:
un proceso con varios hilos, porque el estado vive en memoria).

Requisitos: **Python 3.9+** instalado y en el PATH.

Forma facil (doble clic):

- `run_windows.bat` → instala Flask+waitress y arranca en `http://0.0.0.0:8080/rutero`.
- `run_windows_dev.bat` → servidor de desarrollo de Flask, mismo comando que el
  original en Linux: `python roadmapMockOnline.py --host 0.0.0.0 --port 8080 --no-tls`.

Forma manual (PowerShell / CMD):

```bat
py -3 -m pip install -r requirements-windows.txt
py -3 serve_windows.py 8080
```

Luego, desde el MPC80T o un navegador:

- Web: `http://<IP-DEL-PC-WINDOWS>:8080/rutero`
- Health: `http://<IP-DEL-PC-WINDOWS>:8080/status`

Notas:

- **Firewall**: la primera vez Windows preguntara o bloqueara el puerto 8080;
  permite "Redes privadas" (o abre el puerto manualmente). Si el MPC80T no
  conecta, es casi siempre esto. Para abrirlo:
  `netsh advfirewall firewall add rule name="rutero-mock 8080" dir=in action=allow protocol=TCP localport=8080`
- Para cambiar el puerto: `py -3 serve_windows.py 9090` (y ajusta la URL del APK).
- **HTTPS**: `serve_windows.py` sirve HTTP plano. Si necesitas TLS en el propio
  mock (sin tunel delante), usa el servidor de desarrollo con
  `python roadmapMockOnline.py --port 8443 --cert cert.pem --key key.pem`.
- Los datos `template1.json`, `pentagon.png` y `rutero/` van junto al `.py`
  (ya estan en este repo); no hace falta configurar rutas.
