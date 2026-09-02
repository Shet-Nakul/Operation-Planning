import random
import re
from collections import defaultdict
from copy import deepcopy
from dataclasses import dataclass

import numpy as np

from planning.dataloader.assignment_manager import AssignmentProfileBuilder
from planning.dataloader.data_manager import DataManager
from planning.models.data import Scheduled


@dataclass
class Segment:
    start: int
    end: int
    demand: np.ndarray  # shape: (num_jobs,)


def build_segments(jobs: np.ndarray, resource_availability: np.ndarray):
    """Build global contiguous segments where (job demand + resource availability) stays constant."""
    _, total_slots = jobs.shape
    _, total_slots_r = resource_availability.shape
    if total_slots != total_slots_r:
        raise ValueError("Jobs and Resource must have the same number of time slots")

    segments = []
    start = 0
    prev_key = (tuple(jobs[:, 0].tolist()), tuple(resource_availability[:, 0].tolist()))

    for t in range(1, total_slots):
        key = (tuple(jobs[:, t].tolist()), tuple(resource_availability[:, t].tolist()))
        if key != prev_key:
            segments.append(Segment(start=start, end=t, demand=jobs[:, start].copy()))
            start = t
            prev_key = key

    segments.append(Segment(start=start, end=total_slots, demand=jobs[:, start].copy()))
    return segments


def segment_availability(resource_availability: np.ndarray, seg: Segment):
    """Resource is available in a segment only if available in all slots of that segment."""
    return resource_availability[:, seg.start : seg.end].min(axis=1)


def continuity_cost(sol, segments):
    """Sum of job-wise assignment changes between consecutive segments, weighted by segment boundaries only."""
    if len(sol) <= 1:
        return 0
    cost = 0
    for k in range(1, len(sol)):
        prev_a = sol[k - 1]
        cur_a = sol[k]
        cost += np.abs(cur_a - prev_a).sum()
    return int(cost)


def load_balance_cost(sol, segments):
    """Variance of total assigned slot-load per resource."""
    if not sol:
        return 0.0
    num_resources = sol[0].shape[1]
    loads = np.zeros(num_resources, dtype=float)
    for k, a in enumerate(sol):
        duration = segments[k].end - segments[k].start
        loads += a.sum(axis=0) * duration
    return float(np.var(loads))


def objective(sol, segments, lambda_cont=3.0, lambda_balance=0.15):
    return lambda_cont * continuity_cost(
        sol, segments
    ) + lambda_balance * load_balance_cost(sol, segments)


def is_feasible_segment(assignment_jr, demand_j, avail_r):
    if not np.all(assignment_jr.sum(axis=1) == demand_j):
        return False
    if np.any(assignment_jr.sum(axis=0) > 1):
        return False
    if np.any(assignment_jr[:, avail_r == 0] > 0):
        return False
    return True


def greedy_segment_assignment(demand_j, avail_r, prev_assignment=None):
    """Construct one feasible segment assignment while preserving previous allocations when possible."""
    num_jobs = demand_j.shape[0]
    num_resources = avail_r.shape[0]
    a = np.zeros((num_jobs, num_resources), dtype=int)

    available_resources = set(np.where(avail_r == 1)[0].tolist())
    used = set()
    if prev_assignment is not None:
        for j in range(num_jobs):
            keep = [
                r
                for r in np.where(prev_assignment[j] == 1)[0]
                if r in available_resources and r not in used
            ]
            if len(keep) > demand_j[j]:
                keep = keep[: demand_j[j]]
            for r in keep:
                a[j, r] = 1
                used.add(r)

    for j in np.argsort(-demand_j):
        need = int(demand_j[j] - a[j].sum())
        if need <= 0:
            continue
        candidates = [r for r in available_resources if r not in used]
        if len(candidates) < need:
            return None

        if prev_assignment is None:
            random.shuffle(candidates)
        else:
            idle_first = sorted(
                candidates, key=lambda r: int(prev_assignment[:, r].sum() > 0)
            )
            candidates = idle_first

        for r in candidates[:need]:
            a[j, r] = 1
            used.add(r)

    if is_feasible_segment(a, demand_j, avail_r):
        return a
    return None


