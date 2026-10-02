"""Threaded static file server for local development and tests.

Two defaults in http.server make it fall over when several browsers load the
page at once, which is exactly what parallel Playwright workers do:

  * single-threaded, so every request is serialised
  * HTTP/1.0, so there is no keep-alive and each of the ~55 assets on a page
    load opens its own connection

Together those exhaust the listen backlog and the server resets connections
(net::ERR_CONNECTION_RESET), which looks like an application bug but is not.
Threading, HTTP/1.1 and a deeper backlog fix it.
"""

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *args):
        pass


class Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 128
    allow_reuse_address = True


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print(f"serving on http://localhost:{port}", flush=True)
Server(("", port), Handler).serve_forever()
