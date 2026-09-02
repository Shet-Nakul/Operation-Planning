import numpy as np

from scheduling.dataloader.processor.encoder import AssignmentConstraintsEncoder


class DataProcessor:
    def __init__(self, input_data_handler):
        self.input_data_handler = input_data_handler
        self.vacation = input_data_handler.vacation
        self.day_off = input_data_handler.day_off
        self.shift_codes = input_data_handler.shift_codes
        self.pool_shifts_codes = input_data_handler.pool_shifts_codes
        self.start_day_index = input_data_handler.start_date_weekday_index
        self.num_of_days = input_data_handler.num_of_days
        self.num_of_employees = input_data_handler.num_of_employees
        self.preferred_schedule = input_data_handler.preferred_schedule
        self.preferred_schedule_weight = input_data_handler.preferred_schedule_weight
        self.previous_schedule = input_data_handler.previous_schedule
        self.preferred_shift = input_data_handler.preferred_shift
        self.preferred_pool = input_data_handler.preferred_pool
        self.shift_requirements = input_data_handler.shift_requirements
        self.employees_contract_id = input_data_handler.employee_to_contract_id_list
        self.employee_profiles = (
            input_data_handler.employee_handler.build_employee_profiles()
        )
        (
            self.employee_assignment_matrix,
            self.employee_assignment_fraction_matrix,
        ) = self.build_employee_assignment_matrix()

    @property
    def num_of_pool_shift(self):
        return len(self.input_data_handler.pool_shift_code_to_index)

    @property
    def weekend_pairs(self):
        pairs = []
        start_week_day_index = self.input_data_handler.start_date_weekday_index
        for day in range(self.num_of_days):
            if (start_week_day_index + day) % 7 == 5 and day + 1 < self.num_of_days:
                pairs.append((day, day + 1))
        return np.array(pairs, dtype=np.int32)

    @property
    def past_week_pairs(self):
        pairs = []
        start_week_day_index = self.input_data_handler.start_date_weekday_index
        for day in range(-self.num_of_days, 0):
            if (start_week_day_index + day) % 7 == 5 and day + 1 < 0:
                pairs.append((day, day + 1))
        return np.array(pairs, dtype=np.int32)

    @property
    def preferred_schedule_matrix(self):
        matrix = np.ones((self.num_of_employees, self.num_of_days), dtype=int) * -1
        for emp_idx in self.preferred_schedule:
            for day_str, pref in self.preferred_schedule[emp_idx].items():
                matrix[emp_idx, day_str] = pref
        return matrix

    @property
    def preferred_schedule_matrix_mask(self):
        mask = np.zeros((self.num_of_employees, self.num_of_days), dtype=int)
        for emp_idx in self.preferred_schedule:
            for day_str, _ in self.preferred_schedule[emp_idx].items():
                mask[emp_idx, day_str] = 1
        return mask

    @property
    def preferred_schedule_matrix_weight(self):
        matrix = np.ones((self.num_of_employees, self.num_of_days), dtype=int) * -1
        for emp_idx in self.preferred_schedule_weight:
            for day_str, weight in self.preferred_schedule_weight[emp_idx].items():
                matrix[emp_idx, day_str] = weight
        return matrix

    @property
    def preferred_schedule_shift(self):
        matrix = np.ones((self.num_of_employees, self.num_of_days), dtype=int) * -1
        for emp_idx in self.preferred_shift:
            for day_str, shift in self.preferred_shift[emp_idx].items():
                matrix[emp_idx, day_str] = shift
        return matrix

    @property
    def preferred_schedule_pool(self):
        matrix = np.ones((self.num_of_employees, self.num_of_days), dtype=int) * -1
        for emp_idx in self.preferred_pool:
            for day_str, pool in self.preferred_pool[emp_idx].items():
                matrix[emp_idx, day_str] = pool
        return matrix

    @property
    def previous_schedule_matrix(self):
        matrix = np.ones((self.num_of_employees, self.num_of_days), dtype=int) * -1
        for emp_idx in self.previous_schedule:
            for day_str, sched in self.previous_schedule[emp_idx].items():
                matrix[emp_idx, day_str] = sched
        return matrix

    @property
    def demand_matrix(self):
        num_pool_shift = len(self.input_data_handler.pool_shift_code_to_index)
        matrix = np.zeros((num_pool_shift, 1 + self.num_of_days), dtype=int)
        for (
            pool_shift_code,
            idx,
        ) in self.input_data_handler.pool_shift_code_to_index.items():
            matrix[idx, 0] = pool_shift_code

        for pool_shift_code in self.shift_requirements:
            for day_idx, demand in self.shift_requirements[pool_shift_code].items():
                idx = self.input_data_handler.pool_shift_code_to_index.get(
                    pool_shift_code
                )
                matrix[idx, 1 + day_idx] = demand
        return matrix

    @property
    def contract_constraints_tensor(self):
        constraints_tensor_list = []
        for cidx in range(len(self.input_data_handler.contract_index_to_id)):
            cid = self.input_data_handler.contract_index_to_id[cidx]
            constraints_tensor_list.append(
                AssignmentConstraintsEncoder(
                    self.input_data_handler.contracts[cid]
                ).encoding
            )
        return np.array(constraints_tensor_list, dtype=np.int32)

    @property
    def pool_shift_weights_matrix(self):
        num_pool_shift = len(self.input_data_handler.pool_shift_code_to_index)
        matrix = np.zeros((num_pool_shift, 2), dtype=int)
        for (
            pool_shift_code,
            idx,
        ) in self.input_data_handler.pool_shift_code_to_index.items():
            matrix[idx, 0] = pool_shift_code
            if pool_shift_code not in [0, 11]:  # V and O
                matrix[idx, 1] = self.input_data_handler.weighted_constraints[
                    "pool_shift_code"
                ]
        return matrix

    def build_employee_assignment_matrix(self):
        day_off_code = self.input_data_handler.pool_shift_code_to_index.get("O", 1)
        num_pool_shift = len(self.input_data_handler.pool_shift_code_to_index)
        matrix = np.zeros(
            (
                num_pool_shift,
                self.num_of_employees,
            ),
            dtype=int,
        )
        frac_matrix = np.zeros(
            (
                num_pool_shift,
                self.num_of_employees,
            ),
            dtype=float,
        )
        matrix[day_off_code, :] = 1

        for emp in self.input_data_handler.employee_ids:
            emp_idx = self.input_data_handler.employee_ids.index(emp)
            for ps, psf in self.employee_profiles[emp_idx][
                "pool_shift_assignments"
            ].items():
                ps_idx = self.input_data_handler.pool_shift_code_to_index.get(ps)
                if ps_idx is not None:
                    matrix[ps_idx, emp_idx] = 1
                    frac_matrix[ps_idx, emp_idx] = psf
        return matrix, frac_matrix


