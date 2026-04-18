# QuakeMind

QuakeMind, afet sonrası karar destek senaryoları için geliştirilen çok modüllü bir uygulama paketidir. Tek bir proje altında metin analizi, uydu görüntüsü üzerinden yol hasar analizi, deprem risk değerlendirmesi ve canlı kamera tabanlı bina/catlak tespiti bir araya getirilmiştir.

Bu repo şu an çalışma odaklı bir uygulama deposu olarak düzenlenmiştir. Büyük model dosyalarının bir kısmı GitHub dışında tutulacak şekilde ayrılmıştır; Hugging Face bağlantıları eklendiğinde bu README içindeki ilgili alanlar kolayca doldurulabilir.

## Modüller

- `Afet Metin Analizi`
  Türkçe afet metinlerini sınıflandırır, konum çıkarımı yapar ve harita üzerinde gösterir.
- `Uydu Yol Hasar Analizi`
  Uydu görüntüsü ve segmentasyon modeli ile yol erişilebilirliğini ve enkaz etkisini analiz eder.
- `Deprem Risk Paneli`
  Tarihsel deprem verisi, fay yakınlığı ve kısa/uzun dönem risk sinyallerini birleştirerek şehir bazlı risk çıktısı üretir.
- `Kamera Tespiti`
  Canlı kamera akışında çatlak ve bina durumu modellerini ayrı pencerelerde çalıştırır.

## Proje Yapısı

```text
QuakeMind/
├── main.py
├── README.md
├── .gitignore
└── apps/
    ├── camera_detection/
    │   ├── app.py
    │   ├── camera_manager.py
    │   └── models/
    ├── disaster_nlp/
    │   ├── app.py
    │   ├── requirements.txt
    │   ├── models/
    │   └── src/
    ├── earthquake_risk/
    │   ├── data/
    │   ├── data_manager.py
    │   ├── gui_app.py
    │   ├── main.py
    │   ├── map_visualizer.py
    │   ├── models/
    │   ├── requirements.txt
    │   └── risk_engine.py
    └── road_damage/
        ├── app.py
        ├── models/
        ├── requirements.txt
        └── utils/
```

## Ana Çalıştırma Yolu

Birleşik arayüz için proje kökünden:

```bash
streamlit run main.py
```

Bu arayüz içinde şu sayfalar bulunur:

- `Afet Metin Analizi`
- `Uydu Yol Hasar Analizi`
- `Deprem Risk Paneli`
- `Kamera Tespiti`

## Alt Uygulamalar

### 1. Afet Metin Analizi

Konum:

```text
apps/disaster_nlp
```

Doğrudan çalıştırmak için:

```bash
cd apps/disaster_nlp
streamlit run app.py
```

Öne çıkan yetenekler:

- Türkçe afet metni temizleme
- sınıflandırma
- NER tabanlı konum çıkarımı
- folium ile haritalama

Kullanılan model türleri:

- Yerel sınıflandırma modeli
- Hugging Face üzerinden NER modeli

### 2. Uydu Yol Hasar Analizi

Konum:

```text
apps/road_damage
```

Doğrudan çalıştırmak için:

```bash
cd apps/road_damage
streamlit run app.py
```

Öne çıkan yetenekler:

- uydu katmanları ile alan seçimi
- yol hasarı segmentasyonu
- yol ağı analizi
- erişime açık / kapalı yol ayrımı

### 3. Deprem Risk Paneli

Konum:

```text
apps/earthquake_risk
```

Birleşik arayüz içinden kullanılması önerilir. İstersen masaüstü arayüzü de ayrıca kullanılabilir:

```bash
cd apps/earthquake_risk
python3 main.py
```

Öne çıkan yetenekler:

- canlı deprem verisini CSV üzerine güncelleme
- şehir bazlı risk hesabı
- yakın çevredeki deprem kümelerini analiz etme
- seçilen koordinata yakın fay segmentlerini filtreleyerek haritada gösterme

### 4. Kamera Tespiti

Konum:

```text
apps/camera_detection
```

Bu modül birleşik arayüzde ayrı sayfa olarak açılır. Kod tarafında ana giriş dosyaları:

- `apps/camera_detection/app.py`
- `apps/camera_detection/camera_manager.py`

Öne çıkan yetenekler:

- canlı kamera akışı
- çatlak tespiti
- bina durumu tespiti
- iki YOLO modelini paralel çalıştırma

## Kurulum

## 1. Python sürümü

Önerilen:

```text
Python 3.12
```

## 2. Sanal ortam

Örnek kurulum:

```bash
python3 -m venv venv
source venv/bin/activate
```

## 3. Bağımlılıklar

Bu repo modüler yapıdadır. İki yaklaşım var:

- Tek bir ortak environment kurup tüm bağımlılıkları oraya yüklemek
- Her app için ayrı environment kullanmak

Tek environment yaklaşımı için en pratik yol:

```bash
pip install -r apps/disaster_nlp/requirements.txt
pip install -r apps/road_damage/requirements.txt
pip install -r apps/earthquake_risk/requirements.txt
```

Ek not:

- `earthquake_risk` masaüstü arayüzü için Linux tarafında `python3-tk` gerekebilir.
- Kamera tespiti için webcam erişimi gerekir.

