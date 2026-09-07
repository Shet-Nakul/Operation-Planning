import numpy as np
from numba import njit

from scheduling.neighbours.small_neighbourhood.evaluators.delta import (
    assignment_delta,
    coverage_delta,
)


@njit
def evaluate_reassignment(
    schedule_matrix,
    assignment_penalties,
    coverage_penalties,
    operation_count,
    employee_indices,
    new_shifts,
    selected_days,
    contract_constraints_tensor,
    employee_contract_ids,
    coverage_requirements_matrix,
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
    num_employees, num_days = schedule_matrix.shape
    best_op, best_delta, best_delta_assign, best_delta_cover = (
        -1,
        np.inf,
        np.inf,
        np.inf,
    )
    emp_sched = np.empty(num_days, dtype=schedule_matrix.dtype)
    day_sched = np.empty(num_employees, dtype=schedule_matrix.dtype)

    for i in range(operation_count):
        emp, shift, day = employee_indices[i], new_shifts[i], selected_days[i]

        if schedule_matrix[emp, day] == vacation_shift_id:
            continue

        emp_sched[:] = schedule_matrix[emp]
        day_sched[:] = schedule_matrix[:, day]
        emp_sched[day] = shift
        day_sched[emp] = shift

        delta_assign = assignment_delta(
            emp_sched,
            emp,
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
        )
        delta_cover = coverage_delta(
            day_sched,
            day,
            coverage_penalties,
            coverage_requirements_matrix,
            pool_shift_weights_matrix,
        )
        delta = delta_assign + delta_cover

        if delta < best_delta:
            best_op, best_delta = i, delta
            best_delta_assign, best_delta_cover = delta_assign, delta_cover

    return best_op, best_delta, best_delta_assign, best_delta_cover
