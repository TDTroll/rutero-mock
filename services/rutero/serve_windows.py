"""Arranque del mock en Windows con waitress.

En Linux/Render se usa gunicorn (`gunicorn wsgi:app`). gunicorn no funciona en
Windows, asi que aqui usamos waitress, que hace lo mismo: un unico proceso con
varios hilos (el estado del mock vive en memoria, por eso NO hay que lanzar
varios workers).

Uso:
    python serve_windows.py [puerto]

Variables de entorno opcionales:
    MOCK_HOST   (por defecto 0.0.0.0)
    MOCK_PORT   (por defecto 8080)
"""

import os
import sys
import threading

# Consola en UTF-8 para que los acentos no revienten con el code page de Windows.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

import waitress  # noqa: E402

import roadmapMockOnline as mock  # noqa: E402

# El hilo de rotacion del escenario lo arranca main() en modo CLI; aqui lo
# arrancamos una sola vez (igual que hace wsgi.py con gunicorn).
if not getattr(mock, "_rotation_thread_started", False):
    mock._rotation_thread_started = True
    threading.Thread(target=mock._rotation_loop, daemon=True).start()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("MOCK_PORT", "8080"))
    host = os.environ.get("MOCK_HOST", "0.0.0.0")
    print(f"[roadmap] HTTP (waitress) en http://{host}:{port}/", flush=True)
    print(f"[roadmap] web RUTERO: http://<IP-de-este-PC>:{port}/rutero", flush=True)
    waitress.serve(mock.app, host=host, port=port, threads=8)


if __name__ == "__main__":
    main()
