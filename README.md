# Wiresploit Core – Live Feed Backend

FastAPI backend that receives captured packets and streams them live to clients.

## Features
- **Ingest:** `POST /ingest` takes in packet events from the capture pipeline
- **Live stream:** `GET /stream` sends packets to clients in real time (SSE)
- **Ordering:** a reorder buffer puts packets back in order before they're sent
- **Event model:** one packet event structure used across the backend

## Structure
app/ <br>
├── main.py              # starts the app, adds the routes <br>
├── live_feed/ <br>
│   ├── router.py        # /ingest and /stream endpoints <br>
│   ├── service.py       # receives packets, sends them to connected clients <br>
│   └── reorder_buffer.py <br>
└── models/ <br>
    └── event.py         # packet event structure <br>
tests/ <br>
└── test_live_feed.py <br>

## Run <br>
cd backend <br>
pip install -r requirements.txt <br>
uvicorn app.main:app --port 8000 <br>

## Test <br>
pytest tests/test_live_feed.py <br>

