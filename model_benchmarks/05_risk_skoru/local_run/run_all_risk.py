"""ALAN 05 - Deprem risk skoru: yerel calistirma, ayrintili sonuc + grafik uretimi.

Butun modeller (CatBoost, XGBoost, LightGBM, Random Forest, Lojistik Regresyon, MLP,
Yiginlanmis Topluluk) AYNI veri (common_preprocessing.load_dataset), AYNI walk-forward
(TimeSeriesSplit, 5 fold) bolmesiyle egitilir. _build_notebooks.py / 07 / 08 defterleriyle
BIREBIR AYNI hiperparametreler kullanilir - tek fark: burada fold-bazli detay + OOF
tahminler de saklanip zengin grafikler uretiliyor.

    python run_all_risk.py
"""
import json
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

PARENT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PARENT))
import common_preprocessing as cp  # noqa: E402

HERE = Path(__file__).resolve().parent
RESULTS = HERE / "results"
RESULTS.mkdir(parents=True, exist_ok=True)

N_SPLITS = 5


def build_catboost():
    from catboost import CatBoostClassifier
    params = dict(iterations=800, depth=8, learning_rate=0.03,
                  loss_function="Logloss", random_seed=42, verbose=False)
    return CatBoostClassifier(**params), params


def build_xgboost():
    from xgboost import XGBClassifier
    params = dict(n_estimators=800, max_depth=6, learning_rate=0.03,
                  subsample=0.9, colsample_bytree=0.9, eval_metric="logloss",
                  random_state=42, n_jobs=-1)
    return XGBClassifier(**params), params


def build_lightgbm():
    from lightgbm import LGBMClassifier
    params = dict(n_estimators=800, num_leaves=31, learning_rate=0.03,
                  subsample=0.9, colsample_bytree=0.9, random_state=42, n_jobs=-1, verbose=-1)
    return LGBMClassifier(**params), params


def build_random_forest():
    from sklearn.ensemble import RandomForestClassifier
    params = dict(n_estimators=500, max_depth=None, min_samples_leaf=2,
                  class_weight="balanced", random_state=42, n_jobs=-1)
    return RandomForestClassifier(**params), params


def build_logreg():
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    params = dict(C=1.0, class_weight="balanced", max_iter=2000, random_state=42)
    return make_pipeline(StandardScaler(), LogisticRegression(**params)), params


def build_mlp():
    from sklearn.neural_network import MLPClassifier
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    params = dict(hidden_layer_sizes=(64, 32), activation="relu", alpha=1e-3,
                  learning_rate_init=1e-3, max_iter=500, early_stopping=True, random_state=42)
    return make_pipeline(StandardScaler(), MLPClassifier(**params)), params


def build_stacking():
    from sklearn.ensemble import StackingClassifier, RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from catboost import CatBoostClassifier
    from lightgbm import LGBMClassifier
    params = dict(final_estimator="LogisticRegression", cv=3)
    model = StackingClassifier(
        estimators=[
            ("cat", CatBoostClassifier(iterations=600, depth=7, learning_rate=0.03,
                                        verbose=False, random_seed=42)),
            ("lgbm", LGBMClassifier(n_estimators=600, learning_rate=0.03, random_state=42, verbose=-1)),
            ("rf", RandomForestClassifier(n_estimators=400, class_weight="balanced",
                                           random_state=42, n_jobs=-1)),
        ],
        final_estimator=LogisticRegression(max_iter=1000), cv=3, n_jobs=-1)
    return model, params


MODELS = {
    "catboost": ("CatBoost", build_catboost),
    "xgboost": ("XGBoost", build_xgboost),
    "lightgbm": ("LightGBM", build_lightgbm),
    "random_forest": ("Random Forest", build_random_forest),
    "logistic_regression": ("Lojistik Regresyon", build_logreg),
    "mlp": ("MLP (Sinir Ağı)", build_mlp),
    "stacking_ensemble": ("Yığınlanmış Topluluk (Cat+LGBM+RF)", build_stacking),
}


def get_feature_importance(model, feature_names):
    """Agac/lineer modeller icin oznitelik onemini cikar (varsa)."""
    est = model
    # pipeline ise son adimi al
    if hasattr(model, "steps"):
        est = model.steps[-1][1]
    if hasattr(est, "feature_importances_"):
        vals = np.asarray(est.feature_importances_, dtype=float)
        return dict(zip(feature_names, vals.tolist()))
    if hasattr(est, "coef_"):
        vals = np.abs(np.asarray(est.coef_)).ravel()
        return dict(zip(feature_names, vals.tolist()))
    return None


