# CLI Management System - Quick Reference

## Starting the System

### 1. Start Server
```bash
# Terminal 1
yarn build
yarn arrangent server
```

### 2. Submit Topology
```bash
# Terminal 2
yarn arrangent submit topologies/sample.yaml
```

### 3. Monitor Activity
```bash
# Terminal 3
yarn arrangent monitor
```

## Common Commands

```bash
# List all instances
yarn arrangent list

# Inspect specific node
yarn arrangent inspect parallel-workers

# View instance logs
yarn arrangent logs <instance-id>

# Interact with agent
yarn arrangent interact <instance-id>

# Restart instance
yarn arrangent restart <instance-id>

# Show topology
yarn arrangent topology
```

## Memory Structure

```
memory/
├── {node-id}/
│   ├── config/
│   │   └── base.json              # Layer 1: Base configuration
│   ├── instances/
│   │   └── {instance-id}.json     # Layer 2: Instance state
│   └── runtime/
│       └── {instance-id}/
│           └── {exec-id}.md       # Layer 3: Runtime memory
```

## Agent States

- 🔵 **idle** - Waiting for work
- 🔵 **running** - Executing
- 🟡 **waiting** - Needs user input
- ⏸️  **paused** - Paused by user
- 🔴 **error** - Error occurred  
- 🟢 **completed** - Finished

## Full Documentation

See [CLI_GUIDE.md](./CLI_GUIDE.md) for complete documentation.
