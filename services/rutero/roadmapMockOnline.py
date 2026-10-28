#!/usr/bin/env python3
"""Mock HTTPS para el Roadmap 192x32 (modo online) con el MPC80T como principal."""
import argparse
import json
import os
import ssl
import threading
import time

from flask import Flask, Response, jsonify, redirect, request, send_file, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CERT_FILE = os.path.join(BASE_DIR, "cert.pem")
KEY_FILE = os.path.join(BASE_DIR, "key.pem")

WEB_DIR = os.path.join(BASE_DIR, "web")
STATIC_DIR = os.path.join(WEB_DIR, "static")
TEMPLATE_FILE = os.path.join(BASE_DIR, "config", "template1.json")
if not os.path.exists(TEMPLATE_FILE):
    TEMPLATE_FILE = os.path.join(BASE_DIR, "template1.json")

UI_JSON_DIR = BASE_DIR
alt_ui = os.path.join(os.path.dirname(BASE_DIR), "Web")
candidates = [
    BASE_DIR,
    os.path.join(BASE_DIR, "config"),
    os.path.join(os.path.dirname(BASE_DIR), "services", "rutero"),
    os.path.join(os.path.dirname(BASE_DIR), "services", "rutero", "config"),
    alt_ui,
    os.path.join(alt_ui, "config"),
    os.path.join(os.path.dirname(BASE_DIR), "UI Json"),
    "/home/actia/Aidriver/UI Json",
]
for c in candidates:
    if os.path.exists(os.path.join(c, "full.json")):
        UI_JSON_DIR = c
        break

PENTAGON_FILE = os.path.join(WEB_DIR, "pentagon.png")
if not os.path.exists(PENTAGON_FILE):
    PENTAGON_FILE = os.path.join(BASE_DIR, "pentagon.png")

app = Flask(__name__)

_current_dashboard_name = None
_current_dashboard_data = None
_current_dashboard_lock = threading.Lock()
    {
        "seconds": 8,
        "state": {
            "text": "PROXIMA PARADA",
            "color": "#FFA726",
            "fontScale": 1,
            "flipHorizontal": False,
            "flipVertical": False,
            "scrollDirection": "LEFT",
            "scrollOffset": 0,
        },
    },
    {
        "seconds": 8,
        "actions": [
            {"type": "setText", "text": "BIENVENIDOS A BORDO"},
            {"type": "setColor", "color": "#00FF00"},
            {"type": "setFontScale", "value": 1},
            {"type": "startScroll", "direction": "RIGHT"},
        ],
    },
    {
        "seconds": 6,
        "state": {
            "text": "PARADA SOLICITADA",
            "color": "#FF0000",
            "fontScale": 2,
            "scrollDirection": "NONE",
        },
    },
    {
        "seconds": 6,
        "actions": [
            {"type": "toggleFlipHorizontal"},
            {"type": "setText", "text": "ATENCION"},
            {"type": "increaseFont"},
        ],
    },
    {
        "seconds": 6,
        "actions": [
            {"type": "toggleFlipVertical"},
            {"type": "setFlipHorizontal", "enabled": False},
            {"type": "setText", "text": "PUERTA TRASERA"},
            {"type": "setColor", "color": "#00AEEF"},
        ],
    },
    {
        "seconds": 6,
        "state": {
            "text": "BUENOS DIAS",
            "color": "#FFA726",
            "fontScale": 1,
            "flipHorizontal": False,
            "flipVertical": False,
            "scrollDirection": "LEFT",
            "scrollOffset": 0,
        },
    },
    {
        "seconds": 4,
        "actions": [{"type": "clearText"}],
    },
    {
        "seconds": 8,
        "actions": [
            {"type": "setText", "text": "CUide su equipaje"},
            {"type": "setColor", "color": "#FFFF00"},
            {"type": "setFontScale", "value": 1},
            {"type": "startScroll", "direction": "LEFT"},
        ],
    },
]

_lock = threading.Lock()

# Estado "principal": lo que muestra el MPC80T. La app lo reporta via
# /api/report, de modo que el servidor se adapta al MPC80T. Las modificaciones
# que llegan de la web (/api/push) se encolan como deltas y la app las consume
# en orden desde /api/mod?since=..., confirmando con el propio `since` (ack).
_principal = {
    "text": "PROXIMA PARADA",
    "color": "#FFA726",
    "fontScale": 1,
    "flipHorizontal": False,
    "flipVertical": False,
}
_principal_rev = 0                       # sube en cada reporte del principal
_seq = int(time.time() * 1000)           # monotono entre reinicios
_queue = []                              # pendientes para el MPC80T (FIFO)
_step_index = 0
_paused = False


