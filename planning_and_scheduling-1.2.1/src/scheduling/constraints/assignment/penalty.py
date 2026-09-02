import numpy as np
from numba import njit

from scheduling.constraints.assignment.consecutive import (
    max_consecutive_free_days,
    max_consecutive_working_days,
    min_consecutive_free_days,
    min_consecutive_working_days,
)
from scheduling.constraints.assignment.patterns import forbidden_pattern_simple
from scheduling.constraints.assignment.weekends import (
    complete_weekends,
    identical_shift_types_during_weekend,
    max_consecutive_working_weekends,
    min_consecutive_working_weekends,
    no_free_day_before_working_weekend,
    no_night_shift_before_free_weekend,
)
from scheduling.constraints.assignment.workload import (
    max_num_assignments,
    min_num_assignments,
)


@njit
def calculate_penalty(
    encoder: np.array,
    schedule: np.array,
    weekend_pairs: np.array,
    vacation_shift_id: int,
    off_shift_id: int,
    night_shift_id: int,
    previous_schedule: np.array,
    last_working_block_counts: int,
    last_free_block_counts: int,
    consecutive_working_weekends: int,
    friday_offset: int,
    saturday_offset: int,
):
    total_penalty = 0
    feasibility = 1
    for idx in range(encoder.shape[0]):
        active = encoder[idx][1]
        if active == 0:
            continue
        hard = encoder[idx][2]
        weight = encoder[idx][3]
        value = encoder[idx][4]
        pattern_length = encoder[idx][5]
        penalty = 0
        if idx == 0:
            penalty = identical_shift_types_during_weekend(
                schedule,
                weight,
                off_shift_id,
                vacation_shift_id,
                weekend_pairs,
                previous_schedule,
                saturday_offset,
            )
        elif idx == 1:
            penalty = complete_weekends(
                schedule,
                weight,
                off_shift_id,
                vacation_shift_id,
                weekend_pairs,
                previous_schedule,
                saturday_offset,
            )
        elif idx == 2:
            penalty = no_night_shift_before_free_weekend(
                schedule,
                weight,
                off_shift_id,
                vacation_shift_id,
                night_shift_id,
                weekend_pairs,
                previous_schedule,
                friday_offset,
            )
        elif idx == 3:
            penalty = no_free_day_before_working_weekend(
                schedule,
                weight,
                off_shift_id,
                vacation_shift_id,
                weekend_pairs,
                previous_schedule,
                friday_offset,
            )
        elif idx == 4:
            penalty = max_num_assignments(schedule, weight, value, off_shift_id)
        elif idx == 5:
            penalty = min_num_assignments(schedule, weight, value, off_shift_id)
        elif idx == 6:
            penalty = max_consecutive_working_days(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                last_working_block_counts,
            )
        elif idx == 7:
            penalty = min_consecutive_working_days(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                last_working_block_counts,
            )
        elif idx == 8:
            penalty = max_consecutive_free_days(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                last_free_block_counts,
            )
        elif idx == 9:
            penalty = min_consecutive_free_days(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                last_free_block_counts,
            )
        elif idx == 10:
            penalty = max_consecutive_working_weekends(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                weekend_pairs,
                consecutive_working_weekends,
                previous_schedule,
                saturday_offset,
            )
        elif idx == 11:
            penalty = min_consecutive_working_weekends(
                schedule,
                weight,
                value,
                off_shift_id,
                vacation_shift_id,
                weekend_pairs,
                consecutive_working_weekends,
                previous_schedule,
                saturday_offset,
            )
        elif idx >= 12 and idx <= 18:
            pattern = encoder[idx, 6 : 6 + pattern_length]
            penalty = forbidden_pattern_simple(
                schedule, weight, pattern_length, pattern, previous_schedule
            )
        total_penalty += penalty
        if hard != 0 and penalty > 0:
            feasibility = 0
    return total_penalty, feasibility
