import numpy as np
from numba import njit


@njit
def block_reassignment(
    schedule_matrix,
    employee_shift_table,
    target_emps,
    target_days,
    vacation_shift_id,
    max_block_size=3,
):
    num_days = schedule_matrix.shape[1]

    for i in range(len(target_emps)):

        emp = target_emps[i]
        day = target_days[i]

        if schedule_matrix[emp, day] == vacation_shift_id:
            continue

        valid_shift_count = employee_shift_table[emp, 0]
        if valid_shift_count < 1:
            continue

        shift_pos = np.random.randint(1, valid_shift_count + 1)
        candidate_shift = employee_shift_table[emp, shift_pos]

        block_size = np.random.randint(1, max_block_size + 1)

        end_day = min(day + block_size, num_days)

        for d in range(day, end_day):
            if schedule_matrix[emp, d] == vacation_shift_id:  # pragma: no cover
                continue
            schedule_matrix[emp, d] = candidate_shift

    return schedule_matrix


@njit
def coverage_reassignment(
    schedule_matrix,
    coverage_requirements_matrix,
    employee_shift_table,
    days,
    off_shift_id,
    vacation_shift_id,
):
    """
    LNS repair operator:
    - fixes coverage shortages
    - uses randomized ordering
    - prefers continuity with neighboring days
    - avoids repeated full recounts where possible
    """
    num_employees = schedule_matrix.shape[0]
    num_days = schedule_matrix.shape[1]
    shift_ids = coverage_requirements_matrix[:, 0]
    num_shift_types = len(shift_ids)

    emp_order = np.arange(num_employees)

    for di in range(len(days)):
        day = days[di]
        daily_requirements = coverage_requirements_matrix[:, day + 1]

        # Count current coverage once for this day
        current_counts = np.zeros(num_shift_types, dtype=np.int32)
        for e in range(num_employees):
            sh = schedule_matrix[e, day]
            for s in range(num_shift_types):
                if shift_ids[s] == sh:
                    current_counts[s] += 1
                    break

        for s in range(num_shift_types):
            shift_id = shift_ids[s]
            required = daily_requirements[s]
            shortfall = required - current_counts[s]
            if shortfall <= 0:
                continue

            # Shuffle employees for randomized repair
            for idx in range(num_employees - 1, 0, -1):
                j = np.random.randint(0, idx + 1)
                tmp = emp_order[idx]
                emp_order[idx] = emp_order[j]
                emp_order[j] = tmp

            # Build candidate list
            cand_emp = np.empty(num_employees, dtype=np.int32)
            cand_score = np.empty(num_employees, dtype=np.float64)
            cand_count = 0

            for idx in range(num_employees):
                e = emp_order[idx]
                current_shift = schedule_matrix[e, day]

                if current_shift == vacation_shift_id:
                    continue

                if current_shift == shift_id:
                    continue

                # Eligibility check
                valid_count = employee_shift_table[e, 0]
                can_do = False
                for k in range(1, valid_count + 1):
                    if employee_shift_table[e, k] == shift_id:
                        can_do = True
                        break
                if not can_do:
                    continue

                score = 0.0

                # Continuity bonus
                if day > 0 and schedule_matrix[e, day - 1] == shift_id:
                    score += 2.0
                if day < num_days - 1 and schedule_matrix[e, day + 1] == shift_id:
                    score += 2.0

                # Prefer off-shift employees
                if current_shift == off_shift_id:
                    score += 1.0

                # If stealing from another shift, only allow if it is overstaffed
                if current_shift != off_shift_id:
                    current_shift_idx = -1
                    for s2 in range(num_shift_types):
                        if shift_ids[s2] == current_shift:
                            current_shift_idx = s2
                            break
                    if current_shift_idx == -1:
                        continue
                    if (
                        current_counts[current_shift_idx]
                        <= daily_requirements[current_shift_idx]
                    ):
                        continue

                cand_emp[cand_count] = e
                cand_score[cand_count] = score
                cand_count += 1

            # Assign best available candidates, but keep some randomness
            while shortfall > 0 and cand_count > 0:
                best_idx = 0
                best_score = cand_score[0]
                for idx in range(1, cand_count):
                    if cand_score[idx] > best_score:
                        best_score = cand_score[idx]
                        best_idx = idx
                    elif cand_score[idx] == best_score:
                        if np.random.random() < 0.5:
                            best_idx = idx

                e = cand_emp[best_idx]
                old_shift = schedule_matrix[e, day]

                schedule_matrix[e, day] = shift_id
                current_counts[s] += 1
                shortfall -= 1

                # Remove selected candidate by swapping with last
                cand_count -= 1
                cand_emp[best_idx] = cand_emp[cand_count]
                cand_score[best_idx] = cand_score[cand_count]

                # If we stole from another shift, update its count
                if old_shift != off_shift_id:
                    for s2 in range(num_shift_types):
                        if shift_ids[s2] == old_shift:
                            current_counts[s2] -= 1
                            break

    return schedule_matrix


@njit
def perturbation(
    schedule_matrix, employee_shift_table, vacation_shift_id, fraction=0.25
):
    """Perturb a fraction of employees by randomizing their entire schedule."""
    num_employees = schedule_matrix.shape[0]
    num_days = schedule_matrix.shape[1]
    n_perturb = max(1, int(num_employees * fraction))

    # Randomly select employees to perturb
    all_emps = np.arange(num_employees)
    for i in range(num_employees - 1, 0, -1):
        j = np.random.randint(0, i + 1)
        tmp = all_emps[i]
        all_emps[i] = all_emps[j]
        all_emps[j] = tmp

    for idx in range(n_perturb):
        emp = all_emps[idx]
        valid_count = employee_shift_table[emp, 0]
        if valid_count < 1:
            continue
        for day in range(num_days):
            if schedule_matrix[emp, day] == vacation_shift_id:
                continue
            shift_pos = np.random.randint(1, valid_count + 1)
            schedule_matrix[emp, day] = employee_shift_table[emp, shift_pos]

    return schedule_matrix
