import importlib
import logging
import math
import time

import numpy as np

import scheduling.search.search as attr_mod
from scheduling.search.move_config import MoveType

importlib.reload(attr_mod)
from scheduling.search.cfg import SearchConfig
from scheduling.search.search import HybridTabuSimulatedAnnealing as AttributeHybrid

logger = logging.getLogger(__name__)


class AttributeOptimizer:
    """Optimizer using attribute-based (employee-centric) tabu encoding."""

    # ─── Initialization ───────────────────────────────────────────────────

    def __init__(
        self,
        state_manager,
        data_factory,
        move_config,
        move_generator,
        move_evaluator,
        move_executor,
        cfg: SearchConfig,
        progress_callback=None,
    ):
        self.sm = state_manager
        self.dp = data_factory
        self.mc = move_config
        self.mg = move_generator
        self.me = move_evaluator
        self.mx = move_executor
        self._progress_callback = progress_callback

        self._init_strategy = cfg.initialization.strategy
        self._max_minutes = cfg.search.max_minutes
        self._log_interval = cfg.logging.log_interval
        self._print_interval = cfg.logging.print_interval

        self._search_cfg = cfg.search
        self._moves_cfg = cfg.moves
        self._hybrid = None

        # Adaptive parameters: interpolated based on search progress
        self._n_samples_start = cfg.moves.n_samples
        self._n_samples_end = (
            cfg.moves.n_samples_end
            if cfg.moves.n_samples_end is not None
            else max(1, cfg.moves.n_samples // 3)
        )
        self._max_ops_start = (
            cfg.moves.max_operations_start
            if cfg.moves.max_operations_start is not None
            else max(1, cfg.moves.max_operations // 3)
        )
        self._max_ops_end = cfg.moves.max_operations
        self._adaptive_schedule = (
            cfg.search.adaptive_schedule
            if cfg.search.adaptive_schedule is not None
            else "linear"
        )

        # History for plotting
        self.history_assignment = []
        self.history_coverage = []

    def _create_engine(self):
        return AttributeHybrid(
            tabu_tenure=self._search_cfg.tabu_tenure,
            switch_threshold=self._search_cfg.switch_threshold,
            initial_temp=self._search_cfg.initial_temp,
            min_temp=self._search_cfg.min_temp,
            annealing_duration=(
                self._search_cfg.annealing_duration
                if self._search_cfg.annealing_duration is not None
                else 200
            ),
            random_restart_interval=self._search_cfg.random_restart_interval,
            improvement_threshold=self._search_cfg.improvement_threshold,
            max_iterations=self._search_cfg.max_iterations,
            restart_strategy=self._search_cfg.restart_strategy,
        )

    # ─── Adaptive Parameter Control ──────────────────────────────────────

    def _interpolate(self, start, end):
        """Interpolate between start and end based on progress and configured schedule."""
        p = self._hybrid.progress
        if self._adaptive_schedule == "fixed":
            return start
        elif self._adaptive_schedule == "sigmoid":
            p = 1.0 / (1.0 + math.exp(-10 * (p - 0.5)))
        return max(1, round(start + (end - start) * p))

    def _adaptive_n_samples(self):
        """Interpolate n_samples: high early (diverse), low late (focused)."""
        return self._interpolate(self._n_samples_start, self._n_samples_end)

    def _adaptive_max_operations(self):
        """Interpolate max_operations: low early (broad moves), high late (fine-grained)."""
        return self._interpolate(self._max_ops_start, self._max_ops_end)

    # ─── Move Search & Execution ─────────────────────────────────────────

    def _find_best_local_move(self):
        n_samples = self._adaptive_n_samples()
        self.mg._max_operations = self._adaptive_max_operations()

        samples = self.mc.generate_ls_config(
            self.sm,
            n_samples=n_samples,
            state=self._hybrid.mode,
            progress=self._hybrid.progress,
        )
        best_config = None
        best_moves = None
        best_move_info = None
        best_delta = float("inf")

        for s in range(len(samples[0])):
            move_type, emp, day = samples[0][s], samples[1][s], samples[2][s]
            config = (move_type, emp, day)
            moves = self.mg.generate(self.sm, config)
            move_info = self.me.evaluate(self.sm, config, moves)
            delta = move_info[1]

            if delta < best_delta:
                best_delta = delta
                best_config = config
                best_moves = moves
                best_move_info = move_info

        return best_config, best_moves, best_move_info, best_delta

    def _apply_move(
        self, best_config, best_moves, best_move_info, current_penalty, best_delta
    ):
        if self._hybrid.should_accept_move(
            best_config, best_moves, best_move_info, current_penalty, best_delta
        ):
            self._hybrid.register_accepted_move(best_config, best_moves, best_move_info)
            result = self.mx.execute(self.sm, best_config, best_moves, best_move_info)
            self.sm.update_state(*result)
            self._hybrid.update_best(self.sm, self.sm.penalty)

    def _escape(self):
        if self._hybrid.needs_full_random_restart:
            if self._hybrid.best_solution is not None:
                self.sm._reset_state(self._hybrid.best_solution)
            # Only perturb if early enough; late in search just reset to best
            if self._hybrid.progress < 0.7:
                self.sm.resuffle(MoveType.PERTURBATION, None, None)
        elif self._hybrid.needs_random_restart:
            if self._hybrid.progress < 0.7:
                move, emp, day = self.mc.generate_lns_configs(
                    self.sm, n_samples=self._moves_cfg.lns_samples
                )
                self.sm.resuffle(move, emp, day)
            elif self._hybrid.best_solution is not None:
                # Late: just reset to best instead of destructive LNS
                self.sm._reset_state(self._hybrid.best_solution)
        elif self._hybrid.needs_base_reset and self._hybrid.best_solution is not None:
            if self.sm.penalty > self._hybrid.best_penalty * 1.3:
                self.sm._reset_state(self._hybrid.best_solution)

    # ─── Logging & Reporting ─────────────────────────────────────────────

    def _budget_exceeded(self, start_time, iteration):
        if self._max_minutes is None:
            return False
        if (time.time() - start_time) > self._max_minutes * 60:
            logger.info(
                f"Time limit reached ({self._max_minutes} min) at iteration {iteration}"
            )
            return True
        return False

    def _report_progress(self, i, current_penalty, max_iterations):
        if i % self._print_interval != 0 or i == 0:
            return
        elapsed = time.time() - self._start_time
        progress_pct = (i / max_iterations) * 100
        iters_per_sec = i / elapsed if elapsed > 0 else 0
        n_samples = self._adaptive_n_samples()
        max_ops = self._adaptive_max_operations()
        temp = self._hybrid.temperature

        print(
            f"[{i:>7}/{max_iterations}] {progress_pct:5.1f}% | "
            f"penalty={current_penalty:.2f} best={self._hybrid.best_penalty:.2f} | "
            f"assign={self.sm.assignment_penalty:.2f} cover={self.sm.coverage_penalty:.2f} | "
            f"mode={self._hybrid.mode} temp={temp:.2f} | "
            f"stuck={self._hybrid.iterations_no_improvement} impr={self._hybrid.improvements} switches={self._hybrid.mode_switches} | "
            f"n_samples={n_samples} max_ops={max_ops} | "
            f"{elapsed:.0f}s ({iters_per_sec:.0f} it/s)"
        )

        if self._progress_callback:
            self._progress_callback(
                {
                    "iteration": i,
                    "max_iterations": max_iterations,
                    "progress_pct": progress_pct,
                    "current_penalty": current_penalty,
                    "best_penalty": self._hybrid.best_penalty,
                    "assignment_penalty": self.sm.assignment_penalty,
                    "coverage_penalty": self.sm.coverage_penalty,
                    "mode": self._hybrid.mode,
                    "temperature": temp,
                    "n_samples": n_samples,
                    "max_ops": max_ops,
                    "improvements": self._hybrid.improvements,
                    "mode_switches": self._hybrid.mode_switches,
                    "elapsed_seconds": elapsed,
                    "iters_per_sec": iters_per_sec,
                }
            )

    def _log_history(self, i):
        if i % self._log_interval == 0:
            self.history_assignment.append(self.sm.assignment_penalty)
            self.history_coverage.append(self.sm.coverage_penalty)
            self.sm._calculate_total_penalties(self.sm.schedule_matrix)
            self.sm.reset_violation_matrix()

    # ─── Main Loop ───────────────────────────────────────────────────────

    def run(self):
        max_iterations = self._search_cfg.max_iterations
        self._hybrid = self._create_engine()
        self.history_assignment = []
        self.history_coverage = []

        self.sm.initialize_state(strategy=self._init_strategy)
        print(f"Initial penalty: {self.sm.penalty:.2f}")

        self._start_time = time.time()
        start_time = self._start_time
        iterations_run = 0

        for i in range(max_iterations):
            if self._budget_exceeded(start_time, i):
                break

            current_penalty = self.sm.penalty
            (
                best_config,
                best_moves,
                best_move_info,
                best_delta,
            ) = self._find_best_local_move()

            if best_config is None:
                self._hybrid.step()
                self._log_history(i)
                continue

            self._apply_move(
                best_config, best_moves, best_move_info, current_penalty, best_delta
            )
            self._hybrid.step()
            self._escape()
            self._log_history(i)
            self._report_progress(i, current_penalty, max_iterations)

            iterations_run = i + 1

        elapsed = time.time() - start_time

        return {
            "best_penalty": self._hybrid.best_penalty,
            "improvements": self._hybrid.improvements,
            "mode_switches": self._hybrid.mode_switches,
            "iterations": iterations_run,
            "elapsed_seconds": elapsed,
        }
