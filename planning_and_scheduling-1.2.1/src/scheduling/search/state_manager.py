import numpy as np

from scheduling.constraints.schedule.penalty import calculate_penalty
from scheduling.dataloader.processor.factory import DataFactory
from scheduling.neighbours.large_neighbourhood.generator import (
    block_reassignment,
    coverage_reassignment,
    perturbation,
)
from scheduling.search.targeting import build_violation_matrix


def heuristic_schedule(
    num_employees,
    num_days,
    employee_shift_table,
    contract_constraints_tensor,
    employee_contract_ids,
    off_shift_id,
):
    schedule = np.full((num_employees, num_days), off_shift_id, dtype=np.int32)

    for emp in range(num_employees):
        contract_id = employee_contract_ids[emp]
        constraints = contract_constraints_tensor[contract_id]

        max_consec_work = int(constraints[6, 4])
        min_consec_work = int(constraints[7, 4])
        max_consec_free = int(constraints[8, 4])
        min_consec_free = int(constraints[9, 4])

        # # Get working shifts only
        valid_count = int(employee_shift_table[emp, 0])
        shifts = employee_shift_table[emp, 1 : valid_count + 1]
        work_shifts = shifts[shifts != off_shift_id]

        if len(work_shifts) == 0:
            continue

        # Random starting shift, then cycle
        start = np.random.randint(0, len(work_shifts))

        day = 0
        shift_idx = start
        while day < num_days:
            # Pick next shift in cycle
            chosen_shift = work_shifts[shift_idx % len(work_shifts)]
            shift_idx += 1

            # Random block length between min and max consecutive work
            block_len = np.random.randint(min_consec_work, max_consec_work + 1)
            end_work = min(day + block_len, num_days)
            schedule[emp, day:end_work] = chosen_shift
            day = end_work

            if day >= num_days:
                break

            # Random off length between min and max consecutive free
            off_len = np.random.randint(min_consec_free, max_consec_free + 1)
            day += off_len

    # Rotate each employee's schedule by a random offset for coverage spread
    for emp in range(num_employees):
        offset = np.random.randint(0, num_days)
        schedule[emp] = np.roll(schedule[emp], offset)

    return schedule