def run_model(name, title, builder, X, y, splits):
    fold_metrics = []
    oof_true, oof_prob, oof_idx = [], [], []
    fold_importances = []

    t0 = time.time()
    for i, (tr, te) in enumerate(splits, 1):
        model, params = builder()
        model.fit(X.iloc[tr], y.iloc[tr])
        prob = model.predict_proba(X.iloc[te])[:, 1]

        m = cp.evaluate_predictions(y.iloc[te], prob)
        fold_metrics.append(m)
        oof_true.append(np.asarray(y.iloc[te]))
        oof_prob.append(prob)
        oof_idx.append(np.asarray(te))

        imp = get_feature_importance(model, X.columns.tolist())
        if imp:
            fold_importances.append(imp)

        print(f"[{name}] fold {i}/{len(splits)}: ROC-AUC={m['roc_auc']:.3f} "
              f"PR-AUC={m['pr_auc']:.3f} F1={m['f1']:.3f} n={m['n']}")

    train_s = time.time() - t0
    agg = cp.aggregate_folds(fold_metrics)

    # ortalama oznitelik onemi (fold'lar arasi)
    avg_importance = None
    if fold_importances:
        keys = fold_importances[0].keys()
        avg_importance = {k: float(np.mean([f[k] for f in fold_importances])) for k in keys}
        avg_importance = dict(sorted(avg_importance.items(), key=lambda x: -x[1]))

    payload = {
        "model": name, "title": title,
        **agg,
        "fold_metrics": fold_metrics,
        "params": builder()[1],
        "train_seconds": round(train_s, 2),
        "feature_importance": avg_importance,
    }
    with open(RESULTS / f"{name}.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    return {
        "name": name, "title": title, "agg": agg, "fold_metrics": fold_metrics,
        "oof_true": np.concatenate(oof_true), "oof_prob": np.concatenate(oof_prob),
        "oof_idx": np.concatenate(oof_idx),
        "importance": avg_importance, "train_seconds": train_s,
    }


def main():
    print("Veri yukleniyor...")
    X, y, df_main = cp.load_dataset()
    print(f"Ornek sayisi: {len(X)}  Ozellik sayisi: {X.shape[1]}  Pozitif oran: {y.mean():.4f}")
    print(f"Zaman araligi: {df_main['time'].min()} -> {df_main['time'].max()}")

    splits = cp.walk_forward_splits(len(X), N_SPLITS)

    all_results = {}
    for name, (title, builder) in MODELS.items():
        print(f"\n{'='*60}\n{title} ({name})\n{'='*60}")
        all_results[name] = run_model(name, title, builder, X, y, splits)

    # --- ozet leaderboard ---
    rows = []
    for name, r in all_results.items():
        a = r["agg"]
        rows.append({"model": r["title"], "roc_auc_mean": a["roc_auc_mean"], "roc_auc_std": a["roc_auc_std"],
                     "pr_auc_mean": a["pr_auc_mean"], "f1_mean": a["f1_mean"],
                     "balanced_accuracy_mean": a["balanced_accuracy_mean"],
                     "brier_mean": a["brier_mean"], "mcc_mean": a["mcc_mean"],
                     "train_seconds": round(r["train_seconds"], 2)})
    lb = pd.DataFrame(rows).sort_values("roc_auc_mean", ascending=False)
    lb.to_csv(RESULTS / "leaderboard.csv", index=False)
    print("\n" + lb.round(4).to_string(index=False))

    # --- veri seti bilgisi (rapor icin) ---
    ds_info = {
        "n_total": int(len(X)), "n_features": int(X.shape[1]),
        "feature_names": X.columns.tolist(),
        "positive_rate": float(y.mean()),
        "time_min": str(df_main["time"].min()), "time_max": str(df_main["time"].max()),
        "n_splits": N_SPLITS,
    }
    json.dump(ds_info, open(RESULTS / "dataset_info.json", "w", encoding="utf-8"),
               indent=2, ensure_ascii=False)

    # grafikleri uret
    from plots_risk import make_all_plots
    make_all_plots(all_results, X, y)

    print("\nTum modeller tamamlandi. Rapor icin: python build_docx_report_risk.py")


if __name__ == "__main__":
    main()
