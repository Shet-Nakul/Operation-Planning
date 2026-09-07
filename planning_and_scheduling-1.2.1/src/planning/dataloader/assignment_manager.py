from datetime import datetime

import numpy as np


class AssignmentProfileBuilder:
    def __init__(self, data_loader, scheduled):
        self.data_loader = data_loader
        self.scheduled = scheduled

        (
            self.pool_employee_index,
            self.pool_employee_index_name,
            self.rid_to_pool_id,
        ) = self._build_pool_employee_index()

        self.pool_index = {
            pool_id: idx for idx, pool_id in enumerate(sorted(self.pool_employee_index))
        }

        self.operation_index = {
            op.id: idx
            for idx, op in enumerate(sorted(self.scheduled, key=lambda op: op.id))
        }

        self.total_slots = len(self.data_loader.planning_time_index)

    def _build_rid_to_pool_id(self):
        return {
            resource.rid: resource.id
            for resource in self.data_loader.resources
            if resource.is_pool
        }

    def _collect_pool_employee_sets(self):
        pool_employee_sets = {}

        for resource in self.data_loader.resources:
            if not resource.is_pool:
                continue

            pool_id = resource.rid
            employees = pool_employee_sets.setdefault(pool_id, set())

            for availability in resource.availability:
                employees.update(availability.employee_ids or [])

        return pool_employee_sets

    def _build_pool_employee_index_name(self, pool_employee_sets):
        return {
            pool_id: {
                idx: employee_id for idx, employee_id in enumerate(sorted(employee_ids))
            }
            for pool_id, employee_ids in pool_employee_sets.items()
        }

    def _build_pool_employee_index(self):
        """Build a mapping: pool_id -> {employee_id: row_index}."""
        rid_to_pool_id = self._build_rid_to_pool_id()
        pool_employee_sets = self._collect_pool_employee_sets()
        pool_employee_index_name = self._build_pool_employee_index_name(
            pool_employee_sets
        )

        pool_employee_index = {
            pool_id: {employee_id: idx for idx, employee_id in index_to_name.items()}
            for pool_id, index_to_name in pool_employee_index_name.items()
        }

        return pool_employee_index, pool_employee_index_name, rid_to_pool_id

    def _build_operation_demand_profiles(self):
        """Build demand profiles per pool and operation."""
        profiles = {
            pool_id: {
                op.id: np.zeros(self.total_slots, dtype=int) for op in self.scheduled
            }
            for pool_id in self.pool_index
        }

        for op in self.scheduled:
            for assignment in op.resources_assigned:
                if assignment.count == 0 or assignment.assigned not in self.pool_index:
                    continue

                start, end = self.data_loader.convert_datetime_range_to_slice(
                    assignment.time_range[0][0],
                    assignment.time_range[0][1],
                )
                profiles[assignment.assigned][op.id][start:end] = assignment.count

        return profiles

    def _build_operation_demand_matrices(self, demand_profiles):
        """Convert operation demand profiles into matrices."""
        matrices = {}

        for pool_id, operation_profiles in demand_profiles.items():
            matrix = np.zeros(
                (len(operation_profiles), self.total_slots),
                dtype=int,
            )

            for op_id, row in self.operation_index.items():
                matrix[row] = operation_profiles[op_id]

            matrices[pool_id] = matrix

        return matrices

    def _build_employee_availability_profiles(self):
        """Build availability profiles per employee within each pool."""
        profiles = {}

        for resource in self.data_loader.resources:
            if not resource.is_pool:
                continue

            pool_profiles = profiles.setdefault(resource.rid, {})

            for employee_id in self.pool_employee_index[resource.rid]:
                pool_profiles.setdefault(
                    employee_id,
                    np.zeros(self.total_slots, dtype=int),
                )

            for availability in resource.availability:
                for employee_id in availability.employee_ids or []:
                    for start_time, end_time in availability.normal_hours:

                        start, end = self.data_loader.convert_datetime_range_to_slice(
                            datetime.combine(availability.date, start_time),
                            datetime.combine(availability.date, end_time),
                        )

                        pool_profiles[employee_id][start : end + 1] = 1

        return profiles

    def _build_employee_availability_matrices(self, availability_profiles):
        """Convert employee availability profiles into matrices."""
        matrices = {}

        for pool_id, employee_profiles in availability_profiles.items():
            matrix = np.zeros(
                (len(employee_profiles), self.total_slots),
                dtype=int,
            )

            for employee_id, row in self.pool_employee_index[pool_id].items():
                matrix[row] = employee_profiles[employee_id]

            matrices[pool_id] = matrix

        return matrices

    def build(self):
        operation_demand_profiles = self._build_operation_demand_profiles()
        employee_availability_profiles = self._build_employee_availability_profiles()

        operation_demand_matrices = self._build_operation_demand_matrices(
            operation_demand_profiles
        )
        employee_availability_matrices = self._build_employee_availability_matrices(
            employee_availability_profiles
        )

        return (
            operation_demand_profiles,
            employee_availability_profiles,
            operation_demand_matrices,
            employee_availability_matrices,
        )

    def convert_slot_to_datetime(self, slot):
        """Convert a slot index to a datetime object."""
        return self.data_loader.convert_slot_to_datetime(slot)
