// Memory storage using markdown
import { writeFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';

export class MemoryStore {
  constructor(private dir = './memory') {}

  async save(role: string, id: string, input: any, output: any) {
    await mkdir(join(this.dir, role), { recursive: true });
    const md = `# Execution ${id}\n\n## Input\n\`\`\`json\n${JSON.stringify(input, null, 2)}\n\`\`\`\n\n## Output\n\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\`\n`;
    await writeFile(join(this.dir, role, `${id}.md`), md);
  }

  async count(role: string) {
    try {
      const files = await readdir(join(this.dir, role));
      return files.filter(f => f.endsWith('.md')).length;
    } catch {
      return 0;
    }
  }
}
