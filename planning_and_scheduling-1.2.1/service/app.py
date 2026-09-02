"""Basic FastAPI application setup with a root endpoint."""

import logging
from importlib.metadata import PackageNotFoundError, version

from fastapi import FastAPI

from service.planning import router as planning_router
from service.scheduling import router as scheduling_router

logging.basicConfig(level=logging.INFO)


def _resolve_app_version() -> str:
    try:
        return version("planning-and-scheduling")
    except PackageNotFoundError:
        return "0.0.0"


APP_VERSION = _resolve_app_version()

app = FastAPI(title="Planning And Scheduling API", version=APP_VERSION)
app.include_router(scheduling_router)
app.include_router(planning_router)


@app.get("/")
def root():
    return {"service": "planning-and-scheduling", "version": APP_VERSION}
