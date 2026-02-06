/**
 * Video Blogger Style Generator - Advanced Case Study
 * 
 * This case demonstrates:
 * 1. Collecting and analyzing historical blogger data
 * 2. Generating scripts that mimic a specific style
 * 3. Using parallel LLMs to handle different script segments
 * 4. Preparing content for audio generation
 * 5. Quality validation across all stages
 * 
 * Key Innovation: Parallel processing with 5 worker LLMs to handle
 * different script segments simultaneously, significantly reducing
 * the total generation time.
 */

import { config } from 'dotenv';
import { FlowEngine } from '../../src/engine.js';
import { readFileSync } from 'fs';
import { join } from 'path';

config();

// Load blogger data
const bloggerData = JSON.parse(
  readFileSync(join(__dirname, 'sample-blogger-data.json'), 'utf-8')
);

/**
 * Configuration for video blogger style generation
 * 
 * Roles:
 * 1. data-collector: Analyzes historical content and style
 * 2. style-analyzer: Extracts linguistic patterns and structure
 * 3. script-splitter: Breaks target topic into segments for parallel processing
 * 4. script-writers (5 parallel): Generate script segments in blogger's style
 * 5. script-validator: Ensures consistency and quality
 * 6. audio-formatter: Prepares script for text-to-speech (timing, emphasis)
 * 7. final-merger: Combines all parts into final deliverable
 */
const bloggerStyleConfig = {
  roles: [
    // Phase 1: Data Collection and Analysis
    { 
      name: 'data-collector', 
      type: 'splitter' as const, 
      geminiSettings: { temp: 0.2, tokens: 4096 },
      description: 'Collects and organizes historical blogger content'
    },
    
    // Phase 2: Style Analysis
    { 
      name: 'style-analyzer', 
      type: 'worker' as const, 
      geminiSettings: { temp: 0.3, tokens: 4096 },
      description: 'Analyzes linguistic patterns, tone, and structure'
    },
    
    // Phase 3: Content Splitting for Parallel Processing
    { 
      name: 'script-splitter', 
      type: 'splitter' as const, 
      geminiSettings: { temp: 0.3, tokens: 4096 },
      description: 'Breaks content into 5 segments for parallel generation'
    },
    
    // Phase 4: Parallel Script Generation (5 workers)
    { 
      name: 'script-writer-team', 
      type: 'worker' as const, 
      geminiSettings: { temp: 0.7, tokens: 6144 }, 
      parallel: 5,
      description: '5 parallel LLMs generating different script segments'
    },
    
    // Phase 5: Quality Validation
    { 
      name: 'script-validator', 
      type: 'validator' as const, 
      geminiSettings: { temp: 0.1, tokens: 3072 },
      description: 'Validates style consistency and quality'
    },
    
    // Phase 6: Audio Preparation
    { 
      name: 'audio-formatter', 
      type: 'worker' as const, 
      geminiSettings: { temp: 0.2, tokens: 4096 },
      description: 'Adds timing marks, emphasis, and audio cues'
    },
    
    // Phase 7: Final Assembly
    { 
      name: 'final-merger', 
      type: 'merger' as const, 
      geminiSettings: { temp: 0.3, tokens: 6144 },
      description: 'Combines all segments into final script'
    }
  ],
  connections: [
    { from: 'data-collector', to: 'style-analyzer', channel: 'collected-data' },
    { from: 'style-analyzer', to: 'script-splitter', channel: 'style-profile' },
    { from: 'script-splitter', to: 'script-writer-team', channel: 'script-segments' },
    { from: 'script-writer-team', to: 'script-validator', channel: 'generated-scripts' },
    { from: 'script-validator', to: 'audio-formatter', channel: 'validated-scripts' },
    { from: 'audio-formatter', to: 'final-merger', channel: 'audio-ready-scripts' }
  ]
};

async function runVideoBloggerCase() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║    Video Blogger Style Generator - Advanced Case Study           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const engine = new FlowEngine(bloggerStyleConfig, process.env.GEMINI_API_KEY!);

  console.log('📊 Blogger Profile:');
  console.log(`   Name: ${bloggerData.bloggerName}`);
  console.log(`   Tone: ${bloggerData.bloggerStyle.tone}`);
  console.log(`   Subscribers: ${bloggerData.videoMetrics.subscriber_count.toLocaleString()}`);
  console.log(`   Avg Views: ${bloggerData.videoMetrics.average_views.toLocaleString()}\n`);

  console.log('🎯 Target Video Topic:');
  const targetTopic = {
    title: 'Event-Driven Architecture Patterns',
    duration: '10 minutes',
    key_concepts: [
      'Event sourcing fundamentals',
      'CQRS pattern explained',
      'Message brokers comparison',
      'Real-world implementation challenges',
      'Best practices and pitfalls'
    ]
  };
  console.log(`   ${targetTopic.title}`);
  console.log(`   Duration: ${targetTopic.duration}`);
  console.log(`   Key Concepts: ${targetTopic.key_concepts.length}\n`);

  console.log('⚙️  Processing Pipeline:');
  console.log('   Phase 1: Data Collection');
  console.log('   Phase 2: Style Analysis');
  console.log('   Phase 3: Content Segmentation');
  console.log('   Phase 4: Parallel Script Generation (5 LLMs)');
  console.log('   Phase 5: Quality Validation');
  console.log('   Phase 6: Audio Formatting');
  console.log('   Phase 7: Final Assembly\n');

  console.log('🚀 Starting generation process...\n');
  console.log('─'.repeat(70) + '\n');

  const startTime = Date.now();

  try {
    const result = await engine.execute({
      bloggerData: bloggerData,
      targetTopic: targetTopic,
      requirements: {
        matchStyle: true,
        includeSignaturePhrases: true,
        targetLength: '10 minutes',
        audioReady: true
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '─'.repeat(70));
    console.log('\n✅ Generation Complete!\n');
    
    console.log('📝 Generated Script Summary:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n⏱️  Performance Metrics:');
    console.log(`   Total Time: ${duration}s`);
    console.log(`   Parallel Workers: 5 LLMs`);
    console.log(`   Expected Speedup: ~4x (vs sequential processing)`);

    const stats = await engine.stats();
    console.log('\n📊 Execution Statistics:');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n💡 Key Benefits of Parallel Processing:');
    console.log('   ✓ 5x faster script generation through parallelization');
    console.log('   ✓ Each LLM handles one script segment independently');
    console.log('   ✓ Consistent style maintained through style-analyzer phase');
    console.log('   ✓ Quality validation ensures coherent final output');
    console.log('   ✓ Audio-ready format with timing and emphasis marks');

    console.log('\n🎬 Next Steps:');
    console.log('   1. Review generated script for accuracy');
    console.log('   2. Feed to Text-to-Speech API (e.g., Google Cloud TTS, Azure TTS)');
    console.log('   3. Add background music and transitions');
    console.log('   4. Create video with relevant visuals');
    console.log('   5. Upload to video platform\n');

  } catch (error) {
    console.error('\n❌ Error during generation:');
    console.error(error);
    process.exit(1);
  }
}

// Run the case
runVideoBloggerCase();
