import numpy as np
from numba import njit

from scheduling.neighbours.small_neighbourhood.evaluators.delta import (
    assignment_delta,
    coverage_delta,
)


@njit
def execute_zig_zag_swap(
    schedule_matrix,
    assignment_penalties,
    coverage_penalties,
    assignment_penalty,
    coverage_penalty,  # state info
    operation_count,
    selected_emp_a,
    selected_emp_b,
    selected_day_a,
    selected_day_b,
    best_op,
    best_delta,
    best_delta_assign_a,
    best_delta_assign_b,
    best_delta_cover_a,
    best_delta_cover_b,
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
    da, db = selected_day_a[best_op], selected_day_b[best_op]

    shift_a, shift_b = schedule_matrix[emp_a, da], schedule_matrix[emp_b, db]
    schedule_matrix[emp_a, da], schedule_matrix[emp_b, db] = shift_b, shift_a

    assignment_penalties[emp_a] += best_delta_assign_a
    assignment_penalties[emp_b] += best_delta_assign_b
    coverage_penalties[da] += best_delta_cover_a
    coverage_penalties[db] += best_delta_cover_b
    assignment_penalty += best_delta_assign_a + best_delta_assign_b
    coverage_penalty += best_delta_cover_a + best_delta_cover_b

    return (
        schedule_matrix,
        assignment_penalties,
        coverage_penalties,
        assignment_penalty,
        coverage_penalty,
    )