def build_initial_solution(segments, resource_availability):
    """Greedy forward pass over segments."""
    sol = []
    prev = None
    for seg in segments:
        avail_r = segment_availability(resource_availability, seg)
        a = greedy_segment_assignment(seg.demand, avail_r, prev_assignment=prev)
        if a is None:
            raise ValueError(
                f"No feasible assignment for segment [{seg.start}, {seg.end}) with demand {seg.demand.tolist()}"
            )
        sol.append(a)
        prev = a
    return sol


def random_neighbor(sol, segments, resource_availability, rng):
    """Generate a feasible neighbor by replacement or swap in one random segment."""
    cand = [x.copy() for x in sol]
    k = rng.randrange(len(cand))
    seg = segments[k]
    a = cand[k]
    num_jobs, num_resources = a.shape
    avail_r = segment_availability(resource_availability, seg)

    move_type = rng.choice(["replace", "swap"])

    if move_type == "replace":
        jobs_with_demand = [j for j in range(num_jobs) if seg.demand[j] > 0]
        if not jobs_with_demand:
            return cand
        j = rng.choice(jobs_with_demand)

        assigned = np.where(a[j] == 1)[0].tolist()
        free = [r for r in np.where(avail_r == 1)[0] if a[:, r].sum() == 0]

        if not assigned or not free:
            return cand

        r_out = rng.choice(assigned)
        r_in = rng.choice(free)
        a[j, r_out] = 0
        a[j, r_in] = 1

    else:  # swap
        jobs_with_demand = [j for j in range(num_jobs) if seg.demand[j] > 0]
        if len(jobs_with_demand) < 2:
            return cand
        j1, j2 = rng.sample(jobs_with_demand, 2)

        r1s = np.where(a[j1] == 1)[0].tolist()
        r2s = np.where(a[j2] == 1)[0].tolist()
        if not r1s or not r2s:
            return cand

        r1 = rng.choice(r1s)
        r2 = rng.choice(r2s)
        a[j1, r1], a[j1, r2] = 0, 1
        a[j2, r2], a[j2, r1] = 0, 1

    if is_feasible_segment(a, seg.demand, avail_r):
        cand[k] = a
        return cand
    return sol


def local_search_allocate(
    jobs: np.ndarray,
    resource_availability: np.ndarray,
    iterations=6000,
    seed=7,
    lambda_cont=3.0,
    lambda_balance=0.15,
    temp0=1.0,
    cooling=0.999,
    print_every=1000,
):
    rng = random.Random(seed)
    segments = build_segments(jobs, resource_availability)
    current = build_initial_solution(segments, resource_availability)
    current_cost = objective(
        current, segments, lambda_cont=lambda_cont, lambda_balance=lambda_balance
    )

    best = [x.copy() for x in current]
    best_cost = current_cost

    temp = temp0
    for it in range(1, iterations + 1):
        neighbor = random_neighbor(current, segments, resource_availability, rng)
        neigh_cost = objective(
            neighbor, segments, lambda_cont=lambda_cont, lambda_balance=lambda_balance
        )
        delta = neigh_cost - current_cost

        # SA acceptance to escape local minima.
        if delta <= 0 or rng.random() < np.exp(-delta / max(temp, 1e-9)):
            current = neighbor
            current_cost = neigh_cost
            if current_cost < best_cost:
                best = [x.copy() for x in current]
                best_cost = current_cost

        temp *= cooling

        # if print_every and it % print_every == 0:
        #     print(f"iter={it:5d}  current={current_cost:8.3f}  best={best_cost:8.3f}  temp={temp:8.4f}")

    return best, segments, best_cost


def expand_to_timeslots(solution_segments, segments, total_slots):
    """Convert segment solution to per-slot (job, resource) allocation tensor."""
    num_jobs, num_resources = solution_segments[0].shape
    alloc = np.zeros((num_jobs, num_resources, total_slots), dtype=int)
    for k, a in enumerate(solution_segments):
        seg = segments[k]
        alloc[:, :, seg.start : seg.end] = a[:, :, None]
    return alloc


def print_solution(solution_segments, segments):
    for k, a in enumerate(solution_segments):
        print(
            f"Segment {k:02d} [{segments[k].start:02d},{segments[k].end:02d}) demand={segments[k].demand.tolist()}"
        )
        for j in range(a.shape[0]):
            assigned = np.where(a[j] == 1)[0].tolist()
            print(f"  Job{j+1}: {assigned}")


