from typing import Optional

from pydantic import BaseModel


class SimulatedAnnealingConfig(BaseModel):
    max_iterations: int
    initial_temp: float
    min_temp: float
    cooling_rate: float
    neighborhood_size: int
    exploration: bool


class TabuSearchConfig(BaseModel):
    tabu_tenure: int
    max_iterations: int
    max_no_improve: int
    neighborhood_size: int
    exploration: bool


class AdaptiveSearchConfig(BaseModel):
    sa_initial_temp: float
    sa_cooling_rate: float
    sa_burst_length: int
    max_iterations: int
    max_no_improve: int
    neighborhood_size: int
    switch_threshold: int
    ts_inner_iterations: int


class SearchConfig(BaseModel):
    simulated_annealing: Optional[SimulatedAnnealingConfig]
    tabu_search: Optional[TabuSearchConfig]
    adaptive_search: Optional[AdaptiveSearchConfig]
