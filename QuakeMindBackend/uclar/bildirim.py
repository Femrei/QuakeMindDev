"""Acil bildirim ve ekip sohbeti uclari.

TASIMA_PLANI.md Faz 5: fastapi_app.py'den tasindi. Paylasilan durum ve
`ck.` ile cekirdek modulunden okunur."""

# ruff: noqa: F401  -- cekirdek importlari toplu kopyalandi
import cekirdek as ck
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import bcrypt
import math
import re
import sys
import os
import site
import importlib
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from contextlib import contextmanager, asynccontextmanager
from typing import Optional
from threading import Event, Lock, Thread
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, TimeoutError as FutureTimeoutError
import asyncio
import functools
import multiprocessing
import canli_yayin
from depo import depo_ac
from utils.postgis_manager import postgis_engine
from apps.road_damage.utils.serialization import compact_segment_coords as _compact_segment_coords, serialize_segments as _serialize_segments, haversine_m as _haversine_m
from apps.road_damage.utils.imaging import image_array_to_b64 as _image_array_to_b64, build_damage_overlay as _build_damage_overlay, build_segmentation_overlay as _build_segmentation_overlay
from apps.road_damage.utils.tiling import zoom_for_radius as _zoom_for_radius
from fastapi import APIRouter, Depends
import kimlik

yonlendirici = APIRouter()


@yonlendirici.post("/api/notifications/send_emergency")
def send_emergency_notification(req: ck.EmergencyNotificationRequest):
    ck._require_role(req.token, {"responder", "admin"})
    alert = {
        "id": f"alert-{uuid.uuid4().hex[:6]}",
        "title": req.title,
        "body": req.body,
        "severity": req.severity,
        "location": req.location,
        "magnitude": req.magnitude,
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        # Saat tek basina tarih tasimiyordu; sozlesme ucu epoch ms verir.
        "zamanMs": int(time.time() * 1000),
    }
    ck.active_emergency_alerts.insert(0, alert)
    # Afetzede ekrani bildirimi canli akistan alir; yoklama yok (kural 4).
    canli_yayin.yayinla("bildirim", id=alert["id"], baslik=req.title, onem=req.severity)
    return {
        "status": "broadcasted",
        "message": "Acil durum push bildirimi tum cihazlara ve frontend'e yayinlandi.",
        "activeAlert": alert
    }


@yonlendirici.get("/api/bildirimler/aktif")
def aktif_bildirimler(_kul: dict = Depends(kimlik.kullanici)):
    """Acil durum bildirimleri, en yeni once (J-43, afetzede ekraninin bandi).

    Kaynak eski /api/notifications/active ile ayni; bu uc giris ister ve
    alanlari sozlesme adlariyla verir. Buyukluk ve konum gonderende yoksa
    bos gelir (eskiden 6,8 ve "Hatay" varsayilan olarak uyduruluyordu)."""
    return [
        {
            "id": a["id"],
            "baslik": a["title"],
            "metin": a["body"],
            "onem": a["severity"],
            "konum": a.get("location"),
            "buyukluk": a.get("magnitude"),
            "zaman": a.get("zamanMs"),
        }
        for a in ck.active_emergency_alerts[:5]
    ]


@yonlendirici.get("/api/notifications/active")
def get_active_emergency_notifications():
    return {
        "activeAlert": ck.active_emergency_alerts[0] if ck.active_emergency_alerts else None,
        "totalAlerts": len(ck.active_emergency_alerts)
    }


@yonlendirici.post("/api/chat/send")
def send_team_chat_message(req: ck.ChatMessageRequest):
    user = ck._require_role(req.token, {"responder", "admin"})
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Mesaj boş olamaz.")
    message = {
        "id": f"msg-{uuid.uuid4().hex[:10]}",
        "senderId": user.get("id"),
        "senderName": user.get("name") or user.get("email") or "Ekip Üyesi",
        "senderUnit": user.get("unit"),
        "text": text[:2000],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    ck.team_chat_messages.append(message)
    if len(ck.team_chat_messages) > ck._TEAM_CHAT_LIMIT:
        del ck.team_chat_messages[: len(ck.team_chat_messages) - ck._TEAM_CHAT_LIMIT]
    return {"status": "sent", "message": message}


@yonlendirici.get("/api/chat/messages")
def get_team_chat_messages(token: Optional[str] = None, limit: int = 50):
    ck._require_role(token, {"responder", "admin"})
    capped_limit = max(1, min(limit, ck._TEAM_CHAT_LIMIT))
    return {"messages": ck.team_chat_messages[-capped_limit:]}
