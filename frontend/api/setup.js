// This file is specifically for Vercel deployment to ensure dependencies are available
const fs = require('fs');
const path = require('path');

console.log('Starting dependency setup for Vercel deployment...');

// Check if running in Vercel
if (process.env.VERCEL) {
  console.log('Running in Vercel environment');
  
  try {
    // Make sure mongoose is available
    const mongoose = require('mongoose');
    console.log('Mongoose is available:', mongoose.version);
  } catch (err) {
    console.error('Failed to load mongoose:', err.message);
    process.exit(1);
  }

  // Log directories for debugging
  console.log('Current directory:', process.cwd());
  console.log('Files in current directory:', fs.readdirSync('.'));
  
  if (fs.existsSync('./node_modules')) {
    console.log('node_modules exists in current directory');
    console.log('Some packages in node_modules:', fs.readdirSync('./node_modules').slice(0, 10));
  }
  
  if (fs.existsSync('../../node_modules')) {
    console.log('node_modules exists in root directory');
    console.log('Some packages in root node_modules:', fs.readdirSync('../../node_modules').slice(0, 10));
  }
  
  console.log('Dependency setup complete');
} else {
  console.log('Not running in Vercel environment, skipping setup');
}