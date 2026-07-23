const state = {
    bootstrap: { incidents: [], p2p_records: [], safe_areas: [], summary: {} },
    currentLat: null,
    currentLon: null,
    photoDataUrl: null,
    deferredPrompt: null,
};

// --- YENİ ÇEVRİMDIŞI & P2P MESH TANIMLAMALARI ---
const wsClientId = "cihaz_" + Math.floor(Math.random() * 100000);
let db = null;
let cryptoKeyPair = null;
let currentBatteryZone = "Zone A";

// IndexedDB Kurulumu
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("quakemind_db", 1);
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains("offline_reports")) {
                database.createObjectStore("offline_reports", { keyPath: "uuid" });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB quakemind_db başarıyla kuruldu.");
            updateOfflineQueueUI();
            resolve();
        };
        request.onerror = (event) => {
            console.error("IndexedDB hatası:", event.target.error);
            reject(event.target.error);
        };
    });
}

function saveOfflineReport(report) {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Veritabanı ilklendirilmedi"));
        const tx = db.transaction("offline_reports", "readwrite");
        const store = tx.objectStore("offline_reports");
        store.put(report);
        tx.oncomplete = () => {
            updateOfflineQueueUI();
            resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
    });
}

function getPendingReports() {
    return new Promise((resolve, reject) => {
        if (!db) return resolve([]);
        const tx = db.transaction("offline_reports", "readonly");
        const store = tx.objectStore("offline_reports");
        const request = store.getAll();
        request.onsuccess = () => {
            const all = request.result || [];
            resolve(all.filter(r => r.pending_sync === 1));
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

function markReportSynced(uuid) {
    return new Promise((resolve, reject) => {
        if (!db) return reject(new Error("Veritabanı ilklendirilmedi"));
        const tx = db.transaction("offline_reports", "readwrite");
        const store = tx.objectStore("offline_reports");
        const request = store.get(uuid);
        request.onsuccess = () => {
            const report = request.result;
            if (report) {
                // Depolamayı korumak adına senkronize olan kaydı siliyoruz
                store.delete(uuid);
            }
        };
        tx.oncomplete = () => {
            updateOfflineQueueUI();
            resolve();
        };
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function updateOfflineQueueUI() {
    try {
        const pending = await getPendingReports();
        const chip = document.getElementById("offline-queue-chip");
        const count = document.getElementById("offline-count");
        if (pending.length > 0) {
            chip.style.display = "inline-flex";
            count.textContent = `Offline Kuyruk: ${pending.length}`;
        } else {
            chip.style.display = "none";
        }
    } catch (e) {
        console.error("UI Kuyruk güncelleme hatası:", e);
    }
}

// Web Crypto API ile Dijital İmza İlklendirme
async function initCryptoKeys() {
    try {
        cryptoKeyPair = await window.crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256",
            },
            true,
            ["sign", "verify"]
        );
        console.log("Web Crypto anahtar çifti başarıyla üretildi.");
    } catch (e) {
        console.error("Kriptografik anahtar üretilemedi:", e);
    }
}

async function signPayload(payload) {
    if (!cryptoKeyPair) return null;
    try {
        const encoder = new TextEncoder();
        // Görsel veya şifrelenmemiş kısımları içermeyen temiz veri gövdesi
        const cleanBody = {
            uuid: payload.uuid,
            type: payload.type,
            lat: payload.lat,
            lon: payload.lon,
            text: payload.text,
            sender_id: payload.sender_id
        };
        const data = encoder.encode(JSON.stringify(cleanBody));
        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            cryptoKeyPair.privateKey,
            data
        );
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (e) {
        console.error("Kriptografik imzalama hatası:", e);
        return null;
    }
}

// Akıllı Batarya ve Güç Yönetimi (Zones)
function initBatteryMonitoring() {
    if (!("getBattery" in navigator)) {
        console.log("Battery Status API tarayıcı tarafından desteklenmiyor.");
        return;
    }
    navigator.getBattery().then((battery) => {
        function updateBatteryUI() {
            const pct = Math.round(battery.level * 100);
            const isCharging = battery.charging;
            
            if (pct >= 50) {
                currentBatteryZone = "Zone A";
            } else if (pct >= 20) {
                currentBatteryZone = "Zone B";
            } else if (pct >= 10) {
                currentBatteryZone = "Zone C";
            } else {
                currentBatteryZone = "Zone D";
            }
            
            const chip = document.getElementById("battery-chip");
            const text = document.getElementById("battery-text");
            const icon = document.getElementById("battery-icon");
            
            chip.style.display = "inline-flex";
            text.textContent = `Pil: %${pct} (${currentBatteryZone})`;
            
            if (isCharging) {
                icon.className = "fa-solid fa-battery-charging";
                chip.style.color = "var(--success)";
                chip.style.borderColor = "rgba(71, 215, 172, 0.25)";
            } else {
                chip.style.color = pct < 20 ? "var(--danger)" : "var(--muted)";
                chip.style.borderColor = pct < 20 ? "rgba(255, 107, 107, 0.25)" : "var(--line)";
                if (pct >= 80) icon.className = "fa-solid fa-battery-full";
                else if (pct >= 50) icon.className = "fa-solid fa-battery-three-quarters";
                else if (pct >= 20) icon.className = "fa-solid fa-battery-half";
                else icon.className = "fa-solid fa-battery-quarter";
            }
            
            applyBatteryZoneRestrictions();
        }
        
        battery.addEventListener("levelchange", updateBatteryUI);
        battery.addEventListener("chargingchange", updateBatteryUI);
        updateBatteryUI();
    });
}

function applyBatteryZoneRestrictions() {
    const isZoneC_or_D = currentBatteryZone === "Zone C" || currentBatteryZone === "Zone D";
    const reportTypeSelect = document.getElementById("report-type");
    
    if (isZoneC_or_D) {
        if (reportTypeSelect.value !== "acil_ihtiyac") {
            reportTypeSelect.value = "acil_ihtiyac";
            syncReportMode();
        }
        reportTypeSelect.querySelectorAll("option").forEach(opt => {
            if (opt.value !== "acil_ihtiyac") opt.disabled = true;
        });
        
        btnStartCamera.disabled = true;
        btnStartCamera.innerHTML = '<i class="fa-solid fa-battery-quarter"></i> Pil Kritik - Kamera Kilitli';
    } else {
        reportTypeSelect.querySelectorAll("option").forEach(opt => {
            opt.disabled = false;
        });
        btnStartCamera.disabled = false;
        if (btnStartCamera.innerHTML.includes("Pil Kritik")) {
            btnStartCamera.innerHTML = '<i class="fa-solid fa-camera"></i> Kamera ac';
        }
    }
}

// BroadcastChannel API Kablosuz Mesh Telsiz Ağı Simülasyonu
const meshChannel = new BroadcastChannel("quakemind_p2p_mesh");

meshChannel.onmessage = async (event) => {
    const data = event.data;
    if (data && data.type === "p2p_mesh_relay") {
        const report = data.report;
        console.log("P2P Mesh: Havadan kablosuz zıplama ile veri yakalandı:", report.uuid);
        
        // Mükerrer kontrolü: IndexedDB'de zaten var mı?
        const pending = await getPendingReports();
        const exists = pending.some(r => r.uuid === report.uuid);
        if (exists) {
            console.log("P2P Mesh: Veri yerelde zaten var, mükerrer aktarım drop edildi:", report.uuid);
            return;
        }
        
        // Cihazın kendi IndexedDB'sine kaydet
        const relayedReport = {
            ...report,
            p2p_relayed: true,
            p2p_kaynagi: report.p2p_kaynagi ? report.p2p_kaynagi + " -> " + wsClientId : report.sender_id + " -> " + wsClientId
        };
        
        await saveOfflineReport(relayedReport);
        console.log("P2P Mesh: Zıplayan veri yerel veri tabanına işlendi:", report.uuid);
        
        // GATEWAY MANTIĞI: Eğer BU SEKME internete bağlıysa (WebSocket açık), veriyi sunucuya hemen aktar!
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log("P2P Mesh Gateway: Biz internete bağlıyız! Zıplayan veriyi sunucuya aktarıyoruz.");
            const signature = await signPayload(relayedReport);
            const signedPayload = { ...relayedReport, crypto_signature: signature };
            ws.send(JSON.stringify(signedPayload));
            await markReportSynced(report.uuid);
        }
    }
};

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
const installBtn = document.getElementById("install-btn");
const refreshBtn = document.getElementById("refresh-bootstrap");
const incidentFilter = document.getElementById("incident-filter");
const recenterMapBtn = document.getElementById("recenter-map");
const moduleCards = document.querySelectorAll(".module-card");
const segmentButtons = document.querySelectorAll(".segment-btn");
const reportTypeSelect = document.getElementById("report-type");
const textContainer = document.getElementById("text-container");
const reportText = document.getElementById("report-text");
const btnSubmit = document.getElementById("btn-submit-report");
const btnManualLoc = document.getElementById("btn-manual-loc");
const video = document.getElementById("camera-preview");
const canvas = document.getElementById("photo-canvas");
const photoResult = document.getElementById("photo-result");
const btnStartCamera = document.getElementById("btn-start-camera");
const btnTakePhoto = document.getElementById("btn-take-photo");
const btnRetake = document.getElementById("btn-retake");
const nlpText = document.getElementById("nlp-text");
const nlpRunBtn = document.getElementById("nlp-run");
const riskCity = document.getElementById("risk-city");
const riskRunBtn = document.getElementById("risk-run");
const cameraAiBtn = document.getElementById("camera-ai-run");
const safeName = document.getElementById("safe-name");
const safeCity = document.getElementById("safe-city");
const safeCapacity = document.getElementById("safe-capacity");
const safeStatus = document.getElementById("safe-status");
const safeUseLocationBtn = document.getElementById("safe-use-location");
const safeCreateBtn = document.getElementById("safe-create");

navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.target)));
moduleCards.forEach((card) => card.addEventListener("click", () => switchView(card.dataset.jump)));
segmentButtons.forEach((button) => button.addEventListener("click", () => switchSegment(button.dataset.segment)));
refreshBtn.addEventListener("click", () => loadBootstrap(true));
incidentFilter.addEventListener("change", renderIncidentList);
recenterMapBtn.addEventListener("click", centerMap);
reportTypeSelect.addEventListener("change", syncReportMode);
reportText.addEventListener("input", syncSubmitState);
btnStartCamera.addEventListener("click", startCamera);
btnTakePhoto.addEventListener("click", capturePhoto);
btnRetake.addEventListener("click", retakePhoto);
btnManualLoc.addEventListener("click", chooseLocationOnMap);
btnSubmit.addEventListener("click", submitFieldReport);
nlpRunBtn.addEventListener("click", runNlpAnalysis);
riskRunBtn.addEventListener("click", runRiskAnalysis);
cameraAiBtn.addEventListener("click", runCameraAiAnalysis);
safeUseLocationBtn.addEventListener("click", fillSafeAreaWithCurrentLocation);
safeCreateBtn.addEventListener("click", createSafeArea);

let stream = null;
let ws = null;
let userMarker = null;
let manualMarker = null;

const map = L.map("map", { zoomControl: false }).setView([37.5, 37.5], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "OSM" }).addTo(map);
L.control.zoom({ position: "topright" }).addTo(map);

