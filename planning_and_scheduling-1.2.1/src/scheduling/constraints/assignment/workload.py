import numpy as np
from numba import njit


@njit
def max_num_assignments(schedule: np.array, weight: int, value: int, off_shift_id: int):
    """
    Evaluates the maximum number of assignments constraint.
    Penalizes if the total number of working days exceeds the specified maximum.
    """
    working_days = 0
    for idx in range(len(schedule)):
        if schedule[idx] != off_shift_id:
            working_days += 1
    if working_days > value:
        excess_ratio = (working_days - value) / value
        return (excess_ratio**2) * 100 * weight
    return 0


@njit
def min_num_assignments(schedule: np.array, weight: int, value: int, off_shift_id: int):
    """
    Evaluates the minimum number of assignments constraint.
    Penalizes if the total number of working days is less than the specified minimum.
    """
    working_days = 0
    for idx in range(len(schedule)):
        if schedule[idx] != off_shift_id:
            working_days += 1
    if working_days < value:
        deficit_ratio = (value - working_days) / value
        return (deficit_ratio**2) * 100 * weight
    return 0


@njit
def max_num_assignments_violated_idx(schedule, weight, value, off_shift_id, num_days):
    result = np.zeros(num_days, dtype=np.int32)
    working_days = 0
    for idx in range(num_days):
        if schedule[idx] != off_shift_id:
            working_days += 1
    if working_days > value:
        for idx in range(num_days):
            if schedule[idx] != off_shift_id:
                result[idx] = weight
    return result


@njit
def min_num_assignments_violated_idx(schedule, weight, value, off_shift_id, num_days):
    result = np.zeros(num_days, dtype=np.int32)
    working_days = 0
    for idx in range(num_days):
        if schedule[idx] != off_shift_id:
            working_days += 1
    if working_days < value:
        for idx in range(num_days):
            if schedule[idx] != off_shift_id:
                result[idx] = weight
    return result
