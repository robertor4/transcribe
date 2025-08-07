require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const { getSummarizationPrompt } = require('./prompts');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_DIR = path.join(__dirname, 'output');
const COMPLETED_DIR = path.join(__dirname, 'completed');

const SUPPORTED_FORMATS = ['.m4a', '.mp3', '.wav', '.mp4', '.mpeg', '.mpga', '.webm'];

async function ensureDirectories() {
  await fs.ensureDir(INPUT_DIR);
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(COMPLETED_DIR);
}

function getDateFolder() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function transcribeFile(filePath, fileName, context = '') {
  try {
    console.log(`Transcribing: ${fileName}`);
    
    const options = {
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "text",
    };
    
    if (context) {
      options.prompt = context;
    }
    
    const transcription = await openai.audio.transcriptions.create(options);

    return transcription;
  } catch (error) {
    console.error(`Error transcribing ${fileName}:`, error.message);
    throw error;
  }
}

async function summarizeTranscription(transcription, fileName, context = '') {
  try {
    console.log(`Generating summary for: ${fileName}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates structured summaries of meeting transcripts and conversations."
        },
        {
          role: "user",
          content: getSummarizationPrompt(transcription, context)
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error(`Error summarizing ${fileName}:`, error.message);
    return null;
  }
}

async function getContextForFile(fileName, mode = 'individual') {
  if (mode === 'none') {
    return '';
  }
  
  const contextFile = path.join(__dirname, 'contexts.json');
  let savedContexts = {};
  
  if (await fs.pathExists(contextFile)) {
    savedContexts = await fs.readJson(contextFile);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(60));
    console.log(`FILE: ${fileName}`);
    console.log('='.repeat(60));
    console.log('Provide context about this audio file:');
    console.log('  - Meeting type, participants, topics');
    console.log('  - Technical terms, acronyms, proper names');
    console.log('  - This improves transcription accuracy\n');
    
    if (Object.keys(savedContexts).length > 0) {
      console.log('Saved contexts:');
      Object.keys(savedContexts).forEach(key => {
        console.log(`  [${key}]: ${savedContexts[key].substring(0, 50)}...`);
      });
      console.log('\nType a saved context name to use it, or enter new context.');
    }
    
    const promptText = mode === 'batch' 
      ? 'Context for ALL files (or press Enter to skip): '
      : `Context for "${fileName}" (or press Enter to skip): `;
    
    rl.question(promptText, async (input) => {
      rl.close();
      
      if (savedContexts[input]) {
        console.log(`Using saved context: ${input}`);
        resolve(savedContexts[input]);
      } else if (input && input.trim()) {
        const saveQuestion = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        saveQuestion.question('Save this context for future use? (y/n): ', async (save) => {
          if (save.toLowerCase() === 'y') {
            saveQuestion.question('Context name: ', async (name) => {
              savedContexts[name] = input;
              await fs.writeJson(contextFile, savedContexts, { spaces: 2 });
              console.log(`Context saved as "${name}"`);
              saveQuestion.close();
              resolve(input);
            });
          } else {
            saveQuestion.close();
            resolve(input);
          }
        });
      } else {
        resolve('');
      }
    });
  });
}

function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'individual',
    context: null
  };
  
  if (args.includes('--no-context')) {
    options.mode = 'none';
  } else if (args.includes('--batch')) {
    options.mode = 'batch';
  }
  
  const contextIndex = args.indexOf('--context');
  if (contextIndex !== -1 && args[contextIndex + 1]) {
    options.context = args[contextIndex + 1];
    options.mode = 'batch';
  }
  
  return options;
}

async function processAudioFiles(options) {
  await ensureDirectories();

  const files = await fs.readdir(INPUT_DIR);
  const audioFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_FORMATS.includes(ext);
  });

  if (audioFiles.length === 0) {
    console.log('No audio files found in the input directory.');
    return;
  }

  console.log(`Found ${audioFiles.length} audio file(s) to process.`);
  
  if (options.mode === 'batch') {
    console.log('\nMode: BATCH (same context for all files)');
  } else if (options.mode === 'none') {
    console.log('\nMode: NO CONTEXT');
  } else {
    console.log('\nMode: INDIVIDUAL (separate context for each file)');
  }

  const dateFolder = getDateFolder();
  const outputDateDir = path.join(OUTPUT_DIR, dateFolder);
  await fs.ensureDir(outputDateDir);

  let successCount = 0;
  let failureCount = 0;
  let batchContext = null;
  
  if (options.mode === 'batch') {
    if (options.context) {
      batchContext = options.context;
      console.log(`\nUsing provided context: "${batchContext.substring(0, 100)}..."`);
    } else {
      batchContext = await getContextForFile('all files', 'batch');
    }
  }

  for (const fileName of audioFiles) {
    const inputPath = path.join(INPUT_DIR, fileName);
    const baseName = path.basename(fileName, path.extname(fileName));
    const outputPath = path.join(outputDateDir, `${baseName}.txt`);
    const summaryPath = path.join(outputDateDir, `${baseName}_summary.md`);
    const completedPath = path.join(COMPLETED_DIR, fileName);

    try {
      let context = '';
      
      if (options.mode === 'batch') {
        context = batchContext || '';
      } else if (options.mode === 'individual') {
        context = await getContextForFile(fileName, 'individual');
      }
      
      if (context) {
        console.log(`\nProcessing with context: "${context.substring(0, 50)}..."`);
      } else {
        console.log('\nProcessing without context');
      }
      
      const transcription = await transcribeFile(inputPath, fileName, context);
      
      await fs.writeFile(outputPath, transcription, 'utf8');
      console.log(`✓ Transcription saved: ${outputPath}`);
      
      const summary = await summarizeTranscription(transcription, fileName, context);
      if (summary) {
        await fs.writeFile(summaryPath, summary, 'utf8');
        console.log(`✓ Summary saved: ${summaryPath}`);
      } else {
        console.log(`⚠ Summary generation skipped for: ${fileName}`);
      }
      
      await fs.move(inputPath, completedPath, { overwrite: true });
      console.log(`✓ File moved to completed: ${fileName}`);
      
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to process ${fileName}`);
      failureCount++;
    }
  }

  console.log('\n=== Processing Complete ===');
  console.log(`Successfully processed: ${successCount} file(s)`);
  console.log(`Failed: ${failureCount} file(s)`);
  console.log(`Output directory: ${outputDateDir}`);
}

async function main() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in .env file');
    }

    console.log('\n🎙️  Audio Transcription Tool');
    console.log('================================\n');
    console.log('Usage:');
    console.log('  npm start                 - Ask for context for each file');
    console.log('  npm start -- --batch      - Use same context for all files');
    console.log('  npm start -- --no-context - Process without context');
    console.log('  npm start -- --context "meeting context" - Use provided context for all files\n');
    
    const options = parseCommandLineArgs();
    await processAudioFiles(options);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();