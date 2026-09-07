from __future__ import annotations

import re
from datetime import date, datetime, time, timedelta
from enum import Enum
from typing import Annotated, Any, Dict, List, Literal, Optional

import numpy as np
from annotated_types import Ge, Le, Len
from pydantic import (
    BaseModel,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

TimeStr = Annotated[
    str, StringConstraints(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d|24:00$")
]
TimeRange = Annotated[list[TimeStr], Len(2, 2)]
DurationRange = Annotated[list[int], Len(2, 2)]
Probability = Annotated[float, Ge(0.0), Le(1.0)]


class TimeManager(BaseModel):
    execution_datetime: datetime
    operation_start: time = Field(time(8, 0))
    operation_end: time = Field(time(18, 0))
    resolution: int = Field(15)
    horizon: int = Field(3, gt=0, multiple_of=1, lt=4)

    @field_validator("operation_start", "operation_end", mode="before")
    def parse_operation_time(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%H:%M").time()
            except ValueError as exception:
                raise ValueError(f"Time must be in HH:MM format: {v}") from exception
        elif isinstance(v, time):
            return v
        else:
            raise ValueError(f"Invalid time format: {v}")

    @field_validator("resolution", mode="before")
    def validate_resolution(cls, v):
        if isinstance(v, int) and v > 0:
            if 1440 % v != 0:
                raise ValueError(f"Resolution must divide 1440: {v}")
            return v
        raise ValueError(f"Resolution must be a positive integer: {v}")


REWARD_DEFAULTS: dict[str, dict[str, float | int]] = {
    "mandatory": {
        "R0": 5,
        "lateness_slack_days": 1,
        "earliness_slack_days": 0,
        "p": 0.6,
    },
    "emergency": {
        "R0": 10,
        "lateness_slack_days": 0,
        "earliness_slack_days": 0,
        "p": 1.0,
    },
    "elective": {
        "R0": 1,
        "lateness_slack_days": 3,
        "earliness_slack_days": 2,
        "p": 0.2,
    },
}


class Reward(BaseModel):
    R0: float
    lateness_slack_days: int
    earliness_slack_days: int
    p: Probability
    floor: float = Field(default=3)


class Reservation(BaseModel):
    member_id: str
    start: datetime
    end: datetime
    reservation_type: Literal["patient", "maintenance", "holiday"]


class TimeWindows(BaseModel):
    earliest_date: datetime
    latest_date: datetime
    planned_start: datetime | None = None
    planned_by: datetime | None = None


class RequirementRaw(BaseModel):
    role: str
    idx: Optional[int] = None
    identical_to: Optional[list[int]] = None
    assigned: str | None = None
    candidates: Optional[list[str]] = None
    count: int
    duration: DurationRange
    probability: Probability | None = None
    stage_type: Optional[str] = None

    @model_validator(mode="after")
    def normalize_probability(self):
        if self.probability is None:
            self.probability = 1.0
        return self


class RequirementFlat(BaseModel):
    role: str
    idx: Optional[int] = Field(default=None)
    identical_to: Optional[list[int]] = Field(default=None)
    assigned: Optional[str] = Field(default=None)
    candidates: Optional[list[str]] = Field(default=None)
    count: int
    duration: list[int]
    probability: float = Field(default=1.0)
    stage_type: Optional[str] = Field(default=None)

    @field_validator("probability", mode="before")
    @classmethod
    def normalize_probability(cls, value):
        if value is None:
            return 1.0
        return value


class Stages(BaseModel):
    pre_op: list[RequirementRaw]
    operative: list[RequirementRaw]
    post_op: list[RequirementRaw]
    sterilization: list[RequirementRaw]
    recovery: list[RequirementRaw]


class Surgery(BaseModel):
    id: str
    type: Literal["mandatory", "emergency", "elective"]
    infection_type: int
    time_windows: TimeWindows
    reward: Reward
    idx: Optional[int] = Field(default=None)
    operation_duration: Optional[int] = Field(default=None)

    @model_validator(mode="before")
    @classmethod
    def validate_resources(cls, values):
        resources = values.get("resources", [])
        resources.sort(key=lambda r: r.get("idx", 10**9))
        values["resources"] = resources
        return values

    @model_validator(mode="before")
    @classmethod
    def normalize_type_and_reward(cls, data: Any):
        if "type" in data:
            surgery_type = data["type"]
            if surgery_type not in REWARD_DEFAULTS:
                raise ValueError(f"Invalid surgery type: {surgery_type}")
            reward_defaults = REWARD_DEFAULTS[surgery_type]
            if "reward" not in data:
                data["reward"] = reward_defaults
            else:
                for key, default_value in reward_defaults.items():
                    if key not in data["reward"]:
                        data["reward"][key] = default_value
        return data


class RawSurgery(Surgery):
    stages: Stages


class FlatSurgery(Surgery):
    resources: list[RequirementFlat]


class ShiftAssignment(BaseModel):
    shift: List[str]


class HoursAssignment(BaseModel):
    hours: List[List[str]]


class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


shift_based_availability = Dict[str, Dict[DayOfWeek | date, ShiftAssignment]]
hours_based_availability = Dict[str, Dict[DayOfWeek | date, HoursAssignment]]


class AvailabilityRaw(BaseModel):
    members: shift_based_availability | hours_based_availability


class AvailabilityFlat(BaseModel):
    date: date
    in_pool: Optional[str | bool] = Field(default=None)
    capacity: int = Field(ge=0)
    normal_hours: list[list[time]] = Field(default_factory=list)
    extended_hours: list[list[time]] = Field(default_factory=list)
    employee_ids: Optional[list[str]] = Field(default=None)


class Resource(BaseModel):
    id: str
    rid: str | None = None
    role: str


class RawResource(Resource):
    resource_type: Literal["pool", "individual"]
    availability: AvailabilityRaw
    reservations: List[Reservation] = Field(default_factory=list)


class FlatResource(Resource):
    is_pool: bool
    availability: list[AvailabilityFlat]
    idx: Optional[int] = Field(default=None)


class DataModel(BaseModel):
    horizon: int = Field(3, gt=0, multiple_of=1, lt=4)
    resolution: int = Field(15)
    operation_start: time = Field(time(8, 0))
    operation_end: time = Field(time(18, 0))
    execution_datetime: datetime
    shift_definitions: dict[str, list[TimeRange]]
    dates: Optional[list[date]] = None

    @model_validator(mode="after")
    def generate_dates(self):
        self.dates = [
            self.execution_datetime.date() + timedelta(days=i)
            for i in range(self.horizon * 2 + 1)
        ]
        return self

    @field_validator("operation_start", "operation_end", mode="before")
    def parse_operation_time(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%H:%M").time()
            except ValueError as exception:
                raise ValueError(f"Time must be in HH:MM format: {v}") from exception
        elif isinstance(v, time):
            return v
        else:
            raise ValueError(f"Invalid time format: {v}")

    @field_validator("resolution", mode="before")
    def validate_resolution(cls, v):
        if isinstance(v, int) and v > 0:
            if 1440 % v != 0:
                raise ValueError(f"Resolution must divide 1440: {v}")
            return v
        raise ValueError(f"Resolution must be a positive integer: {v}")


class RawDataModel(DataModel):
    resources: List[RawResource]
    surgeries: list[RawSurgery]

    @model_validator(mode="before")
    @classmethod
    def drop_empty_shift_assignments(cls, values: dict):
        resources = values.get("resources") or []

        for resource in resources:
            availability = (
                resource.get("availability") if isinstance(resource, dict) else None
            )
            members = (
                availability.get("members") if isinstance(availability, dict) else None
            )
            if not isinstance(members, dict):
                continue

            for member, day_map in list(members.items()):
                if not isinstance(day_map, dict):
                    continue

                filtered_day_map = {}
                for day_key, assignment in day_map.items():
                    if isinstance(assignment, dict) and "shift" in assignment:
                        shift_values = assignment.get("shift")
                        if isinstance(shift_values, list) and len(shift_values) == 0:
                            continue
                    filtered_day_map[day_key] = assignment

                if filtered_day_map:
                    members[member] = filtered_day_map
                else:
                    del members[member]

        values["resources"] = resources
        return values


class FlatDataModel(DataModel):
    resources: List[FlatResource]
    surgeries: list[FlatSurgery]

    number_of_resources: int = Field(ge=1)
    number_of_surgeries: int = Field(ge=1)

    @model_validator(mode="before")
    @classmethod
    def validate_resources(cls, values: dict):
        resources = values.get("resources") or []
        if not resources:
            raise ValueError("At least one resource must be defined.")

        seen_ids = set()
        for idx, resource in enumerate(resources, start=1):
            rid = resource.get("rid")
            if not rid:
                raise ValueError(f"Resource at position {idx} is missing an 'id'.")
            if rid in seen_ids:
                raise ValueError(f"Duplicate resource id '{rid}'.")
            seen_ids.add(rid)
            resource["idx"] = idx

        values["number_of_resources"] = len(resources)

        surgeries = values.get("surgeries") or []
        values["number_of_surgeries"] = len(surgeries)
        return values


class ProfileConfig(BaseModel):
    """Configuration for a surgery profile containing resource requirements and feasible starts."""

    profile: np.ndarray
    starts: np.ndarray
    count: int = Field(ge=0)
    mode: List[int]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {np.ndarray: lambda v: v.tolist()}


# scheduling result
class ResourceAllocated(BaseModel):
    role: str
    assigned: str
    count: int
    probability: float
    time_range: List[tuple[datetime, datetime]]
    stage_type: str | None


class Scheduled(BaseModel):
    id: str
    type: str
    scheduled_time: datetime
    resources_assigned: list[ResourceAllocated]


class Dropped(BaseModel):
    id: str


class Infeasible(BaseModel):
    id: str


class PlanningResult(BaseModel):
    scheduled: List[Scheduled]
    dropped: List[Dropped]
    infeasible: List[Infeasible]


# post scheduling assignment model
class AssignedResource(BaseModel):
    assigned_resource: dict = Field(
        default_factory=dict,
        description="Details of the assigned resource",
    )

    @model_validator(mode="before")
    @classmethod
    def validate_assigned_resource(cls, data: Any):
        pre_assigned_resources_map_by_operation = {}
        for surgery in data.get("surgeries", []):
            operation_id = surgery["id"]
            pre_assigned_resources_map_by_operation[operation_id] = {}

            for resources in surgery.get("stages", {}).values():
                for resource in resources:
                    assigned = resource.get("assigned")
                    if assigned:
                        encoded_role_employee = re.sub(
                            r"[^a-z0-9]+",
                            "-",
                            f"{resource['role']}-{assigned}".lower(),
                        ).strip("-")

                        pre_assigned_resources_map_by_operation[operation_id][
                            encoded_role_employee
                        ] = assigned

        data["assigned_resource"] = pre_assigned_resources_map_by_operation
        return data
