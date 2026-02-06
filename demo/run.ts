import { config } from 'dotenv';
import { FlowEngine } from '../src/engine.js';

config();

const demoConfig = {
  roles: [
    { name: 'task-decomposer', type: 'splitter' as const, geminiSettings: { temp: 0.3, tokens: 4096 } },
    { name: 'work-executor', type: 'worker' as const, geminiSettings: { temp: 0.7, tokens: 4096 }, parallel: 2 },
    { name: 'quality-checker', type: 'validator' as const, geminiSettings: { temp: 0.1, tokens: 2048 } },
    { name: 'result-combiner', type: 'merger' as const, geminiSettings: { temp: 0.3, tokens: 4096 } }
  ],
  connections: [
    { from: 'task-decomposer', to: 'work-executor', channel: 'work-items' },
    { from: 'work-executor', to: 'quality-checker', channel: 'outputs' },
    { from: 'quality-checker', to: 'result-combiner', channel: 'approved' }
  ]
};

const engine = new FlowEngine(demoConfig, process.env.GEMINI_API_KEY!);

console.log('Running Arrangent demo...\n');

const result = await engine.execute({
  topic: 'Microservices Architecture',
  tasks: ['Explain service mesh', 'Describe API gateway patterns', 'List best practices']
});

console.log('\n✓ Complete!');
console.log('\nResult:', JSON.stringify(result, null, 2));

const stats = await engine.stats();
console.log('\nStats:', stats);
