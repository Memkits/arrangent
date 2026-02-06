# CLI Management Interface Guide

This guide explains how to use the Arrangent CLI to manage multi-agent workflows with human-in-the-loop capabilities.

## Overview

The CLI management interface provides:
- **Backend Server**: Node.js server managing multiple LLM instances
- **CLI Client**: Command-line tools for monitoring and interaction
- **3-Layer Memory System**: Configuration, instance state, and runtime memory
- **Real-time Monitoring**: Streaming output with WebSocket support
- **Human Intervention**: Pause, interact, and guide agents when needed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Client                           │
│  (monitor, submit, inspect, interact, logs)             │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/WebSocket
                   ▼
┌─────────────────────────────────────────────────────────┐
│             AgentServer (Node.js)                        │
│  - Topology Management                                   │
│  - Instance Lifecycle                                    │
│  - 3-Layer Memory System                                 │
│  - WebSocket Streaming                                   │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the Server

```bash
# Start server on default port 3000
yarn build
yarn arrangent server

# Or with custom options
yarn arrangent server --port 3001 --memory-dir ./my-memory --log-level debug
```

### 2. Submit a Topology

Create a YAML file defining your workflow (see `topologies/sample.yaml`):

```bash
# Submit topology configuration
yarn arrangent submit topologies/sample.yaml
```

### 3. Monitor Activity

```bash
# Start real-time monitoring (streams all agent output)
yarn arrangent monitor
```

## CLI Commands

### Server Management

#### `arrangent server`
Start the agent management server.

**Options:**
- `-p, --port <port>` - Server port (default: 3000)
- `-m, --memory-dir <dir>` - Memory directory (default: ./memory)
- `-l, --log-level <level>` - Log level: debug|info|warn|error (default: info)

**Example:**
```bash
yarn arrangent server --port 3000 --log-level info
```

### Configuration

#### `arrangent submit <yaml-file>`
Submit a topology configuration from YAML file.

**Arguments:**
- `<yaml-file>` - Path to topology YAML file

