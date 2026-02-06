// Simple monitor for streaming agent output
import { WebSocket } from 'ws';
import chalk from 'chalk';
import { StreamMessage } from '../server/types.js';

export class AgentMonitor {
  private ws?: WebSocket;
  private reconnectInterval = 5000;
  private shouldReconnect = true;

  constructor(private serverUrl: string) {}

  async start(): Promise<void> {
    console.log(chalk.bold('\n🔍 Monitoring Agent Activity'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.yellow('Connecting to server...'));
    
    this.connect();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });

    return new Promise(() => {
      // Keep alive
    });
  }

  private connect(): void {
    const wsUrl = this.serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      console.log(chalk.green('\n✓ Connected to server'));
      console.log(chalk.gray('Streaming events...\n'));
    });

    this.ws.on('message', (data: Buffer) => {
      try {
        const message: StreamMessage = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error(chalk.red('Failed to parse message:'), error);
      }
    });

    this.ws.on('close', () => {
      console.log(chalk.yellow('\n⚠️  Disconnected from server'));
      
      if (this.shouldReconnect) {
        console.log(chalk.gray(`Reconnecting in ${this.reconnectInterval / 1000}s...`));
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    });

    this.ws.on('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error.message);
    });
  }

  private handleMessage(msg: StreamMessage): void {
    const timestamp = new Date(msg.timestamp).toLocaleTimeString();
    const instanceId = msg.instanceId.substring(0, 8);

    switch (msg.type) {
      case 'output':
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` ${instanceId} `) + chalk.white('│ ') + msg.content);
        break;
      
      case 'error':
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` ${instanceId} `) + chalk.red('✗ ERROR: ') + msg.content);
        break;
      
      case 'status':
        const statusIcon = this.getStatusIcon(msg.content);
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` ${instanceId} `) + chalk.yellow(`${statusIcon} ${msg.content.toUpperCase()}`));
        break;
      
      case 'prompt':
        console.log(chalk.gray(`[${timestamp}]`) + chalk.cyan(` ${instanceId} `) + chalk.yellow('🟡 WAITING FOR INPUT:'));
        console.log(chalk.yellow('   ' + msg.content));
        break;
    }
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      started: '▶️ ',
      completed: '✓',
      paused: '⏸️ ',
      resumed: '▶️ ',
      restarted: '🔄'
    };
    return icons[status] || '•';
  }

  stop(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
    console.log(chalk.yellow('\n\nMonitoring stopped'));
  }
}