const mapLayers = {
    incidents: L.layerGroup().addTo(map),
    safeAreas: L.layerGroup().addTo(map),
    user: L.layerGroup().addTo(map),
};

function switchView(viewId) {
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === viewId));
    views.forEach((view) => view.classList.toggle("active", view.id === viewId));
    if (viewId === "view-map" && map) {
        setTimeout(() => map.invalidateSize(), 80);
    }
}

function switchSegment(segmentId) {
    segmentButtons.forEach((button) => button.classList.toggle("active", button.dataset.segment === segmentId));
    document.querySelectorAll(".segment-panel").forEach((panel) => panel.classList.toggle("active", panel.id === segmentId));
}

function setConnectionState(connected, text) {
    const dot = document.getElementById("connection-status");
    const label = document.getElementById("connection-text");
    dot.className = connected ? "dot connected" : "dot disconnected";
    label.textContent = text;
}

function setLocationLabel(text) {
    document.getElementById("loc-text").textContent = text;
}

function urgencyClass(level) {
    if (level >= 5) return "danger";
    if (level >= 4) return "warning";
    return "success";
}

function prettyTime(timestamp) {
    if (!timestamp) return "Bilinmiyor";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return date.toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

async function apiGet(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`GET ${url} failed`);
    }
    return response.json();
}

