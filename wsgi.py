"""Shim de compatibilidad para el despliegue Python de Render.

El servicio real esta en services/rutero. Este archivo mantiene funcionando el
startCommand antiguo (`gunicorn wsgi:app`) mientras el servicio de Render se
migra a Docker. La imagen Docker no usa este shim: usa services/rutero/wsgi.py.
"""

import importlib.util
import os
import sys

SERVICE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "services", "rutero"
)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

SPEC = importlib.util.spec_from_file_location(
    "rutero_service_wsgi", os.path.join(SERVICE_DIR, "wsgi.py")
)
if SPEC is None or SPEC.loader is None:
    raise ImportError(f"No se pudo cargar {SERVICE_DIR}/wsgi.py")

MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

app = MODULE.app
