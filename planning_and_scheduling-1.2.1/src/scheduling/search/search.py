import math
import random

import numpy as np

from scheduling.neighbours.utils import encode_move


class HybridTabuSimulatedAnnealing:
    """Hybrid optimization algorithm combining Tabu Search and Simulated Annealing"""

    def __init__(
        self,
        tabu_tenure=100,
        switch_threshold=1000,
        initial_temp=50.0,
        min_temp=0.1,
        annealing_duration=200,
        random_restart_interval=3,
        improvement_threshold=0.001,
        max_iterations=100000,
        restart_strategy="adaptive_sigmoid",
    ):
        self.current_iteration = 0
        self.mode = "tabu"

        # Tabu search parameters
        self.tabu_tenure = tabu_tenure
        self.tabu_dict = {}

        # Simulated annealing parameters
        self.initial_temp = initial_temp
        self.temperature = initial_temp
        self.min_temp = min_temp
        self.cooling_rate = (min_temp / initial_temp) ** (1.0 / annealing_duration)

        # Hybrid control
        self._switch_threshold_start = max(1, switch_threshold // 3)
        self._switch_threshold_end = switch_threshold
        self.switch_threshold = self._switch_threshold_start
        self.iterations_no_improvement = 0
        self.annealing_duration = annealing_duration
        self.annealing_countdown = 0
        self.random_restart_interval = random_restart_interval
        self.improvement_threshold = improvement_threshold

        # Restart strategy config
        self._restart_strategy = restart_strategy
        self._max_iterations = max_iterations
        self._estimated_total_switches = max_iterations // (
            switch_threshold + annealing_duration
        )

        # Best solution tracking
        self.best_penalty = float("inf")
        self.best_solution = None

        # Statistics
        self.improvements = 0
        self.mode_switches = 0
        self.annealing_entries = 0
        self.consecutive_switches_no_improvement = 0
        self.needs_base_reset = False
        self.needs_random_restart = False
        self.needs_full_random_restart = False

    def _encode_move(self, config, moves, best_move_info):
        return encode_move(config, moves, best_move_info)

    def _prune_tabu_dict(self):
        expired = [
            k
            for k, v in self.tabu_dict.items()
            if self.current_iteration - v >= self.tabu_tenure
        ]
        for k in expired:
            del self.tabu_dict[k]

    def is_tabu(self, config, moves, best_move_info):
        if self.mode == "annealing":
            return False
        encoding = self._encode_move(config, moves, best_move_info)
        if encoding in self.tabu_dict:
            if self.current_iteration - self.tabu_dict[encoding] >= self.tabu_tenure:
                del self.tabu_dict[encoding]
                return False
            return True
        return False

    def add_to_tabu(self, config, moves, best_move_info):
        encoding = self._encode_move(config, moves, best_move_info)
        self.tabu_dict[encoding] = self.current_iteration

    def should_accept_move(
        self, config, moves, best_move_info, current_penalty, best_delta
    ):
        """Determine if the move should be accepted."""
        projected_penalty = current_penalty + best_delta

        if self.mode == "tabu":
            is_tabu_move = self.is_tabu(config, moves, best_move_info)
            if projected_penalty < self.best_penalty:
                return True
            if is_tabu_move:
                return False
            return best_delta <= 0
        else:
            if best_delta <= 0:
                return True
            if self.temperature <= self.min_temp:
                return False
            probability = math.exp(-best_delta / self.temperature)
            return random.random() < probability

    def register_accepted_move(self, config, moves, best_move_info):
        """Register an accepted move (add to tabu list)."""
        self.add_to_tabu(config, moves, best_move_info)

    def update_best(self, state_manager, penalty):
        """Update best solution tracking. Returns True if improved."""
        if penalty < self.best_penalty:
            # Only reset stagnation counter for significant improvements
            relative_improvement = (self.best_penalty - penalty) / (
                self.best_penalty + 1e-8
            )
            if relative_improvement > self.improvement_threshold:
                self.iterations_no_improvement = 0
                self.consecutive_switches_no_improvement = 0
            self.best_penalty = penalty
            self.best_solution = np.copy(state_manager.schedule_matrix)
            self.improvements += 1
            return True
        return False

    def _should_random_restart(self):
        """Determine whether to random restart based on configured strategy.

        Strategies:
          - 'fixed_interval': restart every N-th annealing entry (original behavior)
          - 'adaptive_sigmoid': sigmoid curve, explore early → exploit late
          - 'always_restart': always random restart
          - 'always_reset': always reset to best
        """
        if self._restart_strategy == "fixed_interval":
            return self.annealing_entries % self.random_restart_interval == 0

        elif self._restart_strategy == "always_restart":
            return True

        elif self._restart_strategy == "always_reset":
            return False

        else:  # adaptive_sigmoid (default)
            if self._estimated_total_switches <= 0:
                return self.annealing_entries % self.random_restart_interval == 0
            progress = self.annealing_entries / self._estimated_total_switches
            restart_prob = 0.9 - 0.8 * (1.0 / (1.0 + math.exp(-10 * (progress - 0.5))))
            return random.random() < restart_prob

    def step(self):
        """Advance iteration, handle mode switching and temperature updates."""
        self.current_iteration += 1
        self.iterations_no_improvement += 1
        self.needs_base_reset = False
        self.needs_random_restart = False
        self.needs_full_random_restart = False

        # Adaptive switch threshold: small early (switch often), large late (exploit longer)
        p = self.progress
        self.switch_threshold = round(
            self._switch_threshold_start
            + (self._switch_threshold_end - self._switch_threshold_start) * p
        )

        if (
            self.mode == "tabu"
            and self.iterations_no_improvement >= self.switch_threshold
        ):
            self.mode = "annealing"
            self.temperature = self.initial_temp
            self.annealing_countdown = self.annealing_duration
            self.mode_switches += 1
            self.annealing_entries += 1
            self.consecutive_switches_no_improvement += 1
            self._prune_tabu_dict()

            # Perturbation threshold scales with progress: easy early, very hard late
            # Early: 250 switches → perturb. Late (>70%): effectively disabled (2500+)
            perturbation_threshold = round(250 + 2250 * p * p)

            if self.consecutive_switches_no_improvement >= perturbation_threshold:
                self.needs_full_random_restart = True
                self.consecutive_switches_no_improvement = 0
                self.tabu_dict.clear()
            elif self._should_random_restart():
                self.needs_random_restart = True
                self.tabu_dict.clear()
            else:
                self.needs_base_reset = True
                self.tabu_dict.clear()

        elif self.mode == "annealing":
            self.annealing_countdown -= 1
            self.temperature = max(self.min_temp, self.temperature * self.cooling_rate)
            if self.annealing_countdown <= 0:
                self.mode = "tabu"
                self.iterations_no_improvement = 0
                self.mode_switches += 1

        if self.current_iteration % 1000 == 0:
            self._prune_tabu_dict()

    @property
    def progress(self):
        """Search progress as a ratio [0, 1] based on iteration / max_iterations."""
        return min(1.0, self.current_iteration / self._max_iterations)

    def get_status_info(self):
        if self.mode == "tabu":
            return f"TABU (stuck={self.iterations_no_improvement}, tabu_size={len(self.tabu_dict)})"
        return f"ANNEALING (T={self.temperature:.2f}, countdown={self.annealing_countdown})"
