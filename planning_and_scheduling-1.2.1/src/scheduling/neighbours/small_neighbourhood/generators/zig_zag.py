import numpy as np
from numba import njit


@njit
def random_zig_zag_swaps(
    intraday_swap_pairs,
    num_days,
    max_operations,
):
    num_pairs = intraday_swap_pairs.shape[0]

    selected_emp_a = np.full(max_operations, -1, dtype=np.int32)
    selected_emp_b = np.full(max_operations, -1, dtype=np.int32)
    selected_day_a = np.full(max_operations, -1, dtype=np.int32)
    selected_day_b = np.full(max_operations, -1, dtype=np.int32)
    operation_count = 0

    if num_pairs == 0 or num_days < 2:
        return (
            operation_count,
            selected_emp_a,
            selected_emp_b,
            selected_day_a,
            selected_day_b,
        )

    for _ in range(max_operations):
        pair_idx = np.random.randint(0, num_pairs)
        emp_a, emp_b = intraday_swap_pairs[pair_idx]
        day_a = np.random.randint(0, num_days)
        day_b = np.random.randint(0, num_days - 1)
        if day_b >= day_a:
            day_b += 1

        selected_emp_a[operation_count] = emp_a
        selected_emp_b[operation_count] = emp_b
        selected_day_a[operation_count] = day_a
        selected_day_b[operation_count] = day_b
        operation_count += 1

    return (
        operation_count,
        selected_emp_a,
        selected_emp_b,
        selected_day_a,
        selected_day_b,
    )


@njit
def zig_zag_swaps(
    schedule_matrix,
    target_emp,
    target_day,
    shift_swap_pairs,
    shift_swap_pair_mask,
    num_days,
    max_operations,
    window=3,
):
    """
    Cross-day swap: emp_a on day_a gets emp_b's shift from day_b, and vice versa.
    schedule[emp_a, day_a], schedule[emp_b, day_b] = schedule[emp_b, day_b], schedule[emp_a, day_a]
    """
    num_employees = schedule_matrix.shape[0]
    num_swap_pairs = shift_swap_pairs.shape[0]

    selected_emp_a = np.full(max_operations, -1, dtype=np.int32)
    selected_emp_b = np.full(max_operations, -1, dtype=np.int32)
    selected_day_a = np.full(max_operations, -1, dtype=np.int32)
    selected_day_b = np.full(max_operations, -1, dtype=np.int32)
    operation_count = 0

    if num_swap_pairs == 0 or num_days < 2:
        return (
            operation_count,
            selected_emp_a,
            selected_emp_b,
            selected_day_a,
            selected_day_b,
        )

    for _ in range(max_operations * 4):
        if operation_count >= max_operations:
            break

        # Pick two days near target_day
        offset_a = np.random.randint(-window, window + 1)
        day_a = target_day + offset_a
        if day_a < 0:
            day_a = 0
        elif day_a >= num_days:
            day_a = num_days - 1

        offset_b = np.random.randint(-window, window + 1)
        day_b = target_day + offset_b
        if day_b < 0:
            day_b = 0
        elif day_b >= num_days:
            day_b = num_days - 1

        # Must be different days (same-day swaps are handled by the regular swap generator)
        if day_a == day_b:
            continue

        # Get target_emp's shift on day_a (this is what will be given away)
        shift_a = schedule_matrix[target_emp, day_a]

        # Find a swap pair that includes this shift and target_emp is eligible
        pair_idx = -1
        for p in range(num_swap_pairs):
            if shift_swap_pairs[p, 0] == shift_a or shift_swap_pairs[p, 1] == shift_a:
                if shift_swap_pair_mask[p, target_emp]:
                    pair_idx = p
                    break

        if pair_idx == -1:
            continue

        # Find a partner: emp_b must hold a DIFFERENT shift on day_b
        # Cross-swap: schedule[A, day_a] ↔ schedule[B, day_b]
        emp_b = -1
        start = np.random.randint(0, num_employees)
        for k in range(num_employees):
            candidate = (start + k) % num_employees
            if candidate == target_emp:
                continue
            shift_b = schedule_matrix[candidate, day_b]
            # No-op check: if same shift, nothing to swap
            if shift_b == shift_a:
                continue
            # Verify the partner is eligible for this swap pair
            if not shift_swap_pair_mask[pair_idx, candidate]:
                continue
            # Verify shift_b is part of this swap pair
            if (
                shift_b != shift_swap_pairs[pair_idx, 0]
                and shift_b != shift_swap_pairs[pair_idx, 1]
            ):
                continue
            emp_b = candidate
            break

        if emp_b == -1:
            continue

        selected_emp_a[operation_count] = target_emp
        selected_emp_b[operation_count] = emp_b
        selected_day_a[operation_count] = day_a
        selected_day_b[operation_count] = day_b
        operation_count += 1

    return (
        operation_count,
        selected_emp_a,
        selected_emp_b,
        selected_day_a,
        selected_day_b,
    )
