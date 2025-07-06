#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the directory containing your website files
os.chdir('/workspace')

PORT = 8080

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"🚀 Simple server running at http://0.0.0.0:{PORT}")
    print(f"🌐 Access your website at: http://54.70.43.162:{PORT}")
    print(f"📱 Local access: http://localhost:{PORT}")
    httpd.serve_forever()