# class DataProcessor:
#     """Consumes schedule data and produces encoded numeric structures."""

#     VACATION = 0
#     DAY_OFF = 11
#     POOL_INDEX_OFFSET = 2
#     DAY_NAMES = [d.lower() for d in DaysOfWeekEnum._member_names_]

#     def __init__(self, data: ScheduleData | dict):
#         if hasattr(data, "model_dump"):
#             data = data.model_dump()

#         self.raw = data
#         self.num_days = int(data["num_days"])
#         self.num_employees = int(data["num_employees"])
#         self.employee_profiles = data["employee_profiles"]
#         self.shift_requirements = data["shift_requirements"]
#         self.start_day_index = self.DAY_NAMES.index(data["start_day"])
#         self.pools_to_shifts = {pool: shifts for pool, shifts in data["pool_shift_map"].items()}
#         self.pool_names = data["pools"]
#         self.contracts = data["contracts"]
#         self.contract_ids = data["contract_ids"]
#         self.employee_ids = data["employee_ids"]
#         self.employee_contract_ids = data["employee_contract_ids"]

#         self._preferred_shifts = data.get("preferred_shifts", {})
#         self._previous_schedule = data.get("previous_schedule", {})

#         self.shift_penalty_weights = data.get(
#             "shift_penalty_weights",
#             {pool: {shift: 100 for shift in shifts} for pool, shifts in self.pools_to_shifts.items()},
#         )
#         self.raw.setdefault("shift_penalty_weights", self.shift_penalty_weights)

