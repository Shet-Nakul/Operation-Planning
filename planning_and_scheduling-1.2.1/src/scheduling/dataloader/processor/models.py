from __future__ import annotations

import datetime
from copy import deepcopy
from typing import Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator

from scheduling.dataloader.processor.enums import (
    CONSTRAINT_NAME_TO_TYPE,
    ConstraintEnum,
    ShiftEnum,
)

VALID_SHIFTS = {s.name for s in ShiftEnum}
WORKING_SHIFT_KEYS = {"E", "N", "D", "L"}
NON_WORKING_SHIFTS = {"O", "V"}
WEEK_DAYS = {
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
}
DEFAULT_CONSTRAINTS = [
    {
        "active": False,
        "hard": False,
        "name": "complete_weekends",
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "no_free_day_before_working_weekend",
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "no_night_shift_before_free_weekend",
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "identical_shift_types_during_weekend",
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "max_num_assignments",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "min_num_assignments",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "max_consecutive_free_days",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "min_consecutive_free_days",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "max_consecutive_working_days",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "min_consecutive_working_days",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "max_consecutive_working_weekends",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "min_consecutive_working_weekends",
        "reason": "Skipped",
        "value": 0,
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "late_followed_day",
        "pattern": ["L", "D"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "day_followed_early_followed_day",
        "pattern": ["D", "E", "D"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "late_followed_early",
        "pattern": ["L", "E"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "late_followed_night",
        "pattern": ["L", "N"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "day_followed_night",
        "pattern": ["D", "N"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "night_followed_day",
        "pattern": ["N", "D"],
        "reason": "Skipped",
        "weight": 1,
    },
    {
        "active": False,
        "hard": False,
        "name": "night_followed_early",
        "pattern": ["N", "E"],
        "reason": "Skipped",
        "weight": 1,
    },
]


def check_shifts(shifts, context=""):
    invalid = [s for s in shifts if s not in VALID_SHIFTS]
    if invalid:
        raise ValueError(f"Invalid shifts {context}: {invalid}")


class AssignmentConstraint(BaseModel):
    id: int = -1
    name: str
    active: bool
    hard: bool = Field(default=False)
    weight: int = Field(default=1, ge=1)
    value: int | None = None
    pattern: list[str] | None = None
    type: int | None = None

    @model_validator(mode="before")
    def set_id(cls, model):
        model["id"] = CONSTRAINT_NAME_TO_TYPE[model["name"]].value
        return model

    @model_validator(mode="after")
    def set_type(cls, model):
        if model.value is None and model.pattern is None:
            model.type = 0
        elif model.value is not None and model.pattern is None:
            model.type = 1
        elif model.value is None and model.pattern is not None:
            model.type = 2
        else:
            raise ValueError("Constraint cannot have both value and pattern")
        return model


class EmployeeProfile(BaseModel):
    contract: str
    pools: list[str]
    roles_distribution: dict[str, float] | None = None
    weekly_template: dict[str, dict[str, str | None]] | None = None


class BoolConstraint(BaseModel):
    name: Literal[tuple(c.name.lower() for c in ConstraintEnum)]
    active: bool
    hard: bool
    weight: int = 1
    reason: str = ""


class IntConstraint(BoolConstraint):
    value: int


class SequenceConstraint(BoolConstraint):
    pattern: list[str]

    @field_validator("pattern")
    @classmethod
    def validate_pattern(cls, value):
        check_shifts(value, "constraint pattern")
        return value


class ShiftWeight(BaseModel):
    shift: str
    weight: int | None = None

    @field_validator("shift")
    @classmethod
    def validate_shift(cls, v):
        if v not in VALID_SHIFTS:
            raise ValueError(f"shift must be one of {VALID_SHIFTS}")
        return v


class PoolShift(BaseModel):
    pool: str | None = None
    shift: str
    weight: int | None = None

    @field_validator("shift")
    @classmethod
    def validate_shift(cls, v):
        if v not in VALID_SHIFTS:
            raise ValueError(f"shift must be one of {VALID_SHIFTS}")
        return v


class Assignments(BaseModel):
    pool: str | None
    shift: str


class ProceedDataModel(BaseModel):
    contracts: dict[
        str, list[Union[BoolConstraint, IntConstraint, SequenceConstraint]] | None
    ]
    employee_profiles: dict[str, EmployeeProfile]
    pool_role_map: dict[str, str]
    horizon: int
    start_date: str
    shift_requirements: dict[str, dict[str, dict[str, int]]]
    preferred_schedules: dict[str, dict[str, PoolShift]]
    previous_schedules: dict[str, dict[str, PoolShift]]
    static_assignments: dict[str, dict[str, Assignments]]
    effective_preferred_schedules: dict[str, dict[str, PoolShift]] = Field(
        default_factory=dict
    )
    weighted_constraints: dict = Field(default_factory=dict)


class InputDataPayload(BaseModel):
    pool_role_map: dict[str, str]
    horizon: int
    start_date: str
    employee_profiles: dict[str, EmployeeProfile]
    contracts: dict[
        str, list[Union[BoolConstraint, IntConstraint, SequenceConstraint]] | None
    ] = Field(default_factory=dict)
    shift_requirements: dict[str, dict[str, dict[str, int]]]
    preferred_schedules: dict[str, dict[str, PoolShift]] = Field(default_factory=dict)
    previous_schedules: dict[str, dict[str, PoolShift]] = Field(default_factory=dict)
    assigned_schedules: dict[str, dict[str, Assignments]] = Field(default_factory=dict)
    static_assignments: dict[str, dict[str, Assignments]] = Field(default_factory=dict)
    weighted_constraints: dict = Field(default_factory=dict)
