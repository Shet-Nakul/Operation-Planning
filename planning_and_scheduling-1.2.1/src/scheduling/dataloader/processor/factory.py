import numpy as np

from scheduling.dataloader.processor.history import History
from scheduling.dataloader.processor.processor import DataProcessor
from scheduling.neighbours.tables import MoveTableFactory


class DataFactory:
    def __init__(self, raw_data):
        self.raw_data = raw_data
        self._process_data()
        self._build_move_tables()
        self._build_previous_schedule()

    def _process_data(self):

        data_processor = DataProcessor(self.raw_data)
        self.start_day_idx = data_processor.start_day_index
        self.num_days = data_processor.num_of_days
        self.num_employees = data_processor.num_of_employees
        self.num_shifts = data_processor.num_of_pool_shift
        self.shift_to_value = data_processor.shift_codes
        self.off_pool_shift_day = data_processor.day_off
        self.vacation_shift_day = data_processor.vacation
        self.off_shift_id = data_processor.shift_codes["O"]
        self.vacation_shift_id = data_processor.shift_codes["V"]
        self.night_shift_id = data_processor.shift_codes["N"]
        self.weekend_pairs = data_processor.weekend_pairs
        self.previous_weekend_pairs = data_processor.past_week_pairs
        self.pool_shift = np.array(data_processor.pool_shifts_codes)

        self.employee_assignment_matrix = data_processor.employee_assignment_matrix
        self.employee_probability_matrix = (
            data_processor.employee_assignment_fraction_matrix
        )

        self.pool_shift_weights_matrix = data_processor.pool_shift_weights_matrix
        self.coverage_requirements_matrix = data_processor.demand_matrix
        self.contract_constraints_tensor = data_processor.contract_constraints_tensor
        self.employee_contract_ids = data_processor.employees_contract_id
        self.preferred_schedule = data_processor.preferred_schedule
        self.prefered_pool = data_processor.preferred_schedule_pool
        self.prefered_shift = data_processor.preferred_schedule_shift
        self.preference_weight = data_processor.preferred_schedule_matrix_weight
        self.full_previous_schedule = data_processor.previous_schedule_matrix

    def _build_move_tables(self):
        """Build optimized move tables for high-performance move generation"""
        move_tables = MoveTableFactory(
            self.pool_shift,
            self.employee_assignment_matrix,
            self.employee_probability_matrix,
            self.contract_constraints_tensor[0],
        )
        self.employee_shift_table = move_tables.employee_shift_table
        self.employee_shift_probability_table = (
            move_tables.employee_shift_probability_table
        )
        self.shift_swap_pairs = move_tables.shift_swap_pairs
        self.shift_swap_pair_mask = move_tables.shift_swap_pair_mask
        self.intraday_swap_pairs = move_tables.intraday_swap_pairs
        self.forbidden_patterns = move_tables.forbidden_patterns

    def _build_previous_schedule(self):
        """Pre-process previous schedule for quick access during optimization"""
        history = History(
            self.full_previous_schedule,
            self.start_day_idx,
            self.off_shift_id,
            self.vacation_shift_id,
        )
        history.build()
        self.friday_offset = history.friday_offset
        self.saturday_offset = history.saturday_offset
        self.last_working_block_counts = history.last_working_block_counts
        self.last_free_block_counts = history.last_free_block_counts
        self.consecutive_working_weekends = history.consecutive_working_weekends
        self.previous_schedule = history.continuity_assignment
