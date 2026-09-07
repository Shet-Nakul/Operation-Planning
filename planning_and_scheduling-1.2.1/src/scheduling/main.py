# pylint: disable=all

import logging

from scheduling.dataloader.processor.cleaner import PreProcessingPipeline
from scheduling.dataloader.processor.factory import DataFactory
from scheduling.dataloader.processor.handlers import InputDataHandler, OutputHandler
from scheduling.search.cfg import SearchConfig
from scheduling.search.move_config import MoveConfig
from scheduling.search.move_engine import MoveEvaluator, MoveExecutor, MoveGenerator
from scheduling.search.optimizer import AttributeOptimizer
from scheduling.search.state_manager import StateManager

logger = logging.getLogger(__name__)


def run(data: dict, optimizer_config: dict, progress_callback=None):
    cfg = SearchConfig(**optimizer_config)

    logger.info("Initializing data factory and state manager...")

    validated_data = PreProcessingPipeline(data).run()
    input_data_handler = InputDataHandler(input_data_model=validated_data)
    data_factory = DataFactory(input_data_handler)
    state_manager = StateManager(data_factory)
    move_config = MoveConfig()
    move_generator = MoveGenerator(
        data_factory,
        max_operations=cfg.moves.max_operations,
        max_block_size=cfg.moves.max_block_size,
    )
    move_evaluator = MoveEvaluator(data_factory)
    move_executor = MoveExecutor()
    logger.info("Initialization complete. Starting optimization...")

    optimizer = AttributeOptimizer(
        state_manager=state_manager,
        data_factory=data_factory,
        move_config=move_config,
        move_generator=move_generator,
        move_evaluator=move_evaluator,
        move_executor=move_executor,
        cfg=cfg,
        progress_callback=progress_callback,
    )

    results = optimizer.run()
    output_handler = OutputHandler(
        input_data_handler=input_data_handler,
        result_array=optimizer._hybrid.best_solution,
    )
    response = output_handler.response()
    logger.info(
        "Optimization complete: best_penalty=%.2f improvements=%d iterations=%d elapsed=%.1fs",
        results["best_penalty"],
        results["improvements"],
        results["iterations"],
        results["elapsed_seconds"],
    )
    return {"solutions": response, "stats": results}
