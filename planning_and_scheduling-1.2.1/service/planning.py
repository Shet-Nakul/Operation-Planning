# pylint: disable=all
"""fastAPI application for shift assignments and optimizations."""

import asyncio
import json
import logging
import sys
from pathlib import Path

from fastapi import APIRouter, WebSocket

try:
    from planning.main import run_feasibility as run_feasibility_solver
    from planning.main import run_multiple_planning as run_multiple_planning_solver
    from planning.main import run_single_planning as run_single_planning_solver
except ModuleNotFoundError:
    project_root = Path(__file__).resolve().parents[1]
    src_path = project_root / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    from planning.main import run_feasibility as run_feasibility_solver
    from planning.main import run_multiple_planning as run_multiple_planning_solver
    from planning.main import run_single_planning as run_single_planning_solver

router = APIRouter(prefix="/planning", tags=["planning"])

logger = logging.getLogger(__name__)


@router.websocket("")
async def run_planning(websocket: WebSocket):
    await websocket.accept()

    try:
        parameter = await websocket.receive_json()

        raw_data = parameter.get("data")
        config = parameter.get("config")

        loop = asyncio.get_running_loop()

        async def send_progress(data):
            await websocket.send_json({"status": "progress", "data": data})

        def progress_callback(data):
            asyncio.run_coroutine_threadsafe(send_progress(data), loop)

        result = await asyncio.to_thread(
            run_multiple_planning_solver, raw_data, config, progress_callback
        )
        logger.info("Planning process completed.")
        await websocket.send_json(
            {"status": "completed", "result": json.dumps(result, default=str)}
        )

    except Exception as exception:
        logger.exception("Error during planning")
        await websocket.send_json({"status": "error", "message": str(exception)})

    finally:
        await websocket.close()


@router.websocket("/single")
async def run_single_planning(websocket: WebSocket):
    await websocket.accept()

    try:
        parameter = await websocket.receive_json()

        raw_data = parameter.get("data")
        config = parameter.get("config")

        loop = asyncio.get_running_loop()

        async def send_progress(data):
            await websocket.send_json({"status": "progress", "data": data})

        def progress_callback(data):
            asyncio.run_coroutine_threadsafe(send_progress(data), loop)

        result = await asyncio.to_thread(
            run_single_planning_solver, raw_data, config, progress_callback
        )
        logger.info("Planning process completed.")
        await websocket.send_json(
            {"status": "completed", "result": json.dumps(result, default=str)}
        )

    except Exception as exception:
        logger.exception("Error during planning")
        await websocket.send_json({"status": "error", "message": str(exception)})

    finally:
        await websocket.close()


@router.websocket("/feasibility")
async def run_feasibility(websocket: WebSocket):
    await websocket.accept()

    try:
        parameter = await websocket.receive_json()
        raw_data = parameter.get("data")
        result = await asyncio.to_thread(run_feasibility_solver, raw_data)
        logger.info("Feasibility process completed.")
        await websocket.send_json(
            {"status": "completed", "result": json.dumps(result, default=str)}
        )

    except Exception as exception:
        logger.exception("Error during feasibility")
        await websocket.send_json({"status": "error", "message": str(exception)})

    finally:
        await websocket.close()
