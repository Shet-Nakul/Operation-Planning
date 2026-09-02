import re
from collections import defaultdict
from copy import deepcopy
from datetime import date, timedelta

import pandas as pd

from planning.dataloader.resource_manager import ResourceManager
from planning.dataloader.schedule_manager import ScheduleManager
from planning.dataloader.surgery_manager import SurgeryManager
from planning.dataloader.time_manager import TimeManager
from planning.models.data import (
    DayOfWeek,
    FlatDataModel,
    HoursAssignment,
    RawDataModel,
    RawResource,
    Resource,
    ShiftAssignment,
)


class DataManager:
    def __init__(self, data: FlatDataModel, time_manager: TimeManager):
        self.time_manager = time_manager
        self.resource_manager = ResourceManager(data, self.time_manager)
        self.surgery_manager = SurgeryManager(
            data, self.time_manager, self.resource_manager
        )
        self.schedule_manager = ScheduleManager(
            self.time_manager, self.resource_manager, self.surgery_manager
        )
        self.build()

    @property
    def resources_profiles(self):
        return self.resource_manager.profiles

    @property
    def surgery_id_to_index_mapping(self):
        return self.surgery_manager.id_to_index_mapping

    @property
    def surgery_index_to_id_mapping(self):
        return self.surgery_manager.index_to_id_mapping

    @property
    def resource_id_to_index_mapping(self):
        return self.resource_manager.id_to_index_mapping

    @property
    def resources(self):
        return self.resource_manager.resources

    @property
    def feasibility(self):
        return self.surgery_manager.profiles

    @property
    def planning_time_index(self):
        return self.time_manager.planning_time_index

    def convert_datetime_range_to_slice(self, start_datetime, end_datetime):
        return self.time_manager.convert_datetime_range_to_slice(
            start_datetime, end_datetime
        )

    def convert_slot_to_datetime(self, slot):
        """Convert a slot index to a datetime object."""
        return self.time_manager.convert_slot_to_datetime(slot)

    def get_mode_profile_with_feasible_starts(self, surgery_id, mode_id, starts_idx):
        return self.surgery_manager.get_mode_profile_with_feasible_starts(
            surgery_id, mode_id, starts_idx
        )

    def reward(self, surgery_idx, time_slot):
        return self.surgery_manager.reward(surgery_idx, time_slot)

    @property
    def search_space(self):
        return self.surgery_manager.search_space

    def build(self):
        self.resource_manager.build()
        self.surgery_manager.build()

    def build_schedule(self, best_solution):
        return self.schedule_manager.build_schedule(best_solution)

    @property
    def idx_to_id_mapping(self):
        """Legacy property for backward compatibility"""
        return self.surgery_index_to_id_mapping