def solve_overlay(target, pieces):
    """
    target: (n, m) binary numpy array
    pieces: (k, m) binary numpy array (k <= 10)

    Returns:
        List of lists, where result[i] contains the indices of the
        pieces assigned to target row i.

        Returns None if no valid assignment exists.
    """

    n, m = target.shape
    k = len(pieces)

    # Convert each row to an integer bitmask
    def row_to_mask(row):
        mask = 0
        for i, bit in enumerate(row):
            if bit:
                mask |= 1 << i
        return mask

    target_masks = [row_to_mask(row) for row in target]
    piece_masks = [row_to_mask(row) for row in pieces]

    # ------------------------------------------------------------------
    # Precompute the OR of every subset of pieces (INCLUDING EMPTY SET)
    # ------------------------------------------------------------------
    subset_or = {}

    for subset in range(1 << k):  # includes subset = 0
        mask = 0
        for i in range(k):
            if subset & (1 << i):
                mask |= piece_masks[i]
        subset_or[subset] = mask

    # ------------------------------------------------------------------
    # For each row, find all subsets that exactly produce that row
    # ------------------------------------------------------------------
    row_options = []

    for target_mask in target_masks:
        options = []
        for subset, overlay in subset_or.items():
            if overlay == target_mask:
                options.append(subset)
        row_options.append(options)

    # Solve rows with the fewest candidate subsets first
    order = sorted(range(n), key=lambda r: len(row_options[r]))

    solution = [0] * n

    def backtrack(idx, used):
        if idx == n:
            # Every piece must have been consumed
            return used == (1 << k) - 1

        row = order[idx]

        for subset in row_options[row]:
            # Can't reuse pieces
            if subset & used:
                continue

            solution[row] = subset

            if backtrack(idx + 1, used | subset):
                return True

        return False

    if not backtrack(0, 0):
        return None

    # Convert bitmasks back to piece indices
    result = []
    for subset in solution:
        indices = [i for i in range(k) if subset & (1 << i)]
        result.append(indices)

    return result


