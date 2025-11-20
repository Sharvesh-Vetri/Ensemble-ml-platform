"""
Main script to run ensemble ML algorithm analysis (Voting and Stacking)
"""
import sys
import json
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml_engine'))

from ml_engine.preprocessing.data_processor import load_and_preprocess_csv
from ml_engine.ensemble.ensemble_voting import train_voting_classifier
from ml_engine.ensemble.ensemble_stacking import train_stacking_classifier

def run_ensemble_analysis(csv_path, method='both', config=None):
    """
    Run ensemble ML algorithm analysis on CSV data
    
    Args:
        csv_path: Path to CSV file
        method: Ensemble method ('voting', 'stacking', or 'both')
        config: Configuration dictionary
    
    Returns:
        Dictionary containing results
    """
    if config is None:
        config = {}
    
    print(f"Starting Ensemble ML analysis with method: {method}")
    print(f"Loading data from: {csv_path}")
    
    # Load and preprocess data
    data = load_and_preprocess_csv(
        csv_path,
        test_size=config.get('test_size', 0.3),
        random_state=config.get('random_state', 42)
    )
    
    # Check if it's a classification task
    if not data['is_classification']:
        return {
            'error': 'Ensemble methods require classification tasks. Your dataset appears to be for regression.'
        }
    
    results = {
        'dataset_info': {
            'n_samples': data['n_samples'],
            'n_features': data['n_features'],
            'n_classes': data['n_classes'],
            'feature_names': data['feature_names'],
            'class_names': data['class_names'],
            'is_classification': data['is_classification'],
            'task_type': 'classification',
            'dataset_id': 'loan'
        }
    }
    
    # Run requested ensemble methods
    if method in ['voting', 'both']:
        print(f"Running Voting Classifier...")
        voting_strategy = config.get('voting_strategy', 'soft')
        voting_results = train_voting_classifier(
            data['X_train'], data['X_test'],
            data['y_train'], data['y_test'],
            data['feature_names'],
            voting=voting_strategy
        )
        results['voting'] = voting_results
    
    if method in ['stacking', 'both']:
        print(f"Running Stacking Classifier...")
        meta_learner = config.get('meta_learner', 'logistic')
        stacking_results = train_stacking_classifier(
            data['X_train'], data['X_test'],
            data['y_train'], data['y_test'],
            data['feature_names'],
            meta_learner=meta_learner
        )
        results['stacking'] = stacking_results
    
    print(f"Ensemble analysis complete!")
    return results

if __name__ == '__main__':
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python run_ensemble_analysis.py <csv_path> [method] [config_json]")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    method = sys.argv[2] if len(sys.argv) > 2 else 'both'
    config = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    
    # Run analysis
    results = run_ensemble_analysis(csv_path, method, config)
    
    # Output results as JSON (use the same markers as regression path)
    print("\n" + "="*50)
    print("RESULTS_JSON_START")
    print(json.dumps(results, indent=2))
    print("RESULTS_JSON_END")
