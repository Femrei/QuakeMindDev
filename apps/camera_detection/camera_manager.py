from ultralytics import YOLO
import cv2
import threading
from pathlib import Path
import argparse

BASE_DIR = Path(__file__).resolve().parent

class VideoCaptureThread:
    def __init__(self, source=0):
        self.cap = cv2.VideoCapture(source)
        self.frame = None
        self.running = True
        self.lock = threading.Lock()

    def start(self):
        thread = threading.Thread(target=self.update, daemon=True)
        thread.start()

    def update(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                continue
            with self.lock:
                self.frame = frame

    def get_frame(self):
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop(self):
        self.running = False
        self.cap.release()

def draw_results(frame, results, class_names, window_name):
    if results is None:
        cv2.imshow(window_name, frame)
        return
    for box in results.boxes.data.cpu().numpy():
        x1, y1, x2, y2, conf, cls = box
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])
        label = f'{class_names[int(cls)]} {conf:.2f}'
        color = (255, 0, 102)
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    cv2.imshow(window_name, frame)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", type=str, default="both", choices=["crack", "building", "both"], help="Detection mode")
    args = parser.parse_args()

    # Modelleri ve pencereleri seçilen moda göre ayarla
    run_crack = args.mode in ["crack", "both"]
    run_building = args.mode in ["building", "both"]

    model1, model2 = None, None
    class_names1, class_names2 = None, None
    window1, window2 = "catlak Tespiti", "Bina durumu"

    if run_crack:
        model1_path = BASE_DIR / "models" / "catlak.pt"
        model1 = YOLO(str(model1_path))
        class_names1 = model1.names
        cv2.namedWindow(window1, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window1, 800, 600)
    
    if run_building:
        model2_path = BASE_DIR / "models" / "bina.pt"
        model2 = YOLO(str(model2_path))
        class_names2 = model2.names
        cv2.namedWindow(window2, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window2, 800, 600)

    # Video yakalama başlat
    video_thread = VideoCaptureThread(0)
    video_thread.start()

    try:
        while True:
            frame = video_thread.get_frame()
            if frame is None:
                continue

            results1 = [None]
            results2 = [None]

            threads = []
            if run_crack:
                def run_model1():
                    results1[0] = model1.predict(source=frame, conf=0.6, verbose=False)[0]
                t1 = threading.Thread(target=run_model1)
                threads.append(t1)
            
            if run_building:
                def run_model2():
                    results2[0] = model2.predict(source=frame, conf=0.4, verbose=False)[0]
                t2 = threading.Thread(target=run_model2)
                threads.append(t2)

            for t in threads: t.start()
            for t in threads: t.join()

            if run_crack:
                draw_results(frame.copy(), results1[0], class_names1, window1)
            if run_building:
                draw_results(frame.copy(), results2[0], class_names2, window2)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        video_thread.stop()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