def _now_ms():
    return int(time.time() * 1000)


def _next_seq_locked():
    global _seq
    _seq += 1
    return _seq


# Campos del estado que el cliente Android parsea como Int. Si llega un float
# (p.ej. de una prueba manual), lo forzamos a int: una sola respuesta invalida
# rompe el parseo del cliente y, al no hacer ack, atasca la cola para siempre.
_INT_STATE_KEYS = ("fontScale", "scrollOffset")


def _sanitize_state(state):
    if not isinstance(state, dict):
        return state
    clean = dict(state)
    for key in _INT_STATE_KEYS:
        if key not in clean:
            continue
        value = clean[key]
        if isinstance(value, bool):
            continue
        if isinstance(value, float):
            clean[key] = int(round(value))
        elif isinstance(value, str):
            try:
                clean[key] = int(float(value))
            except ValueError:
                clean.pop(key, None)
    return clean


def _enqueue_state_locked(state):
    """Encola un delta de estado. Si el ultimo pendiente es estado puro, se
    fusiona (los estados son idempotentes); asi las acciones posteriores no se
    pierden ni se reordenan."""
    state = _sanitize_state(state)
    if not isinstance(state, dict) or not state:
        return None
    if _queue and "actions" not in _queue[-1] and "state" in _queue[-1]:
        _queue[-1]["state"].update(state)
        _queue[-1]["seq"] = _next_seq_locked()
        _queue[-1]["issuedAt"] = _now_ms()
        return _queue[-1]["seq"]
    seq = _next_seq_locked()
    _queue.append(
        {"seq": seq, "issuedAt": _now_ms(), "ttlMs": 0, "state": dict(state)}
    )
    return seq


def _enqueue_actions_locked(actions):
    if not isinstance(actions, list) or not actions:
        return None
    seq = _next_seq_locked()
    _queue.append(
        {"seq": seq, "issuedAt": _now_ms(), "ttlMs": 0, "actions": list(actions)}
    )
    return seq


def _advance():
    global _step_index
    with _lock:
        _step_index = (_step_index + 1) % len(SCENARIO)
        step = SCENARIO[_step_index]
        if "state" in step:
            _enqueue_state_locked(step["state"])
        if "actions" in step:
            _enqueue_actions_locked(step["actions"])
    print(f"[roadmap] paso={_step_index} dur={step['seconds']}s -> encolado", flush=True)


def _rotation_loop():
    while True:
        with _lock:
            duration = SCENARIO[_step_index]["seconds"]
        time.sleep(duration)
        with _lock:
            paused = _paused
        if paused:
            continue
        _advance()


@app.route("/")
def index():
    return redirect("/menu")


@app.route("/menu")
@app.route("/menu/")
def menu_page():
    menu_path = os.path.join(WEB_DIR, "menu.html")
    if os.path.exists(menu_path):
        return send_from_directory(WEB_DIR, "menu.html")
    with _lock:
        body = json.dumps(
            {
                "principal (MPC80T)": _principal,
                "pending_mods": len(_queue),
                "seq": _seq,
            },
            indent=2,
            ensure_ascii=False,
        )
    return Response(
        "<h3>Roadmap mock online</h3>"
        "<p><a href='/menu/rutero'>Panel RUTERO</a> &middot; "
        "<a href='/menu/ui'>Seleccionar UI JSON</a> &middot; "
        "<a href='/api/state'>/api/state</a></p>"
        f"<pre>{body}</pre>",
        mimetype="text/html",
    )


@app.route("/menu/rutero")
@app.route("/menu/rutero/")
@app.route("/rutero")
@app.route("/rutero/")
@app.route("/rutero/panel")
@app.route("/rutero/panel/")
def rutero_page():
    return send_from_directory(WEB_DIR, "index.html")


@app.route("/menu/ui")
@app.route("/menu/ui/")
def menu_ui_page():
    ui_path = os.path.join(WEB_DIR, "ui-select.html")
    if os.path.exists(ui_path):
        return send_from_directory(WEB_DIR, "ui-select.html")
    return send_from_directory(WEB_DIR, "menu.html")


@app.route("/rutero/static/<path:filename>")
def rutero_static(filename):
    return send_from_directory(STATIC_DIR, filename)


@app.route("/rutero/pentagon.png")
def rutero_pentagon():
    return send_file(PENTAGON_FILE, mimetype="image/png")


