from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Leer el contenido del mensaje
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            print("\n[📢 WEBHOOK RECIBIDO] -----------------------------")
            print(f"📍 Endpoint objetivo: {self.path}")
            print(f"📦 Payload JSON:")
            print(json.dumps(data, indent=2))
            print("--------------------------------------------------\n")
            
            # Responder con 200 OK
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "received"}')
            
        except Exception as e:
            print(f"❌ Error decodificando JSON: {e}")
            self.send_response(400)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=WebhookHandler, port=3000):
    server_address = ('', port)
    print(f"📡 Similador de Servicio de Actividad iniciado...")
    print(f"👂 Escuchando eventos en: http://localhost:{port}/webhooks/activity")
    print(f"Use Ctrl+C para detener.")
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()

if __name__ == "__main__":
    run()
