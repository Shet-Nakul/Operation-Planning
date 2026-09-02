from typing import Literal

from pydantic import BaseModel


class InitializationConfig(BaseModel):
    strategy: Literal["random", "greedy", "heuristic"]


class Search(BaseModel):
    max_iterations: int
    max_minutes: int
    tabu_tenure: int
    switch_threshold: int
    improvement_threshold: float
    restart_strategy: Literal[
        "fixed_interval", "adaptive_sigmoid", "always_restart", "always_reset"
    ]
    random_restart_interval: int
    adaptive_schedule: Literal["fixed", "sigmoid", "linear"]
    initial_temp: float
    min_temp: float
    annealing_duration: int


class Moves(BaseModel):
    n_samples: int
    n_samples_end: int
    lns_samples: int
    max_operations: int
    max_operations_start: int
    max_block_size: int


class Logging(BaseModel):
    log_interval: int
    print_interval: int


class SearchConfig(BaseModel):
    initialization: InitializationConfig
    search: Search
    moves: Moves
    logging: Logging
