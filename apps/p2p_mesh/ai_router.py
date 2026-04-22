import cv2
import numpy as np
import base64
from ultralytics import YOLO
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "camera_detection" / "models" / "bina.pt"

# Initialize model once (Lazy loading)
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            print(f"Loading YOLO model from {MODEL_PATH}")
            _model = YOLO(str(MODEL_PATH))
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
    return _model

def decode_base64_image(base64_str):
    # Remove header if present (e.g., data:image/jpeg;base64,...)
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    
    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def analyze_image(base64_img):
    """
    Analyzes a base64 image using YOLO and returns the highest confidence detection.
    Returns None if no detection is made or error occurs.
    """
    try:
        model = get_model()
        if model is None:
            return {"label": "Yapay Zeka Modeli Bulunamadı", "confidence": 0}
            
        img = decode_base64_image(base64_img)
        if img is None:
            return {"label": "Geçersiz Görüntü", "confidence": 0}

        # Run inference
        results = model.predict(source=img, conf=0.4, verbose=False)
        
        if not results or len(results[0].boxes) == 0:
            return {"label": "Hasar Tespit Edilmedi", "confidence": 0.99}
            
        # Get the highest confidence prediction
        boxes = results[0].boxes
        best_conf = 0
        best_label = "Bilinmeyen"
        
        for box in boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            
            if conf > best_conf:
                best_conf = conf
                best_label = label
                
        return {
            "label": best_label,
            "confidence": best_conf
        }
        
    except Exception as e:
        print(f"AI analysis error: {e}")
def analyze_text(text):
    """
    Analyzes emergency text and categorizes it using basic keyword matching for simulation.
    In production, this would call the actual NLP model.
    """
    text = text.lower()
    if "su" in text or "yemek" in text or "gıda" in text or "erzak" in text:
        return {"category": "Barınma ve Erzak İhtiyacı"}
    elif "kan" in text or "yaralı" in text or "doktor" in text or "ambulans" in text:
        return {"category": "Acil Sağlık İhtiyacı"}
    elif "enkaz" in text or "göçük" in text or "yardım" in text or "ses" in text:
        return {"category": "Arama Kurtarma (Göçük Altı)"}
    else:
        return {"category": "Genel Bilgi / Diğer"}
