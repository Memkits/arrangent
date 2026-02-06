#!/usr/bin/env node
import { Command } from 'commander';
import { config } from 'dotenv';
import { FlowEngine } from './engine.js';
config();
const cli = new Command();
cli.name('arrangent').version('0.1.0');
cli.command('run').action(async () => {
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
cli.parse();
