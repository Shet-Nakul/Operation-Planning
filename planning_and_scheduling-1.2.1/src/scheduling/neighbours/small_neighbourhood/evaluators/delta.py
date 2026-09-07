import numpy as np
from numba import njit

from scheduling.constraints.assignment.penalty import calculate_penalty as _calc_assign
from scheduling.constraints.coverage.shifts import evaluate_requirements as _calc_cover
from scheduling.constraints.prefered.shift_preference import (
    prefered_pool_shift_penalty as _calc_prefered_penalty,
)
from scheduling.constraints.split.split_deviation import (
    assignments_split_deviation as _calc_split,
)


@njit
def assignment_delta(
    emp_schedule,
    emp_idx,
    assignment_penalties,
    contract_constraints_tensor,
    employee_contract_ids,
    pool_shift_weights_matrix,
    employee_probability_matrix,
    prefered_pool,
    prefered_shift,
    preference_weight,
    weekend_pairs,
    vacation_shift_id,
    off_shift_id,
    night_shift_id,
    previous_schedule,
    last_working_block_counts,
    last_free_block_counts,
    consecutive_working_weekends,
    friday_offset,
    saturday_offset,
):

    new_pen, _ = _calc_assign(
        contract_constraints_tensor[employee_contract_ids[emp_idx]],
        emp_schedule % 10,
        weekend_pairs,
        vacation_shift_id,
        off_shift_id,
        night_shift_id,
        previous_schedule[emp_idx],
        last_working_block_counts[emp_idx],
        last_free_block_counts[emp_idx],
        consecutive_working_weekends[emp_idx],
        friday_offset,
        saturday_offset,
    )

    new_split_pen = _calc_split(
        emp_schedule,
        pool_shift_weights_matrix[:, 0],
        employee_probability_matrix[:, emp_idx],
        weight=100,
    )

    new_pref_pen = _calc_prefered_penalty(
        emp_schedule,
        prefered_pool[emp_idx, :],
        prefered_shift[emp_idx, :],
        preference_weight[emp_idx, :],
    )

    return new_pen + new_split_pen + new_pref_pen - assignment_penalties[emp_idx]


@njit
def coverage_delta(
    day_schedule,
    day_idx,
    coverage_penalties,
    coverage_requirements_matrix,
    pool_shift_weights_matrix,
):
    new_pen, _ = _calc_cover(
        day_schedule,
        coverage_requirements_matrix[:, day_idx + 1],
        pool_shift_weights_matrix,
    )
    return new_pen - coverage_penalties[day_idx]
