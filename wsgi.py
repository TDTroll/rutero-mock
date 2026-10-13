"""Punto de entrada WSGI para produccion (Render / gunicorn).

En el modo CLI el hilo de rotacion del escenario lo arranca main(). Gunicorn
importa este modulo y no ejecuta main(), asi que aqui arrancamos ese hilo una
sola vez (usamos 1 worker, por eso es seguro).
"""

import threading

import roadmapMockOnline as mock

if not getattr(mock, "_rotation_thread_started", False):
    mock._rotation_thread_started = True
    threading.Thread(target=mock._rotation_loop, daemon=True).start()

app = mock.app
