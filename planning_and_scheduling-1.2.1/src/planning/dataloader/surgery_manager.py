# pylint: disable=too-many-locals,too-many-instance-attributes,too-many-arguments
from functools import cached_property
from itertools import product
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from numba import njit

from planning.dataloader.resource_manager import ResourceManager
from planning.dataloader.time_manager import TimeManager
from planning.dependencies.allocators import find_all_feasible_starts, score_all_starts
from planning.dependencies.reward import piecewise_penalty
from planning.models.data import FlatDataModel, ProfileConfig


class SurgeryRewardCalculator:
    def __init__(
        self,
        data: FlatDataModel,
        time_manager: TimeManager,
        lambda_slack: float = 0.5,
        lambda_slack_urgent: float = 0.5,
        min_drop_mult: float = 0.3,
        max_drop_mult: float = 5.0,
    ):
        self.surgeries = data.surgeries
        self.time_manager = time_manager

        self.lambda_slack = lambda_slack
        self.lambda_slack_urgent = lambda_slack_urgent
        self.min_drop_mult = min_drop_mult
        self.max_drop_mult = max_drop_mult

    @cached_property
    def profiles(self) -> Dict[int, Dict[str, Any]]:
        profiles = {}

        for surgery in self.surgeries:
            penalty_profile = self._create_penalty_profile(surgery)
            earliest, latest, _, _ = self._calculate_boundaries(surgery)

            profiles[surgery.idx] = {
                "penalty_profile": penalty_profile,
                "earliest_slot": earliest,
                "latest_slot": latest,
            }

        return profiles

    @cached_property  # TODO
    def surgery_hour(self) -> Dict[int, Any]:
        surgery_hour = {}
        for sur in self.surgeries:
            surgery_hour[sur.idx] = (
                sur.operation_duration / self.time_manager.resolution
            )
        return surgery_hour

    def _get_penalty(self, surgery_idx: int, slot: int = None) -> float:

        profile = self.profiles[surgery_idx]
        penalty_array = profile["penalty_profile"]

        if slot is not None:
            return penalty_array[slot] if slot < len(penalty_array) else 0.0

        mult = self._drop_multiplier(surgery_idx)
        drop_penalty = penalty_array[-1] * mult

        ls_slot = profile["latest_slot"]
        horizon_end = len(self.time_manager.planning_time_index)

        if ls_slot <= horizon_end:
            worst_in_horizon = penalty_array[:horizon_end].min()
            drop_penalty = min(drop_penalty, worst_in_horizon)

        return float(drop_penalty)

    def reward(self, surgery_idx: int, start_slot: int = None) -> float:
        penalty = self._get_penalty(surgery_idx, start_slot)
        return penalty * self.surgery_hour[surgery_idx]

    def _drop_multiplier(self, surgery_idx: int) -> float:
        profile = self.profiles[surgery_idx]
        ls_slot = profile["latest_slot"]
        horizon_end = len(self.time_manager.planning_time_index)

        slack_slots = ls_slot - horizon_end
        slack_days = slack_slots / self.time_manager.slots_per_day

        if slack_days > 0:
            mult = 1.0 / (1.0 + self.lambda_slack * slack_days)
        elif slack_days == 0:
            mult = 1.0
        else:
            mult = 1.0 + abs(slack_days) * self.lambda_slack_urgent

        mult = np.clip(mult, self.min_drop_mult, self.max_drop_mult)
        return float(mult)

    def _calculate_boundaries(self, surgery) -> Tuple[int, int, int, int]:
        time_windows = surgery.time_windows
        reward = surgery.reward

        day_latest = self.time_manager.calculate_day_offset(
            time_windows.latest_date, self.time_manager.execution_datetime
        )
        day_earliest = self.time_manager.calculate_day_offset(
            time_windows.earliest_date, self.time_manager.execution_datetime
        )

        slot_latest = int(
            day_latest * self.time_manager.slots_per_day
            + self.time_manager.operational_end_slot
        )
        slot_earliest = int(
            day_earliest * self.time_manager.slots_per_day
            + self.time_manager.operational_start_slot
        )

        slack_earliest = (
            slot_earliest
            - reward.earliness_slack_days * self.time_manager.slots_per_day
            - 1
        )
        slack_latest = (
            slot_latest
            + reward.lateness_slack_days * self.time_manager.slots_per_day
            + 1
        )

        return slack_earliest, slot_earliest, slot_latest, slack_latest

    def _create_penalty_profile(self, surgery) -> np.ndarray:
        total_slots = len(self.time_manager.extended_planning_time_index)
        penalty_array = np.zeros(total_slots, dtype=np.float32)
        reward = surgery.reward
        (
            slack_earliest,
            slot_earliest,
            slot_latest,
            slack_latest,
        ) = self._calculate_boundaries(surgery)
        return piecewise_penalty(
            penalty_array,
            slack_earliest,
            slot_earliest,
            slot_latest,
            slack_latest,
            reward.R0,
            alpha=self.time_manager.slots_per_day,
            floor=-reward.floor * reward.R0,
        )


