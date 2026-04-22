import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from datetime import datetime

# Import AI Router
from apps.p2p_mesh.ai_router import analyze_image, analyze_text

app = FastAPI(title="QuakeMind P2P Mesh Hub")

# CORS setup for local testing if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

# Create static directory if it doesn't exist
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files for the PWA frontend
app.mount("/app", StaticFiles(directory=STATIC_DIR, html=True), name="static")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"New client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Receive text (JSON) from client
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Add server timestamp
            payload["server_time"] = datetime.now().isoformat()
            
            print(f"Received from {client_id}: {payload.get('type')}")
            
            # AI Analysis for Enkaz
            if payload.get("type") in ["enkaz_bildirimi", "yol_durumu"] and payload.get("image"):
                print("Görüntü alındı, AI analizine gönderilecek...")
                result = analyze_image(payload["image"])
                payload["ai_result"] = result
                
            # NLP Analysis for Text
            if payload.get("type") == "acil_ihtiyac" and payload.get("text"):
                print("Metin alındı, NLP analizine gönderilecek...")
                result = analyze_text(payload["text"])
                payload["nlp_result"] = result
            
            # Broadcast the message to all connected devices in the mesh
            await manager.broadcast(json.dumps(payload))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(json.dumps({
            "type": "system",
            "message": f"Client {client_id} left the mesh."
        }))
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    print("QuakeMind P2P Mesh Server is running.")
    print("Connect to http://0.0.0.0:8000/app")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
