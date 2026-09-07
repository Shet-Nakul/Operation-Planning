# pylint: disable= too-many-locals
import numpy as np

from planning.dataloader.resource_manager import ResourceManager
from planning.dataloader.surgery_manager import SurgeryManager
from planning.dataloader.time_manager import TimeManager
from planning.dependencies.allocators import allocate_dense_resources_first_fit
from planning.models.data import (
    Dropped,
    Infeasible,
    PlanningResult,
    ResourceAllocated,
    Scheduled,
)


class ScheduleManager:
    def __init__(
        self,
        time_manager: TimeManager,
        resource_manager: ResourceManager,
        surgery_manager: SurgeryManager,
    ):
        self.time_manager = time_manager
        self.resource_manager = resource_manager
        self.surgery_manager = surgery_manager
        self.resource_index_to_id_mapping = {
            idx: rid for rid, idx in resource_manager.id_to_index_mapping.items()
        }

    def _get_surgery_by_id(self, surgery_id):
        return next(
            (
                surgery
                for surgery in self.surgery_manager.surgeries
                if surgery.id == surgery_id
            ),
            None,
        )

    def _create_resource_allocations(self, surgery, resource_ids, start_slot):
        resource_allocations = []
        resource_names = [
            self.resource_index_to_id_mapping[resource_index]
            for resource_index in resource_ids
        ]

        for requirement, resource_name in zip(surgery.resources, resource_names):
            slots_offset = [
                start_slot + s
                for s in self.time_manager.convert_duration_to_slots(
                    requirement.duration
                )
            ]
            resource_allocations.append(
                ResourceAllocated(
                    role=requirement.role,
                    assigned=resource_name,
                    probability=requirement.probability,
                    count=requirement.count,
                    stage_type=requirement.stage_type,
                    time_range=[
                        (
                            self.time_manager.convert_slot_to_datetime(slots_offset[0]),
                            self.time_manager.convert_slot_to_datetime(slots_offset[1]),
                        )
                    ],
                )
            )
        return resource_allocations

    def _process_solution_task(
        self, surgery_index, mode_index, start_index, resources_profiles
    ):
        (
            profile,
            allowed_starts,
            _,
        ) = self.surgery_manager.get_mode_profile_with_feasible_starts(
            surgery_index, mode_index, start_index
        )
        min_req = np.sum(profile > 0, axis=1).astype(np.int32)
        (
            start_slot,
            end_slot,
            is_scheduled,
            allocation,
        ) = allocate_dense_resources_first_fit(
            resources_profiles, profile, min_req, allowed_starts
        )

        surgery_id = self.surgery_manager.index_to_id_mapping[surgery_index]
        surgery = self._get_surgery_by_id(surgery_id)

        if not is_scheduled:
            return Dropped(id=surgery.id, type=surgery.type), None

        resources_profiles[:, :, start_slot : end_slot + 1] -= allocation
        resource_ids = self.surgery_manager.profiles[surgery_id][mode_index].mode
        start_time = self.time_manager.convert_slot_to_datetime(start_slot)
        resource_allocations = self._create_resource_allocations(
            surgery, resource_ids, start_slot
        )

        scheduled_surgery = Scheduled(
            id=surgery.id,
            type=surgery.type,
            scheduled_time=start_time,
            resources_assigned=resource_allocations,
        )

        return None, scheduled_surgery

    def _find_infeasible_surgeries(self):
        infeasible = []
        for surgery_id in self.surgery_manager.profiles:
            if not self.surgery_manager.profiles[surgery_id]:
                surgery = self._get_surgery_by_id(surgery_id)
                infeasible.append(Infeasible(id=surgery.id, type=surgery.type))
        return infeasible

    def build_schedule(self, best_solution):
        resources_profiles = self.resource_manager.profiles.copy()
        scheduled_surgeries = []
        dropped_surgeries = []

        for surgery_index, mode_index, start_index in best_solution:
            dropped_surgery, scheduled_surgery = self._process_solution_task(
                surgery_index, mode_index, start_index, resources_profiles
            )

            if dropped_surgery:
                dropped_surgeries.append(dropped_surgery)
            else:
                scheduled_surgeries.append(scheduled_surgery)

        infeasible_surgeries = self._find_infeasible_surgeries()
        return PlanningResult(
            scheduled=scheduled_surgeries,
            dropped=dropped_surgeries,
            infeasible=infeasible_surgeries,
        )