class StateManager:
    def __init__(self, data_factory: DataFactory):
        self.data_factory = data_factory

    def _add_preference_schedule(self, schedule):
        for emp in range(self.data_factory.num_employees):
            for day in range(self.data_factory.num_days):
                pool_shift = self.data_factory.preferred_schedule.get(emp, {}).get(day)
                if pool_shift is not None:
                    schedule[emp, day] = pool_shift
        return schedule

    def _off_day_strategy(self):
        schedule = (
            np.ones(
                (self.data_factory.num_employees, self.data_factory.num_days),
                dtype=np.int32,
            )
            * self.data_factory.off_pool_shift_day
        )
        schedule = self._add_preference_schedule(schedule)
        return schedule

    def _random_strategy(self):
        schedule = (
            np.ones(
                (self.data_factory.num_employees, self.data_factory.num_days),
                dtype=np.int32,
            )
            * self.data_factory.off_pool_shift_day
        )
        for emp in range(self.data_factory.num_employees):
            for day in range(self.data_factory.num_days):
                valid_count = self.data_factory.employee_shift_table[emp, 0]
                shift = np.random.choice(
                    self.data_factory.employee_shift_table[emp, 1 : valid_count + 1]
                )
                schedule[emp, day] = shift
        schedule = self._add_preference_schedule(schedule)
        return schedule

    def _get_schedule(self, strategy="off_day"):
        if strategy == "off_day":
            return self._off_day_strategy()
        if strategy == "random":
            return self._random_strategy()
        if strategy == "heuristic":
            return self._heuristic_strategy()
        raise ValueError(f"Unknown strategy: {strategy}")

    def _heuristic_strategy(self):
        schedule = heuristic_schedule(
            num_employees=self.data_factory.num_employees,
            num_days=self.data_factory.num_days,
            employee_shift_table=self.data_factory.employee_shift_table,
            contract_constraints_tensor=self.data_factory.contract_constraints_tensor,
            employee_contract_ids=self.data_factory.employee_contract_ids,
            off_shift_id=11,
        )
        return self._add_preference_schedule(schedule)

    def _calculate_total_penalties(self, schedule_matrix):
        self.schedule_matrix = schedule_matrix
        (
            self.assignment_penalties,
            self.coverage_penalties,
            self.assignment_penalty,
            self.coverage_penalty,
        ) = calculate_penalty(
            schedule_matrix,
            self.data_factory.contract_constraints_tensor,
            self.data_factory.employee_contract_ids,
            self.data_factory.coverage_requirements_matrix,
            self.data_factory.pool_shift_weights_matrix,
            self.data_factory.employee_probability_matrix,
            self.data_factory.prefered_pool,
            self.data_factory.prefered_shift,
            self.data_factory.preference_weight,
            self.data_factory.weekend_pairs,
            self.data_factory.vacation_shift_id,
            self.data_factory.off_shift_id,
            self.data_factory.night_shift_id,
            self.data_factory.previous_schedule,
            self.data_factory.last_working_block_counts,
            self.data_factory.last_free_block_counts,
            self.data_factory.consecutive_working_weekends,
            self.data_factory.friday_offset,
            self.data_factory.saturday_offset,
        )

    def update_state(
        self,
        schedule_matrix,
        assignment_penalties,
        coverage_penalties,
        assignment_penalty,
        coverage_penalty,
    ):

        self.schedule_matrix = schedule_matrix
        self.assignment_penalties = assignment_penalties
        self.coverage_penalties = coverage_penalties
        self.assignment_penalty = assignment_penalty
        self.coverage_penalty = coverage_penalty

    def get_state(self):
        return (
            self.schedule_matrix,
            self.assignment_penalties,
            self.coverage_penalties,
            self.assignment_penalty,
            self.coverage_penalty,
        )

    def _reset_state(self, schedule_matrix):
        self._calculate_total_penalties(schedule_matrix)
        self.reset_violation_matrix()

    def initialize_state(self, strategy="heuristic"):
        if strategy is None:
            strategy = np.random.choice(
                ["off_day", "random", "heuristic"], p=[0.05, 0.5, 0.45]
            )
        schedule_matrix = self._get_schedule(strategy)
        self._reset_state(schedule_matrix)

    @property
    def penalty(self):
        return self.assignment_penalty + self.coverage_penalty

    def resuffle(self, method, target_emp, target_days):
        if method.name == "COVERAGE_REASSIGNMENT":
            coverage_requirements_matrix = (
                self.data_factory.coverage_requirements_matrix
            )
            employee_shift_table = self.data_factory.employee_shift_table
            off_shift_id = self.data_factory.off_shift_id
            vacation_shift_id = self.data_factory.vacation_shift_id
            new_schedule = coverage_reassignment(
                self.schedule_matrix,
                coverage_requirements_matrix,
                employee_shift_table,
                target_days,
                off_shift_id,
                vacation_shift_id,
            )
            self._reset_state(new_schedule)
        elif method.name == "BLOCK_REASSIGNMENT":
            employee_shift_table = self.data_factory.employee_shift_table
            vacation_shift_id = self.data_factory.vacation_shift_id
            new_schedule = block_reassignment(
                self.schedule_matrix,
                employee_shift_table,
                target_emp,
                target_days,
                vacation_shift_id,
                max_block_size=3,
            )

            self._reset_state(new_schedule)
        elif method.name == "PERTURBATION":
            schedule = np.copy(self.schedule_matrix)
            employee_shift_table = self.data_factory.employee_shift_table
            vacation_shift_id = self.data_factory.vacation_shift_id
            new_schedule = perturbation(
                schedule,
                employee_shift_table,
                vacation_shift_id=vacation_shift_id,
                fraction=0.25,
            )
            self._reset_state(new_schedule)
        else:
            raise ValueError(f"Unknown resuffle method: {method}")

    def reset_violation_matrix(self):
        self.violation_matrix = build_violation_matrix(
            self.schedule_matrix,
            self.data_factory.contract_constraints_tensor,
            self.data_factory.employee_contract_ids,
            self.data_factory.off_shift_id,
            self.data_factory.vacation_shift_id,
            self.data_factory.night_shift_id,
            self.data_factory.weekend_pairs,
            self.data_factory.num_employees,
            self.data_factory.num_days,
            self.data_factory.coverage_requirements_matrix,
            self.data_factory.pool_shift_weights_matrix,
            self.data_factory.previous_schedule,
            self.data_factory.last_working_block_counts,
            self.data_factory.last_free_block_counts,
            self.data_factory.consecutive_working_weekends,
            self.data_factory.friday_offset,
            self.data_factory.saturday_offset,
        )
