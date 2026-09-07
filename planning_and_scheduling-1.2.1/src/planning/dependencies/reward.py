# pylint: disable= too-many-arguments, too-many-locals
import numpy as np


def piecewise_penalty(
    penalty_array,
    earliest_start_slack,
    earliest_start,
    latest_start,
    latest_start_slack,
    base_reward,
    alpha,
    floor=-10,
):
    slot_indices = np.arange(penalty_array.shape[0])

    early_mask = slot_indices < earliest_start_slack
    if early_mask.sum() > 0:
        time_distance = earliest_start_slack - slot_indices[early_mask]
        penalty_array[early_mask] = floor * (1 - np.exp(-time_distance / alpha))

    early_ramp_mask = (slot_indices >= earliest_start_slack) & (
        slot_indices < earliest_start
    )
    if early_ramp_mask.sum() > 0:
        reward_values = np.linspace(
            0, base_reward / 2, earliest_start - earliest_start_slack, endpoint=False
        )
        valid_indices = np.arange(earliest_start_slack, earliest_start)
        penalty_array[early_ramp_mask] = reward_values[
            np.where(
                (valid_indices >= max(0, earliest_start_slack))
                & (valid_indices < min(earliest_start, penalty_array.shape[0]))
            )
        ]

    optimal_mask = (slot_indices >= earliest_start) & (slot_indices < latest_start)
    if optimal_mask.sum() > 0:
        reward_values = np.linspace(
            base_reward, base_reward / 2, latest_start - earliest_start, endpoint=False
        )
        valid_indices = np.arange(earliest_start, latest_start)
        penalty_array[optimal_mask] = reward_values[
            np.where(
                (valid_indices >= max(0, earliest_start))
                & (valid_indices < min(latest_start, penalty_array.shape[0]))
            )
        ]

    late_ramp_mask = (slot_indices >= latest_start) & (
        slot_indices < latest_start_slack
    )
    if late_ramp_mask.sum() > 0:
        reward_values = np.linspace(
            base_reward / 2, 0, latest_start_slack - latest_start, endpoint=False
        )
        valid_indices = np.arange(latest_start, latest_start_slack)
        penalty_array[late_ramp_mask] = reward_values[
            np.where(
                (valid_indices >= max(0, latest_start))
                & (valid_indices < min(latest_start_slack, penalty_array.shape[0]))
            )
        ]

    late_mask = slot_indices >= latest_start_slack
    if late_mask.sum() > 0:
        time_distance = slot_indices[late_mask] - latest_start_slack
        penalty_array[late_mask] = floor * (1 - np.exp(-time_distance / alpha))

    return penalty_array
