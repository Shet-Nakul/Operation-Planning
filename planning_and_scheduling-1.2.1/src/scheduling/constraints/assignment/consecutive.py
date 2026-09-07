import numpy as np
from numba import njit, prange


@njit
def max_consecutive_working_days(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    counter_offset: int = 0,
):
    """
    Evaluates the maximum number of consecutive working days constraint.
    Penalizes any sequence of working days that exceeds the specified maximum.
    """
    penalty = 0
    consecutive_days = counter_offset
    for idx in range(len(schedule)):
        if schedule[idx] != off_shift_id and schedule[idx] != vacation_shift_id:
            consecutive_days += 1
        else:
            if consecutive_days > value:
                excess_ratio = (consecutive_days - value) / value
                penalty += (excess_ratio**2) * 100 * weight
            consecutive_days = 0
    if consecutive_days > value:
        excess_ratio = (consecutive_days - value) / value
        penalty += (excess_ratio**2) * 100 * weight
    return penalty


@njit
def min_consecutive_working_days(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    counter_offset: int = 0,
):
    """
    Evaluates the minimum number of consecutive working days constraint.
    Penalizes any sequence of working days that is shorter than the specified minimum.
    """
    penalty = 0
    consecutive_days = counter_offset
    for idx in range(len(schedule)):
        if schedule[idx] != off_shift_id and schedule[idx] != vacation_shift_id:
            consecutive_days += 1
        else:
            if consecutive_days > 0 and consecutive_days < value:
                deficit_ratio = (value - consecutive_days) / value
                penalty += (deficit_ratio**2) * 100 * weight
            consecutive_days = 0
    if consecutive_days < value and consecutive_days > 0:
        deficit_ratio = (value - consecutive_days) / value
        penalty += (deficit_ratio**2) * 100 * weight
    return penalty


@njit
def max_consecutive_free_days(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    counter_offset: int = 0,
):
    """
    Evaluates the maximum number of consecutive free days constraint.
    Penalizes any sequence of free days that exceeds the specified maximum.
    """
    penalty = 0
    consecutive_free = counter_offset
    for idx in range(len(schedule)):
        if schedule[idx] == off_shift_id or schedule[idx] == vacation_shift_id:
            consecutive_free += 1
        else:
            if consecutive_free > value:
                excess_ratio = (consecutive_free - value) / value
                penalty += (excess_ratio**2) * 100 * weight
            consecutive_free = 0
    if consecutive_free > value:
        excess_ratio = (consecutive_free - value) / value
        penalty += (excess_ratio**2) * 100 * weight
    return penalty


@njit
def min_consecutive_free_days(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    counter_offset: int = 0,
):
    """
    Evaluates the minimum number of consecutive free days constraint.
    Penalizes any sequence of free days that is shorter than the specified minimum.
    """

    penalty = 0
    consecutive_free = counter_offset
    for idx in range(len(schedule)):
        if schedule[idx] == off_shift_id or schedule[idx] == vacation_shift_id:
            consecutive_free += 1

        else:
            if consecutive_free > 0 and consecutive_free < value:
                deficit_ratio = (value - consecutive_free) / value
                penalty += (deficit_ratio**2) * 100 * weight
            consecutive_free = 0
    if consecutive_free > 0 and consecutive_free < value:
        deficit_ratio = (value - consecutive_free) / value
        penalty += (deficit_ratio**2) * 100 * weight
    return penalty


# The following functions compute the indices of violations for consecutive working/free days constraints.
@njit
def max_consecutive_working_days_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    num_days,
    counter_offset: int = 0,
):
    result = np.zeros(num_days, dtype=np.int32)
    consecutive_days = counter_offset
    for idx in range(num_days):
        shift = schedule[idx]
        working = shift != off_shift_id and shift != vacation_shift_id
        if working:
            consecutive_days += 1
            if consecutive_days > value:
                result[idx] = weight
        else:
            consecutive_days = 0
    return result


@njit
def min_consecutive_working_days_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    num_days,
    counter_offset: int = 0,
):
    result = np.zeros(num_days, dtype=np.int32)
    start = 0
    consecutive_days = counter_offset
    for idx in range(num_days):
        if schedule[idx] != off_shift_id and schedule[idx] != vacation_shift_id:
            if consecutive_days == 0:
                start = idx
            consecutive_days += 1
        else:
            if consecutive_days > 0 and consecutive_days < value:
                for j in range(start, idx):
                    result[j] = weight
            consecutive_days = 0
    if consecutive_days > 0 and consecutive_days < value:
        for j in range(start, num_days):
            result[j] = weight
    return result


@njit
def max_consecutive_free_days_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    num_days,
    counter_offset: int = 0,
):
    result = np.zeros(num_days, dtype=np.int32)
    consecutive_free = counter_offset
    for idx in range(num_days):
        if schedule[idx] == off_shift_id or schedule[idx] == vacation_shift_id:
            consecutive_free += 1
            if consecutive_free > value:
                result[idx] = weight
        else:
            consecutive_free = 0
    return result


@njit
def min_consecutive_free_days_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    num_days,
    counter_offset: int = 0,
):
    result = np.zeros(num_days, dtype=np.int32)
    start = 0
    consecutive_free = counter_offset
    for idx in range(num_days):
        if schedule[idx] == off_shift_id or schedule[idx] == vacation_shift_id:
            if consecutive_free == 0:
                start = idx
            consecutive_free += 1
        else:
            if consecutive_free > 0 and consecutive_free < value:
                for j in range(start, idx):
                    result[j] = weight
            consecutive_free = 0
    if consecutive_free > 0 and consecutive_free < value:
        for j in range(start, num_days):
            result[j] = weight
    return result