**Options:**
- `-s, --server <url>` - Server URL (default: http://localhost:3000)

**Example:**
```bash
yarn arrangent submit topologies/sample.yaml
```

### Monitoring

#### `arrangent monitor`
Monitor agent activity with real-time streaming output.

**Options:**
- `-s, --server <url>` - Server URL (default: http://localhost:3000)

**Example:**
```bash
yarn arrangent monitor
```

**Output:**
```
[14:32:45] a1b2c3d4 │ Processing with worker...
[14:32:46] a1b2c3d4 │ Generated response: ...
[14:32:47] a1b2c3d4 🟡 WAITING FOR INPUT:
   Please provide feedback on the quality
```

#### `arrangent list`
List all agent instances grouped by node.

**Example:**
```bash
yarn arrangent list
```

### Inspection

#### `arrangent inspect <node-id>`
Inspect a specific node and its instances.

**Arguments:**
- `<node-id>` - Node ID to inspect

**Example:**
```bash
yarn arrangent inspect parallel-workers
```

#### `arrangent logs <instance-id>`
View runtime logs for a specific instance.

**Arguments:**
- `<instance-id>` - Instance ID

**Example:**
```bash
yarn arrangent logs a1b2c3d4
```

#### `arrangent topology`
Show the current topology visualization.

**Example:**
```bash
yarn arrangent topology
```

### Interaction

#### `arrangent interact <instance-id>`
Interact with a specific agent instance (send custom prompts).

**Arguments:**
- `<instance-id>` - Instance ID

**Example:**
```bash
yarn arrangent interact a1b2c3d4
```

#### `arrangent restart <instance-id>`
Restart a specific agent instance (clears runtime memory).

**Arguments:**
- `<instance-id>` - Instance ID

**Example:**
```bash
yarn arrangent restart a1b2c3d4
```

## Memory Structure

The system maintains a 3-layer memory structure:

### Layer 1: Base Configuration
- Original YAML configuration
- Shared across all instances of a node
- Located at: `memory/{node-id}/config/base.json`

### Layer 2: Instance State
- Per-instance configuration and state
- Tracks status, progress, errors
- Located at: `memory/{node-id}/instances/{instance-id}.json`

### Layer 3: Runtime Memory
- Temporary execution memory
- Stored as Markdown for readability
- Located at: `memory/{node-id}/runtime/{instance-id}/{execution-id}.md`

**Example Runtime Memory:**
```markdown
# Execution abc-123

**Timestamp**: 2026-02-06T04:00:00.000Z
**Instance**: a1b2c3d4
**Node**: parallel-workers

## Input
```json
{
  "task": "Analyze pattern X"
}
```

## Output
```json
{
  "result": "Analysis complete",
  "confidence": 0.92
}
```
```

## Topology YAML Format

```yaml
nodes:
  - id: unique-node-id
    name: Human Readable Name
    type: splitter|worker|validator|merger
    geminiSettings:
      temp: 0.3        # Temperature (0-1)
      tokens: 4096     # Max tokens
    parallel: 2        # Number of instances (optional, default: 1)
    dependencies:      # List of node IDs this depends on
      - other-node-id

connections:
  - from: source-node-id
    to: target-node-id
    channel: channel-name  # Data channel name
```

## Use Cases

### 1. Complex Task with Human Checkpoints

```bash
# Terminal 1: Start server
yarn arrangent server

# Terminal 2: Submit topology with validation checkpoints
yarn arrangent submit topologies/human-checkpoint.yaml

# Terminal 3: Monitor and interact when needed
yarn arrangent monitor

# When agent needs input (monitor shows waiting status):
yarn arrangent interact <instance-id>
# Provide feedback
# Agent continues with updated context
```

### 2. Debugging Agent Behavior

```bash
# List all instances to find problematic one
yarn arrangent list

# Inspect specific node
yarn arrangent inspect parallel-workers

# View execution history
yarn arrangent logs a1b2c3d4

# Restart if needed
yarn arrangent restart a1b2c3d4
```

### 3. Production Monitoring

```bash
# Start monitoring in production
yarn arrangent monitor --server https://prod-server.com

# View topology to understand workflow
yarn arrangent topology --server https://prod-server.com

# Check instance status
yarn arrangent list --server https://prod-server.com
```

## Agent Status States

- **🔵 idle** - Not running, waiting for work
- **🔵 running** - Currently executing
- **🟡 waiting** - Waiting for user input
- **⏸️  paused** - Paused by user
- **🔴 error** - Error occurred
- **🟢 completed** - Finished successfully

## Troubleshooting

### Server won't start
- Check if port is already in use: `lsof -i :3000`
- Verify GEMINI_API_KEY is set: `echo $GEMINI_API_KEY`

### Can't connect to server
- Ensure server is running: `curl http://localhost:3000/health`
- Check firewall settings
- Verify correct server URL in CLI commands

### Instance stuck in "waiting" state
- Use `arrangent monitor` to see what it's waiting for
- Use `arrangent interact <instance-id>` to provide input
- Or restart: `arrangent restart <instance-id>`

### Memory usage growing
- Runtime memory accumulates over time
- Restart instances to clear: `arrangent restart <instance-id>`
- Or stop server and clean memory directory

## Advanced Features

### Custom Prompts During Execution

When an agent encounters uncertainty or needs clarification:
1. It enters "waiting" state
2. Monitor shows the prompt/question
3. Use `interact` command to provide guidance
4. Agent continues with your input incorporated

### Parallel Instance Coordination

When `parallel: N` is set in topology:
- N instances spawn for that node
- Each processes data independently
- Results are aggregated automatically
- All instances share base configuration
- Each has separate runtime memory

### Streaming Output

The monitor command provides real-time streaming:
- See agent thinking process
- Catch issues early
- Provide timely intervention
- Track progress across all instances

## Best Practices

1. **Start Small**: Test with 1 instance per node first
2. **Monitor First**: Always run monitor in a separate terminal
3. **Save Configurations**: Version control your topology YAML files
4. **Regular Restarts**: Restart instances periodically to clear memory
5. **Check Logs**: Use logs command to debug issues
6. **Use Checkpoints**: Add validation nodes for quality control
7. **Document Interventions**: Keep notes on manual interactions needed

## Next Steps

- Explore example topologies in `topologies/` directory
- Read the main README for architecture details
- Check out case studies in `cases/` directory
- Contribute new topology patterns

## API Reference

For programmatic access, the server exposes REST endpoints:

- `GET /health` - Health check
- `POST /topology` - Submit topology
- `GET /topology` - Get topology visualization
- `GET /instances` - List all instances
- `GET /instances/:id` - Get instance details
- `GET /instances/:id/history` - Get runtime history
- `POST /instances/:id/interact` - Send prompt to instance
- `POST /instances/:id/pause` - Pause instance
- `POST /instances/:id/resume` - Resume instance
- `POST /instances/:id/restart` - Restart instance
- `POST /execute` - Execute topology

WebSocket endpoint for streaming:
- `ws://localhost:3000` - Real-time event stream