class DataProcessor:
    def __init__(self, data: RawDataModel, time_handler: TimeManager):
        self.data = data
        self.time_handler = time_handler
        self.resolution = self.data.resolution
        self.reference_index = self.time_handler.extended_planning_time_index

    def _rid_key(self, value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")

    def assigned_resources(self) -> set[tuple[str, str]]:
        assigned_resources = []
        for surgery in self.data.surgeries:
            for _, stage_requirements in surgery.stages:
                for requirement in stage_requirements:
                    if requirement.assigned:
                        assigned_resources.append(
                            (requirement.assigned, requirement.role)
                        )
        return set(assigned_resources)

    def _infer_schedule_type(self, resource: RawResource) -> str:
        schedule_keys = []
        for member_schedule in resource.availability.members.values():
            schedule_keys.extend(member_schedule.keys())

        purely_weekly_based = all(isinstance(k, DayOfWeek) for k in schedule_keys)
        purely_daily_based = all(isinstance(k, date) for k in schedule_keys)

        if purely_weekly_based and not purely_daily_based:
            return "weekly"
        if purely_daily_based and not purely_weekly_based:
            return "daily"
        raise ValueError(
            f"Resource {resource.id} has mixed or unsupported schedule keys: {schedule_keys}"
        )

    def _normalize_resources_to_daily(self) -> list[RawResource]:
        normalized = []
        for resource in self.data.resources:
            schedule_type = self._infer_schedule_type(resource)
            if schedule_type == "daily":
                normalized.append(resource)
                continue

            temp_resource = deepcopy(resource.model_dump())
            for member, weekly_schedule in resource.availability.members.items():
                new_weekly_schedule = {}
                for i in range(self.data.horizon * 2 + 1):
                    current_date = self.data.execution_datetime.date() + timedelta(
                        days=i
                    )
                    weekday = current_date.strftime("%A").lower()
                    new_weekly_schedule[current_date] = weekly_schedule[weekday]
                temp_resource["availability"]["members"][member] = new_weekly_schedule
            normalized.append(RawResource(**temp_resource))

        return normalized

    def _build_shift_map(self, resources: list[RawResource]) -> dict[str, set[str]]:
        shift_in_pool = {}
        for resource in resources:
            all_schedule = []
            for member_schedule in resource.availability.members.values():
                for day_schedule in member_schedule.values():
                    if isinstance(day_schedule, list):
                        all_schedule.extend(day_schedule)
                    elif day_schedule is not None:
                        all_schedule.append(day_schedule)

            purely_shift_based = all(
                isinstance(s, ShiftAssignment) for s in all_schedule
            )
            purely_hour_based = all(
                isinstance(s, HoursAssignment) for s in all_schedule
            )

            if purely_shift_based and not purely_hour_based:
                shifts = set()
                for s in all_schedule:
                    if isinstance(s.shift, list):
                        shifts.update(s.shift)
                    else:
                        shifts.add(s.shift)
                shift_in_pool[resource.id] = shifts

        return shift_in_pool

    def _flatten_pool_resource(
        self, resource: RawResource, shifts: set[str]
    ) -> list[RawResource]:
        flattened = []
        for shift in shifts:
            resource_data = deepcopy(resource.model_dump())
            resource_data["rid"] = self._rid_key(
                f"{resource.role}-{shift}-{resource.id}"
            )
            new_availability = deepcopy(resource.availability.model_dump())

            for member, daily_schedule in resource.availability.members.items():
                new_daily_schedule = {}
                for current_date, shift_resources in daily_schedule.items():
                    if shift == shift_resources.shift[0]:
                        new_daily_schedule[current_date] = {
                            "hours": self.data.shift_definitions[
                                shift_resources.shift[0]
                            ]
                        }
                if new_daily_schedule:
                    new_availability["members"][member] = new_daily_schedule
                else:
                    del new_availability["members"][member]

            resource_data["availability"] = new_availability
            flattened.append(RawResource(**resource_data))

        return flattened

    def _flatten_individual_resource(self, resource: Resource) -> Resource:
        resource_data = deepcopy(resource.model_dump())
        resource_data["rid"] = self._rid_key(f"{resource.role}-{resource.id}")
        new_availability = deepcopy(resource.availability.model_dump())

        for member, daily_schedule in resource.availability.members.items():
            new_daily_schedule = {}
            for current_date, shift_resources in daily_schedule.items():
                hours = self.data.shift_definitions[shift_resources.shift[0]]
                if hours:
                    new_daily_schedule[current_date] = {"hours": hours}
            if new_daily_schedule:
                new_availability["members"][member] = new_daily_schedule
            else:
                del new_availability["members"][member]

        resource_data["availability"] = new_availability
        return RawResource(**resource_data)

    def normalize(self) -> list[RawResource]:
        daily_resources = self._normalize_resources_to_daily()
        shift_in_pool = self._build_shift_map(daily_resources)
        flattened = []

        for resource in daily_resources:
            if resource.resource_type == "individual":
                continue
            if resource.id not in shift_in_pool:
                resource.rid = self._rid_key(f"{resource.role}-{resource.id}")
                flattened.append(resource)
                continue
            flattened.extend(
                self._flatten_pool_resource(resource, shift_in_pool[resource.id])
            )

        for resource in daily_resources:
            if resource.resource_type == "pool":
                continue
            if resource.id not in shift_in_pool:
                resource.rid = self._rid_key(f"{resource.role}-{resource.id}")
                flattened.append(resource)
                continue
            flattened.append(self._flatten_individual_resource(resource))

        return flattened

    def find_blocks(self, load_index):
        by_date = defaultdict(list)
        for ts, val in load_index.items():
            date_key = ts.date()
            by_date[date_key].append((ts, frozenset(val)))

        all_blocks = []
        for date_key, items in by_date.items():
            items.sort()
            current = None
            start = None
            prev = None

            for ts, val in items:
                if current is None:
                    current = val
                    start = ts
                    prev = ts
                    continue

                if val != current:
                    all_blocks.append((current, date_key, start, prev))
                    current = val
                    start = ts

                prev = ts
            if current is not None:
                all_blocks.append((current, date_key, start, prev))
        return [b for b in all_blocks if b[0]]

    def add_member_time_window(self, load_per_time_index, date, time_ranges, member):
        for start_time, end_time in time_ranges:
            start_datetime = pd.to_datetime(f"{date} {start_time}")
            end_datetime = pd.to_datetime(f"{date} {end_time}")
            for time in load_per_time_index:
                if time >= start_datetime and time < end_datetime:
                    load_per_time_index[time].add(member)
        return load_per_time_index

    def apply_pool_reservations(self, load_per_time_index, reservations):
        for reservation in reservations:
            delete_times = pd.date_range(
                reservation.start, reservation.end, freq="{}min".format(self.resolution)
            ).tolist()
            for time in delete_times:
                if time in load_per_time_index:
                    load_per_time_index[time].discard(reservation.member_id)
        return load_per_time_index

    def flatten(self, normalized_resources) -> dict:
        flat_resources = {}

        for resource in normalized_resources:
            load_per_time_index = {time: set() for time in self.reference_index}
            for member, daily_schedule in resource.availability.members.items():
                for current_date, shift_resources in daily_schedule.items():
                    self.add_member_time_window(
                        load_per_time_index, current_date, shift_resources.hours, member
                    )
            self.apply_pool_reservations(load_per_time_index, resource.reservations)
            blocks = self.find_blocks(load_per_time_index)
            flat_resources[resource.rid] = {
                "id": resource.id,
                "rid": resource.rid,
                "role": resource.role,
                "is_pool": resource.resource_type == "pool",
                "availability": [
                    {
                        "date": block[1].strftime("%Y-%m-%d"),
                        "capacity": len(block[0]),
                        "employee_ids": list(block[0]),
                        "in_pool": None,
                        "normal_hours": [
                            (
                                block[2].time().strftime("%H:%M"),
                                block[3].time().strftime("%H:%M"),
                            )
                        ],
                    }
                    for block in blocks
                ],
            }
        return flat_resources

    def extract_special(self, new_flat_resources):
        assigned_resources = {}
        for assigned_resource_id, assigned_role in self.assigned_resources():
            rid = self._rid_key(f"{assigned_role}-{assigned_resource_id}")
            availability = []
            for flat_resource in new_flat_resources.values():
                if not flat_resource["is_pool"]:
                    continue
                for a in flat_resource["availability"]:
                    if assigned_resource_id in a["employee_ids"]:
                        a_ = deepcopy(a)
                        a_["in_pool"] = flat_resource["rid"]
                        a_["employee_ids"] = [assigned_resource_id]
                        a_["capacity"] = 1
                        availability.append(a_)
                        a["employee_ids"].remove(assigned_resource_id)
                        a["capacity"] -= 1
            if availability:
                assigned_resources[rid] = {
                    "id": assigned_resource_id,
                    "rid": rid,
                    "role": assigned_role,
                    "is_pool": False,
                    "availability": availability,
                }
        new_flat_resources.update(assigned_resources)
        return new_flat_resources

    def flatten_resources(self) -> list:
        flat_resources = self.normalize()
        flat_resources = self.flatten(flat_resources)
        flat_resources = self.extract_special(flat_resources)
        return list(flat_resources.values())

    def _flatten_assigned_resources(self, flat_resources) -> list:
        for surgery in self.data.surgeries:
            for _, stage_requirements in surgery.stages:
                for requirement in stage_requirements:
                    if requirement.assigned:
                        assigned_resource = next(
                            (
                                resource
                                for resource in flat_resources
                                if resource["id"] == requirement.assigned
                                and resource["role"] == requirement.role
                            ),
                            None,
                        )
                        if assigned_resource:
                            requirement.assigned = assigned_resource["rid"]
        return [surgery.model_dump() for surgery in self.data.surgeries]

    def _get_resource_candidates(self, resources) -> dict[str, list[str]]:
        candidates: dict[str, list[str]] = {}
        for resource in resources:
            candidates.setdefault(resource["role"], []).append(resource["rid"])
        return candidates

    def _operation_duration(self, surgery: dict) -> int:
        stages = surgery.get("stages", {})
        duration = 0
        for stage, stage_resources in stages.items():
            if stage == "operative":
                for r in stage_resources:
                    if r["role"] == "operation_room":
                        duration = r["duration"][1] - r["duration"][0]
        return duration

    def _flatten_surgery_resources(self, surgery: dict) -> list[dict]:
        patient_flow_resource = {
            "role": "patient_total_time",
            "assigned": "patient_flow",
            "candidates": None,
            "count": 1,
            "duration": surgery.get("duration", [0, 0]),
            "probability": 1.0,
        }
        flattened: list[dict] = [patient_flow_resource]
        max_duration = 0
        for stage, stage_resources in surgery.get("stages", {}).items():
            for r in stage_resources:
                item = dict(r)
                item["stage_type"] = stage
                max_duration = max(max_duration, item["duration"][1])
                flattened.append(item)

        if max_duration > patient_flow_resource["duration"][1]:
            flattened[0]["duration"][1] = max_duration
        return flattened

    def _add_idx_identicals_and_candidates(
        self,
        flattened: list[dict],
        resource_candidates: dict[str, list[str]],
    ) -> list[dict]:
        for i, r in enumerate(flattened):
            r["idx"] = i
            r["identical_to"] = []

        by_role: dict[str, list[int]] = {}
        for r in flattened:
            by_role.setdefault(r["role"], []).append(r["idx"])

        for r in flattened:
            same_role_ids = by_role.get(r["role"], [])
            r["identical_to"] = [idx for idx in same_role_ids if idx != r["idx"]]
            if r.get("assigned") is None:
                r["candidates"] = resource_candidates.get(r["role"], [])

        return flattened

    def flatten_surgeries(self, flat_resources) -> list:
        flattened_surgeries = self._flatten_assigned_resources(flat_resources)
        resource_candidates = self._get_resource_candidates(flat_resources)

        for s_idx, surgery in enumerate(flattened_surgeries):
            surgery["idx"] = s_idx
            surgery["operation_duration"] = self._operation_duration(surgery)
            flattened = self._flatten_surgery_resources(surgery)
            surgery["resources"] = self._add_idx_identicals_and_candidates(
                flattened,
                resource_candidates,
            )
        return flattened_surgeries

    def filter_unused_roles(self, flat_resources, surgeries) -> list:
        used_role = set()
        for surgery in surgeries:
            for resource in surgery["resources"]:
                used_role.add(resource["role"])

        filtered_resources = [
            resource for resource in flat_resources if resource["role"] in used_role
        ]
        return filtered_resources

    def flatten_data(self) -> dict:
        flat_resources = self.flatten_resources()
        flat_surgeries = self.flatten_surgeries(flat_resources)
        flat_resources = self.filter_unused_roles(flat_resources, flat_surgeries)
        return {
            "horizon": self.data.horizon,
            "resolution": self.data.resolution,
            "operation_start": self.data.operation_start,
            "operation_end": self.data.operation_end,
            "execution_datetime": self.data.execution_datetime,
            "shift_definitions": self.data.shift_definitions,
            "resources": flat_resources,
            "surgeries": flat_surgeries,
        }