async function apiSend(url, method, payload) {
    const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || `${method} ${url} failed`);
    }
    return data;
}

async function loadBootstrap(showToast = false) {
    try {
        state.bootstrap = await apiGet("/api/mobile/bootstrap");
        renderDashboard();
        renderIncidentList();
        renderSafeAreaManager();
        renderMap();
        if (showToast) alert("Mobil veri yenilendi.");
    } catch (error) {
        console.error(error);
        if (showToast) alert("Veri yenilenemedi.");
    }
}

function renderDashboard() {
    const summary = state.bootstrap.summary || {};
    document.getElementById("metric-incidents").textContent = summary.incident_count || 0;
    document.getElementById("metric-active").textContent = summary.active_count || 0;
    document.getElementById("metric-high").textContent = summary.high_priority_count || 0;
    document.getElementById("metric-safe").textContent = summary.safe_area_count || 0;
    document.getElementById("generated-at").textContent = prettyTime(state.bootstrap.generated_at);

    const highPriority = (state.bootstrap.incidents || []).filter((item) => Number(item.aciliyet || 1) >= 4).slice(0, 5);
    document.getElementById("home-high-priority").innerHTML = highPriority.length
        ? highPriority.map(renderStackItem).join("")
        : '<div class="stack-item"><h4>Kritik vaka yok</h4><p class="incident-body">Sistem simdilik sakin gorunuyor.</p></div>';

    const nearest = getNearestSafeAreas().slice(0, 3);
    document.getElementById("safe-area-list").innerHTML = nearest.length
        ? nearest.map((area) => `
            <div class="stack-item">
                <h4>${area.name}</h4>
                <p class="incident-body">${area.city} | Kapasite: ${area.capacity} | Durum: ${area.status}</p>
                <div class="stack-meta"><span class="chip success">${area.distance_km.toFixed(2)} km</span></div>
            </div>
        `).join("")
        : '<div class="stack-item"><h4>Guvenli alan bilgisi bekleniyor</h4><p class="incident-body">Konum alindiginda yakin alanlar burada listelenecek.</p></div>';
}

