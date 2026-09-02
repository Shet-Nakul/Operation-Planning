import math
import random
from collections import defaultdict
from datetime import timedelta

import numpy as np

from scheduling.dataloader.processor.enums import DaysOfWeekEnum, ShiftEnum


class DataSimulator:
    """Generates raw text-based roster input data."""

    WORKING_SHIFTS = [s for s in ShiftEnum._member_names_ if s not in ("V", "O")]
    DAY_NAMES = [d.lower() for d in DaysOfWeekEnum._member_names_]

    def __init__(
        self,
        num_employees,
        num_days,
        pool_role_map,
        contracts,
        pool_shift_requirements,
        start_date,
    ):
        self.num_employees = num_employees
        self.num_days = num_days
        self.pool_role_map = pool_role_map
        self.contracts = contracts
        self.pool_shift_requirements = pool_shift_requirements
        self.start_date = start_date
        self.pools = sorted(tuple(set(pool_role_map.keys())))
        self.roles = sorted(tuple(set(pool_role_map.values())))
        self.pool_shifts_mapping = self._shifts_for_pools(pool_shift_requirements)
        self.role_to_pool_mapping = self._role_to_pool_mapping(pool_role_map)

    def _random_multiples_of_20(self, n):
        parts = [1] * n
        for _ in range(5 - n):
            parts[random.randint(0, n - 1)] += 1
        return [round(p * 0.2, 3) for p in parts]

    def _shifts_for_pools(self, pool_shift_requirements):
        pool_shifts = {}
        for pool, shift_weekly_demand in pool_shift_requirements.items():
            pool_shifts[pool] = list(set(shift_weekly_demand.keys()))
        return pool_shifts

    def _role_to_pool_mapping(self, pool_role_map):
        role_to_pool_mapping = {}
        for role in pool_role_map.values():
            if role not in role_to_pool_mapping:
                role_to_pool_mapping[role] = []
            for pool, r in pool_role_map.items():
                if r == role:
                    role_to_pool_mapping[role].append(pool)
        for role, pools in role_to_pool_mapping.items():
            role_to_pool_mapping[role] = sorted(set(pools))
        return role_to_pool_mapping

    def _get_role_distribution(self):
        k_pools = random.randint(1, min(len(self.roles), 5))
        role_distribution = dict(
            zip(
                random.sample(self.roles, k_pools),
                self._random_multiples_of_20(k_pools),
            )
        )
        return role_distribution

    def _get_pools(self, role_distribution):
        employee_pools = []
        for role in role_distribution:
            available = self.role_to_pool_mapping[role]
            selected = random.sample(available, random.randint(1, len(available)))
            employee_pools.extend(selected)
        return employee_pools

    def _calculate_pool_distribution(self, role_distribution, employee_pools, pools):
        pool_distribution = {}
        for role, fraction in role_distribution.items():
            role_pools = [p for p in employee_pools if self.pool_role_map[p] == role]
            fraction_per_pool = round(fraction / len(role_pools), 3)
            for pool in role_pools:
                pool_distribution[pool] = fraction_per_pool
        return pool_distribution

    def _calculate_shift_distribution(self, employee_pools, pool_defs):
        shifts = defaultdict(float)
        for pool_name, pool_pct in employee_pools.items():
            pool_shifts = self.pool_shifts_mapping[pool_name]
            share = pool_pct / len(pool_shifts)
            for s in pool_shifts:
                shifts[s] += round(share, 3)
        return dict(shifts)

    def _get_profile(self, employee_id):
        role_distribution = self._get_role_distribution()
        employee_pools = self._get_pools(role_distribution)
        pool_dist = self._calculate_pool_distribution(
            role_distribution, employee_pools, self.pools
        )
        shift_dist = self._calculate_shift_distribution(pool_dist, self.pools)
        profile = {
            employee_id: {
                "pools": employee_pools,
                "shifts": list(shift_dist.keys()),
                "roles_distribution": role_distribution,
                "pools_distribution": pool_dist,
                "shifts_distribution": shift_dist,
                "contract": random.choice(list(self.contracts.keys())),
            }
        }
        return profile

    def _generate_preferred_shifts(self, employee_profiles, preferred_fraction=0.50):
        num_entries = math.ceil(preferred_fraction * self.num_employees * self.num_days)
        preferred_shifts = {}
        all_employees = list(employee_profiles.keys())
        for _ in range(num_entries):
            emp = random.choice(all_employees)
            day = random.randint(0, self.num_days - 1)
            pool = random.choice(employee_profiles[emp]["pools"])
            shift = random.choice(["V", "O"] + self.pool_shifts_mapping[pool])
            if emp not in preferred_shifts:
                preferred_shifts[emp] = {}
            if shift in {"V", "O"}:
                pool = None
            preferred_shifts[emp][
                (self.start_date + timedelta(days=day)).strftime("%Y-%m-%d")
            ] = {"pool": pool, "shift": shift}
        return preferred_shifts

    def _generate_previous_schedule(
        self,
        employee_profiles,
        off_shift_probability=0.20,
        vacation_shift_probability=0.05,
    ):
        previous_schedule = {}
        for emp in employee_profiles:
            previous_schedule[emp] = {}
            pools_distribution = employee_profiles[emp]["pools_distribution"]
            for day in range(self.num_days):
                date = (self.start_date - timedelta(days=day + 1)).strftime("%Y-%m-%d")
                draw = random.random()
                pool = random.choices(
                    population=list(pools_distribution.keys()),
                    weights=list(pools_distribution.values()),
                )[0]
                if draw < vacation_shift_probability:
                    pool = None
                    shift = "V"
                elif draw < vacation_shift_probability + off_shift_probability:
                    pool = None
                    shift = "O"
                else:
                    shift = random.choice(self.pool_shifts_mapping[pool])
                previous_schedule[emp][date] = {"shift": shift, "pool": pool}
        return previous_schedule

    def filter_profiles(self, employee_profiles):
        filtered = {}
        for emp_id, profile in employee_profiles.items():
            del profile["shifts"]
            del profile["pools_distribution"]
            del profile["shifts_distribution"]
            filtered[emp_id] = profile
        return filtered

    def generate(self):
        employee_profiles = {}
        for i in range(self.num_employees):
            emp_id = f"emp_{i}"
            profile = self._get_profile(emp_id)
            employee_profiles.update(profile)
        preferred_shifts = self._generate_preferred_shifts(employee_profiles)
        previous_schedule = self._generate_previous_schedule(employee_profiles)
        employee_profiles = self.filter_profiles(employee_profiles)
        return {
            "pool_role_map": self.pool_role_map,
            "horizon": self.num_days,
            "start_date": self.start_date.strftime("%Y-%m-%d"),
            "employee_profiles": employee_profiles,
            "shift_requirements": self.pool_shift_requirements,
            "contracts": self.contracts,
            "preferred_schedules": preferred_shifts,
            "previous_schedules": previous_schedule,
        }
