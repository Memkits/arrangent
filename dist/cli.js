#!/usr/bin/env node
import { Command } from 'commander';
import { config } from 'dotenv';
import { FlowEngine } from './engine.js';
import { AgentServer } from './server/agent-server.js';
import { AgentCLI } from './cli/commands.js';
import { AgentMonitor } from './cli/monitor.js';
config();
const cli = new Command();
cli.name('arrangent')
    .version('0.1.0')
    .description('Multi-agent orchestration system with CLI management interface');
// Original simple run command (kept for backwards compatibility)
cli.command('run')
    .description('Run a simple flow (legacy)')
    .action(async () => {
    const flowConfig = {
        roles: [
            { name: 'splitter', type: 'splitter', geminiSettings: { temp: 0.3, tokens: 4096 } },
            { name: 'worker', type: 'worker', geminiSettings: { temp: 0.7, tokens: 4096 }, parallel: 2 },
            { name: 'validator', type: 'validator', geminiSettings: { temp: 0.1, tokens: 2048 } },
            { name: 'merger', type: 'merger', geminiSettings: { temp: 0.3, tokens: 4096 } }
        ],
        connections: [
            { from: 'splitter', to: 'worker', channel: 'tasks' },
            { from: 'worker', to: 'validator', channel: 'results' },
            { from: 'validator', to: 'merger', channel: 'validated' }
        ]
    };
    const engine = new FlowEngine(flowConfig, process.env.GEMINI_API_KEY);
    const result = await engine.execute({ task: 'Analyze distributed systems patterns' });
    console.log('Result:', JSON.stringify(result, null, 2));
    const stats = await engine.stats();
    console.log('Stats:', stats);
});
// Server command - start the agent management server
cli.command('server')
    .description('Start the agent management server')
    .option('-p, --port <port>', 'Server port', '3000')
    .option('-m, --memory-dir <dir>', 'Memory storage directory', './memory')
    .option('-l, --log-level <level>', 'Log level (debug|info|warn|error)', 'info')
    .action(async (options) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY environment variable not set');
        process.exit(1);
    }
    const server = new AgentServer({
        port: parseInt(options.port),
        memoryDir: options.memoryDir,
        logLevel: options.logLevel
    }, apiKey);
    await server.start();
    console.log(`\n✓ Arrangent server running on http://localhost:${options.port}`);
    console.log('Press Ctrl+C to stop\n');
});
// Submit topology configuration
cli.command('submit')
    .description('Submit a topology configuration from YAML file')
    .argument('<yaml-file>', 'Path to topology YAML file')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (yamlFile, options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.submitTopology(yamlFile);
});
// Monitor agent activity with streaming output
cli.command('monitor')
    .description('Monitor agent activity with real-time streaming')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (options) => {
    const monitor = new AgentMonitor(options.server);
    await monitor.start();
});
// List all instances
cli.command('list')
    .description('List all agent instances')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.listInstances();
});
// Inspect specific node
cli.command('inspect')
    .description('Inspect a specific node and its instances')
    .argument('<node-id>', 'Node ID to inspect')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (nodeId, options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.inspectNode(nodeId);
});
// Interact with instance
cli.command('interact')
    .description('Interact with a specific agent instance')
    .argument('<instance-id>', 'Instance ID')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (instanceId, options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.interact(instanceId);
});
// Restart instance
cli.command('restart')
    .description('Restart a specific agent instance')
    .argument('<instance-id>', 'Instance ID')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (instanceId, options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.restartInstance(instanceId);
});
// View logs
cli.command('logs')
    .description('View runtime logs for an agent instance')
    .argument('<instance-id>', 'Instance ID')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (instanceId, options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.viewLogs(instanceId);
});
// Show topology
cli.command('topology')
    .description('Show the current topology visualization')
    .option('-s, --server <url>', 'Server URL', 'http://localhost:3000')
    .action(async (options) => {
    const agentCLI = new AgentCLI({ serverUrl: options.server });
    await agentCLI.showTopology();
});
cli.parse();
