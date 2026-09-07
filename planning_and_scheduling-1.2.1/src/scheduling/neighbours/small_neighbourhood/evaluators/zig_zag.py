import numpy as np
from numba import njit

from scheduling.neighbours.small_neighbourhood.evaluators.delta import (
    assignment_delta,
    coverage_delta,
)


@njit
def evaluate_zig_zag_swap(
    schedule_matrix,
    assignment_penalties,
    coverage_penalties,
    operation_count,
    selected_emp_a,
    selected_emp_b,
    selected_day_a,
    selected_day_b,
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
    best_op, best_delta = -1, np.inf
    best_delta_assign_a, best_delta_assign_b = np.inf, np.inf
    best_delta_cover_a, best_delta_cover_b = np.inf, np.inf

    sched_a = np.empty(num_days, dtype=schedule_matrix.dtype)
    sched_b = np.empty(num_days, dtype=schedule_matrix.dtype)
    day_sched_a = np.empty(num_employees, dtype=schedule_matrix.dtype)
    day_sched_b = np.empty(num_employees, dtype=schedule_matrix.dtype)

    for i in range(operation_count):
        emp_a, emp_b = selected_emp_a[i], selected_emp_b[i]
        da, db = selected_day_a[i], selected_day_b[i]

        if (
            schedule_matrix[emp_a, da] == vacation_shift_id
            or schedule_matrix[emp_b, db] == vacation_shift_id
        ):
            continue

        sched_a[:] = schedule_matrix[emp_a]
        sched_b[:] = schedule_matrix[emp_b]

        day_sched_a[:] = schedule_matrix[:, da]
        day_sched_b[:] = schedule_matrix[:, db]

        shift_a, shift_b = sched_a[da], sched_b[db]
        sched_a[da], sched_b[db] = shift_b, shift_a
        day_sched_a[emp_a], day_sched_b[emp_b] = shift_b, shift_a

        delta_assign_a = assignment_delta(
            sched_a,
            emp_a,
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
        delta_assign_b = assignment_delta(
            sched_b,
            emp_b,
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
        delta_cover_a = coverage_delta(
            day_sched_a,
            da,
            coverage_penalties,
            coverage_requirements_matrix,
            pool_shift_weights_matrix,
        )
        delta_cover_b = coverage_delta(
            day_sched_b,
            db,
            coverage_penalties,
            coverage_requirements_matrix,
            pool_shift_weights_matrix,
        )

        delta = delta_assign_a + delta_assign_b + delta_cover_a + delta_cover_b
        if delta < best_delta:
            best_op, best_delta = i, delta
            best_delta_assign_a, best_delta_assign_b = delta_assign_a, delta_assign_b
            best_delta_cover_a, best_delta_cover_b = delta_cover_a, delta_cover_b

    return (
        best_op,
        best_delta,
        best_delta_assign_a,
        best_delta_assign_b,
        best_delta_cover_a,
        best_delta_cover_b,
    )