## Model Dosyaları

Bu repo içinde bazı modeller yerel tutulur, bazıları Hugging Face üzerinden indirilecek şekilde planlanmıştır.

### Hugging Face'e taşınması planlanan büyük modeller

Buraya daha sonra bağlantı ekleyebilmemiz için boş alanlar bırakıldı:

- `Disaster NLP classification model`
  - Hugging Face repo: `TODO_HF_LINK_DISASTER_NLP`
  - hedef klasör: `apps/disaster_nlp/models/2kveri/`
- `Road Damage segmentation model`
  - Hugging Face repo: `TODO_HF_LINK_ROAD_DAMAGE_PRIMARY`
  - hedef dosya: `apps/road_damage/models/optimized_mitb4_focal_dice30.pth`
- `Road Damage fallback model`
  - Hugging Face repo: `TODO_HF_LINK_ROAD_DAMAGE_FALLBACK`
  - hedef dosya: `apps/road_damage/models/210926_deneme_18epoch_mitb4_imagenet_focalanddiceloss.pth`

### Repo içinde kalabilen modeller

- `apps/camera_detection/models/catlak.pt`
- `apps/camera_detection/models/bina.pt`
- `apps/earthquake_risk/models/*.pt`

### NER modeli

Şu an kodda uzaktan kullanılan model:

- `yhaslan/turkish-earthquake-tweets-ner`

İstersen bunun için de burada ayrı bir sabit link alanı kullanabiliriz:

- Hugging Face repo: `TODO_HF_LINK_TURKISH_EARTHQUAKE_TWEETS_NER`

## Model Yerleştirme Adımları

Hugging Face bağlantıları hazır olduktan sonra aşağıdaki bölümü güncelleyebiliriz. Şimdilik örnek akış:

### Disaster NLP modeli

Beklenen klasör:

```text
apps/disaster_nlp/models/2kveri/
├── config.json
├── model.safetensors
├── tokenizer.json
└── tokenizer_config.json
```

### Road Damage modeli

Beklenen dosyalar:

```text
apps/road_damage/models/optimized_mitb4_focal_dice30.pth
apps/road_damage/models/210926_deneme_18epoch_mitb4_imagenet_focalanddiceloss.pth
```

### Kamera modelleri

Beklenen dosyalar:

```text
apps/camera_detection/models/catlak.pt
apps/camera_detection/models/bina.pt
```

## Kullanım Akışları

### Birleşik arayüz ile çalışma

1. Ortak environment'ı aktif et
2. Gerekli bağımlılıkları kur
3. Gerekli model dosyalarını doğru klasörlere yerleştir
4. `streamlit run main.py` ile uygulamayı başlat
5. Sol menüden modül seç

### Afet metni analizi

1. Örnek veri seç veya serbest metin gir
2. Analizi çalıştır
3. kategori, güven skoru ve konum sonucunu incele
4. haritadaki işaretlemeyi kontrol et

### Uydu yol hasar analizi

1. Şehir veya bölge seç
2. harita üzerinde alan belirle
3. model yolunu kontrol et
4. analizi başlat
5. hasar maskelemesi ve yol erişim durumunu incele

### Deprem risk paneli

1. Şehir seç veya manuel koordinat gir
2. istersen veriyi güncelle
3. risk hesabını çalıştır
4. sonuç metni, harita, ısı katmanı ve teknik verileri incele

### Kamera tespiti

1. Kamera sayfasını aç
2. kamera tespitini başlat
3. OpenCV pencerelerinde sonuçları izle
4. çıkmak için `q` tuşuna bas

## Bilinen Gereksinimler ve Notlar

- `streamlit_folium` etkileşimli harita tarafında kullanılır
- `catboost`, `geopy` ve `pandas` deprem risk tarafında gereklidir
- `ultralytics` ve `opencv-python` kamera tarafında gereklidir
- `segmentation-models-pytorch` road damage tarafında gereklidir
- büyük model dosyaları GitHub yerine Hugging Face üzerinde tutulmalıdır

## Geliştirme Notları

Bu proje şu anda uygulama odaklıdır ve birkaç farklı alt sistemi bir araya getirir. İleride aşağıdaki iyileştirmeler eklenebilir:

- otomatik model indirme yardımcı scriptleri
- ilk kurulum scripti
- ortak `requirements.txt` veya `pyproject.toml`
- Hugging Face model resolver katmanı
- Docker desteği

## Hugging Face Link Alanları

Bu bölümü sonradan doğrudan doldurabiliriz:

```text
DISASTER_NLP_MODEL_REPO=TODO
ROAD_DAMAGE_PRIMARY_MODEL_REPO=TODO
ROAD_DAMAGE_FALLBACK_MODEL_REPO=TODO
NER_MODEL_REPO=TODO
CAMERA_CRACK_MODEL_REPO=OPTIONAL
CAMERA_BUILDING_MODEL_REPO=OPTIONAL
```

## Lisans / Dağıtım Notu

Model dosyalarının lisansları, eğitim verileri ve yeniden dağıtım hakları ayrıca kontrol edilmelidir. Özellikle harici model depoları ve Hugging Face üzerinden paylaşılacak ağırlıklar için lisans bilgisinin ayrı netleştirilmesi önerilir.
