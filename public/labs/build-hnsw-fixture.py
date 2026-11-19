# /// script
# requires-python = ">=3.10,<3.15"
# dependencies = ["faiss-cpu==1.12.0", "numpy==2.2.6"]
# ///
"""Run with uv run public/labs/build-hnsw-fixture.py. All binary fields are little-endian."""
import struct
from pathlib import Path

import faiss
import numpy as np


def build():
    count, dims, num_queries, m, construction, seed = 3072, 20, 48, 8, 80, 29
    data_seed, acl_seed = np.random.SeedSequence(seed).spawn(2)
    data_rng = np.random.default_rng(data_seed)
    centers = data_rng.normal(size=(48, dims)).astype("float32")

    def sample(n):
        labels = data_rng.integers(0, len(centers), n)
        noise = data_rng.normal(0, 1.35, (n, dims)).astype("float32")
        return np.ascontiguousarray(centers[labels] + noise)

    vectors = sample(count)
    queries = sample(num_queries)
    # A rank below the cutoff is eligible. This permutation is independent of geometry.
    eligibility_ranks = np.random.default_rng(acl_seed).permutation(count)
    faiss.omp_set_num_threads(1)
    index = faiss.IndexHNSWFlat(dims, m, faiss.METRIC_L2)
    graph = index.hnsw
    graph.rng = faiss.RandomGenerator(seed)
    graph.efConstruction = construction
    index.add(vectors)
    offsets = faiss.vector_to_array(graph.offsets)
    neighbors = faiss.vector_to_array(graph.neighbors)
    assert count < 2**15 and -1 <= neighbors.min() and neighbors.max() < count
    assert offsets[0] == 0 and offsets[-1] == len(neighbors)
    assert graph.nb_neighbors(0) == 2 * m and graph.nb_neighbors(1) == m
    assert graph.max_level > 0 and 0 <= graph.entry_point < count

    # Header: magic, version, N, D, Q, M, highest layer, entry, adjacency slots, efConstruction.
    header = struct.pack("<4s9I", b"HNSW", 1, count, dims, num_queries, m,
                         graph.max_level, graph.entry_point, len(neighbors), construction)
    target = Path(__file__).with_name("hnsw-fixture.bin")
    with target.open("wb") as file:
        file.write(header)
        for array, dtype in [(vectors, "<f4"), (queries, "<f4"), (offsets, "<u4"),
                             (neighbors, "<i2"), (eligibility_ranks, "<u2")]:
            file.write(array.astype(dtype, copy=False).tobytes())
    print(f"{target.name}: {target.stat().st_size} bytes, {graph.max_level + 1} layers")


if __name__ == "__main__":
    build()
