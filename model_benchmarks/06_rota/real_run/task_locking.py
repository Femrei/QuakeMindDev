"""
Gorev kilitleme mekanizmasi - gercek, iplik-guvenli (thread-safe) bir
atama kayit defteri. Makalenin iddia ettigi "HTTP 409" davranisinin
uretim API'sinde karsiligi bulunamadi (denetim bulgusu); burada ayni
mantigi (bir hedefe ayni anda iki ekip atanamaz) GERCEKTEN uygulayip
gercek concurrent thread'lerle test ediyoruz. Sonuc dogru/yanlis
raporlanacak, uydurulmayacak.
"""
import threading
from dataclasses import dataclass


class ConflictError(Exception):
    pass


class TaskLock:
    def __init__(self):
        self._lock = threading.Lock()
        self._assigned = {}  # target_id -> team_id

    def assign(self, team_id, target_id):
        with self._lock:
            if target_id in self._assigned:
                raise ConflictError(
                    f"target {target_id} already assigned to team {self._assigned[target_id]}"
                )
            self._assigned[target_id] = team_id
            return True

    def snapshot(self):
        with self._lock:
            return dict(self._assigned)


@dataclass
class DuplicateDispatchTestResult:
    n_attempts: int
    n_accepted: int
    n_rejected: int
    all_targets_single_owner: bool


def run_duplicate_dispatch_test(n_targets=18, n_duplicate_attempts_per_target=10, n_threads=8):
    """n_targets hedefin her biri icin n_duplicate_attempts_per_target kez
    ES ZAMANLI (gercek thread havuzuyla) ayni hedefe farkli 'takim'lardan
    atama denemesi yapar; TaskLock'un yalniz birini kabul edip digerlerini
    ConflictError ile reddettigini dogrular."""
    import concurrent.futures as cf

    lock = TaskLock()
    accepted = 0
    rejected = 0

    def attempt(target_id, team_id):
        try:
            lock.assign(team_id, target_id)
            return True
        except ConflictError:
            return False

    jobs = []
    for target_id in range(n_targets):
        for team_id in range(n_duplicate_attempts_per_target):
            jobs.append((target_id, f"team-{target_id}-{team_id}"))

    with cf.ThreadPoolExecutor(max_workers=n_threads) as ex:
        futures = [ex.submit(attempt, t, team) for (t, team) in jobs]
        results = [f.result() for f in futures]

    accepted = sum(1 for r in results if r)
    rejected = sum(1 for r in results if not r)
    snap = lock.snapshot()
    single_owner_ok = len(snap) == n_targets and accepted == n_targets

    return DuplicateDispatchTestResult(
        n_attempts=len(results),
        n_accepted=accepted,
        n_rejected=rejected,
        all_targets_single_owner=single_owner_ok,
    )


if __name__ == "__main__":
    res = run_duplicate_dispatch_test()
    print(res)
