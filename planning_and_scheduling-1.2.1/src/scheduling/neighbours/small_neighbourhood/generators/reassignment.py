import numpy as np
from numba import njit


@njit
def random_reassignment(
    schedule_matrix,
    target_emp,
    target_day,
    employee_shift_table,
    num_days,
    max_operations,
):
    valid_shift_count = employee_shift_table[target_emp, 0]

    selected_employees = np.full(max_operations, -1, dtype=np.int32)
    selected_shifts = np.full(max_operations, -1, dtype=np.int32)
    selected_days = np.full(max_operations, -1, dtype=np.int32)

    operation_count = 0

    if valid_shift_count <= 1:
        return operation_count, selected_employees, selected_shifts, selected_days

    for day in (
        target_day,
        target_day - 1,
        target_day + 1,
        target_day - 2,
        target_day + 2,
    ):
        if day < 0 or day >= num_days:
            continue
        current_shift = schedule_matrix[target_emp, day]

        for s in range(1, valid_shift_count + 1):
            candidate_shift = employee_shift_table[target_emp, s]
            if candidate_shift == current_shift:
                continue

            selected_employees[operation_count] = target_emp
            selected_shifts[operation_count] = candidate_shift
            selected_days[operation_count] = day

            operation_count += 1
            if operation_count >= max_operations:
                break

        if operation_count >= max_operations:
            break

    return operation_count, selected_employees, selected_shifts, selected_days


@njit
def pattern_based_reassignment(
    schedule_matrix,
    target_emp,
    employee_shift_table,
    patterns,
    num_days,
    max_operations,
):
    valid_shift_count = employee_shift_table[target_emp, 0]
    num_patterns = patterns.shape[0]

    selected_employees = np.full(max_operations, -1, dtype=np.int32)
    selected_shifts = np.full(max_operations, -1, dtype=np.int32)
    selected_days = np.full(max_operations, -1, dtype=np.int32)

    if valid_shift_count <= 1:
        return 0, selected_employees, selected_shifts, selected_days

    shift_schedule = schedule_matrix[target_emp, :] % 10

    violation_days = np.full(num_days, -1, dtype=np.int32)
    violation_count = 0

    for idx in range(num_patterns):
        pattern_length = patterns[idx, 0]

        for day_offset in range(num_days - pattern_length + 1):
            match = True
            for k in range(pattern_length):
                if shift_schedule[day_offset + k] != patterns[idx, 1 + k]:
                    match = False
                    break
            if match:
                for d in range(day_offset, day_offset + pattern_length):
                    already_added = False
                    for v in range(violation_count):
                        if violation_days[v] == d:
                            already_added = True
                            break
                    if not already_added:
                        violation_days[violation_count] = d
                        violation_count += 1

    if violation_count == 0:  # pragma: no cover
        return 0, selected_employees, selected_shifts, selected_days

    operation_count = 0

    for _ in range(max_operations * 2):
        target_day = violation_days[np.random.randint(0, violation_count)]

        shift_position = np.random.randint(1, valid_shift_count + 1)
        candidate_shift = employee_shift_table[target_emp, shift_position]

        if candidate_shift % 10 == schedule_matrix[target_emp, target_day] % 10:
            continue

        selected_employees[operation_count] = target_emp
        selected_shifts[operation_count] = candidate_shift
        selected_days[operation_count] = target_day

        operation_count += 1
        if operation_count >= max_operations:
            break

    return operation_count, selected_employees, selected_shifts, selected_days