function renderStackItem(item) {
    return `
        <div class="stack-item">
            <h4>${item.kategori || "Vaka"}</h4>
            <p class="incident-body">${(item.tweet || "").slice(0, 120) || "Aciklama yok"}</p>
            <div class="stack-meta">
                <span class="chip ${urgencyClass(Number(item.aciliyet || 1))}">${item.aciliyet_etiketi || "Orta"}</span>
                <span class="chip">${item.konum_tipi || "Konum yok"}</span>
                <span class="chip">${item.durum || "Yeni"}</span>
            </div>
        </div>
    `;
}

function getFilteredIncidents() {
    const filter = incidentFilter.value;
    const items = state.bootstrap.incidents || [];
    if (filter === "high") return items.filter((item) => Number(item.aciliyet || 1) >= 4);
    if (filter === "located") return items.filter((item) => item.harita_merkezi || item.konum);
    if (filter === "new") return items.filter((item) => ["Yeni", "Inceleniyor"].includes(item.durum));
    return items;
}

function renderIncidentList() {
    const incidents = getFilteredIncidents();
    document.getElementById("incident-list").innerHTML = incidents.length
        ? incidents.map((item) => {
            const needs = Array.isArray(item.ihtiyaclar) ? item.ihtiyaclar.slice(0, 3) : [];
            return `
                <article class="incident-card">
                    <h4>${item.kategori || "Vaka"} <small class="muted">#${item.id || "-"}</small></h4>
                    <p class="incident-body">${item.tweet || "Aciklama yok"}</p>
                    <div class="incident-meta">
                        <span class="chip ${urgencyClass(Number(item.aciliyet || 1))}">${item.aciliyet_etiketi || "Orta"}</span>
                        <span class="chip">${item.konum_tipi || "Konum yok"}</span>
                        <span class="chip">${item.atanan_ekip || "Ekip yok"}</span>
                    </div>
                    ${needs.length ? `<div class="incident-meta">${needs.map((need) => `<span class="chip warning">${need.ihtiyac}</span>`).join("")}</div>` : ""}
                </article>
            `;
        }).join("")
        : '<article class="incident-card"><h4>Filtreye uygun vaka yok</h4><p class="incident-body">Baska bir filtre deneyebiliriz.</p></article>';
}

