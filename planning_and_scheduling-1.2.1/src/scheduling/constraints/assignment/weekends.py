import numpy as np
from numba import njit


@njit
def identical_shift_types_during_weekend(
    schedule: np.array,
    weight: int,
    off_shift_id: int,
    vacation_shift_id: int,
    weekend_pairs: np.array,
    previous_schedule: np.array,
    offset: int,
):
    """
    Evaluates the identical shift types during weekend constraint.
    Penalizes if an employee works both days of a weekend but with different shift types.
    """
    penalty = 0

    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and sun_working and sat_shift != sun_shift:
            penalty += weight

    for i in range(weekend_pairs.shape[0]):
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and sun_working and sat_shift != sun_shift:
            penalty += weight

    return penalty


@njit
def complete_weekends(
    schedule: np.array,
    weight: int,
    off_shift_id: int,
    vacation_shift_id: int,
    weekend_pairs: np.array,
    previous_schedule: np.array,
    offset: int = 0,
):
    """
    Evaluates the complete weekends constraint.
    Penalizes if an employee works only one day of a weekend (Saturday or Sunday).
    """
    penalty = 0
    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and not sun_working:
            penalty += weight
        elif sun_working and not sat_working:
            penalty += weight

    for i in range(weekend_pairs.shape[0]):
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and not sun_working:
            penalty += weight
        elif sun_working and not sat_working:
            penalty += weight
        else:
            continue
    return penalty


