#!/usr/bin/env python3
"""
Pre-compute all ML results and save as JSON files.
This eliminates Python runtime overhead - results load instantly from JSON.

Run: python ml-scripts/precompute_results.py
"""

import json
import os
import sys
import subprocess
from pathlib import Path

# Add parent directory to path to import our ML modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configuration
DATASETS = {
    'automobile': 'Automobile.csv',
    'concrete': 'Concrete.csv',
    'loan': 'Loan Approval.csv'
}
METHODS = ['voting', 'stacking']
META_LEARNERS = ['linear', 'random_forest', 'xgboost']  # For stacking only

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / 'public' / 'precomputed-results'
DATASETS_DIR = PROJECT_ROOT / 'data'

def ensure_output_dir():
    """Create output directory if it doesn't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[OK] Output directory: {OUTPUT_DIR}")

def run_python_ml(dataset_id, meta_learner):
    """Run the Python ML script and return parsed results."""
    csv_file = DATASETS[dataset_id]
    csv_path = DATASETS_DIR / csv_file
    
    # Determine which script to use
    is_classification = dataset_id == 'loan'
    script_name = 'run_ensemble_analysis.py' if is_classification else 'run_ensemble.py'
    script_path = PROJECT_ROOT / 'ml-scripts' / script_name
    
    # Build command
    if is_classification:
        config = json.dumps({'meta_learner': meta_learner})
        cmd = [sys.executable, str(script_path), str(csv_path), 'both', config]
    else:
        cmd = [sys.executable, str(script_path), str(csv_path), meta_learner]
    
    print(f"  Running: {' '.join(cmd)}")
    
    # Execute
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    
    if result.returncode != 0:
        raise Exception(f"Python script failed: {result.stderr}")
    
    # Parse JSON output (same logic as actions.ts)
    stdout = result.stdout
    json_start = stdout.find("RESULTS_JSON_START")
    json_end = stdout.find("RESULTS_JSON_END")
    
    if json_start != -1 and json_end != -1:
        json_str = stdout[json_start + len("RESULTS_JSON_START"):json_end].strip()
        return json.loads(json_str)
    else:
        # Fallback: find JSON braces
        first_brace = stdout.find("{")
        last_brace = stdout.rfind("}")
        if first_brace == -1 or last_brace == -1:
            raise Exception("Could not find JSON in Python output")
        json_str = stdout[first_brace:last_brace + 1]
        return json.loads(json_str)

def precompute_all():
    """Pre-compute all combinations of datasets, methods, and meta-learners."""
    ensure_output_dir()
    
    total_combinations = len(DATASETS) * (1 + len(META_LEARNERS))  # 1 voting + N stacking
    current = 0
    
    print(f"\nStarting pre-computation of {total_combinations} combinations...\n")
    
    for dataset_id in DATASETS.keys():
        print(f"\n{'='*60}")
        print(f"Dataset: {dataset_id.upper()}")
        print(f"{'='*60}")
        
        # Voting (run with any meta-learner, extract voting results)
        current += 1
        print(f"\n[{current}/{total_combinations}] Computing Voting for {dataset_id}...")
        try:
            python_results = run_python_ml(dataset_id, 'linear')
            
            # Save complete results (includes both voting and stacking)
            output_file = OUTPUT_DIR / f"{dataset_id}-voting.json"
            
            # Extract just voting data
            voting_data = {
                'success': True,
                'data': {
                    'voting': python_results.get('voting', {}),
                    'dataset_info': python_results.get('dataset_info', {})
                }
            }
            
            with open(output_file, 'w') as f:
                json.dump(voting_data, f, indent=2)
            
            print(f"  [OK] Saved: {output_file.name}")
                    
        except Exception as e:
            print(f"  [ERROR] {str(e)}")
            error_result = {'success': False, 'error': str(e)}
            output_file = OUTPUT_DIR / f"{dataset_id}-voting.json"
            with open(output_file, 'w') as f:
                json.dump(error_result, f, indent=2)
        
        # Stacking with different meta-learners
        for meta_learner in META_LEARNERS:
            current += 1
            print(f"\n[{current}/{total_combinations}] Computing Stacking ({meta_learner}) for {dataset_id}...")
            try:
                python_results = run_python_ml(dataset_id, meta_learner)
                
                # Save stacking results
                output_file = OUTPUT_DIR / f"{dataset_id}-stacking-{meta_learner}.json"
                
                # Extract just stacking data
                stacking_data = {
                    'success': True,
                    'data': {
                        'stacking': python_results.get('stacking', {}),
                        'dataset_info': python_results.get('dataset_info', {})
                    }
                }
                
                with open(output_file, 'w') as f:
                    json.dump(stacking_data, f, indent=2)
                
                print(f"  [OK] Saved: {output_file.name}")
                        
            except Exception as e:
                print(f"  [ERROR] {str(e)}")
                error_result = {'success': False, 'error': str(e)}
                output_file = OUTPUT_DIR / f"{dataset_id}-stacking-{meta_learner}.json"
                with open(output_file, 'w') as f:
                    json.dump(error_result, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Pre-computation complete!")
    print(f"{'='*60}")
    print(f"\nResults saved to: {OUTPUT_DIR}")
    print(f"Total files: {len(list(OUTPUT_DIR.glob('*.json')))}")
    print(f"\nYour app will now load results instantly from JSON!\n")

def create_index():
    """Create an index file listing all available results."""
    index = {
        'datasets': list(DATASETS.keys()),
        'methods': METHODS,
        'meta_learners': META_LEARNERS,
        'combinations': []
    }
    
    # Add voting combinations
    for dataset_id in DATASETS.keys():
        index['combinations'].append({
            'dataset': dataset_id,
            'method': 'voting',
            'file': f"{dataset_id}-voting.json"
        })
    
    # Add stacking combinations
    for dataset_id in DATASETS.keys():
        for meta_learner in META_LEARNERS:
            index['combinations'].append({
                'dataset': dataset_id,
                'method': 'stacking',
                'meta_learner': meta_learner,
                'file': f"{dataset_id}-stacking-{meta_learner}.json"
            })
    
    index_file = OUTPUT_DIR / 'index.json'
    with open(index_file, 'w') as f:
        json.dump(index, f, indent=2)
    
    print(f"[OK] Created index: {index_file.name}")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("Ensemble ML Pre-computation Script")
    print("="*60)
    print("\nThis will generate all ML results as JSON files.")
    print("After this runs, your app will load instantly!")
    print("\n" + "="*60 + "\n")
    
    try:
        precompute_all()
        create_index()
        
        print("\nSuccess! Your app is now blazing fast!")
        print("\nNext steps:")
        print("  1. Start your dev server: npm run dev")
        print("  2. Results will load instantly from JSON")
        print("  3. No more waiting for Python!\n")
        
    except KeyboardInterrupt:
        print("\n\nPre-computation interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError during pre-computation: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

