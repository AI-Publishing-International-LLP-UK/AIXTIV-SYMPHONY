#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the directory containing the owner interface files
os.chdir('/Users/as/asoos/integration-gateway/owner-interface')

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/mocoa-current.html'
        elif self.path == '/test':
            self.path = '/index.html'
        super().do_GET()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 MOCOA Owner Interface server running at http://localhost:{PORT}")
        print(f"📄 Main interface: http://localhost:{PORT}")
        print(f"🧪 Alternative interface: http://localhost:{PORT}/test")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")