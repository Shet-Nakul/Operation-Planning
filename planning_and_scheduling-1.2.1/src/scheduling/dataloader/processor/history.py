import numpy as np


class History:
    def __init__(
        self,
        previous_schedule: np.ndarray,
        start_day: int,
        off_shift_id: int,
        vacation_shift_id: int,
        max_forbidden_pattern_length: int = 3,
    ):
        """
        Initialize the History class with the previous schedule and shift identifiers.

        :param previous_schedule: A numpy array representing the previous schedule.
        :param start_day: The start day index.

        :param off_shift_id: The ID representing an off shift.
        :param vacation_shift_id: The ID representing a vacation shift.
        :param max_forbidden_pattern_length: The maximum length of forbidden patterns to consider.
        """
        self.employee_num = previous_schedule.shape[0]
        self.previous_schedule = previous_schedule
        self.off_shift_id = off_shift_id
        self.vacation_shift_id = vacation_shift_id
        self.max_forbidden_pattern_length = max_forbidden_pattern_length
        self.start_day = start_day

    def _last_working_block_count(self, schedule: np.ndarray) -> int:
        """Count the number of consecutive working days at the end of the schedule."""
        count = 0
        for shift in reversed(schedule):
            if shift != self.off_shift_id and shift != self.vacation_shift_id:
                count += 1
            else:
                break
        return count

    def _last_free_block_count(self, schedule: np.ndarray) -> int:
        """Count the number of consecutive free days (off or vacation) at the end of the schedule."""
        count = 0
        for shift in reversed(schedule):
            if shift == self.off_shift_id or shift == self.vacation_shift_id:
                count += 1
            else:
                break
        return count

    def _consecutive_working_weekends(self, schedule: np.ndarray) -> int:
        """Count the number of consecutive working weekends at the end of the schedule."""
        count = 0
        weekend_pairs = self._trailing_weekend_pairs()
        for day1, day2 in weekend_pairs:
            if (
                schedule[day1] != self.off_shift_id
                and schedule[day1] != self.vacation_shift_id
                and schedule[day2] != self.off_shift_id
                and schedule[day2] != self.vacation_shift_id
            ):
                count += 1
            else:
                break
        return count

    def _trailing_weekend_pairs(self) -> np.ndarray:
        """Generate trailing weekend pairs from the previous schedule."""
        num_days = self.previous_schedule.shape[1]
        pairs = []
        for day in range(-num_days, 0):
            if (day - 1) % 7 == 5 and day + 1 < 0:  # Saturday-Sunday pairs
                pairs.append((day, day + 1))
        return np.array(pairs, dtype=np.int32)

    @property
    def friday_offset(self) -> int:
        """Calculate the Friday offset based on the start day index."""
        day = self.start_day % 7
        if day == 6:  # Sunday
            return 2
        if day == 5:  # Saturday
            return 1
        return 0

    @property
    def saturday_offset(self) -> int:
        """Calculate the Saturday offset based on the start day index."""
        day = self.start_day % 7
        return 1 if day == 6 else 0

    def build(self):
        self.last_working_block_counts = np.zeros((self.employee_num), dtype=np.float32)
        self.last_free_block_counts = np.zeros((self.employee_num), dtype=np.float32)
        self.consecutive_working_weekends = np.zeros(
            (self.employee_num), dtype=np.float32
        )
        for i in range(self.employee_num):
            previous_schedule = self.previous_schedule[i] % 10
            self.last_working_block_counts[i] = self._last_working_block_count(
                previous_schedule
            )
            self.last_free_block_counts[i] = self._last_free_block_count(
                previous_schedule
            )
            self.consecutive_working_weekends[i] = self._consecutive_working_weekends(
                previous_schedule
            )

        max_length = max(
            self.saturday_offset,
            self.friday_offset,
            self.max_forbidden_pattern_length - 1,
        )
        self.continuity_assignment = self.previous_schedule[:, -(max_length):]
