# Arrangent - Multi-Agent Orchestration System

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Yarn](https://img.shields.io/badge/yarn-4.12.0-blue.svg)](https://yarnpkg.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Arrangent** is an advanced multi-agent orchestration system powered by Google Gemini AI. It enables complex task decomposition into specialized roles managed by independent LLM agents, with unidirectional data flow architecture and human-in-the-loop capabilities.

## 📖 Table of Contents

- [Core Philosophy](#-core-philosophy)
- [Architecture](#-architecture-overview)
- [Key Features](#-key-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [CLI Usage](#-cli-usage)
- [HTTP API](#-http-api)
- [Use Cases](#-use-cases)
- [Examples](#-examples)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

## 🌟 Core Philosophy

Arrangent draws inspiration from proven distributed system patterns to create a robust, scalable multi-agent orchestration platform:

### **Kubernetes-style Declarative Configuration**
- Define agent topologies as declarative YAML/JSON configurations
- Ensures service consistency and predictable agent behavior
- Version-controlled agent configurations for reproducibility
- K8S-style HTTP API for programmatic access

### **MapReduce-inspired Concurrency**
- Parallel task execution while maintaining data consistency
- Multiple LLM instances per node for high throughput
- Automatic load distribution across worker agents
- Efficient resource utilization

### **Redux-like Unidirectional Flow**
- Guarantees alignment of LLM-generated content
- Controlled state transitions prevent circular dependencies
- Single source of truth for data flow
- Predictable debugging and audit trails

### **Human-in-the-Loop**
- Critical feedback collection points
- Agents can request human guidance when uncertain
- Pause, inspect, and interact with running agents
- Manual intervention for quality assurance

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                  Human Feedback Loop                        │
│              (Redux-like Action Dispatch)                   │
└──────────────────────┬─────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
  ┌──────────┐                 ┌──────────┐
  │   CLI    │                 │ HTTP API │
  │  Client  │                 │ /api/v1  │
  └────┬─────┘                 └────┬─────┘
       │                             │
       └──────────────┬──────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │    AgentServer         │
         │  (Node.js + Express)   │
         └────────────┬───────────┘
                      │
         ┌────────────┴───────────┐
         │   TopologyManager      │
         │ (Execution Ordering)   │
         └────────────┬───────────┘
                      │
         ┌────────────┴───────────────┐
         │                            │
         ▼                            ▼
   ┌──────────┐              ┌──────────┐
   │ Splitter │              │  Merger  │
   │  Agent   │              │  Agent   │
   └────┬─────┘              └────┬─────┘
        │                          ▲
        │   ┌──────────────────┐  │
        └──►│  Worker Agents   │──┘
            │  (Parallel × N)  │
            └──────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ 3-Layer Memory │
            │  - Base Config │
            │  - State       │
            │  - Runtime     │
            └────────────────┘
```

## 🎯 Key Features

### 1. **Role-Based Task Decomposition**
Tasks are automatically split into specialized sub-tasks, each handled by dedicated LLM agents:
- **Splitter**: Decomposes initial task into manageable sub-tasks
- **Worker**: Executes specific sub-tasks (runs in parallel)
- **Validator**: Validates output alignment and quality
- **Merger**: Aggregates results from multiple workers

### 2. **Unidirectional Data Flow**
```
Input → Splitter → Workers → Validator → Merger → Output
         ↓           ↓          ↓           ↓
      Memory      Memory     Memory      Memory
```
- Data flows in one direction only
- Prevents circular dependencies
- Ensures consistency and alignment
- Transfer channels for controlled information passing

### 3. **Parallel Execution**
- Multiple LLM instances per node (configurable)
- Shared base configuration with instance-specific scopes
- MapReduce-style task distribution
- 3-5x speedup for large tasks

### 4. **3-Layer Memory System**
```
Layer 1: Base Configuration (shared)
  └─ memory/{node}/config/base.json

Layer 2: Instance State (per-instance)
  └─ memory/{node}/instances/{id}.json

Layer 3: Runtime Memory (execution history)
  └─ memory/{node}/runtime/{id}/{exec}.md
```

### 5. **Kubernetes-Style HTTP API**
- RESTful API following K8S resource patterns
- CRUD operations for topologies, nodes, instances
- Watch API for real-time updates (WebSocket)
- CORS-enabled for web client development
- Versioned API (/api/v1/)

### 6. **Human-in-the-Loop**
- Agents can pause and request human input
- Interactive mode for guidance and intervention
- Real-time monitoring with streaming output
- Pause/resume/restart capabilities

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Memkits/arrangent.git
cd arrangent

# Install dependencies (requires Yarn 4+)
yarn install

# Build the project
yarn build

# Configure your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## 🚀 Quick Start

### Method 1: Using CLI

```bash
# Terminal 1: Start the management server
yarn arrangent server

# Terminal 2: Submit a topology
yarn arrangent submit topologies/sample.yaml

# Terminal 3: Monitor real-time execution
yarn arrangent monitor
```

### Method 2: Using HTTP API

```bash
# Start server
yarn arrangent server

# Create topology via API
curl -X POST http://localhost:3000/api/v1/topologies \
  -H "Content-Type: application/json" \
  -d @topologies/sample.json

# Start execution
curl -X POST http://localhost:3000/api/v1/executions \
  -H "Content-Type: application/json" \
  -d '{"input": {"task": "Analyze microservices architecture"}}'
```

### Method 3: Run Demo Cases

```bash
# Simple demonstration
yarn demo

# Documentation analysis demo
yarn demo:doc

# Code review demo
yarn demo:review

# Video blogger style mimicry (complex case study)
yarn case:blogger
```

## 💻 CLI Usage

### Server Management

```bash
# Start server with default settings
yarn arrangent server

# Custom port and log level
yarn arrangent server --port 3001 --log-level debug

# Custom memory directory
yarn arrangent server --memory-dir ./my-memory
```

### Topology Management

```bash
# Submit topology configuration
yarn arrangent submit topologies/sample.yaml

# View topology visualization
yarn arrangent topology
```

### Monitoring & Inspection

```bash
# Real-time monitoring (streaming output)
yarn arrangent monitor

# List all instances
yarn arrangent list

# Inspect specific node
yarn arrangent inspect node-id

# View instance logs
yarn arrangent logs instance-id
```

### Human Interaction

```bash
# Send custom prompt to agent
yarn arrangent interact instance-id

# Restart instance (clears state)
yarn arrangent restart instance-id
```

### Complete Example Workflow

```bash
# 1. Start server
yarn arrangent server &

# 2. Submit topology
yarn arrangent submit topologies/sample.yaml

# 3. Monitor in real-time
yarn arrangent monitor

# When agent waits for input:
# [14:32:47] worker-a1b2 🟡 WAITING FOR INPUT:
#    Please clarify requirement X

# 4. Provide guidance
yarn arrangent interact worker-a1b2
> "Requirement X means focus on performance"

# Agent continues:
# [14:32:50] worker-a1b2 🔵 RUNNING
# [14:32:52] worker-a1b2 🟢 COMPLETED
```

## 🌐 HTTP API

Arrangent provides a Kubernetes-style RESTful HTTP API for programmatic access and custom client development.

### API Discovery

```bash
GET /api/v1
```

Returns available API resources and their capabilities.

### Topology Management

```bash
# List all topologies
GET /api/v1/topologies

# Create topology
POST /api/v1/topologies
Content-Type: application/json
{
  "apiVersion": "arrangent.io/v1",
  "kind": "Topology",
  "metadata": {"name": "my-workflow"},
  "spec": {...}
}

# Get specific topology
GET /api/v1/topologies/{name}

# Get topology status
GET /api/v1/topologies/{name}/status

# Delete topology
DELETE /api/v1/topologies/{name}
```

### Node Management

```bash
# List all nodes
GET /api/v1/nodes

# Get specific node
GET /api/v1/nodes/{id}

# List node instances
GET /api/v1/nodes/{id}/instances
```

### Instance Management

```bash
# List all instances
GET /api/v1/instances

# Get instance details
GET /api/v1/instances/{id}

# Get instance status
GET /api/v1/instances/{id}/status

# Update instance status
PUT /api/v1/instances/{id}/status
Content-Type: application/json
{"action": "pause" | "resume"}

# Interact with instance
POST /api/v1/instances/{id}/interact
Content-Type: application/json
{"prompt": "Your guidance here"}

# Delete/stop instance
DELETE /api/v1/instances/{id}
```

### Execution Management

```bash
# Create execution
POST /api/v1/executions
Content-Type: application/json
{
  "input": {
    "task": "Your task description",
    "data": {...}
  }
}
```

### Response Format (K8S-style)

```json
{
  "apiVersion": "arrangent.io/v1",
  "kind": "Instance",
  "metadata": {
    "name": "worker-1-abc123",
    "namespace": "default",
    "uid": "abc123...",
    "createdAt": "2024-02-06T10:00:00Z",
    "labels": {
      "node": "worker-1",
      "type": "worker"
    }
  },
  "spec": {
    "nodeId": "worker-1",
    "config": {...}
  },
  "status": {
    "state": "running",
    "progress": 0.5,
    "message": "Processing..."
  }
}
```

### WebSocket Streaming

```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message.type, message.content);
};
```

### CORS Support

The API includes CORS headers, enabling web-based clients to connect from any origin during development.

## 🎯 Use Cases

### 1. **Complex Document Analysis**
- Split documents into sections
- Parallel analysis by multiple agents
- Quality validation and consolidation
- **Performance**: 4x faster with 3 workers

### 2. **Code Review Automation**
- Decompose codebase into modules
- Parallel security and quality checks
- Aggregate findings with recommendations
- **Benefit**: Consistent review standards

### 3. **Content Generation at Scale**
- Break content into segments
- Generate segments in parallel
- Style validation and merging
- **Example**: [Video Blogger Case Study](cases/video-blogger/)

### 4. **Research & Data Analysis**
- Distribute research tasks
- Parallel data collection and analysis
- Cross-validation of findings
- **Benefit**: Comprehensive coverage

### 5. **Multi-Language Translation**
- Segment source content
- Parallel translation by language
- Quality assurance validation
- **Result**: Consistent terminology

## 📚 Examples

### Running Examples

```bash
# HTTP API examples (requires jq)
./examples/http-api-examples.sh

# CLI workflow examples
./examples/cli-workflows.sh

# Or view the scripts for reference
cat examples/http-api-examples.sh
cat examples/cli-workflows.sh
```

### Case Studies

#### Simple Demos
```bash
yarn demo          # Basic flow
yarn demo:doc      # Document analysis
yarn demo:review   # Code review
```

#### Complex Case Study
```bash
yarn case:blogger  # Video blogger style mimicry
# See cases/video-blogger/ for complete documentation
```

## ⚙️ Configuration

### Topology YAML Format

```yaml
nodes:
  - id: unique-node-id
    name: Human Readable Name
    type: splitter|worker|validator|merger
    geminiSettings:
      temp: 0.3              # Temperature (0-1)
      tokens: 4096           # Max tokens
    parallel: 3              # Number of instances
    dependencies:            # List of node IDs
      - prerequisite-node-id

connections:
  - from: source-node-id
    to: target-node-id
    channel: channel-name
```

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
LOG_LEVEL=info                    # debug|info|warn|error
MEMORY_DIR=./memory               # Memory storage path
SERVER_PORT=3000                  # API server port
```

## 🔧 Troubleshooting

### Common Issues

**Issue**: Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Use different port
yarn arrangent server --port 3001
```

**Issue**: API key not found
```bash
# Ensure .env file exists
cat .env

# Should contain:
GEMINI_API_KEY=your_key_here
```

**Issue**: Instance not responding
```bash
# Check instance status
yarn arrangent inspect instance-id

# View logs
yarn arrangent logs instance-id

# Restart if needed
yarn arrangent restart instance-id
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Kubernetes**: Declarative configuration patterns
- **Redux**: Unidirectional data flow architecture
- **MapReduce**: Parallel processing concepts
- **Google Gemini**: Powerful LLM capabilities

## 📞 Support

- 📧 Email: support@memkits.org
- 💬 Discord: [Join our community](https://discord.gg/arrangent)
- 🐛 Issues: [GitHub Issues](https://github.com/Memkits/arrangent/issues)
- 📖 Documentation: See CLI_GUIDE.md and other docs

## 🔗 Resources

- [CLI Guide](CLI_GUIDE.md) - Complete command reference
- [Quick Start](CLI_QUICKSTART.md) - Get started in 5 minutes
- [Case Studies](cases/) - Production-ready examples
- [API Examples](examples/) - HTTP API and CLI usage

---

**Built with ❤️ by the Memkits team**
