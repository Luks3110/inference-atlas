# /// script
# requires-python = ">=3.10,<3.15"
# dependencies = ["faiss-cpu==1.12.0", "numpy==2.2.6"]
# ///
"""uv run bench-hnsw-filter.py > hnsw-filter.json"""
import json
import platform
import time
import faiss
import numpy as np


def benchmark():
    seed, count, dims, queries, k, repeats = 29, 16000, 64, 160, 10, 3
    rng = np.random.default_rng(seed)
    faiss.omp_set_num_threads(1)
    centers = rng.normal(size=(96, dims)).astype("float32")

    def sample(n):
        return np.ascontiguousarray(centers[rng.integers(0, len(centers), n)] +
                                    rng.normal(0, 1.35, size=(n, dims)).astype("float32"))

    corpus, qs = sample(count), sample(queries)
    graph = faiss.IndexHNSWFlat(dims, 16)
    graph.hnsw.efConstruction = 100
    graph.add(corpus)
    ef_values = [16, 32, 64, 128, 256]
    percents = [0.5, 1, 5, 10, 25, 50, 100]
    permutation = rng.permutation(count)
    rows = []
    for percent in percents:
        allowed = np.ascontiguousarray(np.sort(permutation[:int(count * percent / 100)]), dtype="int64")
        flat = faiss.IndexFlatL2(dims)
        flat.add(corpus[allowed])
        _, nearest = flat.search(qs, k)
        truth = [set(ids) for ids in allowed[nearest]]
        selector = faiss.IDSelectorBatch(allowed)
        for ef in ef_values:
            params = faiss.SearchParametersHNSW()
            params.efSearch = ef
            params.sel = selector
            graph.search(qs[:16], k, params=params)
            times, hits, returned = [], 0, 0
            for cycle in range(repeats):
                for q in rng.permutation(queries):
                    start = time.perf_counter_ns()
                    _, ids = graph.search(qs[q:q+1], k, params=params)
                    times.append((time.perf_counter_ns() - start) / 1e6)
                    if cycle == 0:
                        found = ids[0][ids[0] >= 0]
                        assert np.isin(found, allowed).all()
                        hits += len(truth[q].intersection(found))
                        returned += len(found)
            rows.append(dict(ef=ef, selectivity=percent, eligible=len(allowed),
                             recall=round(100 * hits / (queries*k), 3),
                             p95=round(float(np.percentile(times, 95)), 4),
                             filled=round(returned/queries, 3)))
    return dict(seed=seed, vectors=count, dims=dims, queries=queries, k=k, repeats=repeats,
                M=16, efConstruction=100, threads=1, faiss=faiss.__version__, cpu=platform.machine(),
                ef=ef_values, selectivity=percents, rows=rows)


if __name__ == "__main__":
    print(json.dumps(benchmark(), ensure_ascii=False, indent=2, allow_nan=False))
