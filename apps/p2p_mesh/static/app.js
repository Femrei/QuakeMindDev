// Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class
        navItems.forEach(n => n.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        
        // Add active class
        item.classList.add('active');
        const targetView = document.getElementById(item.getAttribute('data-target'));
        targetView.classList.add('active');
        
        // Hide notification dot if viewing feed
        if(item.getAttribute('data-target') === 'view-feed') {
            document.getElementById('nav-notif').style.display = 'none';
        }
        
        // Resize map if switching to map view (Leaflet quirk)
        if(item.getAttribute('data-target') === 'view-map' && map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });
});

// Map Initialization
let map = L.map('map').setView([37.5, 37.5], 6); // Default center Turkey
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'OSM'
}).addTo(map);

let userMarker = null;
let currentLat = null;
let currentLon = null;

// Geolocation
function updateLocation() {
    if ("geolocation" in navigator) {
        document.getElementById('loc-text').innerText = "Konum aranıyor...";
        navigator.geolocation.watchPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                document.getElementById('loc-text').innerText = `${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`;
                
                if (!userMarker) {
                    userMarker = L.marker([currentLat, currentLon]).addTo(map)
                        .bindPopup("Sizin Konumunuz").openPopup();
                    map.setView([currentLat, currentLon], 15);
                } else {
                    userMarker.setLatLng([currentLat, currentLon]);
                }
                
                checkSubmitReady();
            },
            (error) => {
                console.error("Geolocation error:", error);
                // Fallback for testing if GPS fails
                currentLat = 37.5;
                currentLon = 37.5;
                document.getElementById('loc-text').innerText = "GPS Hatası (Varsayılan Konum Kullanılıyor)";
                checkSubmitReady();
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        currentLat = 37.5;
        currentLon = 37.5;
        document.getElementById('loc-text').innerText = "GPS Desteklenmiyor";
        checkSubmitReady();
    }
}
updateLocation();

// Camera Logic
const video = document.getElementById('camera-preview');
const canvas = document.getElementById('photo-canvas');
const photoResult = document.getElementById('photo-result');
const btnStartCamera = document.getElementById('btn-start-camera');
const btnTakePhoto = document.getElementById('btn-take-photo');
const btnRetake = document.getElementById('btn-retake');
let stream = null;
let photoDataUrl = null;

btnStartCamera.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        btnStartCamera.style.display = 'none';
        btnTakePhoto.style.display = 'inline-block';
    } catch (err) {
        alert("Kamera açılamadı: " + err.message);
    }
});

btnTakePhoto.addEventListener('click', () => {
    // Downscale for low-bandwidth P2P transmission
    const MAX_WIDTH = 800;
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
    }
    
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    photoDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Lower quality for smaller size
    
    photoResult.src = photoDataUrl;
    video.style.display = 'none';
    photoResult.style.display = 'block';
    
    btnTakePhoto.style.display = 'none';
    btnRetake.style.display = 'inline-block';
    
    // Stop camera stream
    stream.getTracks().forEach(track => track.stop());
    
    checkSubmitReady();
});

btnRetake.addEventListener('click', async () => {
    photoResult.style.display = 'none';
    video.style.display = 'block';
    btnRetake.style.display = 'none';
    photoDataUrl = null;
    
    // Restart camera
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    btnTakePhoto.style.display = 'inline-block';
    
    checkSubmitReady();
});

// Form Submission & UI Toggle
const reportTypeSelect = document.getElementById('report-type');
const cameraContainer = document.getElementById('camera-container');
const textContainer = document.getElementById('text-container');
const reportText = document.getElementById('report-text');
const btnSubmit = document.getElementById('btn-submit-report');

reportTypeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'acil_ihtiyac') {
        cameraContainer.style.display = 'none';
        textContainer.style.display = 'block';
    } else {
        cameraContainer.style.display = 'flex';
        textContainer.style.display = 'none';
    }
    checkSubmitReady();
});

reportText.addEventListener('input', checkSubmitReady);

function checkSubmitReady() {
    const isTextMode = reportTypeSelect.value === 'acil_ihtiyac';
    
    if (!currentLat || !currentLon) {
        btnSubmit.disabled = true;
        return;
    }
    
    if (isTextMode) {
        btnSubmit.disabled = reportText.value.trim().length === 0;
    } else {
        btnSubmit.disabled = photoDataUrl === null;
    }
}

