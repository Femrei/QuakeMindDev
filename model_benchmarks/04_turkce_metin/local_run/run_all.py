"""Tum yerel NLP kiyaslama egitimlerini sirayla calistirir, her modelin hata
vermesi digerlerini durdurmaz (log'a yazilir, devam edilir). Sonunda
build_report.py cagrilir.

    python run_all.py
"""
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
PY = sys.executable
ENV = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}

STEPS = [
    ("classic (tfidf+logreg, tfidf+svm)", [PY, str(HERE / "train_classic.py")]),
    ("fasttext", [PY, str(HERE / "train_fasttext.py")]),
    ("bilstm", [PY, str(HERE / "train_bilstm.py")]),
    ("berturk", [PY, str(HERE / "train_transformer.py"), "berturk", "dbmdz/bert-base-turkish-cased"]),
    ("distilberturk", [PY, str(HERE / "train_transformer.py"), "distilberturk", "dbmdz/distilbert-base-turkish-cased"]),
    ("convberturk", [PY, str(HERE / "train_transformer.py"), "convberturk", "dbmdz/convbert-base-turkish-cased"]),
    ("xlm_roberta", [PY, str(HERE / "train_transformer.py"), "xlm_roberta", "xlm-roberta-base"]),
    ("mbert", [PY, str(HERE / "train_transformer.py"), "mbert", "bert-base-multilingual-cased"]),
    ("turna", [PY, str(HERE / "train_turna.py")]),
]


def main():
    log_path = HERE / "results" / "run_all.log"
    (HERE / "results").mkdir(exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as log:
        for name, cmd in STEPS:
            t0 = time.time()
            header = f"\n{'='*70}\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] BASLIYOR: {name}\n{'='*70}\n"
            print(header); log.write(header); log.flush()
            try:
                proc = subprocess.run(cmd, cwd=str(HERE), stdout=subprocess.PIPE,
                                       stderr=subprocess.STDOUT, text=True,
                                       encoding="utf-8", env=ENV)
                log.write(proc.stdout); log.flush()
                print(proc.stdout[-3000:])
                status = "OK" if proc.returncode == 0 else f"HATA (kod {proc.returncode})"
            except Exception as e:
                status = f"ISTISNA: {e}"
            dt = time.time() - t0
            footer = f"[{name}] {status} - {dt/60:.1f} dk\n"
            print(footer); log.write(footer); log.flush()

    print("\nTum adimlar tamamlandi, rapor olusturuluyor...")
    subprocess.run([PY, str(HERE / "build_report.py")], cwd=str(HERE), env=ENV)


if __name__ == "__main__":
    main()
