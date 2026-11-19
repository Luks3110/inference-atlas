# /// script
# requires-python = ">=3.10,<3.15"
# dependencies = ["faiss-cpu==1.12.0", "numpy==2.2.6"]
# ///
"""Run with uv run bench-indexes.py > results.json. CPU benchmark, single search thread."""
import json
import platform
import time
import faiss
import numpy as np

D, N, NQ, K = 64, 16_000, 160, 10
SEED = 17
faiss.omp_set_num_threads(1)
rng = np.random.default_rng(SEED)
centroids = rng.normal(size=(128, D)).astype("float32")


def sample(count):
    centers = centroids[rng.integers(0, len(centroids), count)]
    return np.ascontiguousarray(centers + rng.normal(0, 1.2, (count, D)).astype("float32"))


base, train, queries = sample(N), sample(N), sample(NQ)
truth = faiss.IndexFlatL2(D)
truth.add(base)
_, exact_ids = truth.search(queries, K)
rows = []


def run_index(family, index, variations):
    start = time.perf_counter()
    if not index.is_trained:
        index.train(train)
    index.add(base)
    build_ms = (time.perf_counter() - start) * 1_000
    size = faiss.serialize_index(index).nbytes
    for knob, value, candidates in variations:
        if knob == "efSearch":
            index.hnsw.efSearch = value
        elif knob == "nprobe":
            index.nprobe = value
        index.search(queries[:16], candidates)
        elapsed, hits, pool_hits = [], 0, 0
        for i, query in enumerate(queries):
            start = time.perf_counter_ns()
            _, ids = index.search(query[None, :], candidates)
            found = ids[0][ids[0] >= 0]
            if candidates > K:
                # Exact L2 within candidate IDs only. Include the cost of reading raw vectors.
                diff = base[found] - query
                chosen = found[np.argsort(np.einsum("ij,ij->i", diff, diff))[:K]]
            else:
                chosen = found[:K]
            elapsed.append((time.perf_counter_ns() - start) / 1_000_000)
            gold = set(exact_ids[i])
            hits += len(gold.intersection(chosen))
            pool_hits += len(gold.intersection(found))
        recall = hits / (NQ*K)
        assert recall <= pool_hits / (NQ*K)
        if family == "Flat" or (family == "IVFFlat" and value == index.nlist):
            assert recall == 1.0
        rows.append(dict(family=family, knob=knob, value=value, candidates=candidates,
                         build_ms=round(build_ms, 2), index_bytes=size,
                         rerank_store_bytes=base.nbytes if candidates > K else 0,
                         recall=round(recall,4), candidate_recall=round(pool_hits/(NQ*K),4),
                         p95_ms=round(float(np.percentile(elapsed, 95)), 4)))


run_index("Flat", faiss.IndexFlatL2(D), [("", 0, K)])
for neighbors in (8, 24):
    index = faiss.IndexHNSWFlat(D, neighbors)
    index.hnsw.efConstruction = 100
    run_index(f"HNSW M={neighbors}", index, [("efSearch", ef, K) for ef in (16, 48, 128)])
sq = faiss.IndexScalarQuantizer(D, faiss.ScalarQuantizer.QT_8bit)
run_index("SQ8", sq, [("", 0, K)])
ivf = faiss.IndexIVFFlat(faiss.IndexFlatL2(D), D, 64)
run_index("IVFFlat", ivf, [("nprobe", p, K) for p in (1, 8, 64)])
pq = faiss.IndexIVFPQ(faiss.IndexFlatL2(D), D, 64, 8, 8)
run_index("IVFPQ", pq, [("nprobe", p, candidates) for p in (1, 8, 32) for candidates in (K, 40)])
print(json.dumps(dict(dim=D, vectors=N, queries=NQ, k=K, training=N, seed=SEED, threads=1,
                      cpu=platform.machine(), faiss=faiss.__version__, numpy=np.__version__, rows=rows),
                 indent=2, allow_nan=False))
