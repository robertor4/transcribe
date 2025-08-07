#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a test audio file that's larger than 25MB
// This creates a dummy file for testing purposes
const testFilePath = path.join(__dirname, 'test-large-audio.mp3');
const fileSize = 30 * 1024 * 1024; // 30MB

console.log('Creating test file of size:', fileSize / (1024 * 1024), 'MB');

// Create a buffer filled with random data
const buffer = Buffer.alloc(fileSize);
for (let i = 0; i < fileSize; i++) {
  buffer[i] = Math.floor(Math.random() * 256);
}

// Write to file
fs.writeFileSync(testFilePath, buffer);

console.log('Test file created at:', testFilePath);
console.log('File size:', fs.statSync(testFilePath).size / (1024 * 1024), 'MB');

console.log('\nTo test the audio splitting:');
console.log('1. Upload this file through the web interface');
console.log('2. The API should automatically detect it exceeds 25MB');
console.log('3. It will split the file into chunks for processing');
console.log('\nNote: This is a dummy file for testing size detection.');
console.log('For real testing, use an actual audio file > 25MB.');