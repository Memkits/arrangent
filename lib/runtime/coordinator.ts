/**
 * Arrangement Coordinator - Orchestrates persona execution and data flow
 */

import { randomUUID } from 'crypto';
import { ArrangementManifest, WorkPacket, PersonaEnvironment } from '../blueprint/schemas.js';
import { GeminiConnector } from '../runtime/gemini-connector.js';
import { ArchiveManager } from '../storage/archive-manager.js';
import { StreamRouter } from '../stream/router.js';
import { PersonaFactory } from '../persona/factory.js';

export interface CoordinationMetrics {
  totalExecutions: number;
  elapsedMillis: number;
  personaExecutionCounts: Record<string, number>;
}

export interface CoordinationResult {
  completedSuccessfully: boolean;
  finalData?: any;
  errorMessage?: string;
  metrics: CoordinationMetrics;
}

export class ArrangementCoordinator {
  private manifest: ArrangementManifest;
  private connector: GeminiConnector;
  private archiver: ArchiveManager;
  private router: StreamRouter;
  private factory: PersonaFactory;

  constructor(
    manifest: ArrangementManifest,
    credentials: string,
    archiveDirectory: string = './memory',
    channelDirectory: string = './transfer'
  ) {
    this.manifest = manifest;
    this.connector = new GeminiConnector(credentials);
    this.archiver = new ArchiveManager(archiveDirectory);
    this.router = new StreamRouter(channelDirectory, manifest.objective.dataStreams);
    this.factory = new PersonaFactory(this.connector, this.archiver);
  }

  async coordinate(initialData: any): Promise<CoordinationResult> {
    const beginTime = Date.now();
    const metrics: CoordinationMetrics = {
      totalExecutions: 0,
      elapsedMillis: 0,
      personaExecutionCounts: {},
    };

    try {
      // Verify stream integrity before starting
      const cycleCheck = this.router.detectCycles();
      if (cycleCheck.hasCycles) {
        return {
          completedSuccessfully: false,
          errorMessage: `Detected cycles in data flow: ${cycleCheck.cycleChains?.join(', ')}`,
          metrics: {
            ...metrics,
            elapsedMillis: Date.now() - beginTime,
          },
        };
      }

      // Initialize work packet
      const initialPacket: WorkPacket = {
        packetId: randomUUID(),
        payload: initialData,
        provenance: {
          origin: 'user-input',
          createdAt: new Date(),
        },
      };

      // Process through each persona sequentially
      let currentPacket = initialPacket;
      
      for (const blueprint of this.manifest.objective.personas) {
        console.log(`Executing persona: ${blueprint.identifier} (${blueprint.kind})`);
        
        const persona = this.factory.instantiate(blueprint);
        const environment: PersonaEnvironment = {
          personaId: blueprint.identifier,
          runId: randomUUID(),
          startedAt: new Date(),
          sourceChannel: '',
          destinationChannel: '',
          archivePath: `./memory/${blueprint.identifier}`,
        };

        // Execute persona
        const outcome = await persona.performWork(environment, currentPacket);
        metrics.totalExecutions++;
        metrics.personaExecutionCounts[blueprint.identifier] = 
          (metrics.personaExecutionCounts[blueprint.identifier] || 0) + 1;

        if (!outcome.succeeded) {
          return {
            completedSuccessfully: false,
            errorMessage: `Persona ${blueprint.identifier} failed: ${outcome.failureReason}`,
            metrics: {
              ...metrics,
              elapsedMillis: Date.now() - beginTime,
            },
          };
        }

        // Route to next channel
        const nextChannel = this.router.findDownstreamChannel(blueprint.identifier);
        if (nextChannel) {
          const outputPacket: WorkPacket = {
            packetId: randomUUID(),
            payload: outcome.resultData,
            provenance: {
              origin: blueprint.identifier,
              createdAt: new Date(),
            },
          };
          await this.router.publishPacket(nextChannel, outputPacket);
          currentPacket = outputPacket;
        } else {
          // Final persona in chain
          currentPacket = {
            packetId: randomUUID(),
            payload: outcome.resultData,
            provenance: {
              origin: blueprint.identifier,
              createdAt: new Date(),
            },
          };
        }
      }

      return {
        completedSuccessfully: true,
        finalData: currentPacket.payload,
        metrics: {
          ...metrics,
          elapsedMillis: Date.now() - beginTime,
        },
      };
    } catch (err) {
      return {
        completedSuccessfully: false,
        errorMessage: err instanceof Error ? err.message : String(err),
        metrics: {
          ...metrics,
          elapsedMillis: Date.now() - beginTime,
        },
      };
    }
  }

  async inspectStatus() {
    const personaStatistics = await Promise.all(
      this.manifest.objective.personas.map(async (blueprint) => ({
        identifier: blueprint.identifier,
        kind: blueprint.kind,
        statistics: await this.archiver.gatherStatistics(blueprint.identifier),
      }))
    );

    return {
      arrangement: this.manifest.identity.label,
      objective: this.manifest.objective.description,
      personas: personaStatistics,
      dataFlow: this.manifest.objective.dataStreams,
    };
  }
}
