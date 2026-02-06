# Testing the CLI Management System

## Test Setup

1. Start server in background:
```bash
yarn server &
```

2. Wait for server to start (2 seconds)

3. Submit topology:
```bash
yarn submit topologies/sample.yaml
```

4. Check topology loaded:
```bash
curl http://localhost:3000/topology
```

5. List instances:
```bash
yarn arrangent list --server http://localhost:3000
```

6. Monitor (will run continuously):
```bash
yarn monitor
```

## Expected Behavior

- Server starts on port 3000
- Topology submission succeeds
- Topology shows nodes in levels
- No instances until execution starts
- Monitor connects via WebSocket

## Manual Test

Run these commands in separate terminals:

**Terminal 1:**
```bash
yarn server
```

**Terminal 2:**
```bash
yarn submit topologies/sample.yaml
yarn arrangent topology
```

**Terminal 3:**
```bash
yarn monitor
```

Success if all commands work without errors!
