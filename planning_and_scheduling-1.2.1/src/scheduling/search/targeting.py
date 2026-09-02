import numpy as np
from numba import njit, prange

from scheduling.constraints.assignment.consecutive import (
    max_consecutive_free_days_violated_idx,
    max_consecutive_working_days_violated_idx,
    min_consecutive_free_days_violated_idx,
    min_consecutive_working_days_violated_idx,
)
from scheduling.constraints.assignment.patterns import (
    forbidden_pattern_simple_violated_idx,
)
from scheduling.constraints.assignment.weekends import (
    complete_weekends_violated_idx,
    identical_shift_types_during_weekend_violated_idx,
    max_consecutive_working_weekends_violated_idx,
    min_consecutive_working_weekends_violated_idx,
    no_free_day_before_working_weekend_violated_idx,
    no_night_shift_before_free_weekend_violated_idx,
)
from scheduling.constraints.assignment.workload import (
    max_num_assignments_violated_idx,
    min_num_assignments_violated_idx,
)
from scheduling.constraints.coverage.shifts import evaluate_requirements_violated_idx


@njit
def _evaluate_employee_violations(
    emp_schedule,
    encoder,
    off_shift_id,
    vacation_shift_id,
    night_shift_id,
    weekend_pairs,
    num_days,
    emp_previous_schedule,
    last_working_block_counts,
    last_free_block_counts,
    consecutive_working_weekends,
    friday_offset,
    saturday_offset,
):
    """Evaluate all assignment constraint violations for a single employee."""
    result = np.zeros(num_days, dtype=np.int32)

    if encoder[0, 1]:
        result += identical_shift_types_during_weekend_violated_idx(
            emp_schedule,
            encoder[0, 3],
            off_shift_id,
            vacation_shift_id,
            weekend_pairs,
            num_days,
            emp_previous_schedule,
            saturday_offset,
        )
    if encoder[1, 1]:
        result += complete_weekends_violated_idx(
            emp_schedule,
            encoder[1, 3],
            off_shift_id,
            vacation_shift_id,
            weekend_pairs,
            num_days,
            emp_previous_schedule,
            saturday_offset,
        )
    if encoder[2, 1]:
        result += no_night_shift_before_free_weekend_violated_idx(
            emp_schedule,
            encoder[2, 3],
            off_shift_id,
            vacation_shift_id,
            night_shift_id,
            weekend_pairs,
            num_days,
            emp_previous_schedule,
            friday_offset,
        )
    if encoder[3, 1]:
        result += no_free_day_before_working_weekend_violated_idx(
            emp_schedule,
            encoder[3, 3],
            off_shift_id,
            vacation_shift_id,
            weekend_pairs,
            num_days,
            emp_previous_schedule,
            friday_offset,
        )
    if encoder[4, 1]:
        result += max_num_assignments_violated_idx(
            emp_schedule, encoder[4, 3], encoder[4, 4], off_shift_id, num_days
        )
    if encoder[5, 1]:
        result += min_num_assignments_violated_idx(
            emp_schedule, encoder[5, 3], encoder[5, 4], off_shift_id, num_days
        )
    if encoder[6, 1]:
        result += max_consecutive_working_days_violated_idx(
            emp_schedule,
            encoder[6, 3],
            encoder[6, 4],
            off_shift_id,
            vacation_shift_id,
            num_days,
            last_working_block_counts,
        )
    if encoder[7, 1]:
        result += min_consecutive_working_days_violated_idx(
            emp_schedule,
            encoder[7, 3],
            encoder[7, 4],
            off_shift_id,
            vacation_shift_id,
            num_days,
            last_working_block_counts,
        )
    if encoder[8, 1]:
        result += max_consecutive_free_days_violated_idx(
            emp_schedule,
            encoder[8, 3],
            encoder[8, 4],
            off_shift_id,
            vacation_shift_id,
            num_days,
            last_free_block_counts,
        )
    if encoder[9, 1]:
        result += min_consecutive_free_days_violated_idx(
            emp_schedule,
            encoder[9, 3],
            encoder[9, 4],
            off_shift_id,
            vacation_shift_id,
            num_days,
            last_free_block_counts,
        )
    if encoder[10, 1]:
        result += max_consecutive_working_weekends_violated_idx(
            emp_schedule,
            encoder[10, 3],
            encoder[10, 4],
            off_shift_id,
            vacation_shift_id,
            weekend_pairs,
            num_days,
            consecutive_working_weekends,
            emp_previous_schedule,
            saturday_offset,
        )
    if encoder[11, 1]:
        result += min_consecutive_working_weekends_violated_idx(
            emp_schedule,
            encoder[11, 3],
            encoder[11, 4],
            off_shift_id,
            vacation_shift_id,
            weekend_pairs,
            num_days,
            consecutive_working_weekends,
            emp_previous_schedule,
            saturday_offset,
        )
    for idx in range(12, 19):
        if encoder[idx, 1]:
            pl = encoder[idx, 5]
            pattern = encoder[idx, 6 : 6 + pl]
            result += forbidden_pattern_simple_violated_idx(
                emp_schedule,
                encoder[idx, 3],
                pl,
                pattern,
                num_days,
                emp_previous_schedule,
            )

    return result


