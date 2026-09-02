import numpy as np
from numba import njit


@njit
def execute_reassignment(
    schedule_matrix,
    assignment_penalties,
    coverage_penalties,
    assignment_penalty,
    coverage_penalty,  # state info
    operation_count,
    employee_indices,
    new_shifts,
    selected_days,  # move info
    best_op,
    best_delta,
    best_delta_assign,
    best_delta_cover,  # best move info
):
    if best_op == -1:
        return (
            schedule_matrix,
            assignment_penalties,
            coverage_penalties,
            assignment_penalty,
            coverage_penalty,
        )

    emp, shift, day = (
        employee_indices[best_op],
        new_shifts[best_op],
        selected_days[best_op],
    )
    schedule_matrix[emp, day] = shift
    assignment_penalties[emp] += best_delta_assign
    coverage_penalties[day] += best_delta_cover
    assignment_penalty += best_delta_assign
    coverage_penalty += best_delta_cover
    return (
        schedule_matrix,
        assignment_penalties,
        coverage_penalties,
        assignment_penalty,
        coverage_penalty,
    )