// WebSocket Connection
const clientId = "device_" + Math.floor(Math.random() * 10000);
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}/ws/${clientId}`;
let ws;

function connectWebSocket() {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        document.getElementById('connection-status').className = 'dot connected';
        document.getElementById('connection-text').innerText = 'Ağa Bağlı (P2P)';
    };
    
    ws.onclose = () => {
        document.getElementById('connection-status').className = 'dot disconnected';
        document.getElementById('connection-text').innerText = 'Bağlantı Koptu, Tekrar Deneniyor...';
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
    };
}
connectWebSocket();

// Handle Sending Data
btnSubmit.addEventListener('click', () => {
    const reportType = reportTypeSelect.value;
    const isTextMode = reportType === 'acil_ihtiyac';
    
    const payload = {
        sender_id: clientId,
        type: reportType,
        lat: currentLat,
        lon: currentLon,
        image: isTextMode ? null : photoDataUrl,
        text: isTextMode ? reportText.value : null
    };
    
    ws.send(JSON.stringify(payload));
    
    // Reset UI
    alert("Bildirim yerel ağdaki tüm cihazlara iletildi.");
    if (!isTextMode) {
        btnRetake.click();
    } else {
        reportText.value = '';
    }
    checkSubmitReady();
    
    // Switch to feed view
    document.querySelector('[data-target="view-feed"]').click();
});

// Handle Incoming Data
let messageCount = 0;
function handleIncomingMessage(data) {
    if (data.type === "system") return;
    
    messageCount++;
    document.getElementById('peer-count').innerText = messageCount;
    
    // Add to Feed
    const feedList = document.getElementById('feed-list');
    const item = document.createElement('div');
    item.className = 'feed-item';
    
    let typeText = "Bilinmeyen Bildirim";
    let color = "var(--primary)";
    
    if(data.type === 'enkaz_bildirimi') { typeText = "⚠️ Enkaz Bildirimi"; color = "var(--danger)"; }
    if(data.type === 'yol_durumu') { typeText = "🚧 Kapalı Yol"; color = "#F39C12"; }
    if(data.type === 'acil_ihtiyac') { typeText = "🆘 Acil İhtiyaç"; color = "#9B59B6"; }
    if(data.type === 'ai_result') { typeText = "🤖 Yapay Zeka Sonucu"; color = "var(--success)"; }
    if(data.type === 'nlp_result') { typeText = "🧠 NLP Analiz Sonucu"; color = "var(--primary)"; }
    
    item.style.borderLeftColor = color;
    
    let html = `<strong style="color:${color}">${typeText}</strong>`;
    
    if(data.text) {
        html += `<p style="margin-top:10px; font-style:italic;">"${data.text}"</p>`;
    }
    
    if(data.image) {
        html += `<img src="${data.image}" alt="Bildirim Fotoğrafı">`;
    }
    
    const time = new Date(data.server_time).toLocaleTimeString();
    html += `
        <div class="feed-meta">
            <span><i class="fas fa-map-pin"></i> ${data.lat ? data.lat.toFixed(4) : '?'}</span>
            <span><i class="fas fa-clock"></i> ${time}</span>
        </div>
    `;
    
    if(data.ai_result) {
        html += `<div style="margin-top:10px; padding:10px; background:rgba(46,204,113,0.2); border-radius:5px;">
            <strong>AI Analizi:</strong> ${data.ai_result.label} (Güven: %${Math.round(data.ai_result.confidence*100)})
        </div>`;
    }
    if(data.nlp_result) {
        html += `<div style="margin-top:10px; padding:10px; background:rgba(46,134,193,0.2); border-radius:5px;">
            <strong>NLP Sınıfı:</strong> ${data.nlp_result.category}
        </div>`;
    }
    
    item.innerHTML = html;
    feedList.prepend(item);

    
    // Show notification dot if not on feed view
    if(!document.getElementById('view-feed').classList.contains('active')) {
        document.getElementById('nav-notif').style.display = 'block';
    }
    
    // Add to Map
    if(data.lat && data.lon) {
        const marker = L.marker([data.lat, data.lon]).addTo(map);
        marker.bindPopup(`<b>${typeText}</b><br>Gönderen: ${data.sender_id}`);
    }
}

// Manual Location Selection
const btnManualLoc = document.getElementById('btn-manual-loc');
let manualMarker = null;

btnManualLoc.addEventListener('click', () => {
    // Switch to map view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-map').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-target="view-map"]').classList.add('active');
    
    // Hint message
    alert("Haritadan bulunduğunuz konuma tıklayın.");
    
    // Map click handler
    map.once('click', (e) => {
        const { lat, lng } = e.latlng;
        currentLat = lat;
        currentLon = lng;
        
        if (manualMarker) {
            manualMarker.setLatLng(e.latlng);
        } else {
            manualMarker = L.marker(e.latlng, { draggable: true }).addTo(map)
                .bindPopup("Manuel Seçilen Konum").openPopup();
        }
        
        document.getElementById('loc-text').innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)} (Manuel)`;
        
        // Return to report view
        setTimeout(() => {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-report').classList.add('active');
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelector('[data-target="view-report"]').classList.add('active');
            checkSubmitReady();
        }, 1000);
    });
});
