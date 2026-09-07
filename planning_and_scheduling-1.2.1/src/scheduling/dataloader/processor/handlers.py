from collections import Counter, defaultdict
from datetime import datetime, timedelta

from pydantic import BaseModel, Field

from scheduling.dataloader.processor.enums import ShiftEnum


class PoolsModel(BaseModel):
    pool_role_map: dict
    pool_shift_requirements: dict


class PoolsHandler:
    """Normalize pool/shift metadata into stable integer encodings."""

    VACATION = 0
    DAY_OFF = 11
    POOL_INDEX_OFFSET = 2

    def __init__(self, input_data_model):
        if hasattr(input_data_model, "model_dump"):
            input_data_model = input_data_model.model_dump()

        self.data_model = PoolsModel(
            pool_role_map=input_data_model["pool_role_map"],
            pool_shift_requirements=input_data_model["shift_requirements"],
        )

        self.pool_role_map = self.data_model.pool_role_map
        self.pool_names = sorted(self.pool_role_map.keys())
        self.pool_name_to_code = {
            pool_name: idx
            for idx, pool_name in enumerate(
                self.pool_names, start=self.POOL_INDEX_OFFSET
            )
        }

        self.pool_to_shifts_map = self._build_pool_to_shifts_map()
        self.pool_shift_label_to_code = self._build_pool_shift_label_to_code_map()

        self.ordered_shift_codes = sorted(self.pool_shift_label_to_code.values())
        self.pool_shift_int_to_index_map = self._build_shift_code_to_row_index_map()

    def pool_shift(self, pool_name, shift_name):
        if pool_name:
            return f"{pool_name}_{shift_name}"
        return shift_name

    def _encode_pool_shift(self, pool_name, shift_name):
        return self.pool_name_to_code[pool_name] * 10 + ShiftEnum[shift_name].value

    def _build_pool_to_shifts_map(self):
        """Build mapping pool -> list of shifts, e.g. HN1 -> [E, D]."""
        mapping = {}
        for (
            pool_name,
            requirements_by_shift,
        ) in self.data_model.pool_shift_requirements.items():
            mapping[pool_name] = list(requirements_by_shift.keys())
        return mapping

    def _build_pool_shift_label_to_code_map(self):
        """Build mapping pool_shift label -> unique int code, e.g. HN1_E -> 22."""
        mapping = {"V": self.VACATION, "O": self.DAY_OFF}
        for pool_name in self.pool_names:
            for shift_name in self.pool_to_shifts_map.get(pool_name, []):
                mapping[
                    self.pool_shift(pool_name, shift_name)
                ] = self._encode_pool_shift(pool_name, shift_name)
        return mapping

    def _build_shift_code_to_row_index_map(self):
        return {
            shift_code: idx for idx, shift_code in enumerate(self.ordered_shift_codes)
        }

    @property
    def shift_codes(self):
        return {key: int(member.value) for key, member in ShiftEnum.__members__.items()}

    @property
    def pools(self):
        return self.pool_names

    @property
    def pool_codes(self):
        return self.pool_name_to_code

    @property
    def pool_to_shifts(self):
        return self.pool_to_shifts_map

    @property
    def pool_shifts_codes(self):
        return self.pool_shift_label_to_code

    @property
    def pool_shifts_codes_list(self):
        return self.ordered_shift_codes

    @property
    def pool_shift_code_to_index(self):
        return self.pool_shift_int_to_index_map


class DayModel(BaseModel):
    start_date: str
    horizon: int


class DayHandler:
    """Normalize day metadata into stable integer encodings."""

    def __init__(self, input_data_model):
        if hasattr(input_data_model, "model_dump"):
            input_data_model = input_data_model.model_dump()

        self.data_model = DayModel(**input_data_model)
        self.num_of_days = self.data_model.horizon
        self.start_date = datetime.strptime(self.data_model.start_date, "%Y-%m-%d")

        self.future_day_index_map = self._future_day_index_map()
        self.history_day_index_map = self._history_day_index_map(
            num_days_history=self.num_of_days
        )

    def _future_day_index_map(self):
        return {
            (self.start_date + timedelta(days=day)).strftime("%Y-%m-%d"): day
            for day in range(self.num_of_days)
        }

    def _history_day_index_map(self, num_days_history):
        return {
            (self.start_date - timedelta(days=day)).strftime("%Y-%m-%d"): -day
            for day in range(1, num_days_history + 1)
        }

    @property
    def start_date_weekday_index(self):
        return self.start_date.weekday()

    @property
    def days(self):
        return self.future_day_index_map | self.history_day_index_map

    @property
    def future_days(self):
        return self.future_day_index_map

    @property
    def history_days(self):
        return self.history_day_index_map