class EmployeeAssignment:
    def __init__(
        self,
        data_manager: DataManager,
        assigned_resource: dict,
        schedule: list[Scheduled],
    ):
        self.assigned_resource = assigned_resource
        self.data_loader = data_manager
        self.assignment_profile = AssignmentProfileBuilder(self.data_loader, schedule)
        self.pool_idx = self.assignment_profile.pool_index
        self.operation_idx = self.assignment_profile.operation_index
        (
            self.operation_demand_profiles,
            self.employee_availability_profiles,
            self.operation_demand_matrices,
            self.employee_availability_matrices,
        ) = self.assignment_profile.build()

        self.schedule = self._set_preassigned_resources(schedule)

    def _set_preassigned_resources(self, schedule):
        temp = deepcopy(schedule)
        for scheduled_operation in temp:
            operation = scheduled_operation.id
            resources = scheduled_operation.resources_assigned
            for resource in resources:
                if resource.assigned in self.assigned_resource.get(operation, {}):
                    resource.assigned = self.assigned_resource[operation][
                        resource.assigned
                    ]
        return temp

    def _schedule_to_dict(self):
        schedule_dict = {}
        for scheduled_operation in self.schedule:
            operation_id = scheduled_operation.id
            resources_assigned = []
            for resource in scheduled_operation.resources_assigned:
                resource_dict = {
                    "role": resource.role,
                    "assigned": resource.assigned,
                    "time_range": [
                        t.strftime("%Y-%m-%d %H:%M:%S") for t in resource.time_range[0]
                    ],
                    "count": resource.count,
                    "stage_type": resource.stage_type,
                    "probability": resource.probability,
                }
                resources_assigned.append(resource_dict)
            schedule_dict[operation_id] = resources_assigned
        return schedule_dict

    def _build_target_matrix(self, pool_id, segments, best_solution, operation_index):
        """Build the target binary matrix for one operation within one pool."""
        target_matrix = np.zeros(
            self.employee_availability_matrices[pool_id].shape, dtype=int
        )
        for segment, segment_solution in zip(segments, best_solution):
            target_matrix[:, segment.start : segment.end + 1] = np.asarray(
                segment_solution[operation_index]
            )[:, None]

        return target_matrix

    def _build_pooled_pieces(self, pool_id, operation_index):
        pooled_pieces = []
        provisional_assignments = []

        for scheduled_operation in self.schedule:
            if self.operation_idx[scheduled_operation.id] != operation_index:
                continue

            for resource in scheduled_operation.resources_assigned:
                if resource.assigned != pool_id:
                    continue
                piece_vector = np.zeros(
                    (self.assignment_profile.total_slots), dtype=int
                )
                start_time = resource.time_range[0][0]
                end_time = resource.time_range[0][1]
                start, end = self.data_loader.convert_datetime_range_to_slice(
                    start_time, end_time
                )
                piece_vector[start:end] = 1

                for _ in range(resource.count):
                    pooled_pieces.append(piece_vector)
                    provisional_assignments.append(
                        {
                            "role": resource.role,
                            "assigned": pool_id,
                            "time_range": [
                                t.strftime("%Y-%m-%d %H:%M:%S")
                                for t in resource.time_range[0]
                            ],
                            "count": 1,
                            "stage_type": resource.stage_type,
                        }
                    )
        return pooled_pieces, provisional_assignments

    def _employee_assignment(self, pool_id):
        demand_matrix = self.operation_demand_matrices[pool_id]
        availability_matrix = self.employee_availability_matrices[pool_id]
        solution, segments, _ = local_search_allocate(
            demand_matrix,
            availability_matrix,
            iterations=4000,
            seed=17,
            lambda_cont=4.0,
            lambda_balance=0.10,
            temp0=0.8,
            cooling=0.9992,
            print_every=1000,
        )
        return solution, segments

    def _stagewise_reformate(self, schedule_dict):
        stage_wise = []
        for operation, resources in schedule_dict.items():
            current_operation = {
                "id": operation,
                "resources_assigned": {},
                "planned_start": None,
            }

            for resource in resources:
                stage = resource.get("stage_type")

                if stage is None and resource.get("role") == "patient_total_time":
                    time_range = resource.get("time_range", [])
                    if time_range:
                        current_operation["planned_start"] = time_range[0]
                    continue

                if stage is None:
                    continue

                cleaned_resource = {
                    key: value
                    for key, value in resource.items()
                    if key not in {"stage_type", "count", "probability"}
                }
                current_operation["resources_assigned"].setdefault(stage, []).append(
                    cleaned_resource
                )

            stage_wise.append(current_operation)

        return stage_wise

    def non_assignable_resources(self):
        schedule = self._schedule_to_dict()
        non_assignable = []
        for operation, resources in schedule.items():
            for idx, resource in enumerate(resources):
                if resource["probability"] < 1.0:
                    non_assignable.append(resource["assigned"])
                    schedule[operation][idx][
                        "assigned"
                    ] = self.assignment_profile.rid_to_pool_id[resource["assigned"]]
        return non_assignable, schedule

    def build(self):
        non_assignable, schedule = self.non_assignable_resources()

        for p_idx in self.pool_idx:
            if p_idx in non_assignable:
                continue
            solution, segments = self._employee_assignment(p_idx)
            for name, o_idx in self.operation_idx.items():
                schedule[name] = [
                    resource
                    for resource in schedule[name]
                    if resource["assigned"] != p_idx
                ]
                target_matrix = self._build_target_matrix(
                    p_idx, segments, solution, o_idx
                )

                pooled_pieces, provisional_assignments = self._build_pooled_pieces(
                    p_idx, o_idx
                )
                # print(f"Pooled pieces for operation {name} in pool {p_idx}:")

                if not pooled_pieces:
                    continue
                overlay_result = solve_overlay(target_matrix, np.array(pooled_pieces))

                if overlay_result is None:
                    continue

                for emp_idx, task_idxs in enumerate(overlay_result):
                    for task_idx in task_idxs:
                        provisional_assignments[task_idx][
                            "assigned"
                        ] = self.assignment_profile.pool_employee_index_name[p_idx][
                            emp_idx
                        ]
                schedule[name].extend(provisional_assignments)
        schedule = self._stagewise_reformate(schedule)
        return schedule