function renderSafeAreaManager() {
    const list = document.getElementById("manage-safe-areas");
    const areas = state.bootstrap.safe_areas || [];
    list.innerHTML = areas.length
        ? areas.map((area) => `
            <div class="stack-item">
                <h4>${area.name}</h4>
                <p class="incident-body">${area.city} | Kapasite: ${area.capacity} | Durum: ${area.status}</p>
                <div class="stack-meta">
                    <span class="chip success">${Number(area.lat).toFixed(3)}, ${Number(area.lon).toFixed(3)}</span>
                </div>
            </div>
        `).join("")
        : '<div class="stack-item"><h4>Kayitli guvenli alan yok</h4></div>';
}

function renderMap() {
    mapLayers.incidents.clearLayers();
    mapLayers.safeAreas.clearLayers();
    const bounds = [];

    (state.bootstrap.safe_areas || []).forEach((area) => {
        L.circleMarker([area.lat, area.lon], {
            radius: 8,
            color: "#47d7ac",
            weight: 2,
            fillColor: "#47d7ac",
            fillOpacity: 0.35,
        }).bindPopup(`<strong>${area.name}</strong><br>${area.city}<br>Kapasite: ${area.capacity}<br>Durum: ${area.status}`).addTo(mapLayers.safeAreas);
        bounds.push([area.lat, area.lon]);
    });

    (state.bootstrap.incidents || []).forEach((item) => {
        const coords = item.harita_merkezi || item.konum;
        if (!coords) return;
        const urgency = Number(item.aciliyet || 1);
        const color = urgency >= 5 ? "#ff6b6b" : urgency >= 4 ? "#ffb454" : "#4cc9f0";
        const radiusKm = Number(item.etki_yaricapi_km || 0);
        if (radiusKm > 1) {
            L.circle(coords, {
                radius: radiusKm * 1000,
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.12,
            }).bindPopup(`<strong>${item.kategori}</strong><br>${item.aciliyet_etiketi}<br>${item.konum_tipi || ""}`).addTo(mapLayers.incidents);
        } else {
            L.marker(coords).bindPopup(`<strong>${item.kategori}</strong><br>${item.aciliyet_etiketi}<br>${item.durum || "Yeni"}`).addTo(mapLayers.incidents);
        }
        bounds.push(coords);
    });

    if (userMarker && state.currentLat !== null && state.currentLon !== null) {
        bounds.push([state.currentLat, state.currentLon]);
    }
    if (bounds.length) {
        map.fitBounds(bounds, { padding: [24, 24] });
    }
}

function centerMap() {
    if (state.currentLat !== null && state.currentLon !== null) {
        map.setView([state.currentLat, state.currentLon], 13);
    } else {
        renderMap();
    }
}

function getNearestSafeAreas() {
    if (state.currentLat === null || state.currentLon === null) return [];
    const toRad = (value) => (value * Math.PI) / 180;
    const distanceKm = (lat1, lon1, lat2, lon2) => {
        const earth = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return 2 * earth * Math.asin(Math.sqrt(a));
    };
    return (state.bootstrap.safe_areas || [])
        .map((area) => ({ ...area, distance_km: distanceKm(state.currentLat, state.currentLon, area.lat, area.lon) }))
        .sort((a, b) => a.distance_km - b.distance_km);
}

function updateUserMarker() {
    if (state.currentLat === null || state.currentLon === null) return;
    mapLayers.user.clearLayers();
    userMarker = L.circleMarker([state.currentLat, state.currentLon], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#4cc9f0",
        fillOpacity: 0.85,
    }).bindPopup("Sizin konumunuz");
    userMarker.addTo(mapLayers.user);
}