class EmployeeHandler:
    def __init__(self, input_data_model, pools_handler):
        if hasattr(input_data_model, "model_dump"):
            input_data_model = input_data_model.model_dump()

        self.data_model = input_data_model
        self.pools_handler = pools_handler

        self.employee_profiles = self.data_model["employee_profiles"]

        self.employee_ids = sorted(self.employee_profiles.keys())
        self.contract_ids = sorted(self.data_model["contracts"].keys())
        self.employee_id_to_index = self._employee_id_to_index_map()
        self.employee_index_to_id = {
            idx: emp_id for emp_id, idx in self.employee_id_to_index.items()
        }

        self.contract_id_to_index = self._contract_id_to_index()
        self.contract_index_to_id = {
            idx: contract_id for contract_id, idx in self.contract_id_to_index.items()
        }

        self.employee_index_to_contract_index_map = (
            self._employee_index_to_contract_index_map()
        )

    @property
    def employee_to_contract_id_list(self):
        return [
            self.employee_index_to_contract_index_map[self.employee_id_to_index[emp_id]]
            for emp_id in self.employee_ids
        ]

    def _employee_id_to_index_map(self):
        return {emp_id: idx for idx, emp_id in enumerate(self.employee_ids)}

    def _contract_id_to_index(self):
        return {contract_id: idx for idx, contract_id in enumerate(self.contract_ids)}

    def _employee_index_to_contract_index_map(self):
        mapping = {}
        for emp_id in self.employee_ids:
            contract_id = self.employee_profiles[emp_id]["contract"]
            mapping[self.employee_id_to_index[emp_id]] = self.contract_id_to_index[
                contract_id
            ]
        return mapping

    def _normalize_distribution(self, distribution):
        total = sum(distribution.values())
        if total <= 0:
            return {}
        return {key: value / total for key, value in distribution.items()}

    def _role_distribution(self, configured_role_distribution, employee_pools):
        assigned_roles = [
            self.pools_handler.pool_role_map[pool] for pool in employee_pools
        ]
        if not assigned_roles:
            return {}

        configured_roles = sorted(configured_role_distribution.keys())
        observed_roles = sorted(set(assigned_roles))

        if observed_roles == configured_roles:
            return self._normalize_distribution(configured_role_distribution)

        role_counts = Counter(assigned_roles)
        raw_role_distribution = {
            role: count / len(assigned_roles) for role, count in role_counts.items()
        }
        return self._normalize_distribution(raw_role_distribution)

    def _pool_distribution(
        self, role_distribution, employee_pools, weekly_template=None
    ):
        # Group pools by role once to avoid repeated filtering.
        role_to_pools = defaultdict(list)
        for pool in employee_pools:
            role_to_pools[self.pools_handler.pool_role_map.get(pool)].append(pool)

        role_based = defaultdict(float)
        for role, weight in role_distribution.items():
            pools = role_to_pools.get(role, [])
            if not pools:
                continue
            share = weight / len(pools)
            for pool in pools:
                role_based[pool] = share

        if not weekly_template:
            return self._normalize_distribution(role_based)

        weekly_counts = Counter(
            entry.get("pool")
            for entry in weekly_template.values()
            if entry.get("pool") in employee_pools
        )

        if not weekly_counts:
            return self._normalize_distribution(role_based)

        weekly_dist = self._normalize_distribution(weekly_counts)
        combined = defaultdict(float, role_based)
        for pool, w in weekly_dist.items():
            combined[pool] += w

        return self._normalize_distribution(combined)

    def _shift_distribution(self, pool_distribution, weekly_template=None):
        raw_shift_distribution = defaultdict(float)

        if weekly_template is not None:
            for entry in weekly_template.values():
                shift = entry.get("shift")
                if shift and shift != "O":
                    raw_shift_distribution[shift] += 1
            return self._normalize_distribution(raw_shift_distribution)

        for pool_name, pool_weight in pool_distribution.items():
            shifts_for_pool = self.pools_handler.pool_to_shifts.get(pool_name, [])
            if not shifts_for_pool:
                continue

            shift_weight = pool_weight / len(shifts_for_pool)
            for shift_name in shifts_for_pool:
                raw_shift_distribution[shift_name] += shift_weight

        return self._normalize_distribution(dict(raw_shift_distribution))

    def _pool_shift_distribution(self, pool_dist, shift_dist, pool_shift_map):
        pool_shift_assignments = {}

        allowed_shifts = set(shift_dist.keys())
        for pool_name, pool_fraction in pool_dist.items():
            valid_shifts = pool_shift_map.get(pool_name, [])
            if not valid_shifts:
                continue

            filtered_shifts = [s for s in valid_shifts if s in allowed_shifts]
            if not filtered_shifts:
                continue

            shift_fraction = pool_fraction / len(filtered_shifts)
            for shift_name in filtered_shifts:
                pool_shift_label = self.pools_handler.pool_shift(pool_name, shift_name)
                pool_shift_code = self.pools_handler.pool_shifts_codes[pool_shift_label]
                pool_shift_assignments[pool_shift_code] = shift_fraction * 1

        total = sum(pool_shift_assignments.values())
        if total > 0:
            pool_shift_assignments = {
                code: round(value / total, 3)
                for code, value in pool_shift_assignments.items()
            }

        return pool_shift_assignments

    def build_employee_profiles(self):
        profiles = {}
        for emp_id in self.employee_ids:
            profile = self.employee_profiles[emp_id]
            role_dist = self._role_distribution(
                profile["roles_distribution"], profile["pools"]
            )
            pool_dist = self._pool_distribution(
                role_dist, profile["pools"], profile.get("weekly_template")
            )
            shift_dist = self._shift_distribution(
                pool_dist, profile.get("weekly_template")
            )
            emp_idx = self.employee_id_to_index[emp_id]
            profiles[emp_idx] = {
                "contract": self.employee_index_to_contract_index_map[emp_idx],
                "pools": {
                    self.pools_handler.pool_codes[pool]: weight
                    for pool, weight in pool_dist.items()
                },
                "shifts": {
                    self.pools_handler.shift_codes[shift]: weight
                    for shift, weight in shift_dist.items()
                },
                "pool_shift_assignments": self._pool_shift_distribution(
                    pool_dist, shift_dist, self.pools_handler.pool_to_shifts
                ),
            }
        return profiles


