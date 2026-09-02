# pylint: disable = too-many-locals, too-many-branches
import numpy as np
from numba import njit


@njit
def allocate_dense_resources_first_fit(
    reference,
    target,
    min_req,
    allowed,
):
    rows = reference.shape[0]
    cols = target.shape[1]

    counts = np.count_nonzero(target, axis=1)

    alloc = np.zeros((rows, 2, cols), dtype=np.float32)
    temp_alloc = np.zeros_like(alloc)

    for start in allowed:

        feasible = True
        temp_alloc[:] = 0

        for resource_idx in range(rows):
            if counts[resource_idx] == 0:
                continue

            if counts[resource_idx] < min_req[resource_idx]:
                feasible = False
                break

            prim = reference[resource_idx, 0]
            sec = reference[resource_idx, 1]
            sat = 0

            for time_idx in range(cols):
                need = target[resource_idx, time_idx]
                if need == 0:
                    continue

                idx = start + time_idx

                if prim[idx] >= need:
                    temp_alloc[resource_idx, 0, time_idx] = need
                    sat += 1
                elif sec[idx] >= need:
                    temp_alloc[resource_idx, 1, time_idx] = need
                else:
                    feasible = False
                    break

            if not feasible or sat < min_req[resource_idx]:
                feasible = False
                break

        if feasible:
            alloc[:] = temp_alloc
            return start, start + cols - 1, True, alloc

    return -1, -1, False, alloc


@njit
def find_all_feasible_starts(
    reference,  # (rows, 2, T)
    target,  # (rows, cols)
    min_req,  # (rows,)
    allowed,  # (T,)
):
    rows = reference.shape[0]
    cols = target.shape[1]
    time_steps = reference.shape[2]

    counts = np.count_nonzero(target, axis=1)

    # Worst case: every start is feasible
    feasible_starts = -np.ones(allowed.shape[0], dtype=np.int64)
    n_feasible = 0

    for start in range(allowed.shape[0]):
        if allowed[start] == 0:
            continue

        if start + cols > time_steps:
            break

        feasible = True

        for resource_idx in range(rows):
            if counts[resource_idx] == 0:
                continue

            if counts[resource_idx] < min_req[resource_idx]:
                feasible = False
                break

            prim = reference[resource_idx, 0]
            sec = reference[resource_idx, 1]
            prim_sat = 0
            sec_sat = 0

            for time_idx in range(cols):
                need = target[resource_idx, time_idx]
                if need == 0:
                    continue

                idx = start + time_idx

                if prim[idx] >= need:
                    prim_sat += 1
                elif sec[idx] >= need:
                    sec_sat += 1
                else:
                    feasible = False
                    break

            if (
                not feasible
                or prim_sat < min_req[resource_idx]
                or (sec_sat + prim_sat) < counts[resource_idx]
            ):
                feasible = False
                break

        if feasible:
            feasible_starts[n_feasible] = start
            n_feasible += 1

    return feasible_starts, n_feasible


@njit
def score_all_starts(
    reference,
    target,
    min_req,
    allowed,
):
    rows = reference.shape[0]
    cols = target.shape[1]
    T = reference.shape[2]

    overall_scores = np.zeros(allowed.shape[0], np.float64)
    short_rows = np.zeros((allowed.shape[0], rows), np.int8)

    for start in range(allowed.shape[0]):

        if allowed[start] == 0:
            continue

        if start + cols > T:
            break

        total_effective = 0.0
        total_need = 0.0
        total_prim_sat = 0.0
        total_min_req = 0.0

        for r in range(rows):
            prim = reference[r, 0]
            sec = reference[r, 1]

            row_effective = 0.0
            row_need = 0.0
            prim_sat = 0
            row_reference_all_zero = True

            for t in range(cols):

                need = target[r, t]
                idx = start + t
                if prim[idx] != 0 or sec[idx] != 0:
                    row_reference_all_zero = False

                if need == 0:
                    continue

                row_need += need

                if prim[idx] >= need:
                    row_effective += need
                    prim_sat += 1
                elif sec[idx] >= need:
                    row_effective += 0.5 * need

            if row_reference_all_zero:
                if row_need > 0.0:
                    short_rows[start, r] = 1

            req = min_req[r]
            if row_need > 0.0 and (row_effective < row_need or prim_sat < req):
                short_rows[start, r] = 1

            total_effective += row_effective
            total_need += row_need
            total_prim_sat += prim_sat
            total_min_req += req

        if total_need > 0.0:
            matrix_coverage = total_effective / total_need
        else:
            matrix_coverage = 0.0

        if total_min_req > 0.0:
            matrix_primary_ratio = total_prim_sat / total_min_req
            if matrix_primary_ratio > 1.0:
                matrix_primary_ratio = 1.0
        else:
            matrix_primary_ratio = 1.0

        overall_scores[start] = matrix_coverage * matrix_primary_ratio

    return overall_scores, short_rows
