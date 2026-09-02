from itertools import combinations

import numpy as np


class MoveTableFactory:
    """Builds pre-computed lookup tables for move generation in roster optimization."""

    def __init__(
        self,
        pool_shift,
        employee_assignment_matrix,
        employee_probability_matrix,
        contract_constraints_matrix,
    ):
        self.pool_shift = pool_shift
        self.num_shifts = len(pool_shift)
        self.num_employees = employee_assignment_matrix.shape[1]
        self.assignment_matrix = employee_assignment_matrix
        self.probability_matrix = employee_probability_matrix
        self.constraint_matrix = contract_constraints_matrix

        self.employee_shift_table = self._build_employee_shift_table()
        self.employee_shift_probability_table = (
            self._build_employee_shift_probability_table()
        )
        shift_swap_table = self._build_shift_swap_table()
        self.shift_swap_pairs = shift_swap_table[0]
        self.shift_swap_pair_mask = shift_swap_table[3]
        self.intraday_swap_pairs = self._build_intraday_swap_pairs()
        self.forbidden_patterns = self._extract_forbidden_patterns()

    def _build_employee_shift_table(self):
        """Per-employee lookup: col 0 = count of valid shifts, cols 1..N = pool_shift values."""
        num_shifts, num_employees = self.assignment_matrix.shape
        table = np.full((num_employees, num_shifts + 1), -1, dtype=int)

        for emp in range(num_employees):
            valid_shift_indices = np.where(self.assignment_matrix[:, emp] == 1)[0]
            count = valid_shift_indices.size
            table[emp, 0] = count
            table[emp, 1 : count + 1] = self.pool_shift[valid_shift_indices]

        return table

    def _build_employee_shift_probability_table(self):
        """Per-employee shift probability table: col 0 = count of valid shifts, cols 1..N = probabilities."""
        num_shifts, num_employees = self.assignment_matrix.shape
        table = np.full((num_employees, num_shifts + 1), -1.0, dtype=float)

        for emp in range(num_employees):
            valid_shift_indices = np.where(self.assignment_matrix[:, emp] == 1)[0]
            count = valid_shift_indices.size
            table[emp, 0] = count
            table[emp, 1 : count + 1] = self.probability_matrix[:, emp][
                valid_shift_indices
            ]

        return table

    def _build_intraday_swap_pairs(self):
        """Find employee pairs with identical shift eligibility — can swap shifts across days."""
        pairs = []
        for i in range(self.num_employees):
            for j in range(i + 1, self.num_employees):
                if np.array_equal(
                    self.assignment_matrix[:, i], self.assignment_matrix[:, j]
                ):
                    pairs.append((i, j))

        return np.array(pairs, dtype=int).reshape(-1, 2)

    def _build_shift_swap_table(self):
        """Build shift-pair swap candidates where >= 2 employees can perform both shifts."""
        num_shifts, num_employees = self.assignment_matrix.shape

        valid_pairs = []
        max_eligible_count = 0

        for sa, sb in combinations(range(num_shifts), 2):
            eligible_employees = [
                emp
                for emp in range(num_employees)
                if self.assignment_matrix[sa, emp] == 1
                and self.assignment_matrix[sb, emp] == 1
            ]
            if len(eligible_employees) > 1:
                valid_pairs.append((sa, sb, eligible_employees))
                max_eligible_count = max(max_eligible_count, len(eligible_employees))

        if not valid_pairs:
            return (
                np.empty((0, 2), dtype=int),
                np.empty((0,), dtype=int),
                np.empty((0, 0), dtype=int),
                np.empty((0, 0), dtype=bool),
            )

        num_pairs = len(valid_pairs)
        pair_shifts = np.full((num_pairs, 2), -1, dtype=int)
        pair_counts = np.full(num_pairs, -1, dtype=int)
        pair_employees = np.full((num_pairs, max_eligible_count), -1, dtype=int)
        pair_mask = np.zeros((num_pairs, num_employees), dtype=bool)

        for idx, (sa, sb, eligible) in enumerate(valid_pairs):
            pair_shifts[idx] = [self.pool_shift[sa], self.pool_shift[sb]]
            pair_counts[idx] = len(eligible)
            pair_employees[idx, : len(eligible)] = eligible
            pair_mask[idx, eligible] = True

        return pair_shifts, pair_counts, pair_employees, pair_mask

    def _extract_forbidden_patterns(self):
        """Extract forbidden shift patterns from encoded constraint matrix."""
        is_pattern = self.constraint_matrix[:, 0] == 2
        is_active = self.constraint_matrix[:, 1] == 1
        pattern_rows = self.constraint_matrix[is_pattern & is_active][:, 5:]
        return pattern_rows

    # def _build_move_restriction_mask(self):
    #     """build a mask based on the preference
    #     pass
