# pylint: disable=too-many-public-methods
import math
from datetime import date, datetime, time, timedelta
from functools import cached_property
from typing import List, Union

import numpy as np
import pandas as pd

from planning.models.data import FlatDataModel


class TimeManager:

    HOURS_IN_DAY = 24
    MINUTES_IN_HOUR = 60
    MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR

    def __init__(self, data: FlatDataModel):
        self.resolution: int = data.resolution
        self.horizon: int = data.horizon
        self.execution_datetime: datetime = data.execution_datetime
        self.operation_start: time = data.operation_start
        self.operation_end: time = data.operation_end

        self.execution_date: date = self.execution_datetime.date()
        self.execution_time: time = self.execution_datetime.time()

    @cached_property
    def planning_start(self) -> datetime:
        return datetime.combine(self.execution_date, time.min)

    @cached_property
    def planning_end(self) -> datetime:
        return datetime.combine(
            self.execution_date + timedelta(days=self.horizon - 1), time.max
        )

    @cached_property
    def extended_planning_end(self) -> datetime:
        return datetime.combine(
            self.execution_date + timedelta(days=2 * self.horizon), time.max
        )

    @cached_property
    def cutoff_duration_minutes(self) -> int:
        return (self.horizon + 1) * self.MINUTES_IN_DAY

    @cached_property
    def slots_per_day(self) -> int:
        return self.MINUTES_IN_DAY // self.resolution

    @cached_property
    def total_extended_slots(self) -> int:
        duration = self.extended_planning_end - self.planning_start
        total_minutes = duration.total_seconds() / 60
        return int(total_minutes // self.resolution) + 1

    @cached_property
    def operational_start_slot(self) -> int:
        return self.convert_minutes_to_slots(
            self.convert_time_to_minutes(self.operation_start)
        )

    @cached_property
    def operational_end_slot(self) -> int:
        return self.convert_minutes_to_slots(
            self.convert_time_to_minutes(self.operation_end)
        )

    @cached_property
    def planning_time_index(self) -> pd.DatetimeIndex:
        return pd.date_range(
            self.planning_start, self.planning_end, freq=f"{self.resolution}min"
        )

    @cached_property
    def extended_planning_time_index(self) -> pd.DatetimeIndex:
        return pd.date_range(
            self.planning_start,
            self.extended_planning_end,
            freq=f"{self.resolution}min",
        )

    @cached_property
    def horizon_operational_mask(self) -> np.ndarray:
        total_slots = len(self.planning_time_index)
        mask = np.zeros(total_slots, dtype=bool)

        for idx, datetime_value in enumerate(self.planning_time_index):
            current_time = datetime_value.time()
            current_date = datetime_value.date()

            if current_date == self.execution_date:
                effective_start = max(self.execution_time, self.operation_start)
                if effective_start <= current_time < self.operation_end:
                    mask[idx] = True
            else:
                if self.operation_start <= current_time < self.operation_end:
                    mask[idx] = True
        return mask

    def convert_minutes_to_slots(self, minutes: int) -> int:
        return minutes // self.resolution

    def convert_slots_to_minutes(self, slots: int) -> int:
        return slots * self.resolution

    def convert_time_to_minutes(self, time_value: time) -> int:
        return time_value.hour * self.MINUTES_IN_HOUR + time_value.minute

    def convert_time_to_slots(self, time_value: time) -> int:
        return self.convert_minutes_to_slots(self.convert_time_to_minutes(time_value))

    def convert_datetime_to_slot_floor(self, datetime_value: datetime) -> int:
        time_diff = datetime_value - self.planning_start
        total_minutes = time_diff.total_seconds() / self.MINUTES_IN_HOUR
        slot_index = int(math.floor(total_minutes / self.resolution))

        if slot_index < 0 or slot_index >= self.total_extended_slots:
            raise ValueError(
                f"Datetime {datetime_value} maps to slot "
                f"{slot_index} which is out of range [0, {self.total_extended_slots})"
            )
        return slot_index

    def convert_datetime_to_slot_ceil(self, datetime_value: datetime) -> int:
        time_diff = datetime_value - self.planning_start
        total_minutes = time_diff.total_seconds() / self.MINUTES_IN_HOUR
        slot_index = int(math.ceil(total_minutes / self.resolution))
        if slot_index < 0 or slot_index > self.total_extended_slots:
            raise ValueError(
                f"Datetime {datetime_value} maps to ceil-slot "
                f"{slot_index} which is out of range [0, {self.total_extended_slots}]"
            )
        return slot_index

    def convert_slot_to_datetime(self, slot_index: int) -> datetime:
        if slot_index < 0 or slot_index >= self.total_extended_slots:
            raise ValueError(
                f"Slot index {slot_index} is out of valid range [0, {self.total_extended_slots})"
            )

        minutes = slot_index * self.resolution
        return self.planning_start + timedelta(minutes=minutes)

    def convert_duration_to_slots(self, duration_minutes: List[int]) -> List[int]:
        if len(duration_minutes) != 2:
            raise ValueError(
                f"Duration must contain exactly 2 elements [start, end], "
                f"got {len(duration_minutes)}"
            )
        start_minutes, end_minutes = duration_minutes
        return [
            self.convert_minutes_to_slots(start_minutes),
            self.convert_minutes_to_slots(end_minutes),
        ]

    def convert_datetime_range_to_slice(
        self, start_datetime: datetime, end_datetime: datetime
    ) -> slice:
        if end_datetime < start_datetime:
            raise ValueError(
                f"Invalid datetime range: start {start_datetime} is after end {end_datetime}"
            )

        start_slot = self.convert_datetime_to_slot_floor(start_datetime)
        end_slot_exclusive = self.convert_datetime_to_slot_ceil(end_datetime)
        return start_slot, end_slot_exclusive

    def is_operational_time(self, datetime_value: datetime) -> bool:
        current_time = datetime_value.time()
        current_date = datetime_value.date()

        if current_date == self.execution_date:
            effective_start = max(self.execution_time, self.operation_start)
            return effective_start <= current_time < self.operation_end

        return self.operation_start <= current_time < self.operation_end

    def apply_horizon_cutoff(self, duration_minutes: List[int]) -> List[int]:
        if len(duration_minutes) != 2:
            raise ValueError(
                f"Duration must contain exactly 2 elements [start, end], "
                f"got {len(duration_minutes)}"
            )
        start_minutes, end_minutes = duration_minutes
        return [start_minutes, min(self.cutoff_duration_minutes, end_minutes)]

    def calculate_max_slots_needed(self, slot_ranges: List[List[int]]) -> int:
        if not slot_ranges:
            return 0
        return max(max(slot_pair) for slot_pair in slot_ranges)

    def calculate_day_offset(
        self,
        target_date: Union[date, datetime],
        reference_date: Union[date, datetime] = None,
    ) -> int:
        if reference_date is None:
            reference_date = self.execution_date

        if isinstance(target_date, datetime):
            target_date = target_date.date()
        if isinstance(reference_date, datetime):
            reference_date = reference_date.date()

        return (target_date - reference_date).days

    def get_scheduling_boundaries(self) -> dict:
        return {
            "earliest_start": self.operational_start_slot,
            "latest_operational": (self.horizon - 1) * self.slots_per_day
            + self.operational_end_slot,
            "planning_deadline": self.horizon * self.slots_per_day,
            "extended_deadline": self.total_extended_slots,
        }