class ScheduleModel(BaseModel):
    shift_requirements: dict
    preferred_schedules: dict = Field(default_factory=dict)
    previous_schedules: dict = Field(default_factory=dict)
    effective_preferred_schedules: dict = Field(default_factory=dict)


class ScheduleHandler:
    def __init__(self, input_data_model, pools_handler, employee_handler, day_handler):
        if hasattr(input_data_model, "model_dump"):
            input_data_model = input_data_model.model_dump()

        self.pools_handler = pools_handler
        self.employee_handler = employee_handler
        self.day_handler = day_handler

        self.data_model = ScheduleModel(
            shift_requirements=input_data_model.get("shift_requirements", {}),
            preferred_schedules=input_data_model.get("preferred_schedules", {}),
            effective_preferred_schedules=input_data_model.get(
                "effective_preferred_schedules", {}
            ),
            previous_schedules=input_data_model.get("previous_schedules", {}),
        )
        self.original_preferred_schedules = self.data_model.preferred_schedules
        self.shift_requirements = self.data_model.shift_requirements
        self._normalize_shift_requirements = self.normalize_shift_requirements_new()
        (
            self._normalize_preferred_schedules,
            self._normalize_preferred_schedules_weight,
        ) = self.normalize_preferred_schedules()

        (
            self._normalize_preferred_shift,
            self._normalize_preferred_pool,
        ) = self.normalize_preferred_assignments()
        self._normalize_previous_schedules = self.normalize_previous_schedules()

    def normalize_shift_requirements_new(self):
        pool_shift_future_requirements = {}
        for pool, reqs in self.shift_requirements.items():
            for shift, daily_demand in reqs.items():
                pool_shift_label = self.pools_handler.pool_shift(pool, shift)
                code = self.pools_handler.pool_shifts_codes[pool_shift_label]
                pool_shift_future_requirements[code] = {}
                for date_str, demand in daily_demand.items():
                    idx = self.day_handler.future_days.get(date_str)
                    pool_shift_future_requirements[code][idx] = demand
        return pool_shift_future_requirements

    def normalize_shift_requirements(self):
        pool_shift_future_requirements = {}
        for pool, reqs in self.shift_requirements.items():
            for shift, weekly_demand in reqs.items():
                pool_shift_label = self.pools_handler.pool_shift(pool, shift)
                code = self.pools_handler.pool_shifts_codes[pool_shift_label]
                pool_shift_future_requirements[code] = {}
                for date_str, idx in self.day_handler.future_days.items():
                    date = datetime.strptime(date_str, "%Y-%m-%d")
                    day_of_week = date.strftime("%A").lower()
                    demand = weekly_demand.get(day_of_week)
                    pool_shift_future_requirements[code][idx] = demand
        return pool_shift_future_requirements

    def normalize_preferred_assignments(self):
        normalize_preferred_shift = {}
        normalize_preferred_pool = {}
        for emp_id, prefs in self.data_model.effective_preferred_schedules.items():
            if emp_id not in self.employee_handler.employee_ids:
                continue
            emp_idx = self.employee_handler.employee_id_to_index[emp_id]
            for date_str, pref in prefs.items():
                if date_str not in self.day_handler.future_days:
                    continue
                day_idx = self.day_handler.future_days[date_str]
                normalize_preferred_shift.setdefault(emp_idx, {})[
                    day_idx
                ] = self.pools_handler.shift_codes.get(pref["shift"], -1)
                normalize_preferred_pool.setdefault(emp_idx, {})[
                    day_idx
                ] = self.pools_handler.pool_codes.get(pref["pool"], -1)
        return normalize_preferred_shift, normalize_preferred_pool

    def normalize_preferred_schedules(self):
        normalized = {}
        weighted_preferences = {}
        for emp_id, prefs in self.data_model.effective_preferred_schedules.items():
            if emp_id not in self.employee_handler.employee_ids:
                continue
            emp_idx = self.employee_handler.employee_id_to_index[emp_id]
            for date_str, pref in prefs.items():
                if date_str not in self.day_handler.future_days:
                    continue
                day_idx = self.day_handler.future_days[date_str]
                if pref["pool"] is None and pref["shift"] in {"D", "E", "N", "L"}:
                    continue
                pool_shift_label = self.pools_handler.pool_shift(
                    pref["pool"], pref["shift"]
                )
                code = self.pools_handler.pool_shifts_codes[pool_shift_label]
                normalized.setdefault(emp_idx, {})[day_idx] = code
                weighted_preferences.setdefault(emp_idx, {})[day_idx] = pref["weight"]
        return normalized, weighted_preferences

    def normalize_previous_schedules(self):
        normalized = {}
        for emp_id, scheds in self.data_model.previous_schedules.items():
            if emp_id not in self.employee_handler.employee_ids:
                continue
            emp_idx = self.employee_handler.employee_id_to_index[emp_id]
            for date_str, sched in scheds.items():
                if date_str not in self.day_handler.history_days:
                    continue
                day_idx = self.day_handler.history_days[date_str]
                pool_shift_label = self.pools_handler.pool_shift(
                    sched["pool"], sched["shift"]
                )
                code = self.pools_handler.pool_shifts_codes[pool_shift_label]
                normalized.setdefault(emp_idx, {})[day_idx] = code
        return normalized


