/**
 * Archive Manager - Persistent storage using markdown chronicles
 */

import { promises as fsPromises } from 'fs';
import { join as pathJoin } from 'path';

export interface ChronicleRecord {
  timestamp: Date;
  personaId: string;
  runId: string;
  inputData: any;
  outputData: any;
  additionalInfo: Record<string, any>;
}

export class ArchiveManager {
  private rootDirectory: string;

  constructor(rootDirectory: string = './memory') {
    this.rootDirectory = rootDirectory;
  }

  private async preparePersonaArchive(personaId: string): Promise<string> {
    const personaArchivePath = pathJoin(this.rootDirectory, personaId);
    await fsPromises.mkdir(personaArchivePath, { recursive: true });
    return personaArchivePath;
  }

  async recordChronicle(record: ChronicleRecord): Promise<string> {
    const archivePath = await this.preparePersonaArchive(record.personaId);
    const timeLabel = record.timestamp.toISOString().replace(/[:.]/g, '-');
    const chronicleFilename = `chronicle-${timeLabel}-${record.runId}.md`;
    const fullPath = pathJoin(archivePath, chronicleFilename);

    const markdownContent = this.convertToMarkdown(record);
    await fsPromises.writeFile(fullPath, markdownContent, 'utf-8');
    
    return fullPath;
  }

  private convertToMarkdown(record: ChronicleRecord): string {
    const { timestamp, personaId, runId, inputData, outputData, additionalInfo } = record;

    return `# Persona Chronicle

## Session Information
- **Persona ID**: ${personaId}
- **Run ID**: ${runId}
- **Timestamp**: ${timestamp.toISOString()}

## Input Received
\`\`\`json
${JSON.stringify(inputData, null, 2)}
\`\`\`

## Output Generated
\`\`\`json
${JSON.stringify(outputData, null, 2)}
\`\`\`

## Additional Context
\`\`\`json
${JSON.stringify(additionalInfo, null, 2)}
\`\`\`

---
*Recorded by Arrangent Archive System*
`;
  }

  async retrieveChronicles(personaId: string, maxRecords?: number): Promise<string[]> {
    const archivePath = pathJoin(this.rootDirectory, personaId);
    
    try {
      const entries = await fsPromises.readdir(archivePath);
      const markdownFiles = entries
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
      
      const limitedFiles = maxRecords ? markdownFiles.slice(0, maxRecords) : markdownFiles;
      
      return Promise.all(
        limitedFiles.map(async (filename) => {
          const content = await fsPromises.readFile(pathJoin(archivePath, filename), 'utf-8');
          return content;
        })
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }
  }

  async getRecentChronicle(personaId: string): Promise<string | null> {
    const chronicles = await this.retrieveChronicles(personaId, 1);
    return chronicles.length > 0 ? chronicles[0] : null;
  }

  async purgeArchive(personaId: string): Promise<void> {
    const archivePath = pathJoin(this.rootDirectory, personaId);
    try {
      await fsPromises.rm(archivePath, { recursive: true, force: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async gatherStatistics(personaId: string): Promise<{ totalRecords: number; latestRecording?: Date }> {
    const archivePath = pathJoin(this.rootDirectory, personaId);
    
    try {
      const entries = await fsPromises.readdir(archivePath);
      const markdownFiles = entries.filter(f => f.endsWith('.md'));
      
      if (markdownFiles.length === 0) {
        return { totalRecords: 0 };
      }

      const recentFile = markdownFiles.sort().reverse()[0];
      const timestampPattern = recentFile.match(/chronicle-(.+?)-.+\.md/);
      
      if (timestampPattern) {
        const timeString = timestampPattern[1].replace(/-/g, ':').replace('T', 'T');
        return {
          totalRecords: markdownFiles.length,
          latestRecording: new Date(timeString),
        };
      }

      return { totalRecords: markdownFiles.length };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return { totalRecords: 0 };
      }
      throw err;
    }
  }
}
