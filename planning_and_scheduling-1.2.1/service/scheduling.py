# pylint: disable=all
"""fastAPI application for shift assignments and optimizations."""

import asyncio
import logging
import sys
from pathlib import Path

from fastapi import APIRouter, WebSocket

try:
    from scheduling.main import run
except ModuleNotFoundError:
    project_root = Path(__file__).resolve().parents[1]
    src_path = project_root / "src"
    if str(src_path) not in sys.path:
        sys.path.insert(0, str(src_path))
    from scheduling.main import run

router = APIRouter(prefix="/scheduling", tags=["scheduling"])

logger = logging.getLogger(__name__)


@router.websocket("/")
async def run_scheduling(websocket: WebSocket):
    await websocket.accept()

    try:
        parameter = await websocket.receive_json()

        data = parameter.get("data")
        config = parameter.get("config")
        logger.info("Received data and config for planning and scheduling.")

        loop = asyncio.get_running_loop()

        async def send_progress(progress_data):
            await websocket.send_json({"status": "progress", "data": progress_data})

        def progress_callback(progress_data):
            asyncio.run_coroutine_threadsafe(send_progress(progress_data), loop)

        result = await asyncio.to_thread(run, data, config, progress_callback)
        logger.info("Scheduling process completed.")

        await websocket.send_json(
            {
                "status": "completed",
                "solutions": result["solutions"],
                "stats": result["stats"],
            }
        )

    except Exception as exception:
        logger.exception("Error during scheduling")
        await websocket.send_json({"status": "error", "message": str(exception)})

    finally:
        await websocket.close()
