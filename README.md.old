# Arrangent - Multi-Agent Orchestration System

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Yarn](https://img.shields.io/badge/yarn-4.12.0-blue.svg)](https://yarnpkg.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Arrangent** is an advanced multi-agent orchestration system powered by Google Gemini AI, designed to decompose complex tasks into specialized roles managed by independent LLM agents with unidirectional data flow architecture.

## 🌟 Core Philosophy

Arrangent draws inspiration from proven distributed system patterns:

- **Kubernetes-style Declarative Configuration**: Ensures service consistency and predictable agent behavior
- **MapReduce-inspired Concurrency**: Enables parallel task execution while maintaining data consistency
- **Redux-like Unidirectional Flow**: Guarantees alignment of LLM-generated content through controlled state transitions
- **Human-in-the-Loop**: Critical feedback collection points where humans validate and guide the agent workflow

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Human Feedback Loop                      │
│                    (Redux-like Actions)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Task Splitter │  ◄── Initial task decomposition
            │     Agent      │
            └────────┬───────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Alignment Checker    │  ◄── Validates consistency
         │      Agent            │      and assigns subtasks
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    ┌─────────┐            ┌─────────┐
    │ Worker  │            │ Worker  │
    │ Agent 1 │            │ Agent N │  ◄── Parallel execution
    └────┬────┘            └────┬────┘      with shared config
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌────────────────┐
            │    Reducer     │  ◄── Aggregates results
            │     Agent      │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Output Results │
            └────────────────┘
```

## 🎯 Key Features

### 1. **Role-Based Task Decomposition**
- Tasks are automatically split into multiple sub-tasks
- Each sub-task is assigned to a specialized role
- Roles are isolated and executed by dedicated LLM agents

### 2. **Unidirectional Data Flow**
- Data flows in one direction only: Input → Processing → Output
- Ensures consistency and alignment of LLM-generated content
- Prevents circular dependencies and conflicting states
- Transfer directories facilitate controlled information passing between nodes

### 3. **Parallel Execution with Shared Configuration**
- Single nodes can host multiple concurrent LLM instances
- All instances share a base configuration
- Each instance has its own scope division for specialized processing
- MapReduce-style task distribution for optimal throughput

### 4. **Memory-Persistent Agents**
- Each agent node maintains its own directory
- Stores execution history and context as Markdown files
- Enables agents to learn from past executions
- Facilitates debugging and audit trails

### 5. **Alignment Verification**
- Dedicated alignment checker agent monitors output consistency
- Validates results against expected patterns
- Assigns corrective tasks when misalignment is detected
- Iterative refinement until accuracy threshold is met

### 6. **Declarative Configuration**
- K8S-inspired YAML/JSON configuration
- Define agent roles, capabilities, and constraints declaratively
- Version-controlled agent behavior
- Easy replication and scaling

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Memkits/arrangent.git
cd arrangent

# Install dependencies (requires Yarn 4+)
yarn install

# Configure your Gemini API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

## 🚀 Quick Start

### 1. Define Your Agent Configuration

Create a configuration file `config/agents.yaml`:

```yaml
apiVersion: arrangent.io/v1
kind: AgentConfig
metadata:
  name: document-analysis-pipeline
spec:
  task: "Analyze and summarize technical documentation"
  
  roles:
    - name: task-splitter
      type: splitter
      llm:
        model: gemini-1.5-pro
        temperature: 0.3
      
    - name: alignment-checker
      type: checker
      llm:
        model: gemini-1.5-pro
        temperature: 0.1
      validation:
        accuracyThreshold: 0.95
        maxIterations: 3
    
    - name: document-analyzer
      type: worker
      llm:
        model: gemini-1.5-flash
        temperature: 0.5
      parallelism: 3
      scope:
        - sections
        - chapters
    
    - name: result-reducer
      type: reducer
      llm:
        model: gemini-1.5-pro
        temperature: 0.3
  
  flow:
    - from: task-splitter
      to: document-analyzer
      via: transfer/input
    
    - from: document-analyzer
      to: alignment-checker
      via: transfer/worker-output
    
    - from: alignment-checker
      to: result-reducer
      via: transfer/validated-output
```

### 2. Run Your Pipeline

```bash
# Execute with configuration
yarn start --config config/agents.yaml --input "path/to/document.pdf"

# Or use the programmatic API
node examples/run-pipeline.js
```

### 3. Monitor Progress

```bash
# View agent memory (execution history)
cat memory/document-analyzer/execution-*.md

# Check transfer data between nodes
cat transfer/worker-output/data.json
```

## 📁 Project Structure

```
arrangent/
├── config/              # Agent configuration files
│   └── agents.yaml      # Declarative agent definitions
├── src/
│   ├── agents/          # Agent implementations
│   │   ├── splitter.ts  # Task decomposition agent
│   │   ├── worker.ts    # Generic worker agent
│   │   ├── checker.ts   # Alignment verification agent
│   │   └── reducer.ts   # Result aggregation agent
│   ├── core/
│   │   ├── flow.ts      # Unidirectional data flow manager
│   │   ├── memory.ts    # Markdown-based memory storage
│   │   ├── config.ts    # Configuration parser
│   │   └── gemini.ts    # Gemini API integration
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main entry point
├── memory/              # Agent memory directories (runtime)
│   ├── task-splitter/
│   ├── document-analyzer/
│   └── alignment-checker/
├── transfer/            # Inter-node data transfer (runtime)
│   ├── input/
│   ├── worker-output/
│   └── validated-output/
├── examples/            # Usage examples
└── tests/               # Test suites
```

## 🔧 Configuration Reference

### Agent Types

1. **Splitter**: Decomposes initial task into sub-tasks
2. **Worker**: Executes specific sub-tasks (can run in parallel)
3. **Checker**: Validates output alignment and quality
4. **Reducer**: Aggregates results from multiple workers
5. **Collector**: Gathers human feedback (human-in-the-loop)

### LLM Configuration

```yaml
llm:
  model: gemini-1.5-pro | gemini-1.5-flash
  temperature: 0.0-1.0    # Creativity level
  maxTokens: 1000         # Response length limit
  topP: 0.95              # Nucleus sampling
  topK: 40                # Top-K sampling
```

### Parallelism Settings

```yaml
parallelism: 3            # Number of concurrent LLM instances
scope:                    # Scope division for each instance
  - sections
  - chapters
  - appendices
```

## 🔐 Environment Variables

```bash
# Required
GEMINI_API_KEY=your_api_key_here

# Optional
LOG_LEVEL=info                    # debug | info | warn | error
MEMORY_DIR=./memory               # Agent memory storage path
TRANSFER_DIR=./transfer           # Data transfer directory
MAX_ITERATIONS=5                  # Maximum refinement iterations
ALIGNMENT_THRESHOLD=0.95          # Minimum alignment score
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run specific test suite
yarn test:agents
yarn test:flow
yarn test:integration

# Run with coverage
yarn test:coverage
```

## 📊 Monitoring & Debugging

### Memory Inspection

Each agent stores its execution history in Markdown format:

```bash
# View task splitter's decisions
cat memory/task-splitter/execution-2024-02-06-001.md

# Check alignment scores
cat memory/alignment-checker/validation-results.md
```

### Flow Visualization

```bash
# Generate flow diagram
yarn visualize --config config/agents.yaml

# Output: flow-diagram.svg
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Inspired by Kubernetes declarative configuration patterns
- Data flow architecture influenced by Redux and functional programming
- Parallel processing concepts from MapReduce
- Google Gemini API for powerful LLM capabilities

## 📞 Support

- 📧 Email: support@memkits.org
- 💬 Discord: [Join our community](https://discord.gg/arrangent)
- 🐛 Issues: [GitHub Issues](https://github.com/Memkits/arrangent/issues)

---

**Built with ❤️ by the Memkits team**
