"""TF-IDF + Lojistik Regresyon / Lineer SVM - cok-etiketli (OneVsRest) taban cizgileri."""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import data_multilabel as D  # noqa: E402


def run(name, clf_builder, clf_desc):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.multiclass import OneVsRestClassifier

    tr, va, te, label_list, label2id = D.load_splits()
    ytr = D.multi_hot(tr, label2id)
    yte = D.multi_hot(te, label2id)

    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=50000, sublinear_tf=True)
    Xtr = vec.fit_transform(tr["text"].tolist())
    Xte = vec.transform(te["text"].tolist())

    clf = OneVsRestClassifier(clf_builder())

    t0 = time.time()
    clf.fit(Xtr, ytr)
    train_s = time.time() - t0

    try:
        yprob = clf.predict_proba(Xte)
    except AttributeError:
        # LinearSVC gibi predict_proba desteklemeyenler icin decision_function -> sigmoid yaklasik
        import numpy as np
        df_ = clf.decision_function(Xte)
        yprob = 1 / (1 + np.exp(-df_))

    metrics = D.classification_metrics(yte, yprob, label_list)
    print(f"[{name}] micro-F1={metrics['micro_f1']:.4f}  macro-F1={metrics['macro_f1']:.4f}  "
          f"subset-acc={metrics['subset_accuracy']:.4f}  (egitim {train_s:.1f}s)")

    params = {"vectorizer": str(vec), "classifier": clf_desc, "strategy": "OneVsRestClassifier",
              "train_seconds": round(train_s, 2)}
    D.save_result(name, metrics, params=params)
    D.plot_per_class_bar(name, metrics["per_class"])
    return metrics


def main():
    from sklearn.linear_model import LogisticRegression
    from sklearn.svm import LinearSVC

    run("tfidf_logreg",
        lambda: LogisticRegression(max_iter=2000, class_weight="balanced", C=2.0),
        "LogisticRegression(max_iter=2000, class_weight='balanced', C=2.0)")

    run("tfidf_svm",
        lambda: LinearSVC(class_weight="balanced", C=1.0),
        "LinearSVC(class_weight='balanced', C=1.0)")


if __name__ == "__main__":
    main()
