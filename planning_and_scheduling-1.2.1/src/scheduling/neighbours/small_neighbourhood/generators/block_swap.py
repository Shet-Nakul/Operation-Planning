import numpy as np
from numba import njit


@njit
def random_intraday_swaps(
    intraday_swap_pairs,
    num_days,
    max_block_size,
    max_operations,
):
    num_pairs = intraday_swap_pairs.shape[0]

    selected_emp_a = np.full(max_operations, -1, dtype=np.int32)
    selected_emp_b = np.full(max_operations, -1, dtype=np.int32)
    selected_day_start = np.full(max_operations, -1, dtype=np.int32)
    selected_day_end = np.full(max_operations, -1, dtype=np.int32)
    operation_count = 0

    if num_pairs == 0 or num_days < 2:
        return (
            operation_count,
            selected_emp_a,
            selected_emp_b,
            selected_day_start,
            selected_day_end,
        )

    clamped_block = min(max_block_size, num_days)

    for _ in range(max_operations):
        pair_idx = np.random.randint(0, num_pairs)
        emp_a, emp_b = intraday_swap_pairs[pair_idx]
        block_size = np.random.randint(1, clamped_block + 1)
        day_start = np.random.randint(0, num_days - block_size + 1)
        day_end = day_start + block_size - 1  # inclusive end

        selected_emp_a[operation_count] = emp_a
        selected_emp_b[operation_count] = emp_b
        selected_day_start[operation_count] = day_start
        selected_day_end[operation_count] = day_end
        operation_count += 1

    return (
        operation_count,
        selected_emp_a,
        selected_emp_b,
        selected_day_start,
        selected_day_end,
    )
