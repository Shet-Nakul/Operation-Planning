import numpy as np
from numba import njit


@njit
def assignments_split_deviation(
    schedule: np.array, reference: np.array, probability: np.array, weight: int
):
    """
    Penalizes deviation between actual assignment ratios and target probabilities.

    Args:
        schedule: (num_days,) employee's schedule with pool-shift IDs
        reference: (num_shifts,) pool-shift reference codes
        probability: (num_shifts,) target assignment probability per shift
        weight: constraint weight
    """
    num_shifts = len(reference)
    num_days = len(schedule)

    # Count assignments per pool-shift (only where probability > 0)
    counts = np.zeros(num_shifts, dtype=np.float64)
    total = 0.0
    for s in range(num_shifts):
        if probability[s] <= 0.0:
            continue
        c = 0
        for d in range(num_days):
            if schedule[d] == reference[s]:
                c += 1
        counts[s] = c
        total += c

    if total == 0.0:
        return 0.0

    # Compute RMSE of ratio deviation
    sum_sq = 0.0
    n = 0
    for s in range(num_shifts):
        if probability[s] <= 0.0:
            continue
        actual_ratio = counts[s] / total
        diff = actual_ratio - probability[s]
        sum_sq += diff * diff
        n += 1

    rmse = np.sqrt(sum_sq / n)
    return rmse * weight
