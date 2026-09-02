# pylint: disable=all
import math
import random
from typing import Tuple

from planning.search.search import Search


class SimulatedAnnealing(Search):
    def search(
        self,
        initial_solution: Tuple,
        max_iterations,
        initial_temp,
        min_temp,
        cooling_rate,
    ):

        self.current_solution = initial_solution
        self.current_objective = self._evaluate_solution(initial_solution)
        self.best_solution = initial_solution
        self.best_objective = self.current_objective

        temperature = initial_temp

        for _ in range(max_iterations):
            self.iteration_count += 1
            temperature *= cooling_rate

            if temperature < min_temp:
                break

            neighbors = self.neighborhood_explorer.generate_neighbours(
                self.current_solution, 1, exploration=True
            )

            if not neighbors:
                break
            neighbor = neighbors[0]
            neighbor_obj = self._evaluate_solution(neighbor)

            delta = neighbor_obj - self.current_objective
            accept = delta > 0 or random.random() < math.exp(delta / temperature)

            if accept:
                self.current_solution = neighbor
                self.current_objective = neighbor_obj

            if self.current_objective > self.best_objective:
                self.best_solution = self.current_solution
                self.best_objective = self.current_objective
                self.improvements += 1

        return {
            "best_solution": self.best_solution,
            "best_objective": self.best_objective,
            "final_solution": self.current_solution,
            "final_objective": self.current_objective,
            "iterations": self.iteration_count,
        }
