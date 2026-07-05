# Sample captures

The dashboard ships with **synthesized** sample captures (built in
`web/src/samples/`) so every lab works without hardware — see the sample buttons
in the Capture Loader.

Drop your own real captures here (or anywhere) and load them via the dashboard:

```bash
./scripts/capture.sh -b 1 -d 10 -o my-device
# then drag captures/my-device.pcapng into the dashboard
```

Real `.pcapng` / `.pcap` files placed in `captures/` are git-ignored by default;
files in this `samples/` folder are kept so you can commit curated examples.
