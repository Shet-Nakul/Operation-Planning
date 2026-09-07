# pylint: disable=all
from abc import ABC, abstractmethod
from typing import Dict, Tuple

import numpy as np

from planning.dependencies.allocators import allocate_dense_resources_first_fit


class Search(ABC):
    def __init__(self, data_manager, neighborhood_explorer):
        self.neighborhood_explorer = neighborhood_explorer
        self.reward_calculator = data_manager.reward
        self.resource_profile = data_manager.resources_profiles
        self.surgery_profiles = data_manager.get_mode_profile_with_feasible_starts

        self.best_solution = None
        self.best_objective = float("-inf")
        self.current_solution = None
        self.current_objective = float("-inf")

        self.iteration_count = 0
        self.improvements = 0

    @abstractmethod
    def search(self, initial_solution: Tuple, **kwargs) -> Dict:
        pass

    def _evaluate_solution(self, solution: Tuple) -> float:
        """Shared evaluation logic"""
        total_reward = 0
        resource_copy = self.resource_profile.copy()
        for task_idx, mode, start_idx in solution:
            try:
                profile, allowed_starts, _ = self.surgery_profiles(
                    task_idx, mode, start_idx
                )

                min_req = np.sum(profile > 0, axis=1).astype(np.int32)
                allocation_result = allocate_dense_resources_first_fit(
                    resource_copy, profile, min_req, allowed_starts
                )
                if allocation_result[2]:
                    actual_start, actual_end, _, allocation = allocation_result
                    resource_copy[:, :, actual_start : actual_end + 1] -= allocation
                    total_reward += self.reward_calculator(
                        surgery_idx=task_idx, time_slot=actual_start
                    )
                else:
                    total_reward += self.reward_calculator(
                        surgery_idx=task_idx, time_slot=None
                    )

            except Exception:
                total_reward += self.reward_calculator(
                    surgery_idx=task_idx, time_slot=None
                )

        return total_reward
