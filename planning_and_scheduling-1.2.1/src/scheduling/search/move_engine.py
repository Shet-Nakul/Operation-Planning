from scheduling.dataloader.processor.factory import DataFactory
from scheduling.neighbours.small_neighbourhood.evaluators.block_swap import (
    evaluate_block_swap,
)
from scheduling.neighbours.small_neighbourhood.evaluators.reassignment import (
    evaluate_reassignment,
)
from scheduling.neighbours.small_neighbourhood.evaluators.swap import evaluate_swap
from scheduling.neighbours.small_neighbourhood.evaluators.zig_zag import (
    evaluate_zig_zag_swap,
)
from scheduling.neighbours.small_neighbourhood.executor.block_swap import (
    execute_block_swap,
)
from scheduling.neighbours.small_neighbourhood.executor.reassignment import (
    execute_reassignment,
)
from scheduling.neighbours.small_neighbourhood.executor.swap import execute_swap
from scheduling.neighbours.small_neighbourhood.executor.zig_zag import (
    execute_zig_zag_swap,
)
from scheduling.neighbours.small_neighbourhood.generators.block_swap import (
    random_intraday_swaps,
)
from scheduling.neighbours.small_neighbourhood.generators.reassignment import (
    pattern_based_reassignment,
    random_reassignment,
)
from scheduling.neighbours.small_neighbourhood.generators.swap import random_swaps
from scheduling.neighbours.small_neighbourhood.generators.zig_zag import (
    random_zig_zag_swaps,
    zig_zag_swaps,
)
from scheduling.search.state_manager import StateManager


class MoveGenerator:
    def __init__(self, data_factory: DataFactory, max_operations=10, max_block_size=3):
        self._num_of_days = data_factory.num_days
        self._num_of_employees = data_factory.num_employees
        self._pool_shift = data_factory.pool_shift
        self._employee_shift_table = data_factory.employee_shift_table
        self._intraday_swap_pairs = data_factory.intraday_swap_pairs
        self._shift_swap_pairs = data_factory.shift_swap_pairs
        self._shift_swap_pair_mask = data_factory.shift_swap_pair_mask
        self._forbidden_patterns = data_factory.forbidden_patterns
        self._max_operations = max_operations
        self._max_block_size = max_block_size

    def generate(self, state_manager: StateManager, config: tuple):
        move_type, target_employee, target_day = config
        schedule_matrix = state_manager.schedule_matrix

        if move_type.name == "REASSIGNMENT":
            return random_reassignment(
                schedule_matrix,
                target_employee,
                target_day,
                self._employee_shift_table,
                self._num_of_days,
                self._max_operations,
            )
        elif move_type.name == "PATTERN":
            return pattern_based_reassignment(
                schedule_matrix,
                target_employee,
                self._employee_shift_table,
                self._forbidden_patterns,
                self._num_of_days,
                self._max_operations,
            )
        elif move_type.name == "ZIG_ZAG":
            return zig_zag_swaps(
                schedule_matrix,
                target_employee,
                target_day,
                self._shift_swap_pairs,
                self._shift_swap_pair_mask,
                self._num_of_days,
                self._max_operations,
            )

        elif move_type.name == "RANDOM_ZIG_ZAG":
            return random_zig_zag_swaps(
                self._intraday_swap_pairs, self._num_of_days, self._max_operations
            )

        elif move_type.name == "BLOCK":
            return random_intraday_swaps(
                self._intraday_swap_pairs,
                self._num_of_days,
                self._max_block_size,
                self._max_operations,
            )
        elif move_type.name == "SWAPS":
            return random_swaps(
                schedule_matrix,
                target_day,
                self._pool_shift,
                self._shift_swap_pairs,
                self._shift_swap_pair_mask,
                self._max_operations,
            )
        else:
            raise ValueError(f"Unknown move type: {move_type}")


