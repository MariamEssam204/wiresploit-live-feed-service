# Wiresploit frontend (live feed)

React + Vite UI for the live-feed backend in `../backend`.

## Run (development)

Terminal 1, the backend:
    cd backend
    pip install fastapi uvicorn
    uvicorn app.main:app --port 8000

Terminal 2, the frontend:
    cd frontend
    npm install
    npm run dev
Open http://localhost:5173 and press Start capture.

Terminal 3, test packets:
    cd backend
    python tools/fake_pi.py --mode http --target http://localhost:8000/ingest

## How it talks to the backend

- The UI calls `/api/...`; Vite (and nginx in Docker) forwards it to the
  backend with `/api` removed, e.g. `/api/stream` -> `/stream`.
- `/stream` sends batches (JSON arrays). The UI gives each packet an id of
  `node_id-timestamp_ns` and a running number for the No. column.
- Start/Stop capture only gate what the UI shows: the backend has no
  start/stop endpoint yet (see the TODO in `src/api/client.js`).
- The Analysis engines pages need `/findings` and `/context-analysis`, which
  this backend does not have yet, so they show an error for now.

See CHANGES.md for the theme, structure and naming rules.
