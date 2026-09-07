# pylint: disable=too-many-instance-attributes, too-many-locals, too-many-arguments
from planning.search.simulated_annealing import SimulatedAnnealing
from planning.search.tabu_search import TabuSearch


class AdaptiveSearch:
    """
    Stand-alone adaptive controller that orchestrates Tabu Search (intensification)
    and Simulated Annealing (diversification).
    """

    def __init__(
        self,
        data_manager,
        neighborhood_explorer,
        tabu_tenure,
        sa_initial_temp,
        sa_cooling_rate,
        sa_burst_length,
    ):

        self.tabu_search = TabuSearch(
            data_manager, neighborhood_explorer, tabu_tenure=tabu_tenure
        )

        self.sa_search = SimulatedAnnealing(data_manager, neighborhood_explorer)

        self.sa_initial_temp = sa_initial_temp
        self.sa_cooling_rate = sa_cooling_rate
        self.sa_burst_length = sa_burst_length

        self.best_solution = None
        self.best_objective = float("-inf")

        self.iteration_count = 0
        self.current_temp = sa_initial_temp

        self.objective_history = []

    def search(
        self,
        initial_solution,
        max_iterations,
        tabu_iterations,
        sa_iterations,
        tabu_max_no_improve,
        tabu_neighborhood_size,
        sa_min_temp,
        switch_threshold,
        progress_callback=None,
    ):

        current_solution = initial_solution
        mode = "TS"
        no_improve = 0
        sa_steps = 0

        for iteration in range(max_iterations):
            self.iteration_count += 1

            if progress_callback:
                if iteration % (max_iterations // 10) == 0:
                    progress_callback(
                        {
                            "progress": (iteration) * 100 / max_iterations,
                        }
                    )

            if mode == "TS":
                result = self.tabu_search.search(
                    current_solution,
                    max_iterations=tabu_iterations,
                    max_no_improve=tabu_max_no_improve,
                    neighborhood_size=tabu_neighborhood_size,
                )

                current_solution = result["final_solution"]

                if result["best_objective"] > self.best_objective:
                    self.best_solution = result["best_solution"]
                    self.best_objective = result["best_objective"]
                    no_improve = 0
                else:
                    no_improve += 1

                if no_improve >= switch_threshold:
                    mode = "SA"
                    sa_steps = 0
                    self.current_temp = self.sa_initial_temp

            else:  # SA mode
                self.current_temp *= self.sa_cooling_rate

                result = self.sa_search.search(
                    current_solution,
                    max_iterations=sa_iterations,
                    initial_temp=self.current_temp,
                    min_temp=sa_min_temp,
                    cooling_rate=1.0,
                )

                current_solution = result["final_solution"]

                sa_steps += 1

                if result["best_objective"] > self.best_objective:
                    self.best_solution = result["best_solution"]
                    self.best_objective = result["best_objective"]
                    no_improve = 0

                if sa_steps >= self.sa_burst_length:
                    mode = "TS"
                    no_improve = 0

            self.objective_history.append(float(result["best_objective"]))

        return {
            "best_solution": self.best_solution,
            "best_objective": self.best_objective,
            "iterations": self.iteration_count,
            "objective_history": self.objective_history,
        }
