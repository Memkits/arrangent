#!/usr/bin/env node
/**
 * Arrangent CLI Interface
 */
import { Command } from 'commander';
import { config } from 'dotenv';
import { promises as fsPromises } from 'fs';
import { dirname as pathDirname } from 'path';
import { ManifestParser } from './blueprint/manifest-parser.js';
import { ArrangementCoordinator } from './runtime/coordinator.js';
config();
const cli = new Command();
cli
    .name('arrangent')
    .description('Multi-persona orchestration with Google Gemini AI')
    .version('0.1.0');
cli
    .command('execute')
    .description('Execute a persona arrangement')
    .requiredOption('-m, --manifest <path>', 'Path to manifest file')
    .option('-d, --data <input>', 'Input data (JSON string or file path)')
    .option('-a, --archive <dir>', 'Archive directory', './memory')
    .option('-c, --channels <dir>', 'Channel directory', './transfer')
    .action(async (opts) => {
    try {
        console.log('Loading manifest...');
        const manifest = await ManifestParser.loadManifest(opts.manifest);
        console.log(`Arrangement: ${manifest.identity.label}`);
        console.log(`Objective: ${manifest.objective.description}\n`);
        const credentials = process.env.GEMINI_API_KEY;
        if (!credentials) {
            console.error('Error: GEMINI_API_KEY environment variable required');
            process.exit(1);
        }
        let inputPayload;
        if (opts.data) {
            try {
                const fileContent = await fsPromises.readFile(opts.data, 'utf-8');
                inputPayload = JSON.parse(fileContent);
            }
            catch {
                try {
                    inputPayload = JSON.parse(opts.data);
                }
                catch {
                    inputPayload = opts.data;
                }
            }
        }
        else {
            inputPayload = { task: manifest.objective.description };
        }
        const coordinator = new ArrangementCoordinator(manifest, credentials, opts.archive, opts.channels);
        console.log('Coordinating arrangement execution...\n');
        const outcome = await coordinator.coordinate(inputPayload);
        if (outcome.completedSuccessfully) {
            console.log('\n✓ Arrangement completed successfully!\n');
            console.log('Final Result:');
            console.log(JSON.stringify(outcome.finalData, null, 2));
            console.log('\nPerformance Metrics:');
            console.log(`- Total executions: ${outcome.metrics.totalExecutions}`);
            console.log(`- Elapsed time: ${outcome.metrics.elapsedMillis}ms`);
            console.log(`- Persona executions:`, outcome.metrics.personaExecutionCounts);
        }
        else {
            console.error('\n✗ Arrangement failed!\n');
            console.error('Error:', outcome.errorMessage);
            process.exit(1);
        }
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
});
cli
    .command('inspect')
    .description('Inspect arrangement status and statistics')
    .requiredOption('-m, --manifest <path>', 'Path to manifest file')
    .option('-a, --archive <dir>', 'Archive directory', './memory')
    .action(async (opts) => {
    try {
        const manifest = await ManifestParser.loadManifest(opts.manifest);
        const credentials = process.env.GEMINI_API_KEY || 'placeholder';
        const coordinator = new ArrangementCoordinator(manifest, credentials, opts.archive);
        const status = await coordinator.inspectStatus();
        console.log(`\nArrangement: ${status.arrangement}`);
        console.log(`Objective: ${status.objective}\n`);
        console.log('Persona Statistics:');
        for (const persona of status.personas) {
            console.log(`\n${persona.identifier} (${persona.kind}):`);
            console.log(`  - Total executions: ${persona.statistics.totalRecords}`);
            if (persona.statistics.latestRecording) {
                console.log(`  - Latest execution: ${persona.statistics.latestRecording.toISOString()}`);
            }
        }
        console.log('\nData Flow:');
        for (const stream of status.dataFlow) {
            console.log(`  ${stream.upstream} → ${stream.downstream} (via ${stream.channelPath})`);
        }
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
});
cli
    .command('init')
    .description('Initialize a new arrangement manifest')
    .option('-o, --output <path>', 'Output file path', 'manifests/arrangement.yaml')
    .action(async (opts) => {
    try {
        const template = ManifestParser.generateTemplate();
        const yaml = await import('js-yaml');
        const content = yaml.dump(template);
        const dir = pathDirname(opts.output);
        await fsPromises.mkdir(dir, { recursive: true });
        await fsPromises.writeFile(opts.output, content, 'utf-8');
        console.log(`✓ Created template manifest at ${opts.output}`);
        console.log('\nEdit the manifest and execute:');
        console.log(`  arrangent execute --manifest ${opts.output}`);
    }
    catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
});
cli
    .command('verify')
    .description('Verify a manifest file')
    .requiredOption('-m, --manifest <path>', 'Path to manifest file')
    .action(async (opts) => {
    try {
        console.log('Verifying manifest...');
        const manifest = await ManifestParser.loadManifest(opts.manifest);
        console.log('✓ Manifest syntax valid');
        const streamCheck = ManifestParser.verifyStreamIntegrity(manifest);
        if (!streamCheck.isValid) {
            console.error('✗ Stream integrity check failed:');
            streamCheck.problems.forEach(prob => console.error(`  - ${prob}`));
            process.exit(1);
        }
        console.log('✓ Stream integrity verified');
        console.log('\nManifest summary:');
        console.log(`  Arrangement: ${manifest.identity.label}`);
        console.log(`  Personas: ${manifest.objective.personas.length}`);
        console.log(`  Data streams: ${manifest.objective.dataStreams.length}`);
    }
    catch (err) {
        console.error('✗ Verification failed:');
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
});
cli.parse();
//# sourceMappingURL=cli.js.map