class InputDataHandler:
    def __init__(self, input_data_model):
        if hasattr(input_data_model, "model_dump"):
            input_data_model = input_data_model.model_dump()
        self.input_data_model = input_data_model
        self.pools_handler = PoolsHandler(input_data_model=input_data_model)
        self.day_handler = DayHandler(input_data_model=input_data_model)
        self.employee_handler = EmployeeHandler(
            input_data_model=input_data_model, pools_handler=self.pools_handler
        )
        self.schedule_handler = ScheduleHandler(
            input_data_model=input_data_model,
            pools_handler=self.pools_handler,
            day_handler=self.day_handler,
            employee_handler=self.employee_handler,
        )

    @property
    def vacation(self):
        return self.pools_handler.VACATION

    @property
    def day_off(self):
        return self.pools_handler.DAY_OFF

    @property
    def pool_shifts_codes(self):
        return self.pools_handler.pool_shifts_codes_list

    @property
    def shift_codes(self):
        return self.pools_handler.shift_codes

    @property
    def num_of_days(self):
        return self.day_handler.num_of_days

    @property
    def contracts(self):
        return self.input_data_model.get("contracts", {})

    @property
    def contract_index_to_id(self):
        return self.employee_handler.contract_index_to_id

    @property
    def employee_ids(self):
        return self.employee_handler.employee_ids

    @property
    def employee_to_contract_id_list(self):
        return self.employee_handler.employee_to_contract_id_list

    @property
    def num_of_employees(self):
        return len(self.employee_handler.employee_ids)

    @property
    def start_date(self):
        return self.day_handler.start_date

    @property
    def start_date_weekday_index(self):
        return self.day_handler.start_date_weekday_index

    @property
    def original_preferred_schedules(self):
        return self.schedule_handler.original_preferred_schedules

    @property
    def preferred_schedule(self):
        return self.schedule_handler._normalize_preferred_schedules

    @property
    def preferred_schedule_weight(self):
        return self.schedule_handler._normalize_preferred_schedules_weight

    @property
    def previous_schedule(self):
        return self.schedule_handler._normalize_previous_schedules

    @property
    def pool_shift_code_to_index(self):
        return self.pools_handler.pool_shift_code_to_index

    @property
    def shift_requirements(self):
        return self.schedule_handler._normalize_shift_requirements

    @property
    def preferred_shift(self):
        return self.schedule_handler._normalize_preferred_shift

    @property
    def preferred_pool(self):
        return self.schedule_handler._normalize_preferred_pool

    @property
    def static_assignment(self):
        return self.input_data_model.get("static_assignments", {})

    @property
    def weighted_constraints(self):
        return self.input_data_model.get("weighted_constraints", {})


