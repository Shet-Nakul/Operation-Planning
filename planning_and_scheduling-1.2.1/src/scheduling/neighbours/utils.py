import numpy as np
from numba import njit


@njit
def weighted_choice_index(probabilities):
    cumsum = np.cumsum(probabilities)
    r = np.random.random()
    for i in range(len(cumsum)):
        if r < cumsum[i]:
            return i
    return len(probabilities) - 1


@njit
def weighted_choice_index_njit(weight, epsilon=1e-8):
    n = len(weight)
    total = 0.0
    for i in range(n):
        total += weight[i] + epsilon
    r = np.random.random() * total
    cumulative = 0.0
    for i in range(n):
        cumulative += weight[i] + epsilon
        if r < cumulative:
            return i
    return n - 1


def encode_move(config, moves, best_move_info):
    """
    Improved tabu encoding:
    - keeps employee structure
    - adds temporal context (day)
    - reduces collisions
    - preserves move-type semantics
    """

    move_type, target_employee, target_day = config
    best_idx = best_move_info[0]

    mtype = move_type.value

    # -------------------------------------------------
    # REASSIGNMENT / PATTERN
    # -------------------------------------------------
    if move_type.name in ("REASSIGNMENT", "PATTERN"):
        emp = int(moves[1][best_idx])
        day = int(moves[3][best_idx]) if len(moves) > 3 else target_day

        return (mtype, emp, day)

    # -------------------------------------------------
    # SWAPS (single-day swap between employees)
    # -------------------------------------------------
    elif move_type.name == "SWAPS":
        emp_a = int(moves[1][best_idx])
        emp_b = int(moves[2][best_idx])
        day = int(moves[3][best_idx])

        return (mtype, min(emp_a, emp_b), max(emp_a, emp_b), day)

    # -------------------------------------------------
    # ZIG_ZAG (multi-day dependency)
    # -------------------------------------------------
    elif move_type.name == "ZIG_ZAG":
        emp_a = int(moves[1][best_idx])
        emp_b = int(moves[2][best_idx])
        day_a = int(moves[3][best_idx])
        day_b = int(moves[4][best_idx])

        return (mtype, min(emp_a, emp_b), max(emp_a, emp_b), day_a, day_b)

    # -------------------------------------------------
    # BLOCK (range-based move)
    # -------------------------------------------------
    elif move_type.name == "BLOCK":
        emp_a = int(moves[1][best_idx])
        emp_b = int(moves[2][best_idx])
        day_start = int(moves[3][best_idx])
        day_end = int(moves[4][best_idx])

        return (mtype, min(emp_a, emp_b), max(emp_a, emp_b), day_start, day_end)

    # -------------------------------------------------
    # SAFETY FALLBACK (should not happen)
    # -------------------------------------------------
    return (mtype, tuple(map(int, moves[1][best_idx : best_idx + 2])))
