# -*- coding: utf-8 -*-
"""Tatbikati secilen alanlarda kosar ve RAPORLANABILIR sayilari uretir.

Zincir (kendi mantigimiz; Copernicus EMS/EMSR, HAZUS ve sentetik kapanma
ureteci KULLANILMAZ):

    gercek acik drone goruntusu
      -> kendi hasar modelimiz (modeller/uydu/<kunye>.json)
      -> OSM yol agiyla piksel kesisimi
      -> kapali yollar
      -> ekip usu (gercek tesis) -> afetzede (hasar blobu) rotalari
      -> kiyas kollari: kapanmayi bilmeyen / telsizle paylasan / QuakeMind

Trafik SAGDAN akar: tek yon uygulanir, sola donus ve U donusu maliyetlidir
(`utils/donus.py`).

Cikti: her alan icin JSON + okunabilir bir ozet tablosu. Beyan edilen her
sabit (donus sureleri, degerlendirme suresi) ciktida yazilir ve `--duyarlilik`
ile etkisi ayrica olculur -- hicbir sonuc tek bir uydurma sabite dayanmasin.
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402


def _alanlari_oku(yol: Path) -> list:
    return json.loads(yol.read_text(encoding="utf-8"))


def _b64_maske(sonuc, alan, esik):
    """Analiz sonucundaki B64 gorseli -> ikili dizi (yoksa None).

    Uc katmani bu gorselleri diske yaziyor ve tatbikat oradan okuyor; burada
    `run_analysis_job` dogrudan cagrildigi icin diske yazan katman yok, ayni
    veriyi sonuctan aliyoruz -- maske AYNI maske.
    """
    import base64
    import io

    from PIL import Image

    ham = sonuc.get(alan)
    if not ham:
        return None
    veri = base64.b64decode(str(ham).split(",")[-1])
    return (np.asarray(Image.open(io.BytesIO(veri)).convert("L")) > esik).astype(np.uint8)


def _tek_alan(alan, model_kunye, tohumlar, ekip_sayisi, gorus_m, donus_maliyetli, kapsam,
              degerlendirme_dk=None):
    from apps.road_damage.utils import model_kunyesi, tatbikat
    from apps.road_damage.worker import _init_worker, run_analysis_job

    kutu = alan["analizBbox"]
    istek = {
        "_analysisId": f"tatbikat-{alan['parca']}",
        "city": alan.get("il") or "?", "source": "oam",
        "latitude": alan["merkez"]["lat"], "longitude": alan["merkez"]["lon"],
        "bboxWest": kutu[0], "bboxSouth": kutu[1], "bboxEast": kutu[2], "bboxNorth": kutu[3],
        "oamTileUrl": alan["tmsUrl"] + "/{z}/{x}/{y}.png",
        "oamPreferredTitle": alan["sahneAdi"],
        "oncesiGoruntusu": False, "modelAdi": model_kunye, "radiusKm": 2.5,
    }
    t0 = time.perf_counter()
    r = run_analysis_job(istek)
    analiz_sn = time.perf_counter() - t0
    for k in ("roadGraph", "closedEdgeKeys", "closureProb"):
        r.pop(k, None)

    # Hasar maskesi ve gecerli piksel maskesi, analizin kendi ciktisindan.
    eksik = tatbikat.goruntu_eksik_mi(r, alan)
    if eksik:
        return {"alan": alan["yer"], "hata": eksik}

    maske = _b64_maske(r, "imageDamageMaskB64", esik=127)
    if maske is None:
        return {"alan": alan["yer"], "hata": "hasar maskesi sonucta yok"}
    gecerli = _b64_maske(r, "imageOriginalB64", esik=12)

    # `bounds` SOZLUK doner ({west, south, east, north}), liste degil. Once
    # `isinstance(..., list)` sinaniyordu; sinama hep basarisiz olup ISTENEN
    # kutuya dusuyordu. Analiz karo sinirina oturdugu icin iki kutu ayni degil
    # -- bu alanda batida 102 m kayma, genislikte %21 fark olculdu, yani maske
    # yanlis yere oturuyordu. Uc katmani bunu zaten dogru okuyor.
    sinir = r.get("bounds") or {}
    if isinstance(sinir, dict) and {"west", "south", "east", "north"} <= set(sinir):
        bounds = (float(sinir["west"]), float(sinir["south"]),
                  float(sinir["east"]), float(sinir["north"]))
    elif isinstance(sinir, (list, tuple)) and len(sinir) == 4:
        bounds = tuple(float(x) for x in sinir)
    else:
        raise RuntimeError(f"Analiz sinirlari okunamadi: {sinir!r}")
    if kapsam == "mahalle":
        # Dunya = goruntulenen mahalle. Ekipler mahallenin giris agizlarinda.
        tam_G, guvenli_G, kapali, rota_kutusu, kapsama_olcum, _cizgi = tatbikat.mahalle_grafigi(
            maske, bounds, gecerli_maske=gecerli)
        ekip = tatbikat.giris_noktalari(tam_G, bounds, sayi=ekip_sayisi)
        if not ekip:
            return {"alan": alan["yer"], "hata": "mahalleye giris agzi bulunamadi"}
    else:
        ilk_kurban = tatbikat.afetzedeler(maske, bounds, sayi=ekip_sayisi * 3, tohum=tohumlar[0])
        ekip = tatbikat.ekipler(alan["merkez"]["lat"], alan["merkez"]["lon"], sayi=ekip_sayisi)
        if not ekip:
            return {"alan": alan["yer"], "hata": "gercek tesis bulunamadi"}
        tam_G, guvenli_G, kapali, rota_kutusu, kapsama_olcum, _cizgi = tatbikat.tatbikat_grafigi(
            ekip, ilk_kurban, maske, bounds, gecerli_maske=gecerli)

    # ANALIZ BIR KEZ, TATBIKAT HER TOHUM ICIN. Cikarim pahalidir ve tohumdan
    # bagimsizdir; degisen tek sey afetzede konumlarinin secimidir. Boylece
    # dagilim (ortalama +- yayilim) ucuza olculur ve tek bir tohumun sansina
    # bakmis olmayiz.
    kollar_tohum = {}
    # "Bes tohumla kostuk" demek, bes FARKLI tatbikat kurduk demek degil: hasar
    # blobu sayisi istenen afetzede sayisindan azsa her tohum ayni kumeyi verir
    # (olculdu: Islahiye'de bes tohumun besi de birebir ayni sonuc). Kac farkli
    # kume kuruldugu sayilir ve raporlanir.
    kumeler = set()
    for t in tohumlar:
        kurban = tatbikat.afetzedeler(maske, bounds, sayi=ekip_sayisi * 3, tohum=t)
        if not kurban:
            kollar_tohum[t] = {"hata": "afetzede bulunamadi (hasar blobu yok)"}
            continue
        kurban, elenen, ekip_t = tatbikat.ulasilabilir_afetzedeler(tam_G, ekip, kurban)
        if not kurban or not ekip_t:
            kollar_tohum[t] = {"hata": f"yol ulasmiyor ({len(elenen)} nokta elendi)"}
            continue
        n = min(len(ekip_t), len(kurban))
        kurban, ekip_t = kurban[:n], ekip_t[:n]
        kumeler.add(tuple(sorted((k["lat"], k["lon"]) for k in kurban)))
        kollar_tohum[t] = tatbikat.kiyas_kollari(
            tam_G, kapali, ekip_t, kurban, gorus_m=gorus_m,
            donus_maliyetli=donus_maliyetli, degerlendirme_dk=degerlendirme_dk)
    kollar = kollar_tohum.get(tohumlar[0])
    if kollar is None or kollar.get("hata"):
        return {"alan": alan["yer"], "hata": (kollar or {}).get("hata", "tatbikat kurulamadi")}
    elenen = []
    return {
        "alan": alan["yer"], "il": alan["il"], "sahne": alan["sahneAdi"],
        "tarih": alan["tarih"], "saglayici": alan["saglayici"],
        "analizBbox": kutu, "gercekBounds": list(bounds), "pencereM": alan.get("pencereM"), "doluluk": alan.get("doluluk"),
        "model": r.get("model"), "analizSn": round(analiz_sn, 1),
        "hasarKare": r.get("damageRate"), "hasarGecerli": r.get("damageRateValid"),
        "gecerliPikselOrani": r.get("validPixelRatio"),
        "acikYol": r.get("openRoads"), "kapaliYol": r.get("blockedRoads"),
        "yolKatmaniYok": r.get("roadLayerMissing"),
        "ekipSayisi": len(ekip), "afetzedeSayisi": len(kurban),
        "elenenAfetzede": len(elenen),
        "grafDugum": tam_G.number_of_nodes(), "grafKenar": tam_G.number_of_edges(),
        "kapaliKenar": len(kapali), "kapsama": kapsama_olcum, "kapsam": kapsam,
        "kollar": kollar, "kollarTohum": kollar_tohum, "tohumlar": list(tohumlar),
        "farkliAfetzedeKumesi": len(kumeler),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--alanlar", required=True, help="araclar_alan_katalogu.py ciktisi (JSON)")
    ap.add_argument("--sec", nargs="*", help="yalniz bu `parca` degerleri")
    ap.add_argument("--model", default=None, help="model kunyesi adi (bos = etkin model)")
    ap.add_argument("--tohum", type=int, nargs="+", default=[42],
                    help="bir ya da daha cok tohum; analiz bir kez kosar")
    ap.add_argument("--ekip", type=int, default=5)
    ap.add_argument("--gorus-m", type=float, default=0.0)
    ap.add_argument("--donussuz", action="store_true", help="donus maliyetini KAPAT (duyarlilik)")
    ap.add_argument("--degerlendirme-dk", type=float, default=None,
                    help="kapanmaya varinca durup degerlendirme suresi (duyarlilik)")
    ap.add_argument("--kapsam", choices=("mahalle", "genis"), default="mahalle",
                    help="mahalle = dunya goruntulenen alan (varsayilan); "
                         "genis = ekipler gercek tesisler, rota alanin disina tasar")
    ap.add_argument("--cikti", default="tatbikat_sonuc.json")
    a = ap.parse_args()

    from apps.road_damage.utils import model_kunyesi
    from apps.road_damage.worker import _init_worker

    alanlar = _alanlari_oku(Path(a.alanlar))
    if a.sec:
        istenen = {x.lower() for x in a.sec}
        alanlar = [x for x in alanlar if x["parca"].lower() in istenen]
    if not alanlar:
        print("Secilen alan yok."); return 1

    kunye_adi = a.model or model_kunyesi.etkin_model_adi()
    _init_worker(model_kunyesi.kunye_oku(kunye_adi))
    print(f"model : {kunye_adi}")
    print(f"alan  : {len(alanlar)}\n")

    sonuc = []
    for alan in alanlar:
        print(f"--- {alan['il']} / {alan['yer']} ---")
        try:
            s = _tek_alan(alan, a.model, a.tohum, a.ekip, a.gorus_m, not a.donussuz, a.kapsam,
                          a.degerlendirme_dk)
        except Exception as e:
            s = {"alan": alan["yer"], "hata": f"{type(e).__name__}: {e}"}
        sonuc.append(s)
        if s.get("hata"):
            print(f"    HATA: {s['hata']}")
            continue
        print(f"    hasar %{(s['hasarGecerli'] or 0)*100:.2f} (gecerli piksel) | "
              f"yol {s['acikYol']} acik / {s['kapaliYol']} kapali | "
              f"graf {s['grafDugum']} dugum, {s['kapaliKenar']} kapali kenar | "
              f"kapsama %{(s['kapsama'] or {}).get('edgesObservedFraction', 0)*100:.1f}")
        for ad, v in (s.get("kollar") or {}).get("varyantlar", {}).items():
            if not isinstance(v, dict) or v.get("hata"):
                continue
            print(f"      {ad:28s} {v['ulasanGorev']}/{v['gorevSayisi']} ulasti | "
                  f"ort {v['ortalamaSureDk']} dk | sol {v['donusler']['sol']} "
                  f"sag {v['donusler']['sag']} U {v['donusler']['u']}")
    Path(a.cikti).write_text(json.dumps(sonuc, ensure_ascii=False, indent=1, default=str),
                             encoding="utf-8")
    print(f"\n{len(sonuc)} alan -> {a.cikti}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