class OutputHandler:
    """Converts solver output into employee, pool, and date-centric views."""

    def __init__(self, input_data_handler, result_array):
        self.input_data_handler = input_data_handler
        self.static_assignment = input_data_handler.static_assignment
        self.result_array = result_array
        self._pool_code_to_name = {
            code: pool_name
            for pool_name, code in self.input_data_handler.pools_handler.pool_name_to_code.items()
        }
        self._shift_code_to_name = {
            code: shift_name
            for shift_name, code in self.input_data_handler.pools_handler.shift_codes.items()
        }

    def _decode_pool_shift_code(self, pool_shift_code):
        assigned_pool_code = int(pool_shift_code) // 10
        assigned_shift_code = int(pool_shift_code) % 10
        return {
            "pool": self._pool_code_to_name.get(assigned_pool_code),
            "shift": self._shift_code_to_name.get(assigned_shift_code),
        }

    def _attach_static_assignment(self, employee_centric_response):
        if not self.static_assignment:
            return employee_centric_response

        merged = {
            employee_id: dict(assignments_by_day)
            for employee_id, assignments_by_day in employee_centric_response.items()
        }

        for employee_id, assignments_by_day in self.static_assignment.items():
            employee_schedule = merged.setdefault(employee_id, {})
            for day, assignment in assignments_by_day.items():
                employee_schedule[day] = {
                    "pool": assignment.get("pool"),
                    "shift": assignment.get("shift"),
                }

        return merged

    def to_employee_centric(self):
        response = {}
        employee_id_to_index = (
            self.input_data_handler.employee_handler.employee_id_to_index
        )
        future_day_index_map = self.input_data_handler.day_handler.future_day_index_map

        for employee_id, employee_index in employee_id_to_index.items():
            response[employee_id] = {}
            for date, date_index in future_day_index_map.items():
                pool_shift_code = self.result_array[employee_index][date_index]
                original_pref = (
                    self.input_data_handler.original_preferred_schedules.get(
                        employee_id, {}
                    ).get(date)
                )

                if original_pref is None and pool_shift_code == 0:
                    response[employee_id][date] = self._decode_pool_shift_code(11)
                else:
                    response[employee_id][date] = self._decode_pool_shift_code(
                        pool_shift_code
                    )

        return self._attach_static_assignment(response)

    def to_pool_centric(self, employee_centric_response):
        pool_response = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        for employee_id, assignments_by_day in employee_centric_response.items():
            for day, assignment in assignments_by_day.items():
                pool_name = assignment.get("pool")
                shift_name = assignment.get("shift")
                if pool_name and shift_name:
                    pool_response[pool_name][day][shift_name].append(employee_id)

        return {
            pool_name: {day: dict(shifts) for day, shifts in days.items()}
            for pool_name, days in pool_response.items()
        }

    def to_date_centric(self, employee_centric_response):
        date_response = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        for employee_id, assignments_by_day in employee_centric_response.items():
            for day, assignment in assignments_by_day.items():
                pool_name = assignment.get("pool")
                shift_name = assignment.get("shift")
                if pool_name and shift_name:
                    date_response[day][pool_name][shift_name].append(employee_id)

        return {
            day: {pool_name: dict(shifts) for pool_name, shifts in pools.items()}
            for day, pools in date_response.items()
        }

    def response(self):
        employee_centric = self.to_employee_centric()
        pool_centric = self.to_pool_centric(employee_centric)
        date_centric = self.to_date_centric(employee_centric)
        return {
            "employee_centric": employee_centric,
            "pool_centric": pool_centric,
            "date_centric": date_centric,
        }
