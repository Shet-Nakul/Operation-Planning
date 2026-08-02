export const configurations = {
    "initialization": { "strategy": "random" },
    "search": {
        "max_iterations": 100000,
        "max_minutes": 5,
        "tabu_tenure": 500,
        "switch_threshold": 2500,
        "improvement_threshold": 0.001,
        "restart_strategy": "adaptive_sigmoid",
        "random_restart_interval": 5,
        "adaptive_schedule": "linear",
        "initial_temp": 50.0,
        "min_temp": 0.05,
        "annealing_duration": 500
    },
    "moves": {
        "n_samples": 3,
        "n_samples_end": 2,
        "lns_samples": 3,
        "max_operations": 9,
        "max_operations_start": 3,
        "max_block_size": 35
    },
    "logging": {
        "log_interval": 500,
        "print_interval": 5000
    }
} as const;

export const weightedConstraints = {
    complete_weekends: 15,
    no_free_day_before_working_weekend: 14,
    no_night_shift_before_free_weekend: 14,
    identical_shift_types_during_weekend: 8,
    max_num_assignments: 12,
    min_num_assignments: 10,
    max_consecutive_free_days: 5,
    min_consecutive_free_days: 10,
    max_consecutive_working_days: 25,
    min_consecutive_working_days: 5,
    max_consecutive_working_weekends: 12,
    min_consecutive_working_weekends: 3,
    late_followed_day: 14,
    day_followed_early_followed_day: 12,
    late_followed_early: 28,
    late_followed_night: 28,
    day_followed_night: 22,
    night_followed_day: 35,
    night_followed_early: 35,
    assigned_schedules_non_working: 25,
    assigned_schedules_working: 20,
    preferred_schedules_non_working: 20,
    preferred_schedules_working: 15,
    preference_schedules_static_assignments: 10,
    pool_shift_code: 100,
} as const;