/**
 * Sample: Executing an arrangement programmatically
 */

import { config } from 'dotenv';
import { ManifestParser } from '../lib/blueprint/manifest-parser.js';
import { ArrangementCoordinator } from '../lib/runtime/coordinator.js';

config();

async function runExample() {
  try {
    console.log('Arrangent Sample - Technical Document Processing\n');

    const manifest = await ManifestParser.loadManifest('manifests/sample-arrangement.yaml');
    
    console.log(`Arrangement: ${manifest.identity.label}`);
    console.log(`Notes: ${manifest.identity.notes}\n`);

    const credentials = process.env.GEMINI_API_KEY;
    if (!credentials) {
      console.error('Error: Set GEMINI_API_KEY environment variable');
      process.exit(1);
    }

    const coordinator = new ArrangementCoordinator(
      manifest,
      credentials,
      './memory',
      './transfer'
    );

    const sampleInput = {
      documentTitle: 'Distributed Systems Architecture',
      content: `
        This technical document covers distributed systems design patterns.
        
        Core Topics:
        1. Microservices and Service Mesh
        2. Event-Driven Architecture
        3. CQRS and Event Sourcing
        4. Distributed Consensus Algorithms
        5. CAP Theorem and Trade-offs
        
        The document provides detailed explanations of how to build robust,
        scalable distributed systems using modern architectural approaches
        and industry best practices.
      `,
      objectives: [
        'Extract main concepts',
        'Summarize key points',
        'Identify design patterns',
        'Assess technical complexity',
      ],
    };

    console.log('Input Document:');
    console.log(JSON.stringify(sampleInput, null, 2));
    console.log('\nCoordinating execution...\n');

    const outcome = await coordinator.coordinate(sampleInput);

    if (outcome.completedSuccessfully) {
      console.log('\n✅ Arrangement completed successfully!\n');
      console.log('═'.repeat(60));
      console.log('FINAL RESULT');
      console.log('═'.repeat(60));
      console.log(JSON.stringify(outcome.finalData, null, 2));
      console.log('\n' + '═'.repeat(60));
      console.log('PERFORMANCE METRICS');
      console.log('═'.repeat(60));
      console.log(`Total Executions: ${outcome.metrics.totalExecutions}`);
      console.log(`Elapsed Time: ${outcome.metrics.elapsedMillis}ms`);
      console.log(`Persona Execution Counts:`, outcome.metrics.personaExecutionCounts);
      console.log('═'.repeat(60) + '\n');
    } else {
      console.error('\n❌ Arrangement failed!');
      console.error(`Error: ${outcome.errorMessage}\n`);
      process.exit(1);
    }

    console.log('\nArrangement Status:');
    const status = await coordinator.inspectStatus();
    for (const persona of status.personas) {
      console.log(`\n${persona.identifier}:`);
      console.log(`  Kind: ${persona.kind}`);
      console.log(`  Executions: ${persona.statistics.totalRecords}`);
      if (persona.statistics.latestRecording) {
        console.log(`  Latest: ${persona.statistics.latestRecording.toISOString()}`);
      }
    }

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
    process.exit(1);
  }
}

runExample();