#         self.pool_to_index = self._build_pool_to_index()
#         self.pool_shift_string_to_int_map = self._build_pool_shift_string_to_int_map()

#         self._pool_shift_tuple = tuple(
#             [self.VACATION, self.DAY_OFF]
#             + sorted(
#                 code
#                 for label, code in self.pool_shift_string_to_int_map.items()
#                 if label not in ("V", "O")
#             )
#         )
#         self.pool_shift = np.array(self._pool_shift_tuple, dtype=int)
#         self._code_to_row = {code: i for i, code in enumerate(self._pool_shift_tuple)}

#         self.num_shifts = len(self._pool_shift_tuple)
#         (
#             self.employee_assignment_matrix,
#             self.employee_probability_matrix,
#         ) = self._build_employee_assignment_matrix()

#     def _build_pool_to_index(self):
#         return {pool: i for i, pool in enumerate(self.pool_names, self.POOL_INDEX_OFFSET)}

#     def _build_pool_shift_string_to_int_map(self):
#         mapping = {"V": self.VACATION, "O": self.DAY_OFF}
#         for pool in self.pool_names:
#             for shift in self.pools_to_shifts.get(pool, []):
#                 mapping[f"{pool}_{shift}"] = self._encode(pool, shift)
#         return mapping

#     def _encode(self, pool_name, shift_name):
#         return self.pool_to_index[pool_name] * 10 + ShiftEnum[shift_name].value

#     def _row(self, code):
#         return self._code_to_row[code]

#     @property
#     def weekend_pairs(self):
#         pairs = []
#         for day in range(self.num_days):
#             if (self.start_day_index + day) % 7 == 5 and day + 1 < self.num_days:
#                 pairs.append((day, day + 1))
#         return np.array(pairs, dtype=np.int32)

#     @property
#     def previous_weekend_pairs(self):
#         pairs = []
#         for day in range(-self.num_days, 0):
#             if (self.start_day_index + day) % 7 == 5 and day + 1 < 0:
#                 pairs.append((day, day + 1))
#         return np.array(pairs, dtype=np.int32)

#     def _employee_assignments(self):
#         assignments = {}
#         for emp in self.employee_ids:
#             emp_idx = self.employee_ids.index(emp)
#             profile = self.employee_profiles[emp_idx]
#             codes = [self.VACATION, self.DAY_OFF]
#             for pool, pool_prob in profile["pools"].items():
#                 valid_shifts = self.pools_to_shifts.get(pool, [])
#                 for shift, shift_prob in profile["shifts"].items():
#                     if shift not in valid_shifts:
#                         continue
#                     encoded_value = self._encode(pool, shift)
#                     prob = round(pool_prob * shift_prob, 3)
#                     codes.append((encoded_value, prob))
#             assignments[emp] = codes
#         return assignments

#     def _build_employee_assignment_matrix(self):
#         assignments = self._employee_assignments()
#         matrix = np.zeros((self.num_shifts, self.num_employees), dtype=int)
#         probability_matrix = np.zeros((self.num_shifts, self.num_employees), dtype=float)

#         matrix[self._row(self.DAY_OFF), :] = 1

#         for col, emp in enumerate(self.employee_ids):
#             for code_prob in assignments[emp]:
#                 if isinstance(code_prob, tuple):
#                     code, prob = code_prob
#                 else:
#                     code, prob = code_prob, 0.0

