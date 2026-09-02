from copy import deepcopy
from datetime import datetime, timedelta

from scheduling.dataloader.processor.models import (
    DEFAULT_CONSTRAINTS,
    NON_WORKING_SHIFTS,
    VALID_SHIFTS,
    WEEK_DAYS,
    WORKING_SHIFT_KEYS,
    Assignments,
    InputDataPayload,
    PoolShift,
    ProceedDataModel,
)


class DateTimeClass:
    def __init__(self, data):
        self.data = data

    def horizon_dates(self):
        start = datetime.strptime(self.data["start_date"], "%Y-%m-%d")
        return [
            (
                (start + timedelta(days=i)).strftime("%Y-%m-%d"),
                (start + timedelta(days=i)).strftime("%A").lower(),
            )
            for i in range(self.data.get("horizon", 0))
        ]


class UpdateContracts:
    def __init__(self, contracts, weighted_constraints):
        self._contracts = deepcopy(contracts)
        for contract_id, contract in contracts.items():
            if not contract:
                self._contracts[contract_id] = deepcopy(DEFAULT_CONSTRAINTS)
            self._add_weight_to_constraints(
                self._contracts[contract_id], weighted_constraints
            )

    def _add_weight_to_constraints(self, contract, weighted_constraints):
        for constraint in contract:
            constraint["weight"] = weighted_constraints.get(constraint.get("name"))

    @property
    def contracts(self):
        return self._contracts


class StaticEmployees:
    """Classifies employees by template type and builds per-day assignment dicts."""

    def __init__(self, data, date_time_class):
        self.data = data
        self.date_time_class = date_time_class
        self.pure_static_profiles = []
        self.semi_static_profiles = []
        self._classify_profiles()

    def _is_static_template(self, weekly_template):
        for weekday in WEEK_DAYS:
            assignment = weekly_template.get(weekday)
            if not isinstance(assignment, dict):
                return False
            shift, pool = assignment.get("shift"), assignment.get("pool")
            if shift not in VALID_SHIFTS:
                return False
            if shift in WORKING_SHIFT_KEYS and pool is None:
                return False
            if pool is None and shift not in NON_WORKING_SHIFTS:
                return False
        return True

    def _classify_profiles(self):
        for emp_id, profile in self.data.get("employee_profiles", {}).items():
            weekly_template = profile.get("weekly_template")
            if not isinstance(weekly_template, dict):
                continue
            if self._is_static_template(weekly_template):
                self.pure_static_profiles.append(emp_id)
            else:
                self.semi_static_profiles.append(emp_id)

    def _build_assignments(self, employee_list, o_to_v=False):
        assignments = {}
        for emp_id in employee_list:
            profile = self.data.get("employee_profiles", {}).get(emp_id)
            if not profile:
                continue
            weekly_template = deepcopy(profile.get("weekly_template", {}))
            emp_prefs = self.data.get("preferred_schedules", {}).get(emp_id, {})
            emp_days = {}
            for date_str, weekday in self.date_time_class.horizon_dates():
                if date_str in emp_prefs:
                    emp_days[date_str] = Assignments(**emp_prefs[date_str]).model_dump()
                    continue
                assignment = weekly_template.get(weekday)
                if not assignment:
                    continue
                pool = assignment.get("pool")
                shift = assignment.get("shift")
                if pool is None and shift not in NON_WORKING_SHIFTS:
                    continue
                if o_to_v and shift == "O":
                    assignment["shift"] = "V"
                emp_days[date_str] = Assignments(**assignment).model_dump()
            assignments[emp_id] = emp_days
        return assignments

    def pure_static_assignment(self):
        return self._build_assignments(self.pure_static_profiles)

    def semi_static_assignment(self):
        return self._build_assignments(self.semi_static_profiles, o_to_v=True)


class ResourceDemand:
    """Expands weekly shift requirements into per-day demand, adjusted for static employees."""

    def __init__(self, data, date_time_class, static_assignments=None):
        self.data = data
        self.date_time_class = date_time_class
        self.static_assignments = static_assignments

    def _actual_demand(self):
        return {
            pool_id: {
                shift: {
                    day: weekly_demand[weekday]
                    for day, weekday in self.date_time_class.horizon_dates()
                }
                for shift, weekly_demand in shifts.items()
            }
            for pool_id, shifts in self.data.get("shift_requirements", {}).items()
        }

    def plannable_demand(self):
        demand = self._actual_demand()
        if self.static_assignments is None:
            return demand
        for assignments in self.static_assignments.values():
            for date_str, assignment in assignments.items():
                pool, shift = assignment.get("pool"), assignment.get("shift")
                if (
                    pool
                    and shift
                    and pool in demand
                    and shift in demand[pool]
                    and date_str in demand[pool][shift]
                ):
                    demand[pool][shift][date_str] = max(
                        0, demand[pool][shift][date_str] - 1
                    )
        return demand


