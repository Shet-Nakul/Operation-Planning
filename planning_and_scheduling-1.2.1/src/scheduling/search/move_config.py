from enum import IntEnum

import numpy as np

from scheduling.neighbours.utils import weighted_choice_index_njit
from scheduling.search.state_manager import StateManager


class MoveType(IntEnum):
    REASSIGNMENT = 0
    SWAPS = 1
    PATTERN = 2
    ZIG_ZAG = 3
    BLOCK = 4

    BLOCK_REASSIGNMENT = 5
    COVERAGE_REASSIGNMENT = 6
    PERTURBATION = 7
    RANDOM_ZIG_ZAG = 8


class MoveConfig:
    """Violation-guided move configuration.

    Infers the best move type based on whether coverage or assignment
    violations dominate for a given (employee, day) pair.
    """

    def __init__(self):
        self._MOVE_ORDER = [
            MoveType.REASSIGNMENT,
            MoveType.SWAPS,
            MoveType.PATTERN,
            MoveType.ZIG_ZAG,
            MoveType.BLOCK,
            MoveType.RANDOM_ZIG_ZAG,
        ]
        self._tabu_ = [0.25, 0.25, 0.15, 0.15, 0.10, 0.10]
        self._tabu_late_ = [0.35, 0.30, 0.15, 0.15, 0.03, 0.02]
        self._annealing_ = [0.1, 0.1, 0.15, 0.25, 0.25, 0.15]

    def select_move(self, state="tabu", progress=0.0):
        if state == "tabu":
            probs = self._tabu_late_ if progress > 0.5 else self._tabu_
            return MoveType(np.random.choice(self._MOVE_ORDER, p=probs))
        elif state == "annealing":
            return MoveType(np.random.choice(self._MOVE_ORDER, p=self._annealing_))
        else:
            return MoveType(np.random.choice(self._MOVE_ORDER))

    def select_employee_day(self, state_manager: StateManager):
        day = state_manager.coverage_penalty / (
            state_manager.coverage_penalty + state_manager.assignment_penalty
        )
        if np.random.rand() > day + 0.1:
            day = weighted_choice_index_njit(state_manager.coverage_penalties, 1)
            emp = weighted_choice_index_njit(state_manager.violation_matrix[:, day], 1)
        else:
            emp = weighted_choice_index_njit(state_manager.assignment_penalties, 1)
            day = weighted_choice_index_njit(state_manager.violation_matrix[emp], 1)
        return emp, day

    def generate_ls_config(
        self, state_manager: StateManager, n_samples=10, state="tabu", progress=0.0
    ):
        employee = []
        days = []
        move_types = []
        for _ in range(n_samples):
            emp, day = self.select_employee_day(state_manager)
            if emp not in employee:
                employee.append(emp)
                days.append(day)
                move_types.append(self.select_move(state, progress))
        return move_types, np.array(employee), np.array(days)

    def generate_lns_configs(self, state_manager: StateManager, n_samples=10):
        employee = []
        days = []
        for _ in range(n_samples):
            emp, day = self.select_employee_day(state_manager)
            if emp not in employee:
                employee.append(emp)
                days.append(day)
        move_types = MoveType(
            np.random.choice(
                [MoveType.BLOCK_REASSIGNMENT, MoveType.COVERAGE_REASSIGNMENT]
            )
        )
        return move_types, np.array(employee), np.array(days)
