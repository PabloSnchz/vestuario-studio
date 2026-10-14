#!/usr/bin/env python3
"""
server.py - Servidor local de Vestuario Studio
- Sirve los archivos estaticos del proyecto
- Endpoints API para leer/escribir JSON y subir imagenes
- Sin dependencias externas (solo stdlib de Python)
"""

import http.server
import json
import os
import subprocess
import sys
import urllib.parse
import webbrowser
import threading
import time
import base64
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent.resolve()
PORT = 8000

WRITABLE = ['data', 'assets']
READABLE = ['data', 'assets', 'js', 'css', 'templates', 'server']


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        pass

    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json_response(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._set_cors()
        self.end_headers()
        self.wfile.write(body)

    def _safe_path(self, rel_path, writable=False):
        rel_path = rel_path.strip().lstrip('/').replace('\\', '/')
        if not rel_path:
            return None
        full = (ROOT / rel_path).resolve()
        try:
            full.relative_to(ROOT)
        except ValueError:
            return None
        first = rel_path.split('/')[0]
        permitidas = WRITABLE if writable else READABLE
        if first not in permitidas and rel_path not in permitidas:
            return None
        return full

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/status':
            self._status()
            return
        if path == '/api/read':
            self._read(query.get('path', [''])[0])
            return

        super().do_GET()

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        if parsed.path == '/api/write':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                self._write(query.get('path', [''])[0], data)
            except Exception as e:
                self._json_response({'error': str(e)}, 400)
            return
        self._json_response({'error': 'No encontrado'}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)

        if parsed.path == '/api/upload':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                self._upload(query.get('path', [''])[0], data.get('content', ''))
            except Exception as e:
                self._json_response({'error': str(e)}, 400)
            return

        if parsed.path == '/api/backup':
            self._backup()
            return

        if parsed.path == '/api/update':
            self._update()
            return

        if parsed.path == '/api/check-update':
            self._check_update()
            return

        self._json_response({'error': 'No encontrado'}, 404)

    def _read(self, rel_path):
        full = self._safe_path(rel_path)
        if not full or not full.exists():
            self._json_response({'error': 'No existe: ' + rel_path}, 404)
            return
        try:
            content = full.read_text(encoding='utf-8')
            self._json_response({'content': content, 'path': rel_path})
        except Exception as e:
            self._json_response({'error': str(e)}, 500)

    def _write(self, rel_path, data):
        full = self._safe_path(rel_path, writable=True)
        if not full:
            self._json_response({'error': 'Path no permitido: ' + rel_path}, 403)
            return
        try:
            full.parent.mkdir(parents=True, exist_ok=True)
            full.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
            self._json_response({'ok': True, 'path': rel_path})
        except Exception as e:
            self._json_response({'error': str(e)}, 500)

    def _upload(self, rel_path, base64_content):
        full = self._safe_path(rel_path, writable=True)
        if not full:
            self._json_response({'error': 'Path no permitido: ' + rel_path}, 403)
            return
        try:
            full.parent.mkdir(parents=True, exist_ok=True)
            full.write_bytes(base64.b64decode(base64_content))
            self._json_response({'ok': True, 'path': rel_path})
        except Exception as e:
            self._json_response({'error': str(e)}, 500)

    def _status(self):
        try:
            result = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=str(ROOT),
                capture_output=True, text=True, timeout=5
            )
            cambios = len([l for l in result.stdout.strip().split('\n') if l.strip()])
            log = subprocess.run(
                ['git', 'log', '-1', '--format=%h|%ci|%s'],
                cwd=str(ROOT),
                capture_output=True, text=True, timeout=5
            )
            partes = log.stdout.strip().split('|')
            self._json_response({
                'ok': True,
                'root': str(ROOT),
                'pendientes': cambios,
                'ultimo_commit': {
                    'hash': partes[0] if len(partes) > 0 else '',
                    'fecha': partes[1] if len(partes) > 1 else '',
                    'mensaje': partes[2] if len(partes) > 2 else '',
                }
            })
        except Exception as e:
            self._json_response({'ok': False, 'error': str(e)}, 500)

    def _check_update(self):
        try:
            # Fetch silencioso de origin
            subprocess.run(
                ['git', 'fetch', 'origin', 'main'],
                cwd=str(ROOT), capture_output=True, text=True, timeout=30
            )
            # Contar commits de diferencia
            result = subprocess.run(
                ['git', 'rev-list', '--count', 'HEAD..origin/main'],
                cwd=str(ROOT), capture_output=True, text=True, timeout=10
            )
            pendientes = 0
            try:
                pendientes = int(result.stdout.strip())
            except Exception:
                pendientes = 0

            # Traer el mensaje del ultimo commit remoto
            ultimo = ''
            if pendientes > 0:
                log = subprocess.run(
                    ['git', 'log', 'origin/main', '-1', '--format=%s'],
                    cwd=str(ROOT), capture_output=True, text=True, timeout=5
                )
                ultimo = log.stdout.strip()

            self._json_response({
                'ok': True,
                'hayCambios': pendientes > 0,
                'pendientes': pendientes,
                'ultimoMensaje': ultimo,
            })
        except Exception as e:
            self._json_response({'ok': False, 'error': str(e), 'hayCambios': False, 'pendientes': 0}, 200)

    def _update(self):
        try:
            result = subprocess.run(
                ['git', 'pull'],
                cwd=str(ROOT), capture_output=True, text=True, timeout=60
            )
            if result.returncode != 0:
                self._json_response({'ok': False, 'error': result.stderr or result.stdout}, 500)
                return
            salida = result.stdout.strip()
            hayCambios = 'Already up to date' not in salida and 'Ya esta actualizado' not in salida
            self._json_response({
                'ok': True,
                'hayCambios': hayCambios,
                'mensaje': 'Actualizado' if hayCambios else 'Ya estas en la ultima version',
                'salida': salida
            })
        except Exception as e:
            self._json_response({'ok': False, 'error': str(e)}, 500)

    def _backup(self):
        try:
            subprocess.run(['git', 'add', '.'], cwd=str(ROOT), check=True, timeout=30)
            status = subprocess.run(
                ['git', 'status', '--porcelain'],
                cwd=str(ROOT), capture_output=True, text=True, timeout=5
            )
            if not status.stdout.strip():
                self._json_response({'ok': True, 'mensaje': 'Sin cambios para commitear'})
                return
            msg = 'Backup ' + datetime.now().strftime('%Y-%m-%d %H:%M')
            subprocess.run(['git', 'commit', '-m', msg], cwd=str(ROOT), check=True, timeout=30)
            push = subprocess.run(
                ['git', 'push'],
                cwd=str(ROOT), capture_output=True, text=True, timeout=60
            )
            if push.returncode != 0:
                self._json_response({'ok': False, 'error': 'Error en push: ' + push.stderr}, 500)
                return
            self._json_response({'ok': True, 'mensaje': 'Backup exitoso'})
        except Exception as e:
            self._json_response({'ok': False, 'error': str(e)}, 500)


def abrir_navegador():
    time.sleep(1.5)
    webbrowser.open('http://localhost:' + str(PORT))


def main():
    os.chdir(str(ROOT))
    threading.Thread(target=abrir_navegador, daemon=True).start()

    server = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print('')
    print('  ========================================')
    print('   Vestuario Studio - Servidor local')
    print('  ========================================')
    print('')
    print('   Root:     ' + str(ROOT))
    print('   URL:      http://localhost:' + str(PORT))
    print('')
    print('   Para cerrar: presiona Ctrl+C o cerra esta ventana')
    print('')

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('')
        print('  Cerrando servidor...')
        server.shutdown()


if __name__ == '__main__':
    main()