function watchLocation() {
    if (!("geolocation" in navigator)) {
        setLocationLabel("GPS desteklenmiyor");
        return;
    }
    navigator.geolocation.watchPosition(
        (position) => {
            state.currentLat = position.coords.latitude;
            state.currentLon = position.coords.longitude;
            setLocationLabel(`${state.currentLat.toFixed(4)}, ${state.currentLon.toFixed(4)}`);
            updateUserMarker();
            renderDashboard();
            syncSubmitState();
        },
        () => setLocationLabel("GPS alinamadi"),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 3000 }
    );
}

function syncReportMode() {
    const isTextMode = reportTypeSelect.value === "acil_ihtiyac";
    textContainer.hidden = !isTextMode;
    document.getElementById("camera-container").hidden = isTextMode;
    syncSubmitState();
}

function syncSubmitState() {
    const isTextMode = reportTypeSelect.value === "acil_ihtiyac";
    const hasLocation = state.currentLat !== null && state.currentLon !== null;
    btnSubmit.disabled = !(hasLocation && (isTextMode ? reportText.value.trim().length > 0 : Boolean(state.photoDataUrl)));
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        btnStartCamera.hidden = true;
        btnTakePhoto.hidden = false;
    } catch (error) {
        alert(`Kamera acilamadi: ${error.message}`);
    }
}

function capturePhoto() {
    let targetWidth = 900;
    let quality = 0.68;
    
    // Batarya Bölgesi (Zone B) veya Çevrimdışı modda Canvas Sıkıştırma (Dynamic Downscaling)
    if (currentBatteryZone === "Zone B" || !navigator.onLine || (ws && ws.readyState !== WebSocket.OPEN)) {
        targetWidth = 480;
        quality = 0.35;
        console.log("Canvas Sıkıştırma Aktif: 480px, Kalite %35.");
    }
    
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > targetWidth) {
        height = Math.round((height * targetWidth) / width);
        width = targetWidth;
    }
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(video, 0, 0, width, height);
    state.photoDataUrl = canvas.toDataURL("image/jpeg", quality);
    photoResult.src = state.photoDataUrl;
    photoResult.hidden = false;
    video.hidden = true;
    btnTakePhoto.hidden = true;
    btnRetake.hidden = false;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    syncSubmitState();
}

async function retakePhoto() {
    state.photoDataUrl = null;
    photoResult.hidden = true;
    video.hidden = false;
    btnRetake.hidden = true;
    btnTakePhoto.hidden = false;
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    syncSubmitState();
}

function chooseLocationOnMap() {
    switchView("view-map");
    alert("Haritada bulundugunuz yere bir kez dokunun.");
    map.once("click", (event) => {
        const { lat, lng } = event.latlng;
        state.currentLat = lat;
        state.currentLon = lng;
        setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)} (manuel)`);
        if (manualMarker) {
            manualMarker.setLatLng([lat, lng]);
        } else {
            manualMarker = L.marker([lat, lng], { draggable: true }).addTo(mapLayers.user);
        }
        updateUserMarker();
        renderDashboard();
        syncSubmitState();
        setTimeout(() => switchView("view-report"), 700);
    });
}

function wsUrl() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/${wsClientId}`;
}

