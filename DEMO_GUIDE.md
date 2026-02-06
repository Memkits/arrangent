# Quick Demo Guide

This guide shows how to run the demonstration cases in the Arrangent project.

## Prerequisites

1. Set up your environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Build the project:
   ```bash
   yarn build
   ```

## Running Demos

### 1. Microservices Architecture Analysis
```bash
yarn demo
```
Analyzes microservices concepts including service mesh, API gateway patterns, and best practices.

### 2. Technical Documentation Analysis
```bash
yarn demo:doc
```
Processes technical documentation about distributed systems, extracting key concepts and generating insights.

### 3. Code Review Analysis
```bash
yarn demo:review
```
Performs automated code review focusing on security vulnerabilities, code quality, and best practices.

## Demo Features Comparison

| Feature | Microservices | Documentation | Code Review |
|---------|--------------|---------------|-------------|
| Parallel Workers | 2 | 3 | 2 |
| Temperature (Splitter) | 0.3 | 0.2 | 0.2 |
| Temperature (Worker) | 0.7 | 0.5 | 0.6 |
| Focus Area | Architecture | Analysis | Security |

## Customizing Demos

Each demo can be customized by modifying the configuration:

```typescript
const demoConfig = {
  roles: [
    { 
      name: 'role-name', 
      type: 'splitter' | 'worker' | 'validator' | 'merger',
      geminiSettings: { temp: 0.0-1.0, tokens: 2048-8192 },
      parallel?: 1-10  // Only for worker roles
    }
  ],
  connections: [
    { from: 'source', to: 'target', channel: 'channel-name' }
  ]
};
```

## Understanding Output

Each demo will:
1. Show progress as it processes through each role
2. Display the final result in JSON format
3. Show execution statistics (number of runs per role)

## Troubleshooting

- **Missing API Key**: Ensure GEMINI_API_KEY is set in your .env file
- **Build Errors**: Run `yarn clean && yarn build`
- **Module Not Found**: Run `yarn install` again

For more details, see `demo/README.md`.
