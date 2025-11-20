#!/usr/bin/env python3
"""
Verification script to test accuracy of precomputed results
"""
import sys
import json
import numpy as np
from pathlib import Path

# Add script and engine paths
PROJECT_ROOT = Path(__file__).parent
SCRIPT_ROOT = PROJECT_ROOT / "ml-scripts"
ENGINE_ROOT = PROJECT_ROOT / "ml_engine"

sys.path.insert(0, str(SCRIPT_ROOT))
sys.path.insert(0, str(ENGINE_ROOT))

from run_ensemble import run_ensemble_analysis as run_regression_ensemble
from run_ensemble_analysis import run_ensemble_analysis as run_classification_ensemble

def compare_results(precomputed, fresh, dataset_name, method):
    """Compare precomputed vs freshly computed results"""
    print(f"\n{'='*60}")
    print(f"Verifying: {dataset_name} - {method}")
    print(f"{'='*60}")
    
    issues = []
    
    # Extract relevant metrics based on method
    if method == 'voting':
        if dataset_name == 'loan':
            # Classification metrics
            pre_metrics = precomputed['data']['voting']['metrics']
            fresh_metrics = fresh['voting']['metrics']
            
            for model_name in pre_metrics.keys():
                print(f"\n{model_name}:")
                for metric in ['accuracy', 'precision', 'recall', 'f1_score']:
                    pre_val = pre_metrics[model_name][metric]
                    fresh_val = fresh_metrics[model_name][metric]
                    diff = abs(pre_val - fresh_val)
                    
                    print(f"  {metric}: pre={pre_val:.4f}, fresh={fresh_val:.4f}, diff={diff:.6f}")
                    
                    # Allow small tolerance due to randomness
                    if diff > 0.01:
                        issues.append(f"{model_name} {metric}: difference {diff:.6f} > 0.01")
        else:
            # Regression metrics
            pre_models = precomputed['data']['voting']['base_models']
            fresh_models = fresh['voting']['base_models']
            
            for model_name in pre_models.keys():
                print(f"\n{model_name}:")
                for metric in ['r2_score', 'rmse', 'mae']:
                    pre_val = pre_models[model_name][metric]
                    fresh_val = fresh_models[model_name][metric]
                    diff = abs(pre_val - fresh_val)
                    
                    print(f"  {metric}: pre={pre_val:.4f}, fresh={fresh_val:.4f}, diff={diff:.6f}")
                    
                    if diff > 0.01:
                        issues.append(f"{model_name} {metric}: difference {diff:.6f} > 0.01")
            
            # Check ensemble performance
            print(f"\nEnsemble Performance:")
            pre_ens = precomputed['data']['voting']['ensemble_performance']
            fresh_ens = fresh['voting']['ensemble_performance']
            for metric in ['r2_score', 'rmse', 'mae']:
                pre_val = pre_ens[metric]
                fresh_val = fresh_ens[metric]
                diff = abs(pre_val - fresh_val)
                print(f"  {metric}: pre={pre_val:.4f}, fresh={fresh_val:.4f}, diff={diff:.6f}")
                
                if diff > 0.01:
                    issues.append(f"Ensemble {metric}: difference {diff:.6f} > 0.01")
    
    return issues

def verify_dataset(dataset_name, csv_file):
    """Verify results for a single dataset"""
    print(f"\n{'#'*60}")
    print(f"# VERIFYING DATASET: {dataset_name.upper()}")
    print(f"{'#'*60}")
    
    csv_path = Path(__file__).parent / 'data' / csv_file
    
    all_issues = []
    
    # Test voting
    print(f"\n--- Testing Voting ---")
    precomputed_file = Path(__file__).parent / 'public' / 'precomputed-results' / f'{dataset_name}-voting.json'
    
    with open(precomputed_file, 'r') as f:
        precomputed = json.load(f)
    
    # Run fresh computation
    if dataset_name == 'loan':
        config = {'meta_learner': 'linear', 'voting_strategy': 'soft'}
        fresh = run_classification_ensemble(str(csv_path), 'voting', config)
    else:
        fresh = run_regression_ensemble(str(csv_path), 'linear')
    
    issues = compare_results(precomputed, fresh, dataset_name, 'voting')
    all_issues.extend(issues)
    
    if issues:
        print(f"\n[!] ISSUES FOUND:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print(f"\n[OK] Voting results verified - all metrics match!")
    
    return all_issues

def main():
    """Main verification function"""
    print("\n" + "="*60)
    print("RESULTS VERIFICATION SCRIPT")
    print("="*60)
    print("\nThis will verify the accuracy of precomputed results")
    print("by comparing them with fresh computations.\n")
    
    all_issues = []
    
    # Test each dataset
    datasets = [
        ('automobile', 'Automobile.csv'),
        ('concrete', 'Concrete.csv'),
        ('loan', 'Loan Approval.csv')
    ]
    
    for dataset_name, csv_file in datasets:
        try:
            issues = verify_dataset(dataset_name, csv_file)
            all_issues.extend([(dataset_name, issue) for issue in issues])
        except Exception as e:
            print(f"\n[ERROR] verifying {dataset_name}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Final summary
    print(f"\n{'='*60}")
    print("VERIFICATION SUMMARY")
    print(f"{'='*60}")
    
    if all_issues:
        print(f"\n[!] Found {len(all_issues)} issues:")
        for dataset, issue in all_issues:
            print(f"  [{dataset}] {issue}")
    else:
        print("\n[OK] All results verified successfully!")
        print("   Precomputed results are accurate!")
    
    print("\n")

if __name__ == '__main__':
    main()

