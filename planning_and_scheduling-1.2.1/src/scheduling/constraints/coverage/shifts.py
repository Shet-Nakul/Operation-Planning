import numpy as np
from numba import njit


@njit
def evaluate_requirements_v1(
    daily_schedule, daily_coverage_requirements, pool_shift_weights_matrix
):
    penalty = 0
    feasibility = 0

    shift_ids = pool_shift_weights_matrix[:, 0]

    for i in range(shift_ids.shape[0]):
        shift_id = shift_ids[i]
        required_count = daily_coverage_requirements[i]
        actual_count = np.sum(daily_schedule == shift_id)

        if actual_count < required_count:
            shortfall = required_count - actual_count
            gap_pct = shortfall / required_count
            penalty += shortfall * (1 + gap_pct) ** 2 * pool_shift_weights_matrix[i, 1]
    if penalty > 0:
        feasibility = 1

    return penalty, feasibility


@njit
def evaluate_requirements(
    daily_schedule, daily_coverage_requirements, pool_shift_weights_matrix
):
    penalty = 0.0
    feasibility = 0

    shift_ids = pool_shift_weights_matrix[:, 0]

    # Find max requirement for log-based scarcity scaling
    max_req = 0.0
    for i in range(shift_ids.shape[0]):
        if daily_coverage_requirements[i] > max_req:
            max_req = daily_coverage_requirements[i]

    for i in range(shift_ids.shape[0]):
        shift_id = shift_ids[i]
        required_count = daily_coverage_requirements[i]
        actual_count = np.sum(daily_schedule == shift_id)

        if actual_count < required_count:
            shortfall = required_count - actual_count
            gap_pct = shortfall / required_count
            scarcity = np.log(max_req + 1) / np.log(required_count + 1)
            penalty += (
                shortfall
                * (1 + gap_pct) ** 2
                * scarcity
                * pool_shift_weights_matrix[i, 1]
                * 10
            )

    if penalty > 0:
        feasibility = 1

    return penalty, feasibility


@njit
def evaluate_requirements_violated_idx(
    daily_schedule, daily_coverage_requirements, pool_shift_weights_matrix, off_shift_id
):
    num_employees = len(daily_schedule)
    result = np.zeros(num_employees, dtype=np.int32)
    shift_ids = pool_shift_weights_matrix[:, 0]

    for i in range(shift_ids.shape[0]):
        shift_id = shift_ids[i]
        required_count = daily_coverage_requirements[i]
        actual_count = 0
        for e in range(num_employees):
            if daily_schedule[e] == shift_id:
                actual_count += 1

        if actual_count < required_count:
            shortfall = required_count - actual_count
            w = np.int32(shortfall * pool_shift_weights_matrix[i, 1])
            half_w = w // 2
            for e in range(num_employees):
                if daily_schedule[e] == off_shift_id:
                    result[e] += w
                elif daily_schedule[e] != shift_id:
                    result[e] += half_w
    return result
