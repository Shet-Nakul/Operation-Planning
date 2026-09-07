# pylint: disable
import random
from typing import Dict, List, Tuple


class NeighbourhoodExplorer:
    def __init__(self, task_data: Dict[str, Tuple[int, int, List[int]]]):
        self.task_data = task_data
        # Initialize private attributes to avoid pylint E0203 errors
        self._start_zones = None
        self._mode_change_probs = None
        self._mode_ratio = None
        self._infeasible_tasks = None
        self._feasible_tasks = None
        self._mode_change_tasks = None

    @property
    def start_zones(self) -> Dict[str, List[List[int]]]:
        if self._start_zones is not None:
            return self._start_zones
        self._start_zones = {
            task_id: [
                [0, starts // 4, starts // 2, 3 * starts // 4, starts - 1]
                for starts in starts_list
            ]
            for _, (task_id, _, starts_list) in self.feasible_tasks.items()
        }
        return self._start_zones

    @property
    def mode_change_probs(self) -> Dict[str, float]:
        if self._mode_change_probs is not None:
            return self._mode_change_probs
        avg_start_ranges = {
            task_id: sum(starts_list) / (len(starts_list) + 1)
            for _, (task_id, _, starts_list) in self.feasible_tasks.items()
        }
        self._mode_change_probs = {
            task_id: min(0.25, 1 / (1 + avg_range / 50))
            for task_id, avg_range in avg_start_ranges.items()
        }
        return self._mode_change_probs

    @property
    def mode_ratio(self) -> float:
        if self._mode_ratio is not None:
            return self._mode_ratio
        self._mode_ratio = len(self.mode_change_tasks) / len(self.feasible_tasks)
        return self._mode_ratio

    @property
    def infeasible_tasks(self) -> Dict[str, Tuple[str, int, List[int]]]:
        if self._infeasible_tasks is not None:
            return self._infeasible_tasks
        self._infeasible_tasks = {
            task_id: (task_id, mode_count, starts)
            for task_id, (task_id, mode_count, starts) in self.task_data.items()
            if mode_count == 0
        }
        return self._infeasible_tasks

    @property
    def feasible_tasks(self) -> Dict[str, Tuple[str, int, List[int]]]:
        if self._feasible_tasks is not None:
            return self._feasible_tasks
        self._feasible_tasks = {
            task_id: (task_id, mode_count, starts)
            for task_id, (task_id, mode_count, starts) in self.task_data.items()
            if mode_count > 0
        }
        return self._feasible_tasks

    @property
    def mode_change_tasks(self) -> List[str]:
        if self._mode_change_tasks is not None:
            return self._mode_change_tasks
        self._mode_change_tasks = [
            task_id
            for task_id, (_, num_modes, _) in self.feasible_tasks.items()
            if num_modes > 1
        ]
        return self._mode_change_tasks

    def initial_execution_plan(self) -> Tuple[Tuple[str, int, int], ...]:
        """Generate initial execution plan with all tasks at mode 0, start 0"""
        ordered_tasks = sorted(self.feasible_tasks.values(), key=lambda x: x[0])
        return tuple((task_id, 0, 0) for task_id, _, _ in ordered_tasks)

    def random_execution_plan(self) -> Tuple[Tuple[str, int, int], ...]:
        """Generate random execution plan with random modes and start times"""
        plan = []
        for task_id, (task_id, num_modes, starts) in self.feasible_tasks.items():
            mode = random.randint(0, num_modes - 1)
            start = random.choice(starts)
            plan.append((task_id, mode, start))
        random.shuffle(plan)
        return tuple(plan)

    def task_neighbour(self, plan: List) -> Tuple[Tuple, Tuple]:
        plan = list(plan)
        random_val = random.random()

        if random_val < 0.4:  # Insert: move task to different position
            i, j = random.sample(range(len(plan)), 2)
            task = plan.pop(i)
            plan.insert(j, task)
        elif random_val < 0.7:  # Swap: exchange two tasks
            i, j = random.sample(range(len(plan)), 2)
            plan[i], plan[j] = plan[j], plan[i]
        else:  # Two-opt: reverse a segment
            i, j = sorted(random.sample(range(len(plan)), 2))
            plan[i : j + 1] = reversed(plan[i : j + 1])

        return tuple(plan)

    def mode_neighbour(self, plan: List, task_id: str) -> Tuple[Tuple, Tuple]:
        if not self.mode_change_tasks:
            return tuple(plan)

        plan = list(plan)
        task_index = next(idx for idx, (tid, _, _) in enumerate(plan) if tid == task_id)

        _, num_modes, _ = self.feasible_tasks[task_id]
        _, current_mode, _ = plan[task_index]

        if random.random() < self.mode_change_probs[task_id]:
            available_modes = [m for m in range(num_modes) if m != current_mode]
            new_mode = random.choice(available_modes)
            plan[task_index] = (task_id, new_mode, 0)
            return tuple(plan)

        return tuple(plan)

    def start_neighbour(self, plan: List) -> Tuple[Tuple, Tuple]:
        """Generate a start time neighbor"""
        plan = list(plan)
        i = random.randrange(len(plan))
        task_id, mode, current_start = plan[i]

        zones = self.start_zones[task_id][mode]

        random_val = random.random()
        if random_val < 0.4:
            new_start = random.choice(zones[1:4])
        elif random_val < 0.8:
            direction = random.choice([-1, 1])
            step = max(1, zones[-1] // 20)
            new_start = current_start + direction * step
            new_start = max(0, min(new_start, zones[-1]))
        else:
            new_start = random.randint(0, zones[-1])

        plan[i] = (task_id, mode, new_start)
        return tuple(plan)

    def search_neighbour(
        self, plan: Tuple[Tuple[str, int, int], ...], exploration: bool = True
    ) -> Tuple[Tuple[str, int, int], ...]:
        if exploration:
            if random.random() < 0.05:
                return self.random_execution_plan()
            return self.task_neighbour(list(plan))

        if not self.mode_change_tasks:
            return self.start_neighbour(list(plan))

        task_id = random.choice(self._mode_change_tasks)
        if random.random() < self.mode_change_probs[task_id]:
            return self.mode_neighbour(list(plan), task_id)

        return self.start_neighbour(list(plan))

    def generate_neighbours(
        self,
        plan: Tuple[Tuple[str, int, int], ...],
        neighbor_count: int,
        exploration: bool = True,
    ) -> List[Tuple[Tuple[str, int, int], ...]]:
        neighbours = []
        while len(neighbours) < neighbor_count:
            neighbor = self.search_neighbour(plan, exploration)
            neighbours.append(neighbor)
        return neighbours
