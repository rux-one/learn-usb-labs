#!/usr/bin/env python3
"""Convert a usbmon .pcapng capture into the normalized JSON the dashboard expects.

Usage:
    ./scripts/pcap-to-json.py input.pcapng [output.json]

Requires `tshark` on PATH. If output is omitted, prints JSON to stdout.

Normalized schema (also produced client-side by web/src/lib/usb/pcapng.ts):
{
  "meta":   { "source": str, "packetCount": int, "generatedBy": str },
  "packets": [ USBPacket, ... ]
}
USBPacket = {
  "index": int, "timestamp": float, "busId": int|null, "deviceAddress": int|null,
  "endpoint": int|null, "direction": "IN"|"OUT"|null,
  "transferType": "CONTROL"|"BULK"|"INTERRUPT"|"ISOCHRONOUS"|"UNKNOWN",
  "urbType": "SUBMIT"|"COMPLETE"|null,
  "setup": { "bmRequestType": int, "bRequest": int, "wValue": int,
             "wIndex": int, "wLength": int } | null,
  "dataHex": str, "status": int|null
}
"""
import json
import shutil
import subprocess
import sys

# usbmon transfer_type codes (Linux)
TRANSFER_TYPES = {0: "ISOCHRONOUS", 1: "INTERRUPT", 2: "CONTROL", 3: "BULK"}

FIELDS = [
    "frame.number",
    "frame.time_relative",
    "usb.bus_id",
    "usb.device_address",
    "usb.endpoint_address",
    "usb.transfer_type",
    "usb.urb_type",
    "usb.setup.bmRequestType",
    "usb.setup.bRequest",
    "usb.setup.wValue",
    "usb.setup.wIndex",
    "usb.setup.wLength",
    "usb.urb_status",
    "usb.capdata",
    "usb.data_fragment",
]


def parse_int(val):
    """Parse tshark numeric field which may be hex (0x..) or decimal."""
    if val is None or val == "":
        return None
    val = val.strip().split(",")[0]  # sometimes comma-joined dup fields
    try:
        if val.lower().startswith("0x"):
            return int(val, 16)
        return int(val)
    except ValueError:
        return None


def parse_urb_type(val):
    if not val:
        return None
    v = val.strip().split(",")[0]
    # tshark may emit char ('S'/'C') or the ASCII code (83/67)
    if v in ("S", "'S'"):
        return "SUBMIT"
    if v in ("C", "'C'"):
        return "COMPLETE"
    n = parse_int(v)
    if n == 83:
        return "SUBMIT"
    if n == 67:
        return "COMPLETE"
    return None


def clean_hex(val):
    if not val:
        return ""
    # tshark returns colon-separated bytes, possibly multiple fields comma-joined
    val = val.replace(",", ":")
    return val.replace(":", "").strip().lower()


def run_tshark(path):
    cmd = ["tshark", "-r", path, "-T", "fields", "-E", "separator=\t", "-E", "occurrence=f"]
    for f in FIELDS:
        cmd += ["-e", f]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr)
        raise SystemExit(f"tshark failed (exit {proc.returncode})")
    return proc.stdout


def convert(path):
    raw = run_tshark(path)
    packets = []
    for line in raw.splitlines():
        cols = line.split("\t")
        # pad to expected length
        cols += [""] * (len(FIELDS) - len(cols))
        (num, trel, bus, dev, epaddr, ttype, urb,
         bmreq, breq, wval, widx, wlen, status, capdata, datafrag) = cols[:15]

        ep_raw = parse_int(epaddr)
        endpoint = (ep_raw & 0x0F) if ep_raw is not None else None
        direction = None
        if ep_raw is not None:
            direction = "IN" if (ep_raw & 0x80) else "OUT"

        tt = parse_int(ttype)
        transfer_type = TRANSFER_TYPES.get(tt, "UNKNOWN")

        setup = None
        bm = parse_int(bmreq)
        if bm is not None:
            setup = {
                "bmRequestType": bm,
                "bRequest": parse_int(breq) or 0,
                "wValue": parse_int(wval) or 0,
                "wIndex": parse_int(widx) or 0,
                "wLength": parse_int(wlen) or 0,
            }

        data_hex = clean_hex(capdata) or clean_hex(datafrag)

        packets.append({
            "index": (parse_int(num) or 0) - 1,
            "timestamp": float(trel) if trel else 0.0,
            "busId": parse_int(bus),
            "deviceAddress": parse_int(dev),
            "endpoint": endpoint,
            "direction": direction,
            "transferType": transfer_type,
            "urbType": parse_urb_type(urb),
            "setup": setup,
            "dataHex": data_hex,
            "status": parse_int(status),
        })

    return {
        "meta": {
            "source": path,
            "packetCount": len(packets),
            "generatedBy": "pcap-to-json.py",
        },
        "packets": packets,
    }


def main():
    if len(sys.argv) < 2:
        sys.stderr.write(__doc__)
        raise SystemExit(1)
    if not shutil.which("tshark"):
        raise SystemExit("tshark not found on PATH. Run ./scripts/check-env.sh")

    inp = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    result = convert(inp)
    text = json.dumps(result, indent=2)
    if out:
        with open(out, "w") as f:
            f.write(text)
        sys.stderr.write(f"Wrote {out} ({result['meta']['packetCount']} packets)\n")
    else:
        print(text)


if __name__ == "__main__":
    main()
