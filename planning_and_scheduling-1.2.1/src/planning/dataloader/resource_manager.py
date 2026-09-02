from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np

from planning.dataloader.time_manager import TimeManager
from planning.models.data import FlatDataModel


class ResourceManager:
    PATIENT_FLOW_RESOURCE_ID = "patient_flow"
    PATIENT_FLOW_INDEX = 0
    DEFAULT_DUMMY_CAPACITY = 20.0
    NORMAL_HOURS_PROFILE = 0
    EXTENDED_HOURS_PROFILE = 1

    def __init__(self, data: FlatDataModel, time_manager: TimeManager):
        if not isinstance(time_manager, TimeManager):
            raise TypeError("time_manager must be an instance of TimeManager")
        self.resources = data.resources
        self.time_manager = time_manager
        self._count = data.number_of_resources + 1
        self._profiles: Optional[np.ndarray] = None
        self._is_built = False

    @property
    def count(self) -> int:
        return self._count

    @property
    def profiles(self) -> np.ndarray:
        if not self._is_built:
            self.build()
        return self._profiles

    @property
    def ids(self) -> List[str]:
        return [self.PATIENT_FLOW_RESOURCE_ID] + [res.rid for res in self.resources]

    @property
    def id_to_index_mapping(self) -> Dict[str, int]:
        mapping = {self.PATIENT_FLOW_RESOURCE_ID: self.PATIENT_FLOW_INDEX}
        mapping.update({res.rid: res.idx for res in self.resources})
        return mapping

    @property
    def index_to_id_mapping(self) -> Dict[int, str]:
        mapping = {self.PATIENT_FLOW_INDEX: self.PATIENT_FLOW_RESOURCE_ID}
        mapping.update({res.idx: res.rid for res in self.resources})
        return mapping

    @property
    def shape(self) -> Tuple[int, int, int]:
        return (self._count, 2, self.time_manager.total_extended_slots)

    def build(self, flow_capacity: float = DEFAULT_DUMMY_CAPACITY) -> None:
        self._initialize()
        self._set_patient_flow_capacity(flow_capacity)

        for resource in self.resources:
            for availability in resource.availability:

                self._process_time_slots(
                    resource.idx,
                    availability.capacity,
                    availability.date,
                    availability.normal_hours,
                    self.NORMAL_HOURS_PROFILE,
                )

                self._process_time_slots(
                    resource.idx,
                    availability.capacity,
                    availability.date,
                    availability.extended_hours,
                    self.EXTENDED_HOURS_PROFILE,
                )

        self._is_built = True

    def _initialize(self) -> None:
        if self._profiles is None:
            self._profiles = np.zeros(self.shape, dtype=np.float32)

    def _set_patient_flow_capacity(
        self, capacity: float = DEFAULT_DUMMY_CAPACITY
    ) -> None:
        self._initialize()
        self._profiles[self.PATIENT_FLOW_INDEX, self.NORMAL_HOURS_PROFILE, :] = capacity

    def _process_time_slots(
        self,
        index: int,
        capacity: int,
        date: datetime.date,
        time_ranges: List[List[datetime.time]],
        profile_type: int,
    ) -> None:
        if not time_ranges:
            return

        for time_range in time_ranges:
            if len(time_range) != 2:
                print(
                    f"Warning: Invalid time range format for resource {index}: {time_range}"
                )
                continue

            start_datetime = datetime.combine(date, time_range[0])
            end_datetime = datetime.combine(date, time_range[1])

            try:
                (
                    start_slot,
                    end_slot_exclusive,
                ) = self.time_manager.convert_datetime_range_to_slice(
                    start_datetime, end_datetime
                )
                self._profiles[
                    index, profile_type, start_slot : end_slot_exclusive + 1
                ] = capacity
            except (ValueError, IndexError) as exception:
                print(
                    f" Failed to set availability for resource {index} on {date}: {exception}"
                )
