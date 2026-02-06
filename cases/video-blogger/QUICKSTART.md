# Quick Start: Video Blogger Style Generator

## 🚀 5-Minute Quick Start

### Step 1: Prerequisites
```bash
# Ensure you have Node.js 18+ and Yarn installed
node --version  # Should be >= 18.0.0
yarn --version  # Should be 4.x
```

### Step 2: Environment Setup
```bash
# Set your Gemini API key
cp .env.example .env
# Edit .env and add: GEMINI_API_KEY=your_key_here
```

### Step 3: Install & Build
```bash
yarn install
yarn build
```

### Step 4: Run the Case
```bash
yarn case:blogger
```

## 📖 What Will Happen

The system will:

1. **Load Blogger Data** (~1s)
   - Historical content analysis
   - Style profile extraction
   
2. **Process Through Pipeline** (~40s)
   ```
   Data Collection → Style Analysis → Content Segmentation
   → Parallel Generation (5 LLMs) → Validation 
   → Audio Formatting → Final Assembly
   ```

3. **Output Results**
   - Complete script in blogger's style
   - Performance metrics
   - Quality scores
   - Next steps for production

## 🎯 Expected Output

```
╔══════════════════════════════════════════════════════════════════╗
║    Video Blogger Style Generator - Advanced Case Study           ║
╚══════════════════════════════════════════════════════════════════╝

📊 Blogger Profile:
   Name: Tech Insights Daily
   Tone: enthusiastic and informative
   Subscribers: 180,000
   Avg Views: 50,000

🎯 Target Video Topic:
   Event-Driven Architecture Patterns
   Duration: 10 minutes

🚀 Starting generation process...

Running data-collector (splitter)...
Running style-analyzer (worker)...
Running script-splitter (splitter)...
Running script-writer-team (worker)...
Running script-validator (validator)...
Running audio-formatter (worker)...
Running final-merger (merger)...

✅ Generation Complete!

⏱️  Performance Metrics:
   Total Time: 45.23s
   Parallel Workers: 5 LLMs
   Expected Speedup: ~4x

🎬 Next Steps:
   1. Review generated script
   2. Feed to Text-to-Speech API
   3. Add music and transitions
   4. Create video with visuals
   5. Upload to platform
```

## 📁 Files Generated

After running, check the `memory/` directory:
```
memory/
├── data-collector/
├── style-analyzer/
├── script-splitter/
├── script-writer-team/
├── script-validator/
├── audio-formatter/
└── final-merger/
```

Each directory contains Markdown files with:
- Input data
- Processing results
- Execution timestamps

## 🔧 Customization

### Change Blogger Data
Edit `cases/video-blogger/sample-blogger-data.json`:
```json
{
  "bloggerName": "Your Blogger Name",
  "bloggerStyle": {
    "tone": "your preferred tone",
    "signature_phrases": ["Your", "Signature", "Phrases"]
  }
}
```

### Adjust Worker Count
Edit `cases/video-blogger/blogger-style-generator.ts`:
```typescript
{ 
  name: 'script-writer-team', 
  type: 'worker' as const, 
  geminiSettings: { temp: 0.7, tokens: 6144 }, 
  parallel: 5  // Change this number (3-10 recommended)
}
```

### Change Target Topic
In the same file, modify:
```typescript
const targetTopic = {
  title: 'Your Topic Here',
  duration: '10 minutes',
  key_concepts: [
    'Concept 1',
    'Concept 2',
    // Add more...
  ]
};
```

## 🐛 Troubleshooting

### "GEMINI_API_KEY not found"
**Solution:** Ensure `.env` file exists with valid API key
```bash
echo "GEMINI_API_KEY=your_key_here" > .env
```

### "Module not found" errors
**Solution:** Rebuild the project
```bash
yarn clean
yarn install
yarn build
```

### API rate limit errors
**Solution:** Reduce parallel workers or add delays
```typescript
parallel: 3  // Instead of 5
```

### Slow performance
**Check:**
- Internet connection speed
- API response times
- Increase timeout if needed

## 📊 Performance Tuning

### For Speed (Less Quality)
```typescript
geminiSettings: { 
  temp: 0.8,    // Higher temperature = faster
  tokens: 4096  // Fewer tokens = faster
}
```

### For Quality (Slower)
```typescript
geminiSettings: { 
  temp: 0.3,    // Lower temperature = more focused
  tokens: 8192  // More tokens = detailed output
}
```

### Optimal Balance (Recommended)
```typescript
geminiSettings: { 
  temp: 0.5-0.7,
  tokens: 4096-6144
}
```

## 🎓 Next Steps

1. **Read Full Documentation**
   - [Case README](./README.md) - Complete overview
   - [FEASIBILITY.md](./FEASIBILITY.md) - Technical analysis
   - [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Enhancement ideas

2. **Experiment**
   - Try different blogger styles
   - Adjust worker counts
   - Test various topics

3. **Integrate with TTS**
   - Google Cloud Text-to-Speech
   - Azure Cognitive Services
   - ElevenLabs (for voice cloning)

4. **Scale Up**
   - Process multiple videos
   - Automate the pipeline
   - Add monitoring and analytics

## 💡 Tips for Best Results

1. **Provide Quality Data**
   - Use 10+ historical transcripts
   - Include signature phrases
   - Add engagement metrics

2. **Test Incrementally**
   - Start with 3 workers
   - Gradually increase to 5-7
   - Monitor quality at each step

3. **Review Output**
   - Always review generated scripts
   - Edit for accuracy
   - Maintain human oversight

4. **Iterate**
   - Collect feedback
   - Adjust parameters
   - Improve over time

## 🤝 Getting Help

- **Documentation:** Read the full [README](./README.md)
- **Issues:** Check GitHub issues
- **Community:** Join Discord/Slack
- **Examples:** Review `memory/` after running

## 📈 Measuring Success

Track these metrics:
- ✅ Generation time (target: <2 minutes)
- ✅ Style match score (target: >85%)
- ✅ Human approval rate (target: >90%)
- ✅ Cost per video (target: <$0.50)

---

**Ready to create your first AI-generated video script?**

Run: `yarn case:blogger` 🚀