class SurgeryProfileBuilder:
    def __init__(
        self,
        data: FlatDataModel,
        time_manager: TimeManager,
        resource_manager: ResourceManager,
    ) -> None:
        self.surgeries = data.surgeries
        self.time_manager = time_manager
        self.resource_manager = resource_manager
        self._profiles: Dict[str, List[ProfileConfig]] = {}

    @property
    def count(self) -> int:
        return len(self.surgeries)

    @property
    def profiles(self) -> Dict[str, List[ProfileConfig]]:
        if not self._profiles:
            self.build()
        return self._profiles

    @property
    def id_to_index_mapping(self) -> Dict[str, int]:
        return {surgery.id: surgery.idx for surgery in self.surgeries}

    @property
    def resource_count(self) -> int:
        return self.resource_manager.count

    @property
    def search_space(self):
        """Provides search space metadata for metaheuristic algorithms."""
        search_space = {}
        for surgery_id in self._profiles:
            idx = self.id_to_index_mapping[surgery_id]
            modes = len(self._profiles[surgery_id])
            starts = [self._profiles[surgery_id][j].count for j in range(modes)]
            search_space[idx] = (idx, modes, starts)
        return search_space

    def build(self) -> None:
        self._profiles = {surgery.id: [] for surgery in self.surgeries}
        for surgery in self.surgeries:
            try:
                candidates, counts, probabilities, ranges = self._extract_requirements(
                    surgery
                )

                modes = self._compute_modes(candidates, surgery)
                for mode in modes:
                    profile = self._create_profile(mode, ranges, counts, probabilities)

                    is_feasible, feasible_starts, num_starts = self._check_feasibility(
                        profile
                    )

                    if is_feasible:
                        self._profiles[surgery.id].append(
                            ProfileConfig(
                                profile=profile,
                                starts=feasible_starts,
                                count=num_starts,
                                mode=mode,
                            )
                        )

            except Exception as exception:
                raise ValueError(
                    f"Failed to process surgery {surgery.id}: {str(exception)}"
                ) from exception

    def _extract_requirements(
        self, surgery
    ) -> Tuple[List[List[int]], List[int], List[float], List[List[int]]]:
        candidates, counts, probabilities, ranges = [], [], [], []

        for resource_requirement in surgery.resources:
            if resource_requirement.assigned:
                if (
                    resource_requirement.assigned
                    not in self.resource_manager.id_to_index_mapping
                ):
                    raise ValueError(
                        f"Unknown assigned resource: {resource_requirement.assigned}"
                    )
                candidates.append(
                    [
                        self.resource_manager.id_to_index_mapping[
                            resource_requirement.assigned
                        ]
                    ]
                )
            else:
                valid_candidates = []
                for candidate_id in resource_requirement.candidates:
                    if candidate_id in self.resource_manager.id_to_index_mapping:
                        valid_candidates.append(
                            self.resource_manager.id_to_index_mapping[candidate_id]
                        )

                if not valid_candidates:
                    message = (
                        f"No valid candidate resources found for requirement: "
                        f"{resource_requirement.role}"
                    )
                    raise ValueError(message)
                candidates.append(valid_candidates)

            counts.append(resource_requirement.count)
            probabilities.append(resource_requirement.probability)

            constrained_duration = self.time_manager.apply_horizon_cutoff(
                resource_requirement.duration
            )
            slots = self.time_manager.convert_duration_to_slots(constrained_duration)
            ranges.append(slots)

        return candidates, counts, probabilities, ranges

    def _compute_modes(self, candidates: List[List[int]], surgery) -> List[List[int]]:
        all_modes = [list(mode) for mode in product(*candidates)]
        identical_groups = self._group_identical_resources(surgery.resources)
        filtered_modes = []
        for mode in all_modes:
            filter_out = False
            for group in identical_groups:
                mode_indices = [
                    mode[i]
                    for i in range(len(mode))
                    if surgery.resources[i].idx in group
                ]
                if len(set(mode_indices)) > 1:
                    filter_out = True
                    break
            if not filter_out:
                filtered_modes.append(mode)
        return filtered_modes

    def _group_identical_resources(self, resources):
        identical_groups = []
        for resource in resources:
            if resource.identical_to:
                group = set([resource.idx] + resource.identical_to)
                if not any(
                    group <= existing_group for existing_group in identical_groups
                ):
                    identical_groups.append(group)
        return identical_groups

    def _create_profile(
        self,
        mode: List[int],
        ranges: List[List[int]],
        counts: List[int],
        probabilities: List[float],
    ) -> np.ndarray:
        total_slots = self.time_manager.calculate_max_slots_needed(ranges)
        if total_slots <= 0:
            return np.zeros((self.resource_manager.count, 1), dtype=float)

        profile = np.zeros((self.resource_manager.count, total_slots), dtype=float)

        for resource_idx, (start_slot, end_slot), count, probability in zip(
            mode, ranges, counts, probabilities
        ):
            if start_slot < end_slot <= total_slots:
                profile[resource_idx, start_slot:end_slot] += count * probability

        return profile

    def _check_feasibility(self, profile: np.ndarray) -> Tuple[bool, np.ndarray, int]:
        min_resources_needed = np.sum(profile > 0, axis=1).astype(np.float32)

        feasible_starts, num_starts = find_all_feasible_starts(
            self.resource_manager.profiles,
            profile,
            min_resources_needed,
            self.time_manager.horizon_operational_mask,
        )

        return num_starts > 0, feasible_starts, num_starts

    def _score_feasibility(self, profile: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        min_resources_needed = np.sum(profile > 0, axis=1).astype(np.float32)
        overall_scores, short_rows = score_all_starts(
            self.resource_manager.profiles,
            profile,
            min_resources_needed,
            self.time_manager.horizon_operational_mask,
        )
        return overall_scores, short_rows


class PackedSurgeryProfiles:
    def __init__(self, profile_builder: SurgeryProfileBuilder):
        self._profiles = profile_builder.profiles
        self._id_to_index_mapping = profile_builder.id_to_index_mapping
        total_surgeries = len(self._profiles)
        total_modes = sum(
            len(self._profiles[surgery_id]) for surgery_id in self._profiles
        )
        total_starts = sum(
            config.count
            for surgery_id in self._profiles
            for config in self._profiles[surgery_id]
        )
        total_width = sum(
            config.profile.shape[1]
            for surgery_id in self._profiles
            for config in self._profiles[surgery_id]
        )

        self.feasible_start_times = np.full(total_starts, -1, dtype=np.int64)
        self.mode_to_surgery_mapping = np.zeros(total_modes, dtype=np.int64)
        self.surgery_mode_offsets = np.zeros(total_surgeries + 1, dtype=np.int64)
        self.mode_column_offsets = np.zeros(total_modes + 1, dtype=np.int64)
        self.start_time_offsets = np.zeros(total_modes + 1, dtype=np.int64)
        self.packed_profiles = np.zeros((profile_builder.resource_count, total_width))

    def build(self):
        mode_cursor = 0
        width_cursor = 0
        starts_cursor = 0
        for surgery_id, profiles in self._profiles.items():
            idx = self._id_to_index_mapping[surgery_id]
            self.surgery_mode_offsets[idx] = mode_cursor
            for config in profiles:
                profile = config.profile
                starts = config.starts
                count = config.count

                width = profile.shape[1]

                self.mode_to_surgery_mapping[mode_cursor] = idx
                self.mode_column_offsets[mode_cursor] = width_cursor
                self.start_time_offsets[mode_cursor] = starts_cursor
                self.packed_profiles[:, width_cursor : width_cursor + width] = profile
                self.feasible_start_times[
                    starts_cursor : starts_cursor + count
                ] = starts[:count]

                width_cursor += width
                starts_cursor += count
                mode_cursor += 1
        self.surgery_mode_offsets[-1] = mode_cursor
        self.mode_column_offsets[-1] = width_cursor
        self.start_time_offsets[-1] = starts_cursor

    def get_mode_profile_with_feasible_starts(
        self, surgery_idx: int, mode_id: int, starts_idx: int
    ):
        return self._get_mode_profile_jit(
            self.packed_profiles,
            self.feasible_start_times,
            self.surgery_mode_offsets,
            self.mode_column_offsets,
            self.start_time_offsets,
            surgery_idx,
            mode_id,
            starts_idx,
        )

    @staticmethod
    @njit
    def _get_mode_profile_jit(
        packed_profiles,
        feasible_start_times,
        surgery_mode_offsets,
        mode_column_offsets,
        start_time_offsets,
        surgery_idx,
        mode_id,
        starts_idx,
    ):
        if surgery_idx < 0 or surgery_idx >= surgery_mode_offsets.shape[0] - 1:
            return packed_profiles[:, 0:0], feasible_start_times[0:0], 0

        n_modes = (
            surgery_mode_offsets[surgery_idx + 1] - surgery_mode_offsets[surgery_idx]
        )

        if mode_id < 0 or mode_id >= n_modes:
            return packed_profiles[:, 0:0], feasible_start_times[0:0], 0

        global_mode = surgery_mode_offsets[surgery_idx] + mode_id

        start_col = mode_column_offsets[global_mode]
        end_col = mode_column_offsets[global_mode + 1]
        profile = packed_profiles[:, start_col:end_col]

        start_idx = start_time_offsets[global_mode]
        end_idx = start_time_offsets[global_mode + 1]
        feasible_starts = feasible_start_times[start_idx + starts_idx : end_idx]

        return profile, feasible_starts, 1


class SurgeryManager:
    def __init__(
        self,
        data: FlatDataModel,
        time_manager: TimeManager,
        resource_manager: ResourceManager,
    ):
        self.surgeries = data.surgeries
        self.reward_calculator = SurgeryRewardCalculator(data, time_manager)
        self.profile_builder = SurgeryProfileBuilder(
            data, time_manager, resource_manager
        )
        self.packed_profiles = PackedSurgeryProfiles(self.profile_builder)
        self.time_manager = time_manager
        self.resource_manager = resource_manager
        self._count: Optional[int] = None
        self._profiles: Optional[Dict[str, List[ProfileConfig]]] = None
        self._id_to_index_mapping: Optional[Dict[str, int]] = None
        self._index_to_id_mapping: Optional[Dict[int, str]] = None
        self._search_space: Optional[Dict] = None
        self._is_built = False

    @property
    def count(self) -> int:
        if self._count is None:
            self._count = self.profile_builder.count
        return self._count

    @property
    def id_to_index_mapping(self) -> Dict[str, int]:
        if self._id_to_index_mapping is None:
            self._id_to_index_mapping = self.profile_builder.id_to_index_mapping
        return self._id_to_index_mapping

    @property
    def index_to_id_mapping(self) -> Dict[int, str]:
        if self._index_to_id_mapping is None:
            self._index_to_id_mapping = {
                idx: surgery_id for surgery_id, idx in self.id_to_index_mapping.items()
            }
        return self._index_to_id_mapping

    @property
    def profiles(self) -> Dict[str, List[ProfileConfig]]:
        if not self._is_built:
            self.build()
        return self._profiles

    @property
    def search_space(self) -> Dict:
        if self._search_space is None:
            self._search_space = self.profile_builder.search_space
        return self._search_space

    def get_mode_profile_with_feasible_starts(
        self, surgery_idx: int, mode_id: int, starts_idx: int
    ):
        return self.packed_profiles.get_mode_profile_with_feasible_starts(
            surgery_idx, mode_id, starts_idx
        )

    def reward(self, surgery_idx: int, slot: int) -> float:
        return self.reward_calculator.reward(surgery_idx, slot)

    def build(self) -> None:
        if self._is_built:
            return
        self.profile_builder.build()
        self.packed_profiles.build()
        self._profiles = self.profile_builder.profiles
        self._is_built = True


class InfeasibilityProfiler:
    def __init__(self, surgery_profile, data_manager):
        self.surgery_profile = surgery_profile
        self.data_manager = data_manager
        self.rid_to_role = {
            resource.rid: resource.role for resource in data_manager.resources
        }

    def _score_feasibility(self, profile):
        scores, short_rows = self.surgery_profile._score_feasibility(profile)
        return scores, short_rows

    def _extract_short_resource_roles(self, short_row_mask):
        row_indices = np.where(short_row_mask)[0].tolist()
        rids = [
            self.surgery_profile.resource_manager.index_to_id_mapping[i]
            for i in row_indices
        ]
        return [self.rid_to_role.get(rid, rid) for rid in rids]

    def _collect_feasible_entries(self, mode, ranges, counts, probabilities):
        profile = self.surgery_profile._create_profile(
            mode, ranges, counts, probabilities
        )
        scores, short_rows = self._score_feasibility(profile)

        entries = []
        for score_index, score in enumerate(scores):
            entries.append(
                {
                    "score": float(score),
                    "short_resources": self._extract_short_resource_roles(
                        short_rows[int(score_index)]
                    ),
                    "start_index": self.surgery_profile.time_manager.convert_slot_to_datetime(
                        int(score_index)
                    ).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )
        return entries

    def _top_feasible_entries(self, entries, top_n=5):
        if not entries:
            return []

        all_scores = np.array([entry["score"] for entry in entries], dtype=float)

        if np.any(all_scores == 1.0):
            first_idx = np.where(all_scores == 1.0)[0][0]
            del entries[first_idx]["score"]
            return [entries[first_idx]]

        top_n = min(top_n, len(all_scores))
        top_idx = np.argsort(all_scores)[-top_n:][::-1]
        for i in top_idx:
            del entries[i]["score"]
        return [entries[i] for i in top_idx]

    def build(self):
        report = {"feasibles": [], "infeasibles": []}
        for surgery in self.surgery_profile.surgeries:
            (
                candidates,
                counts,
                probabilities,
                ranges,
            ) = self.surgery_profile._extract_requirements(surgery)
            modes = self.surgery_profile._compute_modes(candidates, surgery)

            all_mode_entries = []
            for mode in modes:
                all_mode_entries.extend(
                    self._collect_feasible_entries(mode, ranges, counts, probabilities)
                )

            top_entries = self._top_feasible_entries(all_mode_entries, top_n=5)
            if all(len(entry["short_resources"]) == 0 for entry in top_entries):
                report["feasibles"].append(
                    {
                        "surgery_id": surgery.id,
                    }
                )
            else:
                report["infeasibles"].append(
                    {
                        "surgery_id": surgery.id,
                        "top_feasible_starts": top_entries,
                    }
                )

        return report
