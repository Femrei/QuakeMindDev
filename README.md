# QuakeMind

QuakeMind is a multi-module disaster decision-support prototype. It combines
social-media disaster text analysis, emergency operations management,
satellite-based road damage assessment, earthquake risk analysis, and live
camera detection in one Streamlit interface.

## Main Flow

Run the unified app from the repository root:

```bash
streamlit run main.py
```

Recommended demo flow:

1. Open `Afet Metin Analizi`.
2. Analyze a disaster-related tweet.
3. Open `Acil Operasyon Merkezi`.
4. Review the created incident, urgency label, location confidence, needs list,
   safe-area suggestions, and team assignments.
5. Optionally run `Uydu Yol Hasar Analizi` and calculate the logistics network.
   If logistics data exists in the session, the operations map overlays open and
   blocked roads.

## Unified Pages

- `Afet Metin Analizi`
  Classifies Turkish disaster tweets, extracts locations, estimates urgency, and
  sends successful analyses to the operations queue.
- `Acil Operasyon Merkezi`
  Lists incidents by class, shows exact or uncertain locations on a map, suggests
  nearest safe gathering areas, extracts needs, and lets emergency units manage
  assignments.
- `Uydu Yol Hasar Analizi`
  Uses satellite imagery and segmentation to estimate road damage and derive a
  logistics network with open and blocked roads.
- `Deprem Risk Paneli`
  Computes city-level earthquake risk and visualizes nearby earthquake/fault data.
- `Kamera Tespiti`
  Runs OpenCV/YOLO based crack and building-status detection in local windows.

## Operations Features

The operations module supports:

- incident queue created from analyzed tweets
- urgency labels: `Kritik`, `Yuksek`, `Orta`, `Dusuk`, `Izleme`
- location confidence:
  - `Net konum`: exact marker
  - `Tahmini alan`: map circle with radius
  - `Konum yok`: explicitly marked as unavailable
- nearest safe-area recommendations
- need extraction for rescue, health, shelter, food/water, logistics, and security
- per-need unit assignment and status tracking
- incident-level status, team assignment, routing target, and notes

Safe areas are stored in:

```text
apps/operations/safe_areas.json
```

Runtime operation records are stored locally in:

```text
runtime/operation_incidents.json
```

The `runtime/` directory is ignored by Git because it contains local run state.

## Repository Structure

```text
QuakeMind/
|-- main.py
|-- README.md
|-- requirements.txt
|-- apps/
|   |-- camera_detection/
|   |-- disaster_nlp/
|   |-- earthquake_risk/
|   |-- operations/
|   |   `-- safe_areas.json
|   `-- road_damage/
`-- runtime/              # local generated state, ignored by Git
```

## Requirements

Recommended Python version:

```text
Python 3.10 or newer
```

Install the unified dependencies:

```bash
pip install -r requirements.txt
```

Some modules also keep app-specific requirement files:

```bash
pip install -r apps/disaster_nlp/requirements.txt
pip install -r apps/road_damage/requirements.txt
pip install -r apps/earthquake_risk/requirements.txt
```

## Models and Data

Large model files are either stored locally or downloaded from Hugging Face when
missing.

Disaster NLP classification model:

```text
Utbird/EqTwitterTr
apps/disaster_nlp/models/2kveri/
```

Road damage segmentation model:

```text
Utbird/dispath_optimized_mitb4_focal_dice30
apps/road_damage/models/optimized_mitb4_focal_dice30.pth
```

External NER model:

```text
yhaslan/turkish-earthquake-tweets-ner
```

## Notes

- Camera detection requires local webcam access and opens OpenCV windows.
- Road damage and map features may require internet access for map tiles, OSM,
  Overpass, Hugging Face downloads, or geocoding.
- Before publishing the repository, review redistribution rights for model
  weights and third-party datasets.
