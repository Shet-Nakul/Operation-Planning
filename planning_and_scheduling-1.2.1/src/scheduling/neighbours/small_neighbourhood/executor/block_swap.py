import numpy as np
from numba import njit

from scheduling.neighbours.small_neighbourhood.evaluators.delta import assignment_delta


@njit
def execute_block_swap(
    schedule_matrix,
    assignment_penalties,
    coverage_penalties,
    assignment_penalty,
    coverage_penalty,  # state info
    operation_count,
    selected_emp_a,
    selected_emp_b,
    selected_day_start,
    selected_day_end,  # move info
    best_op,
    best_delta,
    best_delta_assign_a,
    best_delta_assign_b,  # best move info
):
    if best_op == -1:
        return (
            schedule_matrix,
            assignment_penalties,
            coverage_penalties,
            assignment_penalty,
            coverage_penalty,
        )

    emp_a, emp_b = selected_emp_a[best_op], selected_emp_b[best_op]
    day_start, day_end = selected_day_start[best_op], selected_day_end[best_op]

    for day in range(day_start, day_end + 1):
        shift_a = schedule_matrix[emp_a, day]
        shift_b = schedule_matrix[emp_b, day]
        schedule_matrix[emp_a, day] = shift_b
        schedule_matrix[emp_b, day] = shift_a

    assignment_penalties[emp_a] += best_delta_assign_a
    assignment_penalties[emp_b] += best_delta_assign_b
    assignment_penalty += best_delta_assign_a + best_delta_assign_b

    return (
        schedule_matrix,
        assignment_penalties,
        coverage_penalties,
        assignment_penalty,
        coverage_penalty,
    )
