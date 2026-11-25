"""Reads /stream and checks that packets come out in order.

  python tools/watch_stream.py --url http://localhost:8000/stream --expect 200
"""
import argparse
import json
import urllib.request

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://localhost:8000/stream")
ap.add_argument("--expect", type=int, default=200)
args = ap.parse_args()

received, out_of_order, late, last = 0, 0, 0, -1
with urllib.request.urlopen(args.url) as resp:
    for raw in resp:
        line = raw.decode().strip()
        if not line.startswith("data: "):
            continue                                   # skip pings / blank lines
        for ev in json.loads(line[6:]):
            ts = int(ev["timestamp_ns"])
            received += 1
            late += ev["late"]
            if ts < last and not ev["late"]:
                out_of_order += 1
            last = max(last, ts)
        print(f"received={received} out_of_order={out_of_order} late={late}")
        if received >= args.expect:
            break

print("PASS" if received == args.expect and out_of_order == 0 else "FAIL")
