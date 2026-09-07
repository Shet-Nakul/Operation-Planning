import numpy as np
from numba import njit, prange


@njit
def forbidden_pattern_simple(
    schedule: np.array,
    weight: int,
    pattern_length: int,
    patterns: np.array,
    previous_schedule: np.array,
):
    """
    Simple forbidden pattern evaluation - matches exact shift sequences, including across previous/current boundary.
    Optimized: avoids np.concatenate, uses explicit indexing for high-frequency calls.
    """
    penalty = 0
    prev_len = previous_schedule.shape[0]
    sched_len = schedule.shape[0]
    # total_len removed (was unused)
    window_count = sched_len + min(prev_len, pattern_length - 1) - pattern_length + 1
    for start in range(window_count):
        match = True
        for i in range(pattern_length):
            idx = start + i
            if idx < pattern_length - 1:
                # Index into previous_schedule
                prev_idx = prev_len - (pattern_length - 1) + idx
                if prev_idx < 0 or previous_schedule[prev_idx] != patterns[i]:
                    match = False
                    break
            else:
                sched_idx = idx - (pattern_length - 1)
                if sched_idx < 0 or schedule[sched_idx] != patterns[i]:
                    match = False
                    break
        if match:
            penalty += weight
    return penalty


@njit
def forbidden_pattern_simple_violated_idx(
    schedule, weight, pattern_length, patterns, num_days, previous_schedule
):
    """
    Marks only violations in the current schedule (not previous_schedule),
    using explicit boundary logic (no concatenation).
    """
    result = np.zeros(num_days, dtype=np.int32)
    prev_len = previous_schedule.shape[0]
    sched_len = schedule.shape[0]
    window_count = sched_len + min(prev_len, pattern_length - 1) - pattern_length + 1
    for start in range(window_count):
        match = True
        for i in range(pattern_length):
            idx = start + i
            if idx < pattern_length - 1:
                prev_idx = prev_len - (pattern_length - 1) + idx
                if prev_idx < 0 or previous_schedule[prev_idx] != patterns[i]:
                    match = False
                    break
            else:
                sched_idx = idx - (pattern_length - 1)
                if sched_idx < 0 or schedule[sched_idx] != patterns[i]:
                    match = False
                    break
        if match:
            # Only mark indices in the current schedule
            for i in range(pattern_length):
                idx = start + i
                if idx >= pattern_length - 1:
                    sched_idx = idx - (pattern_length - 1)
                    if 0 <= sched_idx < num_days:
                        result[sched_idx] = weight
    return result
