# Planning And Scheduling

Simple guide to run the scheduling service and call it.

## 1. Setup

From the project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
pip install pandas numpy scipy numba fastapi uvicorn
```

Optional notebook dependencies:

```bash
pip install -e .[notebook]
```

## 2. Run The Service

Start FastAPI with Uvicorn from the project root:

```bash
source .venv/bin/activate
uvicorn service.app:app --host 127.0.0.1 --port 8000 --reload
```

WebSocket endpoints:

- `ws://localhost:8000/planning`
- `ws://localhost:8000/planning/feasibility`
- `ws://localhost:8000/planning/single`
- `ws://localhost:8000/scheduling`

## 3. Call The Service (WebSocket)

`/planning/` expects:

```json
{
	"data": {"...": "planning input"},
	"config": {"...": "optimizer config"}
}
```

`/planning/feasibility` expects:

```json
{
	"data": {"...": "planning input"}
}
```

`/scheduling/` expects:

```json
{
	"data": {"...": "raw scheduling input"},
	"config": {"...": "optimizer config"}
}
```

Minimal client examples:

```python
import asyncio
import json
import websockets


async def call_planning(data, config):
	uri = "ws://localhost:8000/planning/"
	async with websockets.connect(uri) as ws:
		await ws.send(json.dumps({"data": data, "config": config}))
		return await ws.recv()


async def call_feasibility(data):
	uri = "ws://localhost:8000/planning/feasibility"
	async with websockets.connect(uri) as ws:
		await ws.send(json.dumps({"data": data}))
		return await ws.recv()

async def call_feasibility(data):
	uri = "ws://localhost:8000/planning/single"
	async with websockets.connect(uri) as ws:
		await ws.send(json.dumps({"data": data}))
		return await ws.recv()

async def call_scheduling(data, config):
	uri = "ws://localhost:8000/scheduling/"
	async with websockets.connect(uri) as ws:
		await ws.send(json.dumps({"data": data, "config": config}))
		return await ws.recv()


```

## 4. Generate Input Data Like The Notebook

The notebook flow in [docs/scheduling/playgroud.ipynb](docs/scheduling/playgroud.ipynb) uses:

- [docs/scheduling/simulator_config.json](docs/scheduling/simulator_config.json)
- [docs/scheduling/optimizer_config.yml](docs/scheduling/optimizer_config.yml)
- `simulator.scheduling.DataSimulator` to build `raw_data`

If you run Python from inside `docs/scheduling`, add repo root to `sys.path` before imports.

## 5. Direct Call Without Service

You can also call the optimizer directly:

```python
from scheduling.main import run

result = run(data=raw_data, optimizer_config=optimizer_config)
print(result["stats"])
```

## 6. Troubleshooting

- `ModuleNotFoundError` when importing `scheduling`:
	- Run commands from project root, or install package with `pip install -e .`.
- Service starts but WebSocket fails:
	- Confirm URL is exactly `ws://localhost:8000/planning/`, `ws://localhost:8000/planning/feasibility`, or `ws://localhost:8000/scheduling/`.
- Import issues in notebooks under `docs/scheduling`:
	- Add repo root to `sys.path` before imports.
