/**
 * Manifest Parser - Reads and validates arrangement blueprints
 */

import { promises as fsPromises } from 'fs';
import yaml from 'js-yaml';
import { z } from 'zod';
import { ArrangementManifest } from '../blueprint/schemas.js';

const ThinkingStyleSchema = z.object({
  creativity: z.number().min(0).max(1),
  outputLimit: z.number().positive(),
  focusNarrowness: z.number().min(0).max(1),
  samplingDiversity: z.number().min(0).max(1),
});

const PersonaBlueprintSchema = z.object({
  identifier: z.string(),
  kind: z.enum(['decomposer', 'executor', 'validator', 'synthesizer', 'feedback']),
  thinkingStyle: ThinkingStyleSchema,
  concurrentInstances: z.number().positive().optional(),
  responsibilityScope: z.array(z.string()).optional(),
  qualityRules: z.object({
    minimumScore: z.number().min(0).max(1),
    retryAttempts: z.number().positive(),
  }).optional(),
});

const StreamConnectionSchema = z.object({
  upstream: z.string(),
  downstream: z.string(),
  channelPath: z.string(),
});

const ManifestSchema = z.object({
  schemaVersion: z.string(),
  arrangementKind: z.string(),
  identity: z.object({
    label: z.string(),
    notes: z.string().optional(),
  }),
  objective: z.object({
    description: z.string(),
    personas: z.array(PersonaBlueprintSchema),
    dataStreams: z.array(StreamConnectionSchema),
  }),
});

export class ManifestParser {
  static async loadManifest(filepath: string): Promise<ArrangementManifest> {
    const rawContent = await fsPromises.readFile(filepath, 'utf-8');
    
    let parsedData: unknown;
    if (filepath.endsWith('.yaml') || filepath.endsWith('.yml')) {
      parsedData = yaml.load(rawContent);
    } else if (filepath.endsWith('.json')) {
      parsedData = JSON.parse(rawContent);
    } else {
      throw new Error('Manifest must be YAML (.yaml/.yml) or JSON (.json)');
    }

    return this.verifyManifest(parsedData);
  }

  static verifyManifest(data: unknown): ArrangementManifest {
    try {
      return ManifestSchema.parse(data) as ArrangementManifest;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Manifest verification failed:\n${issues.join('\n')}`);
      }
      throw err;
    }
  }

  static verifyStreamIntegrity(manifest: ArrangementManifest): { isValid: boolean; problems: string[] } {
    const problems: string[] = [];
    const personaIds = new Set(manifest.objective.personas.map(p => p.identifier));

    for (const stream of manifest.objective.dataStreams) {
      if (!personaIds.has(stream.upstream)) {
        problems.push(`Stream references unknown upstream persona: ${stream.upstream}`);
      }
      if (!personaIds.has(stream.downstream)) {
        problems.push(`Stream references unknown downstream persona: ${stream.downstream}`);
      }
    }

    return {
      isValid: problems.length === 0,
      problems,
    };
  }

  static generateTemplate(): ArrangementManifest {
    return {
      schemaVersion: 'arrangent.io/v1',
      arrangementKind: 'PersonaArrangement',
      identity: {
        label: 'sample-arrangement',
        notes: 'Example multi-persona arrangement',
      },
      objective: {
        description: 'Process and analyze data through multiple personas',
        personas: [
          {
            identifier: 'task-decomposer',
            kind: 'decomposer' as const,
            thinkingStyle: {
              creativity: 0.3,
              outputLimit: 8192,
              focusNarrowness: 0.7,
              samplingDiversity: 0.95,
            },
          },
          {
            identifier: 'work-executor',
            kind: 'executor' as const,
            thinkingStyle: {
              creativity: 0.5,
              outputLimit: 8192,
              focusNarrowness: 0.5,
              samplingDiversity: 0.95,
            },
            concurrentInstances: 2,
          },
          {
            identifier: 'output-validator',
            kind: 'validator' as const,
            thinkingStyle: {
              creativity: 0.1,
              outputLimit: 4096,
              focusNarrowness: 0.9,
              samplingDiversity: 0.8,
            },
            qualityRules: {
              minimumScore: 0.95,
              retryAttempts: 3,
            },
          },
          {
            identifier: 'result-synthesizer',
            kind: 'synthesizer' as const,
            thinkingStyle: {
              creativity: 0.3,
              outputLimit: 8192,
              focusNarrowness: 0.7,
              samplingDiversity: 0.95,
            },
          },
        ],
        dataStreams: [
          {
            upstream: 'task-decomposer',
            downstream: 'work-executor',
            channelPath: 'channels/decomposed-tasks',
          },
          {
            upstream: 'work-executor',
            downstream: 'output-validator',
            channelPath: 'channels/execution-results',
          },
          {
            upstream: 'output-validator',
            downstream: 'result-synthesizer',
            channelPath: 'channels/validated-results',
          },
        ],
      },
    };
  }
}