let reconnectAttempts = 0;
function connectWebSocket() {
    ws = new WebSocket(wsUrl());
    
    ws.onopen = async () => {
        reconnectAttempts = 0;
        setConnectionState(true, "P2P agina bagli");
        syncSubmitState();
        
        // Çevrimdışı IndexedDB kuyruğundaki bekleyen tüm ihbarları senkronize et
        try {
            const pending = await getPendingReports();
            if (pending.length > 0) {
                console.log(`Bağlantı kuruldu! ${pending.length} adet çevrimdışı ihbar senkronize ediliyor...`);
                for (const report of pending) {
                    const signature = await signPayload(report);
                    const signedPayload = { ...report, crypto_signature: signature };
                    ws.send(JSON.stringify(signedPayload));
                    await markReportSynced(report.uuid);
                }
                alert("Tüm çevrimdışı ihbarlar başarıyla merkez sunucuya iletildi!");
            }
        } catch (e) {
            console.error("Kuyruk senkronizasyon hatası:", e);
        }
    };
    
    ws.onclose = () => {
        setConnectionState(false, "Baglanti yeniden kuruluyor");
        syncSubmitState();
        
        // Üstel Geri Çekilme (Exponential Backoff) & Jitter Algoritması
        reconnectAttempts++;
        const delay = Math.min(2500 * Math.pow(2, reconnectAttempts - 1), 30000);
        const jitter = Math.random() * 1000;
        const finalDelay = delay + jitter;
        
        console.log(`WebSocket koptu. ${Math.round(finalDelay)}ms sonra yeniden denenecek. (Deneme #${reconnectAttempts})`);
        setTimeout(connectWebSocket, finalDelay);
    };
    
    ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "system") return;
        loadBootstrap();
    };
}

async function submitFieldReport() {
    const isTextMode = reportTypeSelect.value === "acil_ihtiyac";
    const uuid = "INC-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    
    const payload = {
        uuid: uuid,
        sender_id: wsClientId,
        type: reportTypeSelect.value,
        lat: state.currentLat,
        lon: state.currentLon,
        image: isTextMode ? null : state.photoDataUrl,
        text: isTextMode ? reportText.value.trim() : null,
        pending_sync: 1,
        zaman: new Date().toISOString()
    };
    
    const isOnline = ws && ws.readyState === WebSocket.OPEN;
    
    if (!isOnline) {
        // ÇEVRİMDIŞI İHBAR KAYDI (IndexedDB)
        try {
            await saveOfflineReport(payload);
            
            // BroadcastChannel ile Mesh ağında sekmeler arası yayılım tetiklenir
            meshChannel.postMessage({
                type: "p2p_mesh_relay",
                report: payload
            });
            
            alert("İhbar internet olmadığı için yerel belleğe (IndexedDB) kaydedildi!\nKablosuz telsiz ağı (P2P Mesh) ile çevredeki cihazlara aktarılarak iletilecektir.");
        } catch (e) {
            console.error("Çevrimdışı ihbar kaydedilemedi:", e);
            alert("İhbar kaydedilirken yerel hata oluştu.");
            return;
        }
    } else {
        // ÇEVRİMİÇİ DOĞRUDAN GÖNDERİM
        try {
            const signature = await signPayload(payload);
            const signedPayload = { ...payload, crypto_signature: signature, pending_sync: 0 };
            
            ws.send(JSON.stringify(signedPayload));
            
            // Yerel depoya da senkronize edilmiş olarak yazalım
            await saveOfflineReport({ ...payload, pending_sync: 0 });
            
            alert("Bildirim canlı ağ üzerinden başarıyla merkeze iletildi.");
        } catch (e) {
            console.error("Canlı ihbar gönderim hatası:", e);
            alert("Canlı gönderimde hata oluştu.");
            return;
        }
    }
    
    // Form temizliği ve ekran yönlendirmesi
    if (isTextMode) {
        reportText.value = "";
    } else if (!btnRetake.hidden) {
        btnRetake.click();
    }
    
    syncSubmitState();
    switchView("view-incidents");
    
    if (isOnline) {
        setTimeout(() => loadBootstrap(true), 600);
    }
}

async function runNlpAnalysis() {
    const text = nlpText.value.trim();
    if (!text) {
        alert("Analiz icin metin gir.");
        return;
    }
    const container = document.getElementById("nlp-result");
    container.innerHTML = '<div class="stack-item"><h4>Analiz yapiliyor</h4></div>';
    try {
        const data = await apiSend("/api/mobile/nlp/analyze", "POST", { text });
        if (!data.accepted) {
            container.innerHTML = `<div class="stack-item"><h4>Analiz reddedildi</h4><p class="incident-body">${data.message}</p></div>`;
            return;
        }
        const analysis = data.analysis;
        const incident = data.incident;
        container.innerHTML = `
            <div class="stack-item">
                <h4>${analysis.kategori}</h4>
                <p class="incident-body">Aciliyet: ${analysis.aciliyet} | Guven: %${Math.round((analysis.guven_skoru || 0) * 100)}</p>
                <div class="stack-meta">
                    <span class="chip ${urgencyClass(Number(analysis.aciliyet || 1))}">${incident.konum_tipi}</span>
                    <span class="chip success">Operasyona eklendi #${incident.id}</span>
                </div>
            </div>
        `;
        await loadBootstrap();
        nlpText.value = "";
        switchView("view-incidents");
    } catch (error) {
        container.innerHTML = `<div class="stack-item"><h4>Hata</h4><p class="incident-body">${error.message}</p></div>`;
    }
}

