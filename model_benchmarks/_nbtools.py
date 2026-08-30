"""Ortak .ipynb uretim yardimcilari (butun _build.py dosyalari kullanir)."""

import json
from pathlib import Path


def md(*lines):
    return {"cell_type": "markdown", "metadata": {}, "source": _src(lines)}


def code(*lines):
    return {
        "cell_type": "code",
        "metadata": {},
        "execution_count": None,
        "outputs": [],
        "source": _src(lines),
    }


def _src(lines):
    flat = []
    for ln in lines:
        flat.extend(str(ln).split("\n"))
    if not flat:
        return []
    return [l + "\n" for l in flat[:-1]] + [flat[-1]]


REPO_URL = "https://github.com/UtBird/QuakeMind.git"


def colab_cell(subpath, pip=""):
    """Her defterin ilk hucresi: Colab'da repoyu klonla + dogru klasore gec + kur.
    Yerelde (Colab disi) hicbir sey yapmaz.
    subpath: 'model_benchmarks/01_yol_hasari' gibi.
    pip: bosluklarla ayrilmis paket listesi (ayni satirda %pip install).
    """
    lines = [
        "# === COLAB KURULUM ===  (yerelde calistirinca atlanir)",
        "import os, sys",
        "IN_COLAB = 'google.colab' in sys.modules",
        "if IN_COLAB and not os.path.exists('/content/QuakeMind'):",
        f"    !git clone --depth 1 {REPO_URL} /content/QuakeMind",
        "if IN_COLAB:",
        f"    %cd /content/QuakeMind/{subpath}",
    ]
    if pip:
        lines.append(f"    %pip install -q {pip}")
    lines.append("print('cwd:', os.getcwd())")
    return code(*lines)


def write_notebook(path, cells):
    nb = {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    Path(path).write_text(json.dumps(nb, indent=1, ensure_ascii=False))
    print("yazildi:", Path(path).name)
