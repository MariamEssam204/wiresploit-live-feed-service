# Wiresploit Core – Live Feed Backend

FastAPI backend that receives captured packets and streams them live to clients.

## Features
- **Ingest:** `POST /ingest` takes in packet events from the capture pipeline
- **Live stream:** `GET /stream` sends packets to clients in real time (SSE)
- **Ordering:** a reorder buffer puts packets back in order before they're sent
- **Event model:** one packet event structure used across the backend

## Structure
app/
├── main.py              # starts the app, adds the routes
├── live_feed/
│   ├── router.py        # /ingest and /stream endpoints
│   ├── service.py       # receives packets, sends them to connected clients
│   └── reorder_buffer.py
└── models/
    └── event.py         # packet event structure
tests/
└── test_live_feed.py

## Run
cd core/backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000

## Test
pytest tests/test_live_feed.py