async function runRiskAnalysis() {
    const container = document.getElementById("risk-result");
    container.innerHTML = '<div class="stack-item"><h4>Risk hesaplaniyor</h4></div>';
    try {
        const data = await apiSend("/api/mobile/risk/analyze", "POST", { city: riskCity.value });
        const summary = data.summary;
        container.innerHTML = `
            <div class="stack-item">
                <h4>${summary.city}</h4>
                <p class="incident-body">${summary.result}</p>
                <div class="stack-meta">
                    <span class="chip warning">150 km deprem: ${summary.nearby_count}</span>
                    <span class="chip">Max mag: ${summary.max_mag.toFixed(2)}</span>
                    <span class="chip">Ortalama derinlik: ${summary.avg_depth.toFixed(1)} km</span>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="stack-item"><h4>Hata</h4><p class="incident-body">${error.message}</p></div>`;
    }
}

async function runCameraAiAnalysis() {
    const container = document.getElementById("camera-ai-result");
    if (!state.photoDataUrl) {
        container.innerHTML = '<div class="stack-item"><h4>Fotograf gerekli</h4><p class="incident-body">Bildir ekraninda once bir fotograf cek.</p></div>';
        return;
    }
    container.innerHTML = '<div class="stack-item"><h4>AI analizi yapiliyor</h4></div>';
    try {
        const data = await apiSend("/api/mobile/camera/analyze", "POST", { image: state.photoDataUrl });
        container.innerHTML = `
            <div class="stack-item">
                <h4>${data.analysis.label || "Sonuc yok"}</h4>
                <p class="incident-body">Guven: %${Math.round((data.analysis.confidence || 0) * 100)}</p>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="stack-item"><h4>Hata</h4><p class="incident-body">${error.message}</p></div>`;
    }
}

function fillSafeAreaWithCurrentLocation() {
    if (state.currentLat === null || state.currentLon === null) {
        alert("Once konum alinsin.");
        return;
    }
    safeCity.value = safeCity.value || "Hatay";
    alert(`Konum hazir: ${state.currentLat.toFixed(4)}, ${state.currentLon.toFixed(4)}`);
}

async function createSafeArea() {
    if (state.currentLat === null || state.currentLon === null) {
        alert("Toplanma alani eklemek icin konum gerekiyor.");
        return;
    }
    const payload = {
        name: safeName.value.trim(),
        city: safeCity.value.trim(),
        lat: state.currentLat,
        lon: state.currentLon,
        capacity: Number(safeCapacity.value || 0),
        status: safeStatus.value,
    };
    if (!payload.name || !payload.city || !payload.capacity) {
        alert("Alan adi, sehir ve kapasite gerekli.");
        return;
    }
    try {
        await apiSend("/api/mobile/safe-areas", "POST", payload);
        safeName.value = "";
        safeCity.value = "";
        safeCapacity.value = "";
        await loadBootstrap(true);
    } catch (error) {
        alert(error.message);
    }
}

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch((error) => console.error("SW error", error));
    });
}

// Çevrimdışı IndexedDB, Batarya ve Kripto servislerini ilklendir
async function initAppServices() {
    try {
        await initDB();
        await initCryptoKeys();
        initBatteryMonitoring();
    } catch (e) {
        console.error("Servis ilklendirme hatası:", e);
    }
}

initAppServices();
watchLocation();
syncReportMode();
switchSegment("nlp-panel");
connectWebSocket();
loadBootstrap();