class MoveEvaluator:
    def __init__(self, data_factory: DataFactory):
        self._contract_constraints_tensor = data_factory.contract_constraints_tensor
        self._employee_contract_ids = data_factory.employee_contract_ids
        self._coverage_requirements_matrix = data_factory.coverage_requirements_matrix
        self._pool_shift_weights_matrix = data_factory.pool_shift_weights_matrix
        self._employee_probability_matrix = data_factory.employee_probability_matrix
        self._prefered_pool = data_factory.prefered_pool
        self._prefered_shift = data_factory.prefered_shift
        self._preference_weight = data_factory.preference_weight
        self._weekend_pairs = data_factory.weekend_pairs
        self._vacation_shift_id = data_factory.vacation_shift_id
        self._off_shift_id = data_factory.off_shift_id
        self._night_shift_id = data_factory.night_shift_id

        self._previous_schedule = data_factory.previous_schedule
        self._last_working_block_counts = data_factory.last_working_block_counts
        self._last_free_block_counts = data_factory.last_free_block_counts
        self._consecutive_working_weekends = data_factory.consecutive_working_weekends
        self._friday_offset = data_factory.friday_offset
        self._saturday_offset = data_factory.saturday_offset

    def evaluate(self, state_manager: StateManager, config: tuple, move: tuple):
        move_type, _, _ = config
        sch_mat = state_manager.schedule_matrix
        assig_pens = state_manager.assignment_penalties
        cov_pens = state_manager.coverage_penalties

        if move_type.name == "REASSIGNMENT" or move_type.name == "PATTERN":
            op_count, sel_emps, sel_shifts, sel_days = move
            return evaluate_reassignment(
                sch_mat,
                assig_pens,
                cov_pens,
                op_count,
                sel_emps,
                sel_shifts,
                sel_days,
                self._contract_constraints_tensor,
                self._employee_contract_ids,
                self._coverage_requirements_matrix,
                self._pool_shift_weights_matrix,
                self._employee_probability_matrix,
                self._prefered_pool,
                self._prefered_shift,
                self._preference_weight,
                self._weekend_pairs,
                self._vacation_shift_id,
                self._off_shift_id,
                self._night_shift_id,
                self._previous_schedule,
                self._last_working_block_counts,
                self._last_free_block_counts,
                self._consecutive_working_weekends,
                self._friday_offset,
                self._saturday_offset,
            )

        elif move_type.name == "ZIG_ZAG" or move_type.name == "RANDOM_ZIG_ZAG":
            op_count, sel_a_emps, sel_b_emps, rea_a_days, rea_b_days = move
            return evaluate_zig_zag_swap(
                sch_mat,
                assig_pens,
                cov_pens,
                op_count,
                sel_a_emps,
                sel_b_emps,
                rea_a_days,
                rea_b_days,
                self._contract_constraints_tensor,
                self._employee_contract_ids,
                self._coverage_requirements_matrix,
                self._pool_shift_weights_matrix,
                self._employee_probability_matrix,
                self._prefered_pool,
                self._prefered_shift,
                self._preference_weight,
                self._weekend_pairs,
                self._vacation_shift_id,
                self._off_shift_id,
                self._night_shift_id,
                self._previous_schedule,
                self._last_working_block_counts,
                self._last_free_block_counts,
                self._consecutive_working_weekends,
                self._friday_offset,
                self._saturday_offset,
            )

        elif move_type.name == "BLOCK":
            op_count, sel_a_emps, sel_b_emps, rea_a_days, rea_b_days = move
            return evaluate_block_swap(
                sch_mat,
                assig_pens,
                op_count,
                sel_a_emps,
                sel_b_emps,
                rea_a_days,
                rea_b_days,
                self._contract_constraints_tensor,
                self._employee_contract_ids,
                self._pool_shift_weights_matrix,
                self._employee_probability_matrix,
                self._prefered_pool,
                self._prefered_shift,
                self._preference_weight,
                self._weekend_pairs,
                self._vacation_shift_id,
                self._off_shift_id,
                self._night_shift_id,
                self._previous_schedule,
                self._last_working_block_counts,
                self._last_free_block_counts,
                self._consecutive_working_weekends,
                self._friday_offset,
                self._saturday_offset,
            )

        elif move_type.name == "SWAPS":
            op_count, sel_a_emps, sel_b_emps, rea_days = move
            return evaluate_swap(
                sch_mat,
                assig_pens,
                op_count,
                sel_a_emps,
                sel_b_emps,
                rea_days,
                self._contract_constraints_tensor,
                self._employee_contract_ids,
                self._pool_shift_weights_matrix,
                self._employee_probability_matrix,
                self._prefered_pool,
                self._prefered_shift,
                self._preference_weight,
                self._weekend_pairs,
                self._vacation_shift_id,
                self._off_shift_id,
                self._night_shift_id,
                self._previous_schedule,
                self._last_working_block_counts,
                self._last_free_block_counts,
                self._consecutive_working_weekends,
                self._friday_offset,
                self._saturday_offset,
            )
        else:
            raise ValueError(f"Unknown move type: {move_type}")


class MoveExecutor:
    def __init__(self):
        self._executors = {
            "REASSIGNMENT": execute_reassignment,
            "PATTERN": execute_reassignment,
            "ZIG_ZAG": execute_zig_zag_swap,
            "RANDOM_ZIG_ZAG": execute_zig_zag_swap,
            "BLOCK": execute_block_swap,
            "SWAPS": execute_swap,
        }

    def execute(
        self,
        state_manager: StateManager,
        config: tuple,
        moves: tuple,
        best_move_info: tuple,
    ):
        move_type, _, _ = config
        executor_fn = self._executors[move_type.name]

        result = executor_fn(
            state_manager.schedule_matrix,
            state_manager.assignment_penalties,
            state_manager.coverage_penalties,
            state_manager.assignment_penalty,
            state_manager.coverage_penalty,
            *moves,
            *best_move_info,
        )

        return result
