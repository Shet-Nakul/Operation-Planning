import numpy as np

from scheduling.dataloader.processor.enums import ShiftEnum
from scheduling.dataloader.processor.models import AssignmentConstraint


class AssignmentConstraintsEncoder:
    COMMON_DIMS = 6

    def __init__(self, constraints_raw: list):
        self.constraints = [AssignmentConstraint(**c) for c in constraints_raw]
        self.num_constraints = len(self.constraints)
        self.pattern_dims = max(
            (len(c.pattern) for c in self.constraints if c.pattern is not None),
            default=0,
        )

    @property
    def encoding(self):
        return self._encode()

    def _encode(self):
        total_dims = self.COMMON_DIMS + self.pattern_dims
        matrix = np.full((self.num_constraints, total_dims), -1, dtype=np.int32)
        for c in self.constraints:
            row = matrix[c.id]
            row[0] = c.type
            row[1] = int(c.active)
            row[2] = int(c.hard)
            row[3] = c.weight
            if c.type == 1:
                row[4] = c.value
            elif c.type == 2:
                row[5] = len(c.pattern)
                for j, shift in enumerate(c.pattern):
                    row[self.COMMON_DIMS + j] = ShiftEnum[shift].value
        return matrix
