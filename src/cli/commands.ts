// CLI commands for interacting with agent server
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import chalk from 'chalk';

export interface CLIConfig {
  serverUrl: string;
}

export class AgentCLI {
  constructor(private config: CLIConfig) {}

  async submitTopology(yamlPath: string): Promise<void> {
    try {
      const yamlContent = await readFile(yamlPath, 'utf-8');
      const topology = load(yamlContent);

      const response = await fetch(`${this.config.serverUrl}/topology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topology)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(chalk.green('✓ Topology loaded successfully'));
      } else {
        console.error(chalk.red('✗ Failed to load topology:'), result.error);
      }
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async inspectNode(nodeId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/instances`);
      const grouped = await response.json();

      const instances = grouped[nodeId];
      if (!instances || instances.length === 0) {
        console.log(chalk.yellow(`No instances found for node: ${nodeId}`));
        return;
      }

      console.log(chalk.bold(`\n📦 Node: ${nodeId}`));
      console.log(chalk.gray('─'.repeat(60)));

      for (const inst of instances) {
        this.printInstance(inst);
      }
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async interact(instanceId: string): Promise<void> {
    try {
      // First get instance state
      const response = await fetch(`${this.config.serverUrl}/instances/${instanceId}`);
      if (response.status === 404) {
        console.error(chalk.red(`✗ Instance not found: ${instanceId}`));
        return;
      }

      const state = await response.json();
      console.log(chalk.bold(`\n🤖 Interacting with instance: ${instanceId}`));
      console.log(chalk.gray(`Node: ${state.nodeId} | Status: ${state.status}`));
      
      if (state.lastOutput) {
        console.log(chalk.gray('\nLast output:'));
        console.log(state.lastOutput.substring(0, 200) + '...');
      }

      console.log(chalk.yellow('\n💡 Enter your prompt (or "exit" to quit):'));
      
      // In real CLI, we'd use readline here
      // For now, just show the interface
      console.log(chalk.gray('> '));
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async restartInstance(instanceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/instances/${instanceId}/restart`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(chalk.green(`✓ Instance ${instanceId} restarted`));
      } else {
        console.error(chalk.red('✗ Failed to restart:'), result.error);
      }
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async viewLogs(instanceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/instances/${instanceId}/history`);
      
      if (response.status === 404) {
        console.error(chalk.red(`✗ Instance not found: ${instanceId}`));
        return;
      }

      const data = await response.json();
      const history = data.history || [];

      console.log(chalk.bold(`\n📜 Runtime History for ${instanceId}`));
      console.log(chalk.gray('─'.repeat(60)));

      if (history.length === 0) {
        console.log(chalk.yellow('No history available'));
      } else {
        console.log(chalk.green(`Found ${history.length} execution(s)`));
        history.forEach((execId: string, idx: number) => {
          console.log(chalk.gray(`  ${idx + 1}. ${execId}`));
        });
      }
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async showTopology(): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/topology`);
      
      if (response.status === 404) {
        console.log(chalk.yellow('No topology loaded'));
        return;
      }

      const data = await response.json();
      this.printTopology(data);
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  async listInstances(): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverUrl}/instances`);
      const grouped = await response.json();

      console.log(chalk.bold('\n📊 Agent Instances'));
      console.log(chalk.gray('═'.repeat(70)));

      for (const [nodeId, instances] of Object.entries(grouped)) {
        console.log(chalk.bold(`\n📦 ${nodeId}`));
        console.log(chalk.gray('─'.repeat(60)));
        
        for (const inst of instances as any[]) {
          this.printInstance(inst);
        }
      }
    } catch (error) {
      console.error(chalk.red('✗ Error:'), (error as Error).message);
    }
  }

  private printInstance(inst: any): void {
    const statusColor = this.getStatusColor(inst.status);
    const statusIcon = this.getStatusIcon(inst.status);
    
    console.log(`  ${statusIcon} ${chalk.cyan(inst.id.substring(0, 8))}`);
    console.log(`     Status: ${statusColor(inst.status)}`);
    console.log(`     Progress: ${inst.progress}%`);
    
    if (inst.errorMessage) {
      console.log(`     ${chalk.red('Error:')} ${inst.errorMessage}`);
    }
    
    console.log();
  }

  private printTopology(data: any): void {
    console.log(chalk.bold('\n🗺️  Topology Visualization'));
    console.log(chalk.gray('═'.repeat(70)));

    // Group nodes by level
    const levels = new Map<number, any[]>();
    for (const node of data.nodes) {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level)!.push(node);
    }

    // Print level by level
    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
      const nodes = levels.get(level)!;
      console.log(chalk.yellow(`\nLevel ${level}:`));
      
      for (const node of nodes) {
        const parallelInfo = node.parallel > 1 ? chalk.gray(` [×${node.parallel}]`) : '';
        console.log(`  📦 ${chalk.cyan(node.name)} ${chalk.gray(`(${node.id})`)}${parallelInfo}`);
      }
    }

    // Print connections
    if (data.edges && data.edges.length > 0) {
      console.log(chalk.yellow('\n\nConnections:'));
      for (const edge of data.edges) {
        console.log(`  ${chalk.cyan(edge.from)} ${chalk.gray('→')} ${chalk.cyan(edge.to)} ${chalk.gray(`[${edge.label}]`)}`);
      }
    }
  }

  private getStatusColor(status: string): (text: string) => string {
    const colors: Record<string, (text: string) => string> = {
      idle: chalk.gray,
      running: chalk.blue,
      waiting: chalk.yellow,
      paused: chalk.magenta,
      error: chalk.red,
      completed: chalk.green
    };
    return colors[status] || chalk.white;
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      idle: '⚪',
      running: '🔵',
      waiting: '🟡',
      paused: '⏸️ ',
      error: '🔴',
      completed: '🟢'
    };
    return icons[status] || '⚪';
  }
}
