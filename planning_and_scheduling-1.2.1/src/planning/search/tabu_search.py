# pylint: disable=all
from collections import deque
from typing import Tuple

from planning.search.search import Search


class TabuSearch(Search):
    def __init__(self, *args, tabu_tenure):
        super().__init__(*args)
        self.tabu_list = deque(maxlen=tabu_tenure)
        self.aspiration_count = 0

    def _solution_to_move(self, old, new):
        return str(hash(frozenset(set(old) ^ set(new))))

    def search(
        self,
        initial_solution: Tuple,
        max_iterations,
        max_no_improve,
        neighborhood_size,
    ):
        self.current_solution = initial_solution

        self.current_objective = self._evaluate_solution(initial_solution)
        self.best_solution = initial_solution
        self.best_objective = self.current_objective

        no_improve = 0

        for _ in range(max_iterations):
            self.iteration_count += 1

            neighbors = self.neighborhood_explorer.generate_neighbours(
                self.current_solution, neighborhood_size, exploration=False
            )
            best_neighbor = None
            best_obj = float("-inf")
            best_move = None

            for neighbor in neighbors:

                obj = self._evaluate_solution(neighbor)
                move = self._solution_to_move(self.current_solution, neighbor)

                if move not in self.tabu_list or obj > self.best_objective:
                    if obj > best_obj:
                        best_neighbor = neighbor
                        best_obj = obj
                        best_move = move

            if best_neighbor is None:
                break

            self.current_solution = best_neighbor
            self.current_objective = best_obj
            self.tabu_list.append(best_move)

            if best_obj > self.best_objective:
                self.best_solution = best_neighbor
                self.best_objective = best_obj
                self.improvements += 1
                no_improve = 0
            else:
                no_improve += 1

            if no_improve >= max_no_improve:
                break

        return {
            "best_solution": self.best_solution,
            "best_objective": self.best_objective,
            "final_solution": self.current_solution,
            "final_objective": self.current_objective,
            "iterations": self.iteration_count,
        }