class SchedulePreferenceBuilder:
    """Merges preferred and assigned schedules with weighted preference resolution."""

    def __init__(self, data, date_time_class, static_employee_profiles=None):
        self.data = deepcopy(data)
        self.date_time_class = date_time_class
        self.static_employee_profiles = static_employee_profiles

    def _filter_ignored_preferences(self):
        for emp_id, day_assignments in self.data.get("preferred_schedules", {}).items():
            for date_str, assignment in list(day_assignments.items()):
                if assignment.get("status") == "ignored":
                    del day_assignments[date_str]

    def _get_weight(
        self, assignment, non_working_default, working_default, date_str=None
    ):
        status = assignment.get("status")
        base_weight = (
            non_working_default
            if assignment.get("shift") in NON_WORKING_SHIFTS
            else working_default
        )
        if status and "day_of_request" in assignment:

            day_gap = int(
                (
                    datetime.strptime(date_str, "%Y-%m-%d")
                    - datetime.strptime(assignment["day_of_request"], "%Y-%m-%d")
                ).days
            )
            status_bonus = {"requested": 2, "accepted": 4}.get(status, 0)
            assignment["weight"] = int(base_weight + (day_gap * 0.35) + status_bonus)
        else:
            assignment["weight"] = base_weight

    def _apply_weights(self, schedule_key, non_working_default, working_default):
        for assignments in self.data.get(schedule_key, {}).values():
            for date_str, assignment in assignments.items():
                self._get_weight(
                    assignment, non_working_default, working_default, date_str
                )

    def apply_semi_static_assignments_as_preference(self, default_weight: int = 50):
        assignments = self.static_employee_profiles.semi_static_assignment()
        emp_prefs = self.data.setdefault("preferred_schedules", {})
        for emp_id, day_assignments in assignments.items():
            day_prefs = emp_prefs.setdefault(emp_id, {})
            for date_str, assignment in day_assignments.items():
                assignment.setdefault("weight", default_weight)
                day_prefs[date_str] = assignment

    def build_effective_preference(self):
        schedule_holder = {}
        for emp_id in self.data.get("employee_profiles", {}):
            if emp_id in self.static_employee_profiles.pure_static_profiles:
                continue
            preferred_days = self.data.get("preferred_schedules", {}).get(emp_id, {})
            assigned_days = self.data.get("assigned_schedules", {}).get(emp_id, {})
            schedule_holder[emp_id] = {
                date: (
                    PoolShift(**preferred_days[date]).model_dump()
                    if date in preferred_days
                    else PoolShift(**assigned_days[date]).model_dump()
                )
                for date, _ in self.date_time_class.horizon_dates()
                if date in preferred_days or date in assigned_days
            }
        return schedule_holder

    def build(self):
        self._filter_ignored_preferences()
        weighted_constraints = self.data.get("weighted_constraints", {})
        self._apply_weights(
            "assigned_schedules",
            non_working_default=weighted_constraints["assigned_schedules_non_working"],
            working_default=weighted_constraints["assigned_schedules_working"],
        )
        self._apply_weights(
            "preferred_schedules",
            non_working_default=weighted_constraints["preferred_schedules_non_working"],
            working_default=weighted_constraints["preferred_schedules_working"],
        )
        self.apply_semi_static_assignments_as_preference(
            default_weight=weighted_constraints[
                "preference_schedules_static_assignments"
            ]
        )
        return self.build_effective_preference()


class PreProcessingPipeline:
    """Orchestrates the preprocessing of scheduling data."""

    def __init__(self, data):
        self.data = deepcopy(data)
        self.date_time_class = DateTimeClass(data)
        self.static_employee_profiles = StaticEmployees(data, self.date_time_class)
        static_assignments = self.static_employee_profiles.pure_static_assignment()
        self.resource_demand = ResourceDemand(
            data,
            date_time_class=self.date_time_class,
            static_assignments=static_assignments,
        )
        self.schedule_builder = SchedulePreferenceBuilder(
            data,
            date_time_class=self.date_time_class,
            static_employee_profiles=self.static_employee_profiles,
        )

    def _validate_data(self):
        contracts = UpdateContracts(
            deepcopy(self.data["contracts"]),
            deepcopy(self.data.get("weighted_constraints")),
        )
        self.data["contracts"] = contracts.contracts
        return InputDataPayload(**self.data).model_dump()

    def _drop_pure_static_employees(self):
        for emp_id in self.static_employee_profiles.pure_static_profiles:
            if emp_id in self.data.get("employee_profiles", {}):
                del self.data["employee_profiles"][emp_id]
            if emp_id in self.data.get("preferred_schedules", {}):
                del self.data["preferred_schedules"][emp_id]
            if emp_id in self.data.get("assigned_schedules", {}):
                del self.data["assigned_schedules"][emp_id]

    def update_data(self):
        self.data[
            "static_assignments"
        ] = self.static_employee_profiles.pure_static_assignment()
        self.data["shift_requirements"] = self.resource_demand.plannable_demand()
        self.data["effective_preferred_schedules"] = self.schedule_builder.build()

    def run(self):
        self.data = self._validate_data()
        self.update_data()
        self._drop_pure_static_employees()
        return ProceedDataModel(**self.data)