@app.route("/api/config")
def api_config():
    with open(TEMPLATE_FILE, encoding="utf-8") as fh:
        template = json.load(fh)
    dashboard = next(
        (
            d
            for d in template.get("dashboards", [])
            if str(d.get("title", "")).upper() == "RUTERO"
        ),
        None,
    )
    if dashboard is None:
        return jsonify({"error": "dashboard RUTERO no encontrado"}), 404
    items = []
    for item in dashboard.get("items", []):
        items.append(
            {
                "id": item.get("id"),
                "type": item.get("type"),
                "width": item.get("width", 0),
                "height": item.get("height", 0),
                "offsetX": item.get("offsetX", 0),
                "offsetY": item.get("offsetY", 0),
                "scale": item.get("scale", 1.0),
            }
        )
    return jsonify(
        {
            "title": dashboard.get("title"),
            "background": dashboard.get("background"),
            "width": dashboard.get("width", 1280),
            "height": dashboard.get("height", 704),
            "theme": template.get("theme", {}),
            "items": items,
        }
    )


@app.route("/api/ui-json/<path:filename>")
def api_ui_json(filename):
    """Sirve los archivos JSON de UI para cargar dashboards remotos (igual que rutero)."""
    safe_name = os.path.basename(filename)
    path = os.path.join(UI_JSON_DIR, safe_name)
    if not os.path.exists(path):
        return jsonify({"error": "archivo no encontrado", "name": safe_name}), 404
    return send_file(path, mimetype="application/json")


@app.route("/api/dashboard/remote")
def api_dashboard_remote():
    """Devuelve un JSON de dashboard remoto desde UI Json (full.json/pullman.json)."""
    name = request.args.get("name", "full")
    base = os.path.basename(name).replace(".json", "")
    safe_name = f"{base}.json"
    if safe_name not in ("full.json", "pullman.json"):
        safe_name = "full.json"
    path = os.path.join(UI_JSON_DIR, safe_name)
    if not os.path.exists(path):
        return jsonify({"error": "archivo no encontrado", "name": safe_name}), 404
    return send_file(path, mimetype="application/json")


@app.route("/api/dashboard/select", methods=["POST"])
def api_dashboard_select():
    """Selecciona un JSON de UI (full/pullman) para aplicarlo online a la app Android."""
    global _current_dashboard_name, _current_dashboard_data
    data = request.get_json(force=True, silent=True) or {}
    name = str(data.get("name") or data.get("dashboard") or "full")
    base = os.path.basename(name).replace(".json", "")
    safe_name = f"{base}.json"
    if safe_name not in ("full.json", "pullman.json"):
        return jsonify({"error": "solo se permite full.json o pullman.json"}), 400
    path = os.path.join(UI_JSON_DIR, safe_name)
    if not os.path.exists(path):
        return jsonify({"error": "archivo no encontrado", "name": safe_name}), 404
    try:
        with open(path, encoding="utf-8") as fh:
            dashboard_json = json.load(fh)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    with _current_dashboard_lock:
        _current_dashboard_name = base
        _current_dashboard_data = dashboard_json
    print(f"[ui-select] dashboard seleccionado: {base}", flush=True)
    return jsonify({"ok": True, "name": base, "url": f"/api/dashboard/active"})


@app.route("/api/dashboard/active")
def api_dashboard_active():
    """Devuelve el JSON de dashboard seleccionado online para la app Android."""
    with _current_dashboard_lock:
        if _current_dashboard_data is None:
            # Por defecto usar full.json si existe
            path = os.path.join(UI_JSON_DIR, "full.json")
            if os.path.exists(path):
                try:
                    with open(path, encoding="utf-8") as fh:
                        _current_dashboard_data = json.load(fh)
                    _current_dashboard_name = "full"
                except Exception:
                    pass
        if _current_dashboard_data is None:
            return jsonify({"error": "no hay dashboard seleccionado"}), 404
        return jsonify(_current_dashboard_data)


@app.route("/api/dashboard/list")
def api_dashboard_list():
    items = []
    for name in ("full.json", "pullman.json"):
        path = os.path.join(UI_JSON_DIR, name)
        if os.path.exists(path):
            items.append({"name": name.replace(".json", ""), "url": f"/api/dashboard/remote?name={name.replace('.json','')}"})
    return jsonify({"items": items, "active": _current_dashboard_name})


