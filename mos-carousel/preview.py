"""Local-only preview, Python standard library; no installation needed."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    handler = partial(Handler, directory=str(root))
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/'
        print(f'Вкусная Москва: {url}\nДля остановки нажми Ctrl+C.', flush=True)
        Timer(.3, webbrowser.open, args=(url,)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
