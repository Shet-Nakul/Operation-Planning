import numpy as np
from numba import njit

from scheduling.constraints.assignment.penalty import (
    calculate_penalty as cal_assignment_penalty,
)
from scheduling.constraints.coverage.shifts import (
    evaluate_requirements as cal_coverage_penalty,
)
from scheduling.constraints.prefered.shift_preference import (
    prefered_pool_shift_penalty as cal_prefered_pool_shift_penalty,
)
from scheduling.constraints.split.split_deviation import (
    assignments_split_deviation as cal_split_penalty,
)


@njit
def calculate_penalty(
    pool_shift_schedule,
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

    num_employees, num_days = pool_shift_schedule.shape

    assignment_penalties = np.zeros(num_employees, dtype=np.float32)
    coverage_penalties = np.zeros(num_days, dtype=np.float32)
    assignment_penalty = 0
    coverage_penalty = 0

    for emp_idx in range(num_employees):
        employee_shift_schedule = pool_shift_schedule[emp_idx, :] % 10
        previous_employee_schedule = previous_schedule[emp_idx, :] % 10
        contract_id = employee_contract_ids[emp_idx]
        contract_constraints = contract_constraints_tensor[contract_id]
        ass_penalty, _ = cal_assignment_penalty(
            contract_constraints,
            employee_shift_schedule,
            weekend_pairs,
            vacation_shift_id,
            off_shift_id,
            night_shift_id,
            previous_employee_schedule,
            last_working_block_counts[emp_idx],
            last_free_block_counts[emp_idx],
            consecutive_working_weekends[emp_idx],
            friday_offset,
            saturday_offset,
        )
        assignment_penalties[emp_idx] = ass_penalty
        assignment_penalty += ass_penalty

    for day_idx in range(num_days):
        daily_schedule = pool_shift_schedule[:, day_idx]
        daily_coverage_requirements = coverage_requirements_matrix[:, day_idx + 1]
        cov_penalty, _ = cal_coverage_penalty(
            daily_schedule, daily_coverage_requirements, pool_shift_weights_matrix
        )
        coverage_penalties[day_idx] = cov_penalty
        coverage_penalty += cov_penalty

    for emp_idx in range(num_employees):
        employee_pool_shift_schedule = pool_shift_schedule[emp_idx, :]
        sli_penalty = cal_split_penalty(
            employee_pool_shift_schedule,
            pool_shift_weights_matrix[:, 0],
            employee_probability_matrix[:, emp_idx],
            weight=100,
        )
        assignment_penalties[emp_idx] += sli_penalty
        assignment_penalty += sli_penalty

    for emp_idx in range(num_employees):
        employee_pool_shift_schedule = pool_shift_schedule[emp_idx, :]
        emp_prefered_pool = prefered_pool[emp_idx, :]
        emp_prefered_shift = prefered_shift[emp_idx, :]
        emp_preference_weight = preference_weight[emp_idx, :]

        pref_penalty = cal_prefered_pool_shift_penalty(
            employee_pool_shift_schedule,
            emp_prefered_pool,
            emp_prefered_shift,
            emp_preference_weight,
        )
        assignment_penalties[emp_idx] += pref_penalty
        assignment_penalty += pref_penalty

    return (
        assignment_penalties,
        coverage_penalties,
        assignment_penalty,
        coverage_penalty,
    )
