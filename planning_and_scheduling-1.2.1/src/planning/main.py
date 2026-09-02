from copy import deepcopy

from planning.dataloader.data_manager import DataManager, DataProcessor
from planning.dataloader.resource_manager import ResourceManager
from planning.dataloader.surgery_manager import (
    InfeasibilityProfiler,
    SurgeryProfileBuilder,
)
from planning.dataloader.time_manager import TimeManager
from planning.dependencies.neighbours import NeighbourhoodExplorer
from planning.models.data import AssignedResource, FlatDataModel, RawDataModel
from planning.search.adaptive_search import AdaptiveSearch
from planning.search.assignment import EmployeeAssignment
from planning.search.cfg import SearchConfig


def run_multiple_planning(data, config, progress_callback=None):

    raw_data = RawDataModel(**data)
    assigned_resource = AssignedResource(**data)
    time_handler = TimeManager(raw_data)
    processed_data = DataProcessor(raw_data, time_handler=time_handler).flatten_data()
    flat_data = FlatDataModel(**processed_data)
    data_manager = DataManager(flat_data, time_manager=time_handler)

    neighbourhood_explorer = NeighbourhoodExplorer(data_manager.search_space)
    search_config = SearchConfig(**config)
    initial_plan = neighbourhood_explorer.initial_execution_plan()
    adaptive_search = AdaptiveSearch(
        data_manager,
        neighbourhood_explorer,
        tabu_tenure=search_config.tabu_search.tabu_tenure,
        sa_initial_temp=search_config.simulated_annealing.initial_temp,
        sa_cooling_rate=search_config.simulated_annealing.cooling_rate,
        sa_burst_length=search_config.adaptive_search.sa_burst_length,
    )
    solution = adaptive_search.search(
        initial_plan,
        max_iterations=search_config.adaptive_search.max_iterations,
        tabu_iterations=search_config.tabu_search.max_iterations,
        sa_iterations=search_config.simulated_annealing.max_iterations,
        tabu_max_no_improve=search_config.tabu_search.max_no_improve,
        tabu_neighborhood_size=search_config.tabu_search.neighborhood_size,
        sa_min_temp=search_config.simulated_annealing.min_temp,
        switch_threshold=search_config.adaptive_search.switch_threshold,
        progress_callback=progress_callback,
    )
    schedule = data_manager.build_schedule(solution["best_solution"])
    resource_reassignment = EmployeeAssignment(
        data_manager=data_manager,
        assigned_resource=assigned_resource.assigned_resource,
        schedule=schedule.scheduled,
    ).build()

    result = {
        "scheduled": resource_reassignment,
        "dropped": [drop.model_dump() for drop in schedule.dropped],
        "infeasible": [drop.model_dump() for drop in schedule.infeasible],
    }
    return result


def run_feasibility(data):
    raw_data = RawDataModel(**data)
    time_handler = TimeManager(raw_data)
    processed_data = DataProcessor(raw_data, time_handler=time_handler).flatten_data()
    flat_data = FlatDataModel(**processed_data)
    data_manager = DataManager(flat_data, time_manager=time_handler)
    resource_manager = ResourceManager(data=flat_data, time_manager=time_handler)
    surgery_profile = SurgeryProfileBuilder(
        data=flat_data, time_manager=time_handler, resource_manager=resource_manager
    )
    infeasibility_report = InfeasibilityProfiler(
        surgery_profile=surgery_profile, data_manager=data_manager
    )
    report = infeasibility_report.build()
    return report


def run_single_planning(data, config, progress_callback=None):
    payload = deepcopy(data)

    if "surgeries" in data and len(data["surgeries"]) == 1:
        surgery = deepcopy(data["surgeries"][0])
        surgery_id = surgery["id"]
        surgeries = []
        for i in range(2):
            _surgery_ = deepcopy(surgery)
            _surgery_["id"] = f"{_surgery_['id']}_{i}"
            surgeries.append(_surgery_)
        payload["surgeries"] = surgeries

    raw_data = RawDataModel(**payload)
    assigned_resource = AssignedResource(**payload)
    time_handler = TimeManager(raw_data)
    processed_data = DataProcessor(raw_data, time_handler=time_handler).flatten_data()
    flat_data = FlatDataModel(**processed_data)
    data_manager = DataManager(flat_data, time_manager=time_handler)

    neighbourhood_explorer = NeighbourhoodExplorer(data_manager.search_space)
    search_config = SearchConfig(**config)
    initial_plan = neighbourhood_explorer.initial_execution_plan()
    adaptive_search = AdaptiveSearch(
        data_manager,
        neighbourhood_explorer,
        tabu_tenure=search_config.tabu_search.tabu_tenure,
        sa_initial_temp=search_config.simulated_annealing.initial_temp,
        sa_cooling_rate=search_config.simulated_annealing.cooling_rate,
        sa_burst_length=search_config.adaptive_search.sa_burst_length,
    )
    solution = adaptive_search.search(
        initial_plan,
        max_iterations=search_config.adaptive_search.max_iterations,
        tabu_iterations=search_config.tabu_search.max_iterations,
        sa_iterations=search_config.simulated_annealing.max_iterations,
        tabu_max_no_improve=search_config.tabu_search.max_no_improve,
        tabu_neighborhood_size=search_config.tabu_search.neighborhood_size,
        sa_min_temp=search_config.simulated_annealing.min_temp,
        switch_threshold=search_config.adaptive_search.switch_threshold,
        progress_callback=None,
    )
    schedule = data_manager.build_schedule(solution["best_solution"])
    earliest_index = min(
        range(len(schedule.scheduled)),
        key=lambda i: schedule.scheduled[i].scheduled_time,
    )
    schedule.scheduled[earliest_index].id = surgery_id
    resource_reassignment = EmployeeAssignment(
        data_manager=data_manager,
        assigned_resource=assigned_resource.assigned_resource,
        schedule=[schedule.scheduled[earliest_index]],
    ).build()

    final_result = {
        "scheduled": resource_reassignment,
        "dropped": schedule.model_dump()["dropped"],
        "infeasible": schedule.model_dump()["infeasible"],
    }

    return final_result
