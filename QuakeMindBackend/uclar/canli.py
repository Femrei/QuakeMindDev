"""Tek canli akis (SSE) -- MIMARI.md 6.

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
from fastapi import APIRouter

yonlendirici = APIRouter()


@yonlendirici.get("/api/live")
async def canli_akis(request: Request):
    """TEK canli akis (SSE) -- MIMARI 6.

    Sunucu YALNIZCA degisiklik oldugunda mesaj gonderir; istemci hicbir ucu
    yoklamaz. Mesaj tipleri: yeni-sos, is-durumu, yeni-analiz, isi-surumu,
    ekip-konumu. Sessiz gecen surelerde 20 saniyede bir yorum satiri (": ping")
    gider; bu veri degil, baglantinin vekil sunucularca kapatilmasini onleyen
    bir canlilik isaretidir.
    """
    kuyruk = canli_yayin.abone_ol()

    async def uret():
        try:
            # Akis acilir acilmaz bir kare gonderilir: istemci "bagli" durumuna
            # boylece hemen gecer, ilk olayi beklemez.
            yield ": akis acildi\n\n"
            while True:
                if await request.is_disconnected():
                    return
                try:
                    mesaj = await asyncio.wait_for(kuyruk.get(), timeout=20.0)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                yield canli_yayin.sse_bicimle(mesaj)
        finally:
            canli_yayin.abonelik_bitir(kuyruk)

    return StreamingResponse(
        uret(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            # nginx gibi vekiller akisi tamponlamasin.
            "X-Accel-Buffering": "no",
        },
    )