@app.route("/api/push", methods=["POST"])
def api_push():
    """La web envia aqui sus modificaciones (deltas de estado y/o acciones).
    Se encolan y el MPC80T las consume en orden desde /api/mod."""
    global _paused
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON invalido"}), 400
    with _lock:
        seq = None
        if isinstance(data.get("state"), dict):
            seq = _enqueue_state_locked(data["state"])
        if isinstance(data.get("actions"), list):
            seq = _enqueue_actions_locked(data["actions"])
        pending = len(_queue)
        _paused = True
    print(
        f"[web] push seq={seq} pending={pending} -> "
        f"{json.dumps(data, ensure_ascii=False)}",
        flush=True,
    )
    return jsonify({"ok": True, "seq": seq, "pending": pending})


@app.route("/api/resume", methods=["POST"])
def api_resume():
    """Reactiva la rotacion automatica de escenarios."""
    global _paused
    with _lock:
        _paused = False
    print("[web] rotacion reanudada", flush=True)
    return jsonify({"ok": True, "paused": _paused})


@app.route("/api/reset", methods=["POST"])
def api_reset():
    """Limpia la cola de mods pendientes. Util si un mensaje invalido la atasca
    (el cliente no hace ack y la cola crece sin fin)."""
    global _paused, _step_index
    with _lock:
        _queue.clear()
        _paused = False
        _step_index = 0
    print("[web] cola limpiada (/api/reset)", flush=True)
    return jsonify({"ok": True, "pending": len(_queue)})


@app.route("/api/mod")
def api_mod():
    """El MPC80T pide las mods pendientes con ?since=<ultimo seq aplicado>.
    El `since` hace de ack: se descarta lo ya consumido (un unico consumidor)."""
    try:
        since = int(request.args.get("since", "0"))
    except ValueError:
        since = 0
    with _lock:
        while _queue and _queue[0]["seq"] <= since:
            _queue.pop(0)
        messages = [m for m in _queue if m["seq"] > since]
        latest = _seq
    return jsonify({"seq": latest, "messages": messages})


@app.route("/api/report", methods=["POST"])
def api_report():
    """El MPC80T reporta su estado actual: pasa a ser el principal."""
    global _principal_rev
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON invalido"}), 400
    state = data.get("state", data)
    if isinstance(state, dict):
        with _lock:
            _principal.update({k: v for k, v in state.items() if v is not None})
            _principal_rev += 1
    return jsonify({"ok": True, "rev": _principal_rev})


@app.route("/api/state")
def api_state():
    """Estado principal (lo que muestra el MPC80T) para que la web lo adopte."""
    with _lock:
        return jsonify(
            {"rev": _principal_rev, "seq": _seq, "state": dict(_principal)}
        )


@app.route("/roadmap.json")
def roadmap():
    return api_state()


@app.route("/status")
def status():
    with _lock:
        return jsonify(
            {
                "seq": _seq,
                "step": _step_index,
                "paused": _paused,
                "principal": _principal,
                "pending_mods": len(_queue),
            }
        )


@app.route("/set", methods=["POST"])
def set_payload():
    """Compatibilidad: fija el principal con un payload completo."""
    global _principal_rev
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON invalido"}), 400
    state = data.get("state", data)
    with _lock:
        if isinstance(state, dict):
            _principal.update({k: v for k, v in state.items() if v is not None})
            _principal_rev += 1
    print(f"[roadmap] /set -> {json.dumps(_principal, ensure_ascii=False)}", flush=True)
    return jsonify({"ok": True, "rev": _principal_rev})


def main():
    parser = argparse.ArgumentParser(description="Mock HTTPS del Roadmap online")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8443)
    parser.add_argument("--cert", default=CERT_FILE)
    parser.add_argument("--key", default=KEY_FILE)
    parser.add_argument(
        "--once",
        action="store_true",
        help="Sirve un unico step sin rotar (step 0)",
    )
    parser.add_argument(
        "--no-tls",
        action="store_true",
        help="Sirve HTTP plano (sin TLS) para ponerlo detras de un tunel/proxy que termina el TLS",
    )
    args = parser.parse_args()

    if not args.once:
        threading.Thread(target=_rotation_loop, daemon=True).start()

    ssl_context = None
    scheme = "http"
    if not args.no_tls:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=args.cert, keyfile=args.key)
        ssl_context = context
        scheme = "https"

    print(f"[roadmap] {scheme.upper()} en {scheme}://{args.host}:{args.port}/", flush=True)
    if ssl_context is not None:
        print(f"[roadmap] cert={args.cert} key={args.key}", flush=True)
    app.run(host=args.host, port=args.port, ssl_context=ssl_context, threaded=True)


if __name__ == "__main__":
    main()
