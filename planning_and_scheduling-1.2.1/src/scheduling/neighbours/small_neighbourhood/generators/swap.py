import numpy as np
from numba import njit


@njit
def random_swaps(
    schedule_matrix,
    target_day,
    pool_shift,
    shift_swap_pairs,
    shift_swap_pair_mask,
    max_operations,
):
    num_employees = schedule_matrix.shape[0]
    num_shifts = pool_shift.shape[0]
    num_pairs = shift_swap_pairs.shape[0]
    employees_by_shift = np.full((num_shifts, num_employees), -1, dtype=np.int32)
    employee_count_per_shift = np.zeros(num_shifts, dtype=np.int32)

    for emp in range(num_employees):
        current_pool_shift = schedule_matrix[emp, target_day]
        for shift_idx in range(num_shifts):
            if current_pool_shift == pool_shift[shift_idx]:
                break
        employees_by_shift[shift_idx, employee_count_per_shift[shift_idx]] = emp
        employee_count_per_shift[shift_idx] += 1

    selected_emp_a = np.full(max_operations, -1, dtype=np.int32)
    selected_emp_b = np.full(max_operations, -1, dtype=np.int32)
    selected_days = np.full(max_operations, -1, dtype=np.int32)

    operation_count = 0

    for _ in range(max_operations * 2):
        pair_idx = np.random.randint(0, num_pairs)
        shift_a = shift_swap_pairs[pair_idx, 0]
        shift_b = shift_swap_pairs[pair_idx, 1]

        for idx_a in range(num_shifts):
            if shift_a == pool_shift[idx_a]:
                shift_a_idx = idx_a
                break
        for idx_b in range(num_shifts):
            if shift_b == pool_shift[idx_b]:
                shift_b_idx = idx_b
                break

        count_a = employee_count_per_shift[shift_a_idx]
        count_b = employee_count_per_shift[shift_b_idx]

        if count_a == 0 or count_b == 0:
            continue

        candidate_a = -1
        for _ in range(count_a):
            idx = np.random.randint(0, count_a)
            emp = employees_by_shift[shift_a_idx, idx]
            if shift_swap_pair_mask[pair_idx, emp]:
                candidate_a = emp
                break

        if candidate_a == -1:
            continue

        candidate_b = -1
        for _ in range(count_b):
            idx = np.random.randint(0, count_b)
            emp = employees_by_shift[shift_b_idx, idx]
            if shift_swap_pair_mask[pair_idx, emp]:
                candidate_b = emp
                break

        if candidate_b == -1:
            continue

        selected_emp_a[operation_count] = candidate_a
        selected_emp_b[operation_count] = candidate_b
        selected_days[operation_count] = target_day

        operation_count += 1
        if operation_count >= max_operations:
            break

    return operation_count, selected_emp_a, selected_emp_b, selected_days
