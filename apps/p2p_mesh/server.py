import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from datetime import datetime

# Import AI Router
from apps.p2p_mesh.ai_router import analyze_image, analyze_text
import base64

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
PROJECT_ROOT = BASE_DIR.parent.parent
RUNTIME_DIR = PROJECT_ROOT / "runtime"
P2P_RECORDS_PATH = RUNTIME_DIR / "p2p_records.json"
P2P_IMAGES_DIR = RUNTIME_DIR / "p2p_images"

# Create directories if they don't exist
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(RUNTIME_DIR, exist_ok=True)
os.makedirs(P2P_IMAGES_DIR, exist_ok=True)

# Ensure incidents file exists
if not P2P_RECORDS_PATH.exists():
    with open(P2P_RECORDS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f)

def save_p2p_to_db(payload, ai_result=None, nlp_result=None):
    try:
        # Load existing records
        with open(P2P_RECORDS_PATH, "r", encoding="utf-8") as f:
            records = json.load(f)
            
        incident_id = f"P2P-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        image_path = None
        
        # Save image if present
        if payload.get("image"):
            base64_str = payload["image"]
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]
            img_data = base64.b64decode(base64_str)
            image_filename = f"{incident_id}.jpg"
            image_full_path = P2P_IMAGES_DIR / image_filename
            with open(image_full_path, "wb") as f:
                f.write(img_data)
            # Store relative path for UI
            image_path = str(image_full_path)
            
        # Determine category and urgency
        category = "Diğer"
        urgency_label = "Orta"
        urgency_score = 3
        confidence = 1.0
        
        if payload.get("type") == "enkaz_bildirimi":
            category = "Enkaz ve Yikim"
            urgency_label = "Kritik"
            urgency_score = 5
            if ai_result:
                confidence = float(ai_result.get("confidence", 1.0))
        elif payload.get("type") == "yol_durumu":
            category = "Kapali Yol"
            urgency_score = 4
        elif payload.get("type") == "acil_ihtiyac":
            if nlp_result:
                category = nlp_result.get("category", "Genel Ihtiyac")
                if "Acil" in category or "Kurtarma" in category:
                    urgency_label = "Kritik"
                    urgency_score = 5
                    
        # Construct the record
        text_content = payload.get("text", "")
        if not text_content and ai_result:
            text_content = f"Görsel AI Analizi: {ai_result.get('label')}"
            
        record = {
            "id": incident_id,
            "kategori": category,
            "aciliyet_etiketi": urgency_label,
            "aciliyet": urgency_score,
            "konum_tipi": "Net konum",
            "durum": "Yeni",
            "atanan_ekip": "Atanmadi",
            "yonlendirme": "",
            "harita_merkezi": [payload.get("lat"), payload.get("lon")] if payload.get("lat") else None,
            "tweet": f"P2P Saha İhbarı: {text_content}",
            "konum_guveni": "Yuksek",
            "guven_skoru": confidence,
            "resim_yolu": image_path,
            "p2p_kaynagi": payload.get("sender_id", "Bilinmeyen Cihaz"),
            "zaman": payload.get("server_time")
        }
        
        records.insert(0, record)
        
        # Save back to file
        with open(P2P_RECORDS_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=4, ensure_ascii=False)
            
        print(f"Saved incident {incident_id} to database.")
    except Exception as e:
        print(f"Failed to save P2P record to database: {e}")

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
            
            ai_res = None
            nlp_res = None
            
            # AI Analysis for Enkaz
            if payload.get("type") in ["enkaz_bildirimi", "yol_durumu"] and payload.get("image"):
                print("Görüntü alındı, AI analizine gönderilecek...")
                ai_res = analyze_image(payload["image"])
                payload["ai_result"] = ai_res
                
            # NLP Analysis for Text
            if payload.get("type") == "acil_ihtiyac" and payload.get("text"):
                print("Metin alındı, NLP analizine gönderilecek...")
                nlp_res = analyze_text(payload["text"])
                payload["nlp_result"] = nlp_res
                
            # Save to main operations database
            save_p2p_to_db(payload, ai_result=ai_res, nlp_result=nlp_res)
            
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
