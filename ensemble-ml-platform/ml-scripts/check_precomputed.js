#!/usr/bin/env node
/**
 * Check if precomputed results exist and are valid
 */

const fs = require('fs');
const path = require('path');

const PRECOMPUTED_DIR = path.join(__dirname, '..', 'public', 'precomputed-results');
const DATASETS = ['automobile', 'concrete', 'loan'];
const META_LEARNERS = ['linear', 'random_forest', 'xgboost'];

function checkPrecomputed() {
  console.log('\n🔍 Checking precomputed results...\n');
  
  if (!fs.existsSync(PRECOMPUTED_DIR)) {
    console.log('❌ Precomputed results directory not found!');
    console.log(`   Expected: ${PRECOMPUTED_DIR}`);
    console.log('\n💡 Run: npm run precompute\n');
    process.exit(1);
  }
  
  let totalFiles = 0;
  let validFiles = 0;
  let missingFiles = [];
  
  // Check voting files
  DATASETS.forEach(dataset => {
    const filename = `${dataset}-voting.json`;
    const filepath = path.join(PRECOMPUTED_DIR, filename);
    totalFiles++;
    
    if (fs.existsSync(filepath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        if (data.success) {
          validFiles++;
          console.log(`✓ ${filename}`);
        } else {
          console.log(`⚠️  ${filename} (contains error)`);
        }
      } catch (e) {
        console.log(`❌ ${filename} (invalid JSON)`);
      }
    } else {
      missingFiles.push(filename);
      console.log(`❌ ${filename} (missing)`);
    }
  });
  
  // Check stacking files
  DATASETS.forEach(dataset => {
    META_LEARNERS.forEach(metaLearner => {
      const filename = `${dataset}-stacking-${metaLearner}.json`;
      const filepath = path.join(PRECOMPUTED_DIR, filename);
      totalFiles++;
      
      if (fs.existsSync(filepath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          if (data.success) {
            validFiles++;
            console.log(`✓ ${filename}`);
          } else {
            console.log(`⚠️  ${filename} (contains error)`);
          }
        } catch (e) {
          console.log(`❌ ${filename} (invalid JSON)`);
        }
      } else {
        missingFiles.push(filename);
        console.log(`❌ ${filename} (missing)`);
      }
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${validFiles}/${totalFiles} files valid`);
  console.log('='.repeat(60));
  
  if (missingFiles.length > 0) {
    console.log(`\n⚠️  ${missingFiles.length} files missing. Run: npm run precompute\n`);
    process.exit(1);
  } else if (validFiles === totalFiles) {
    console.log('\n✅ All precomputed results are ready!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some files have errors. Run: npm run precompute\n');
    process.exit(1);
  }
}

checkPrecomputed();

