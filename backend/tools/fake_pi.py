"""Fake Raspberry Pi: sends shuffled packets so you can test ordering.

  Direct to backend:   python tools/fake_pi.py --mode http --target http://localhost:8000/ingest
  Through Fluent Bit:  python tools/fake_pi.py --mode tcp  --target localhost:5170
"""
import argparse
import json
import random
import socket
import time
import urllib.request
from datetime import datetime, timezone

PROTOCOLS = ["I2C", "SPI", "UART", "TCP"]


def make_packets(count: int, nodes: list[str], session: str) -> list[dict]:
    start_ns = time.time_ns()
    packets = []
    for i in range(count):
        ns = start_ns + i * 1_000_000                      # 1 ms apart
        sec, frac = divmod(ns, 1_000_000_000)
        ts = datetime.fromtimestamp(sec, timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        packets.append({
            "timestamp": f"{ts}.{frac:09d}Z",
            "node_id": random.choice(nodes),
            "session_id": session,
            "dut_id": "dut-test",
            "event_type": "onboard",
            "protocol": random.choice(PROTOCOLS),
            "duration": random.randint(100, 5000),
            "length_bytes": 4,
            "payload_hex": f"{i:08x}",                     # payload = original index
            "psf": {"seq_debug": i},
        })
    return packets


def shuffle_locally(packets: list[dict], window: int) -> list[dict]:
    """Swap packets only within small windows = realistic slight disorder."""
    out = []
    for i in range(0, len(packets), window):
        chunk = packets[i:i + window]
        random.shuffle(chunk)
        out.extend(chunk)
    return out


def send_http(target: str, packets: list[dict], batch: int) -> None:
    for i in range(0, len(packets), batch):
        body = "\n".join(json.dumps(p) for p in packets[i:i + batch]).encode()
        req = urllib.request.Request(target, data=body, method="POST")
        print(urllib.request.urlopen(req).read().decode())
        time.sleep(0.05)


def send_tcp(target: str, packets: list[dict]) -> None:
    host, port = target.split(":")
    with socket.create_connection((host, int(port))) as sock:
        for p in packets:
            sock.sendall((json.dumps(p) + "\n").encode())
    print(f"sent {len(packets)} packets to Fluent Bit")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["http", "tcp"], default="http")
    ap.add_argument("--target", default="http://localhost:8000/ingest")
    ap.add_argument("--count", type=int, default=200)
    ap.add_argument("--nodes", default="pi-01,pi-02")
    ap.add_argument("--session", default="s-test")
    ap.add_argument("--window", type=int, default=10, help="disorder window")
    ap.add_argument("--batch", type=int, default=20)
    args = ap.parse_args()

    pkts = shuffle_locally(make_packets(args.count, args.nodes.split(","), args.session), args.window)
    if args.mode == "http":
        send_http(args.target, pkts, args.batch)
    else:
        send_tcp(args.target, pkts)