@njit
def no_night_shift_before_free_weekend(
    schedule: np.array,
    weight: int,
    off_shift_id: int,
    vacation_shift_id: int,
    night_shift_id: int,
    weekend_pairs: np.array,
    previous_schedule: np.array,
    offset: int = 0,
):
    """
    Evaluates the no night shift before free weekend constraint.
    Penalizes if an employee works a night shift on Friday and then has a free weekend (Saturday and Sunday off).
    """
    penalty = 0

    if offset == 2:
        fri_shift = previous_schedule[-2]
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if fri_shift == night_shift_id and not sat_working and not sun_working:
            penalty += weight

    if offset == 1 and weekend_pairs[0][0] == 0 and weekend_pairs[0][1] == 1:
        fri_shift = previous_schedule[-1]
        sat_shift = schedule[weekend_pairs[0][0]]
        sun_shift = schedule[weekend_pairs[0][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if fri_shift == night_shift_id and not sat_working and not sun_working:
            penalty += weight

    for i in range(weekend_pairs.shape[0]):
        if weekend_pairs[i][0] == 0:
            continue  # handled by offset cases above
        fri_shift = schedule[weekend_pairs[i][0] - 1]
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if fri_shift == night_shift_id and not sat_working and not sun_working:
            penalty += weight

    return penalty


@njit
def no_free_day_before_working_weekend(
    schedule: np.array,
    weight: int,
    off_shift_id: int,
    vacation_shift_id: int,
    weekend_pairs: np.array,
    previous_schedule: np.array,
    offset: int = 0,
):
    """
    Evaluates the no free day before working weekend constraint.
    Penalizes if an employee has a free day on Friday and then works on at least one
    day of the weekend (Saturday or Sunday).
    """
    penalty = 0

    if offset == 2:
        fri_shift = previous_schedule[-2]
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            penalty += weight

    if offset == 1 and weekend_pairs[0][0] == 0 and weekend_pairs[0][1] == 1:
        fri_shift = previous_schedule[-1]
        sat_shift = schedule[weekend_pairs[0][0]]
        sun_shift = schedule[weekend_pairs[0][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            penalty += weight

    for i in range(weekend_pairs.shape[0]):
        if weekend_pairs[i][0] == 0:
            continue  # handled by offset cases above
        fri_shift = schedule[weekend_pairs[i][0] - 1]
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            penalty += weight

    return penalty


@njit
def max_consecutive_working_weekends(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    weekend_pairs: np.array,
    consecutive_count: int,
    previous_schedule: np.array,
    offset: int,
):
    """
    Evaluates the maximum consecutive working weekends constraint.
    Penalizes if an employee works more than the allowed number of consecutive weekends.
    """
    penalty = 0
    consecutive = consecutive_count

    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
            if consecutive > value:
                penalty += weight
        else:
            consecutive = 0

    for i in range(weekend_pairs.shape[0]):
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
            if consecutive > value:
                penalty += weight
        else:
            consecutive = 0
    return penalty


@njit
def min_consecutive_working_weekends(
    schedule: np.array,
    weight: int,
    value: int,
    off_shift_id: int,
    vacation_shift_id: int,
    weekend_pairs: np.array,
    consecutive_count: int,
    previous_schedule: np.array,
    offset: int,
):
    """
    Evaluates the minimum consecutive working weekends constraint.
    Penalizes if an employee works fewer than the required number of consecutive weekends.
    """
    penalty = 0
    consecutive = consecutive_count

    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
        else:
            if consecutive > 0 and consecutive < value:
                penalty += weight
            consecutive = 0

    for i in range(weekend_pairs.shape[0]):
        sat_shift = schedule[weekend_pairs[i][0]]
        sun_shift = schedule[weekend_pairs[i][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
        else:
            if consecutive > 0 and consecutive < value:
                penalty += weight
            consecutive = 0
    if consecutive > 0 and consecutive < value:
        penalty += weight
    return penalty


# Violation index functions for visualization and debugging


@njit
def identical_shift_types_during_weekend_violated_idx(
    schedule,
    weight,
    off_shift_id,
    vacation_shift_id,
    weekend_pairs,
    num_days,
    previous_schedule,
    offset,
):

    result = np.zeros(num_days, dtype=np.int32)
    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and sun_working and sat_shift != sun_shift:
            result[0] = weight

    for i in range(weekend_pairs.shape[0]):
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if sat_working and sun_working and sat_shift != sun_shift:
            result[sat_idx] = weight
            result[sun_idx] = weight
    return result


@njit
def complete_weekends_violated_idx(
    schedule,
    weight,
    off_shift_id,
    vacation_shift_id,
    weekend_pairs,
    num_days,
    previous_schedule,
    offset,
):
    result = np.zeros(num_days, dtype=np.int32)
    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working and not sun_working:
            result[0] = weight
        elif sun_working and not sat_working:
            result[0] = weight

    for i in range(weekend_pairs.shape[0]):
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if sat_working and not sun_working:
            result[sat_idx] = weight
            result[sun_idx] = weight
        elif sun_working and not sat_working:
            result[sat_idx] = weight
            result[sun_idx] = weight
    return result


@njit
def no_night_shift_before_free_weekend_violated_idx(
    schedule,
    weight,
    off_shift_id,
    vacation_shift_id,
    night_shift_id,
    weekend_pairs,
    num_days,
    previous_schedule,
    offset,
):

    result = np.zeros(num_days, dtype=np.int32)
    if offset == 2:
        fri_shift = previous_schedule[-2]
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if fri_shift == night_shift_id and not sat_working and not sun_working:
            result[0] = weight

    if offset == 1 and weekend_pairs[0][0] == 0 and weekend_pairs[0][1] == 1:
        fri_shift = previous_schedule[-1]
        sat_shift = schedule[weekend_pairs[0][0]]
        sun_shift = schedule[weekend_pairs[0][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if fri_shift == night_shift_id and not sat_working and not sun_working:
            result[weekend_pairs[0][0]] = weight
            result[weekend_pairs[0][1]] = weight

    for i in range(weekend_pairs.shape[0]):
        if weekend_pairs[i][0] == 0:
            continue
        fri_idx = weekend_pairs[i][0] - 1
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        fri_shift = schedule[fri_idx]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if fri_shift == night_shift_id and not sat_working and not sun_working:
            result[fri_idx] = weight
    return result


@njit
def no_free_day_before_working_weekend_violated_idx(
    schedule,
    weight,
    off_shift_id,
    vacation_shift_id,
    weekend_pairs,
    num_days,
    previous_schedule,
    offset,
):
    result = np.zeros(num_days, dtype=np.int32)
    if offset == 2:
        fri_shift = previous_schedule[-2]
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            result[0] = weight

    if offset == 1 and weekend_pairs[0][0] == 0 and weekend_pairs[0][1] == 1:
        fri_shift = previous_schedule[-1]
        sat_shift = schedule[weekend_pairs[0][0]]
        sun_shift = schedule[weekend_pairs[0][1]]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            result[weekend_pairs[0][0]] = weight
            result[weekend_pairs[0][1]] = weight

    for i in range(weekend_pairs.shape[0]):
        if weekend_pairs[i][0] == 0:
            continue
        fri_idx = weekend_pairs[i][0] - 1
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        fri_shift = schedule[fri_idx]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if (
            (fri_shift == off_shift_id or fri_shift == vacation_shift_id)
            and sat_working
            and sun_working
        ):
            result[fri_idx] = weight
    return result


@njit
def max_consecutive_working_weekends_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    weekend_pairs,
    num_days,
    consecutive_count,
    previous_schedule,
    offset,
):
    result = np.zeros(num_days, dtype=np.int32)
    consecutive = consecutive_count
    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
            if consecutive > value:
                result[0] = weight
        else:
            consecutive = 0

    for i in range(weekend_pairs.shape[0]):
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if sat_working or sun_working:
            consecutive += 1
            if consecutive > value:
                result[sat_idx] = weight
                result[sun_idx] = weight
        else:
            consecutive = 0
    return result


@njit
def min_consecutive_working_weekends_violated_idx(
    schedule,
    weight,
    value,
    off_shift_id,
    vacation_shift_id,
    weekend_pairs,
    num_days,
    consecutive_count,
    previous_schedule,
    offset,
):
    result = np.zeros(num_days, dtype=np.int32)
    consecutive = consecutive_count
    start_weekend = -1
    has_offset_sunday = False
    if offset == 1:
        sat_shift = previous_schedule[-1]
        sun_shift = schedule[0]

        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id

        if sat_working or sun_working:
            consecutive += 1
            has_offset_sunday = True
        else:
            consecutive = 0
            has_offset_sunday = False

    for i in range(weekend_pairs.shape[0]):
        sat_idx = weekend_pairs[i][0]
        sun_idx = weekend_pairs[i][1]
        sat_shift = schedule[sat_idx]
        sun_shift = schedule[sun_idx]
        sat_working = sat_shift != off_shift_id and sat_shift != vacation_shift_id
        sun_working = sun_shift != off_shift_id and sun_shift != vacation_shift_id
        if sat_working or sun_working:
            if start_weekend == -1:
                start_weekend = i
            consecutive += 1
        else:
            if consecutive > 0 and consecutive < value:
                if has_offset_sunday:
                    result[0] = weight
                if start_weekend != -1:
                    for j in range(start_weekend, i):
                        result[weekend_pairs[j][0]] = weight
                        result[weekend_pairs[j][1]] = weight
            consecutive = 0
            start_weekend = -1
            has_offset_sunday = False
    if consecutive > 0 and consecutive < value:
        if has_offset_sunday:
            result[0] = weight
        if start_weekend != -1:
            for j in range(start_weekend, weekend_pairs.shape[0]):
                result[weekend_pairs[j][0]] = weight
                result[weekend_pairs[j][1]] = weight
    return result
