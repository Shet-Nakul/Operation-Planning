import numpy as np
from numba import njit


@njit
def prefered_shift_penalty(
    schedule: np.array,
    prefered_shift: np.array,
    prefered_shift_mask: np.array,
    prefered_shift_weight: np.array,
):
    """
    Penalizes deviations from an employee's preferred shift assignments.
    For each day where the employee has a stated preference (mask == 1),
    applies a penalty if the scheduled shift does not match the preferred shift.
    """
    penalty = 0
    for idx in range(len(schedule)):
        if prefered_shift_mask[idx] == 1:
            if schedule[idx] != prefered_shift[idx]:
                penalty += prefered_shift_weight[idx]
    return penalty


@njit
def prefered_pool_shift_penalty(
    schedule: np.array,
    prefered_pool: np.array,
    prefered_shift: np.array,
    prefered_shift_weight: np.array,
):
    """
    Penalizes deviations from an employee's preferred pool assignments.
    For each day where the employee has a stated preference (mask == 1),
    applies a penalty if the scheduled pool does not match the preferred pool.
    """
    penalty = 0
    for idx in range(len(schedule)):

        if prefered_pool[idx] == -1:  # Check if there is a preferred pool for this day
            continue

        if schedule[idx] // 10 != prefered_pool[idx]:
            penalty += prefered_shift_weight[idx]

    for idx in range(len(schedule)):
        if (
            prefered_shift[idx] == -1
        ):  # Check if there is a preferred shift for this day
            continue

        if schedule[idx] % 10 != prefered_shift[idx]:
            penalty += prefered_shift_weight[idx]
    return penalty
