# Demo Cases

This directory contains demonstration cases showcasing different use cases of the Arrangent multi-agent orchestration system.

## Available Cases

### 1. Microservices Architecture Analysis (`run.ts`)
Demonstrates analyzing microservices architecture concepts.

**Run with:**
```bash
yarn demo
```

**Use case:** Explains service mesh, API gateway patterns, and best practices for microservices.

### 2. Technical Documentation Analysis (`doc-analysis.ts`)
Demonstrates processing and analyzing technical documentation.

**Run with:**
```bash
yarn demo:doc
```

**Use case:** Analyzes distributed systems design guide, extracting key concepts, identifying relationships, and generating actionable insights.

**Features:**
- Parallel processing with 3 worker instances
- Lower temperature for more focused analysis
- Comprehensive section-by-section breakdown

### 3. Code Review Analysis (`code-review.ts`)
Demonstrates automated code review with security and quality focus.

**Run with:**
```bash
yarn demo:review
```

**Use case:** Reviews code changes for security vulnerabilities, code quality, performance, and documentation needs.

**Features:**
- Security-focused validation
- Multi-aspect code analysis
- Detailed review report generation

## Configuration

All demos require a `GEMINI_API_KEY` environment variable. Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

## Role Configuration

Each demo showcases different configurations of the four role types:

- **Splitter**: Decomposes tasks into subtasks
- **Worker**: Processes work chunks (supports parallel execution)
- **Validator**: Checks output quality and alignment
- **Merger**: Combines results into final output

You can customize the `geminiSettings` for each role:
- `temp`: Temperature (0.0-1.0) - controls randomness
- `tokens`: Maximum output tokens
- `parallel`: Number of parallel worker instances (worker role only)
