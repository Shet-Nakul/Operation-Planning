import numpy as np
from numba import njit

from scheduling.neighbours.small_neighbourhood.evaluators.delta import assignment_delta


@njit
def evaluate_swap(
    schedule_matrix,
    assignment_penalties,
    operation_count,
    selected_emp_a,
    selected_emp_b,
    selected_days,
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
    _, num_days = schedule_matrix.shape
    best_op, best_delta = -1, np.inf
    best_delta_assign_a, best_delta_assign_b = np.inf, np.inf
    sched_a = np.empty(num_days, dtype=schedule_matrix.dtype)
    sched_b = np.empty(num_days, dtype=schedule_matrix.dtype)

    for i in range(operation_count):
        a, b, day = selected_emp_a[i], selected_emp_b[i], selected_days[i]
        sched_a[:] = schedule_matrix[a]
        sched_b[:] = schedule_matrix[b]

        if sched_a[day] == vacation_shift_id or sched_b[day] == vacation_shift_id:
            continue

        shift_a, shift_b = sched_a[day], sched_b[day]
        sched_a[day] = shift_b
        sched_b[day] = shift_a

        delta_assign_a = assignment_delta(
            sched_a,
            a,
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
            b,
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

        delta = delta_assign_a + delta_assign_b
        if delta < best_delta:
            best_op, best_delta = i, delta
            best_delta_assign_a, best_delta_assign_b = delta_assign_a, delta_assign_b

    return best_op, best_delta, best_delta_assign_a, best_delta_assign_b
