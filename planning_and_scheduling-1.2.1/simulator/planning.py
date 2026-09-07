# pylint: disable=C0103,too-many-instance-attributes,too-many-locals
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List


class SurgeryGenerator:
    def __init__(self):
        self.or_rooms = ["operating_room_1", "operating_room_2", "operating_room_3"]
        self.anesthesia_pools = ["anesthesia_day_shift", "anesthesia_night_shift"]
        self.nurse_pools = [
            "operating_room_nurse_day_shift",
            "operating_room_nurse_evening_shift",
        ]
        self.surgeons = ["surgeon_1", "surgeon_2", "surgeon_3"]
        self.pacu_beds = ["post_anesthesia_care_bed_pool"]
        self.icu_beds = ["intensive_care_bed_pool"]
        self.evs_pools = ["evs_day_shift", "evs_evening_shift", "evs_night_shift"]
        self.CLEANING_DURATION_MAP = {0: 15, 1: 30, 2: 40, 3: 45}
        self.CLEANING_PROTOCOLS = {
            0: "standard_turnover",
            1: "enhanced_disinfection",
            2: "deep_cleaning",
            3: "terminal_cleaning",
        }

        self.patient_names = [
            "PATIENT_001",
            "PATIENT_002",
            "PATIENT_003",
            "PATIENT_004",
            "PATIENT_005",
            "PATIENT_006",
            "PATIENT_007",
            "PATIENT_008",
            "PATIENT_009",
            "PATIENT_010",
            "PATIENT_011",
            "PATIENT_012",
            "PATIENT_013",
            "PATIENT_014",
            "PATIENT_015",
            "PATIENT_016",
            "PATIENT_017",
            "PATIENT_018",
            "PATIENT_019",
            "PATIENT_020",
            "PATIENT_021",
            "PATIENT_022",
            "PATIENT_023",
            "PATIENT_024",
            "PATIENT_025",
        ]

        self.PRE_OP_MIN, self.PRE_OP_MAX = 15, 60
        self.OP_MIN, self.OP_MAX = 30, 240
        self.PACU_MIN, self.PACU_MAX = 30, 120
        self.ICU_MIN, self.ICU_MAX = 360, 4320

    def generate_surgery_phases(
        self, infection_type: int = 0, surgery_type: str = "mandatory"
    ) -> Dict[str, Any]:
        """Generate timing for all phases including cleaning, with optional ICU recovery"""
        pre_op_duration = random.randint(self.PRE_OP_MIN, self.PRE_OP_MAX)

        op_duration = random.randint(self.OP_MIN, self.OP_MAX)
        op_start = pre_op_duration
        op_end = op_start + op_duration

        pacu_duration = random.randint(self.PACU_MIN, self.PACU_MAX)
        pacu_start = op_end
        pacu_end = pacu_start + pacu_duration

        cleaning_duration = self.CLEANING_DURATION_MAP[infection_type]
        cleaning_start = op_end
        cleaning_end = cleaning_start + cleaning_duration

        needs_icu = self.determine_icu_need(surgery_type, op_duration)

        if needs_icu:
            recovery_start = max(pacu_end, cleaning_end)
            icu_duration = random.randint(self.ICU_MIN, self.ICU_MAX)
            icu_end = recovery_start + icu_duration
            total_duration = icu_end
            recovery_phase = (recovery_start, icu_end)
        else:
            total_duration = max(pacu_end, cleaning_end)
            recovery_phase = None

        return {
            "pre_op": (0, pre_op_duration),
            "operative": (op_start, op_end),
            "pacu": (pacu_start, pacu_end),
            "cleaning": (cleaning_start, cleaning_end),
            "recovery": recovery_phase,
            "total": total_duration,
            "needs_icu": needs_icu,
        }

    def determine_icu_need(self, surgery_type: str, op_duration: int) -> bool:
        """Determine if surgery needs ICU recovery based on type and duration"""
        if surgery_type == "elective":
            return random.random() < (0.1 if op_duration < 90 else 0.4)
        if surgery_type == "emergency":
            return random.random() < 0.8
        return random.random() < (0.3 if op_duration < 120 else 0.6)

    def create_resource_requirements(
        self,
        phases: Dict,
        infection_type: int = 0,
        surgery_complexity: str = "standard",
    ) -> List[Dict]:
        """Create resource requirements for all phases including cleaning"""
        resources = []

        resources.append(
            {
                "name": "patient_total_time",
                "assigned": "patient_flow",
                "candidates": None,
                "count": 1,
                "duration": [0, phases["total"]],
                "probability": 1,
            }
        )

        preop_anesth_duration = min(
            30, phases["pre_op"][1] // 2
        )  # Last 30 min or half of pre-op, whichever is smaller
        preop_anesth_start = phases["pre_op"][1] - preop_anesth_duration
        resources.append(
            {
                "name": "pre_op_anesthesiologist",
                "assigned": None,
                "candidates": self.anesthesia_pools,
                "count": 1,
                "duration": [preop_anesth_start, phases["pre_op"][1]],
                "probability": 1,
            }
        )
        or_candidates = random.sample(
            self.or_rooms, random.randint(1, len(self.or_rooms))
        )
        resources.append(
            {
                "name": "OR",
                "assigned": None,
                "candidates": or_candidates,
                "count": 1,
                "duration": [phases["operative"][0], phases["cleaning"][1]],
                "probability": 1,
            }
        )

        resources.append(
            {
                "name": "anesthesiologist",
                "assigned": None,
                "candidates": self.anesthesia_pools,
                "count": 1,
                "duration": list(phases["operative"]),
                "probability": 1,
            }
        )

        nurse_count = (
            2 if surgery_complexity in ["complex", "high"] else random.randint(1, 2)
        )
        resources.append(
            {
                "name": "or_nurse",
                "assigned": None,
                "candidates": self.nurse_pools,
                "count": nurse_count,
                "duration": list(phases["operative"]),
                "probability": 1,
            }
        )

        surgeon_end = max(
            phases["operative"][0] + 30, phases["operative"][1] - random.randint(0, 30)
        )
        resources.append(
            {
                "name": "surgeon",
                "assigned": random.choice(self.surgeons),
                "candidates": None,
                "count": 1,
                "duration": [phases["operative"][0], surgeon_end],
                "probability": 1,
            }
        )

        pacu_anesth_duration = random.randint(15, 45)
        pacu_anesth_end = min(
            phases["pacu"][0] + pacu_anesth_duration, phases["pacu"][1]
        )
        resources.append(
            {
                "name": "pacu_anesthesiologist",
                "assigned": None,
                "candidates": self.anesthesia_pools,
                "count": 1,
                "duration": [phases["pacu"][0], pacu_anesth_end],
                "probability": 1,
            }
        )

        resources.append(
            {
                "name": "pacu_bed",
                "assigned": None,
                "candidates": self.pacu_beds,
                "count": 1,
                "duration": list(phases["pacu"]),
                "probability": 1,
            }
        )

        cleaning_staff_count = 2 if infection_type >= 2 else 1
        resources.append(
            {
                "name": "or_cleaning",
                "assigned": None,
                "candidates": self.evs_pools,
                "count": cleaning_staff_count,
                "duration": list(phases["cleaning"]),
                "probability": 1,
                "infection_level": infection_type,
                "cleaning_protocol": self.CLEANING_PROTOCOLS[infection_type],
            }
        )

        if phases["needs_icu"] and phases["recovery"] is not None:
            icu_probability = round(random.uniform(0.05, 0.8), 2)
            resources.append(
                {
                    "name": "icu_bed",
                    "assigned": None,
                    "candidates": self.icu_beds,
                    "count": 1,
                    "duration": list(phases["recovery"]),
                    "probability": icu_probability,
                }
            )

        return resources

    def generate_time_windows(self, surgery_type: str):
        """Generate time windows based on surgery type"""
        base_date = datetime(2026, 2, 15)

        if surgery_type == "emergency":
            earliest = base_date + timedelta(days=random.randint(0, 2))
            latest = earliest
        else:
            start_offset = random.randint(0, 5)
            window_days = random.randint(1, 5)
            earliest = base_date + timedelta(days=start_offset)
            latest = earliest + timedelta(days=window_days)

        return {
            "earliest_date": earliest.strftime("%Y-%m-%dT%H:%M"),
            "latest_date": latest.strftime("%Y-%m-%dT23:59"),
            "planned_start": None,
            "planned_by": None,
        }

    def generate_reward_structure(self, surgery_type: str):
        """Generate reward structure based on surgery type"""
        r0_values = {"elective": 3, "mandatory": 5, "emergency": 10e6}

        if surgery_type == "emergency":
            return {
                "R0": r0_values[surgery_type],
                "lateness_slack_days": 0,
                "earliness_slack_days": 0,
                "p": 0.9,
            }
        return {
            "R0": r0_values[surgery_type],
            "lateness_slack_days": random.randint(0, 3),
            "earliness_slack_days": random.randint(0, 3),
            "p": 0.6 if surgery_type == "mandatory" else 0.4,
        }

    def generate_surgery(
        self,
        patient_name: str,
        surgery_type: str = "mandatory",
        infection_type: int = 0,
        complexity: str = "standard",
    ) -> Dict[str, Any]:
        """Generate a complete surgery specification with cleaning phase"""
        phases = self.generate_surgery_phases(infection_type, surgery_type)
        time_windows = self.generate_time_windows(surgery_type)
        resources = self.create_resource_requirements(
            phases, infection_type, complexity
        )
        reward = self.generate_reward_structure(surgery_type)

        return {
            "id": patient_name,
            "type": surgery_type,
            "infection_type": infection_type,
            "time_windows": time_windows,
            "resources": resources,
            "reward": reward,
        }

    def generate_surgery_schedule(self, num_surgeries: int = 15) -> Dict[str, List]:
        """Generate complete surgery schedule with realistic infection distribution"""
        surgeries = []
        used_names = set()

        infection_weights = [70, 15, 10, 5]

        for i in range(num_surgeries):
            available_names = [
                name for name in self.patient_names if name not in used_names
            ]
            if not available_names:
                patient_name = f"PATIENT_{i+26:03d}_GENERATED"
            else:
                patient_name = random.choice(available_names)
                used_names.add(patient_name)

            surgery_types = ["elective", "mandatory", "emergency"]
            surgery_weights = [40, 50, 10]
            surgery_type = random.choices(surgery_types, weights=surgery_weights)[0]

            infection_type = random.choices([0, 1, 2, 3], weights=infection_weights)[0]

            complexity = random.choices(
                ["standard", "complex", "high"], weights=[60, 30, 10]
            )[0]

            surgery = self.generate_surgery(
                patient_name, surgery_type, infection_type, complexity
            )
            surgeries.append(surgery)

        return {"surgeries": surgeries}
