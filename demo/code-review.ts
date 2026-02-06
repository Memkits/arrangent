import { config } from 'dotenv';
import { FlowEngine } from '../src/engine.js';

config();

const demoConfig = {
  roles: [
    { name: 'code-classifier', type: 'splitter' as const, geminiSettings: { temp: 0.2, tokens: 4096 } },
    { name: 'code-reviewer', type: 'worker' as const, geminiSettings: { temp: 0.6, tokens: 4096 }, parallel: 2 },
    { name: 'review-validator', type: 'validator' as const, geminiSettings: { temp: 0.1, tokens: 2048 } },
    { name: 'report-compiler', type: 'merger' as const, geminiSettings: { temp: 0.3, tokens: 4096 } }
  ],
  connections: [
    { from: 'code-classifier', to: 'code-reviewer', channel: 'code-chunks' },
    { from: 'code-reviewer', to: 'review-validator', channel: 'reviews' },
    { from: 'review-validator', to: 'report-compiler', channel: 'validated-reviews' }
  ]
};

const engine = new FlowEngine(demoConfig, process.env.GEMINI_API_KEY!);

console.log('Running Code Review Analysis Demo...\n');

const result = await engine.execute({
  pullRequest: 'PR #123 - Add user authentication service',
  codeChanges: `
    // New authentication service
    class AuthService {
      constructor(private db: Database) {}
      
      async authenticate(username: string, password: string) {
        const user = await this.db.findUser(username);
        if (!user) return null;
        
        // TODO: Add password hashing
        if (user.password === password) {
          return this.generateToken(user);
        }
        return null;
      }
      
      generateToken(user: User) {
        return jwt.sign({ id: user.id }, 'secret-key');
      }
    }
  `,
  reviewFocus: [
    'Security vulnerabilities',
    'Code quality and best practices',
    'Performance considerations',
    'Test coverage needs',
    'Documentation requirements'
  ]
});

console.log('\n✓ Code Review Complete!');
console.log('\nReview Result:', JSON.stringify(result, null, 2));

const stats = await engine.stats();
console.log('\nReview Stats:', stats);