#                 if code in (self.VACATION, self.DAY_OFF):
#                     continue

#                 row = self._row(code)
#                 matrix[row, col] = 1
#                 probability_matrix[row, col] = prob

#         return matrix, probability_matrix

#     @property
#     def daily_requirements_matrix(self):
#         matrix = np.zeros((self.num_shifts, 1 + self.num_days), dtype=int)
#         matrix[:, 0] = self.pool_shift

#         for pool, daily in self.shift_requirements.items():
#             for day, shifts in daily.items():
#                 day_idx = int(day)
#                 if not (0 <= day_idx < self.num_days):
#                     continue

#                 for shift, req in shifts.items():
#                     if shift not in self.pools_to_shifts.get(pool, []):
#                         continue
#                     code = self._encode(pool, shift)
#                     matrix[self._row(code), 1 + day_idx] = int(req)

#         return matrix

#     @property
#     def contract_constraints_tensor(self):
#         return np.array(
#             [AssignmentConstraintsEncoder(self.contracts[cid]).encoding for cid in self.contract_ids]
#         )

#     @property
#     def pool_shift_weights_matrix(self):
#         """Matrix of shape (num_pools, num_shifts) with penalty weights for unmet requirements."""
#         pool_shift_penalty = self.raw["shift_penalty_weights"]

#         array = np.zeros((self.num_shifts, 2), dtype=int)
#         array[:, 0] = self.pool_shift
#         for pool in self.pool_names:
#             for shift in ShiftEnum._member_names_:
#                 if shift not in self.pools_to_shifts[pool]:
#                     continue
#                 if shift not in ("V", "O"):
#                     code = self._encode(pool, shift)
#                     idx = self._row(code)
#                     array[idx, 1] = pool_shift_penalty[pool][shift]
#         return array

#     @property
#     def preferred_shift(self):
#         preferred = np.ones((self.num_employees, self.num_days), dtype=int) * -1

#         for emp, by_day in self._preferred_shifts.items():
#             for day, pref in by_day.items():
#                 day_idx = int(day)
#                 if not (0 <= day_idx < self.num_days):
#                     continue

#                 pool = pref["pool"]
#                 shift = pref["shift"]
#                 if shift == "V":
#                     code = self.VACATION
#                 elif shift == "O":
#                     code = self.DAY_OFF
#                 else:
#                     if shift not in self.pools_to_shifts.get(pool, []):
#                         continue
#                     code = self._encode(pool, shift)
#                 preferred[int(emp), day_idx] = code

#         return preferred

#     @property
#     def preferred_shift_mask(self):
#         mask = np.zeros((self.num_employees, self.num_days), dtype=int)

#         for emp, by_day in self._preferred_shifts.items():
#             for day in by_day:
#                 day_idx = int(day)
#                 if 0 <= day_idx < self.num_days:
#                     mask[int(emp), day_idx] = 1

#         return mask

#     @property
#     def previous_schedule(self):
#         """History-only schedule: keeps only negative day indices from input."""
#         previous = np.ones((self.num_employees, self.num_days), dtype=int) * -1

#         for emp, by_day in self._previous_schedule.items():
#             for day, prev in by_day.items():
#                 raw_day_idx = int(day)
#                 if raw_day_idx >= 0:
#                     continue

#                 day_idx = self.num_days + raw_day_idx
#                 if not (0 <= day_idx < self.num_days):
#                     continue

#                 pool = prev["pool"]
#                 shift = prev["shift"]
#                 if shift == "V" and pool == 0:
#                     code = self.VACATION
#                 elif shift == "O" and pool == 0:
#                     code = self.DAY_OFF
#                 else:
#                     if shift not in self.pools_to_shifts.get(pool, []):
#                         continue
#                     code = self._encode(pool, shift)
#                 previous[int(emp), day_idx] = code

#         return previous