@njit(parallel=True)
def build_violation_matrix(
    schedule_matrix,
    contract_constraints_tensor,
    employee_contract_ids,
    off_shift_id,
    vacation_shift_id,
    night_shift_id,
    weekend_pairs,
    num_employees,
    num_days,
    coverage_requirements_matrix,
    pool_shift_weights_matrix,
    previous_schedule,
    last_working_block_counts,
    last_free_block_counts,
    consecutive_working_weekends,
    friday_offset,
    saturday_offset,
):
    result = np.zeros((num_employees, num_days), dtype=np.int32)

    # Build assignment schedule (shift % 10) — parallel over employees
    assignment_schedule = np.zeros((num_employees, num_days), dtype=np.int32)
    for e in prange(num_employees):
        for d in range(num_days):
            assignment_schedule[e, d] = schedule_matrix[e, d] % 10

    # Evaluate assignment constraints — parallel over employees
    for emp in prange(num_employees):
        contract_id = employee_contract_ids[emp]
        encoder = contract_constraints_tensor[contract_id]
        result[emp] = _evaluate_employee_violations(
            assignment_schedule[emp],
            encoder,
            off_shift_id,
            vacation_shift_id,
            night_shift_id,
            weekend_pairs,
            num_days,
            previous_schedule[emp],
            last_working_block_counts[emp],
            last_free_block_counts[emp],
            consecutive_working_weekends[emp],
            friday_offset,
            saturday_offset,
        )

    # Coverage violations — parallel over days
    for day in prange(num_days):
        daily = schedule_matrix[:, day]
        cov = evaluate_requirements_violated_idx(
            daily,
            coverage_requirements_matrix[:, day + 1],
            pool_shift_weights_matrix,
            off_shift_id,
        )
        for e in range(num_employees):
            result[e, day] += cov[e]

    return result


@njit
def sample_violations(matrix, n_samples):
    rows = matrix.shape[0]
    cols = matrix.shape[1]
    result = np.zeros((n_samples, 2), dtype=np.int32)

    # Flatten and compute cumulative sum for O(n) sampling
    flat = matrix.ravel()
    total = flat.shape[0]
    cum_sum = np.zeros(total, dtype=np.int64)
    cum_sum[0] = flat[0]
    for i in range(1, total):
        cum_sum[i] = cum_sum[i - 1] + flat[i]

    grand_total = cum_sum[total - 1]

    for s in range(n_samples):
        if grand_total == 0:
            result[s, 0] = np.random.randint(0, rows)
            result[s, 1] = np.random.randint(0, cols)
        else:
            threshold = np.random.randint(1, grand_total + 1)
            # Binary search for threshold in cum_sum
            lo = 0
            hi = total - 1
            while lo < hi:
                mid = (lo + hi) // 2
                if cum_sum[mid] < threshold:
                    lo = mid + 1
                else:
                    hi = mid
            result[s, 0] = lo // cols
            result[s, 1] = lo % cols

    return result
