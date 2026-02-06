import { config } from 'dotenv';
import { FlowEngine } from '../src/engine.js';

config();

const demoConfig = {
  roles: [
    { name: 'doc-analyzer', type: 'splitter' as const, geminiSettings: { temp: 0.2, tokens: 4096 } },
    { name: 'section-processor', type: 'worker' as const, geminiSettings: { temp: 0.5, tokens: 4096 }, parallel: 3 },
    { name: 'content-validator', type: 'validator' as const, geminiSettings: { temp: 0.1, tokens: 2048 } },
    { name: 'summary-generator', type: 'merger' as const, geminiSettings: { temp: 0.4, tokens: 4096 } }
  ],
  connections: [
    { from: 'doc-analyzer', to: 'section-processor', channel: 'sections' },
    { from: 'section-processor', to: 'content-validator', channel: 'processed-sections' },
    { from: 'content-validator', to: 'summary-generator', channel: 'validated-content' }
  ]
};

const engine = new FlowEngine(demoConfig, process.env.GEMINI_API_KEY!);

console.log('Running Technical Documentation Analysis Demo...\n');

const result = await engine.execute({
  documentTitle: 'Distributed Systems Design Guide',
  content: `
    This comprehensive guide covers essential distributed systems concepts:
    
    1. System Architecture
       - Microservices vs Monoliths
       - Service discovery patterns
       - Load balancing strategies
    
    2. Data Management
       - CAP theorem implications
       - Eventual consistency models
       - Database sharding techniques
    
    3. Communication Patterns
       - Synchronous vs Asynchronous messaging
       - Event-driven architecture
       - API gateway design
    
    4. Reliability & Resilience
       - Circuit breaker pattern
       - Retry strategies
       - Fault tolerance mechanisms
    
    5. Observability
       - Distributed tracing
       - Metrics collection
       - Centralized logging
  `,
  analysisGoals: [
    'Extract key concepts from each section',
    'Identify relationships between topics',
    'Generate actionable insights',
    'Provide learning recommendations'
  ]
});

console.log('\n✓ Documentation Analysis Complete!');
console.log('\nResult:', JSON.stringify(result, null, 2));

const stats = await engine.stats();
console.log('\nExecution Stats:', stats);
