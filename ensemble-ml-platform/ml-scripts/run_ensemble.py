"""
Ensemble ML Script - Runs Voting and Stacking Regressors
"""
import sys
import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import VotingRegressor, StackingRegressor, RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.model_selection import cross_val_score

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml_engine'))

from ml_engine.preprocessing.data_processor import load_and_preprocess_csv
from scipy import stats

def run_ensemble_analysis(csv_path, meta_learner="linear"):
    """
    Run ensemble ML analysis (Voting & Stacking) on CSV data
    
    Args:
        csv_path: Path to CSV file
        meta_learner: Meta-learner for stacking ('linear', 'random_forest', or 'xgboost')
    
    Returns:
        Dictionary containing ensemble results
    """
    print(f"Starting ensemble analysis with meta-learner: {meta_learner}")
    print(f"Loading data from: {csv_path}")
    
    # Detect dataset from filename
    csv_filename = os.path.basename(csv_path).lower()
    if 'automobile' in csv_filename:
        dataset_id = 'automobile'
        target_variable = 'mpg'
    elif 'concrete' in csv_filename:
        dataset_id = 'concrete'
        target_variable = 'concrete_compressive_strength'
    else:
        # Default fallback
        dataset_id = 'unknown'
        target_variable = 'target'
    
    # Load and preprocess data
    data = load_and_preprocess_csv(csv_path, test_size=0.3, random_state=42)
    
    if data['is_classification']:
        print("ERROR: Classification tasks not yet supported for ensembles")
        sys.exit(1)
    
    X_train = data['X_train']
    X_test = data['X_test']
    y_train = data['y_train']
    y_test = data['y_test']
    feature_names = data['feature_names']
    
    print(f"Training ensemble models on {len(X_train)} samples...")
    
    # Define base models
    linear_model = LinearRegression()
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    xgb_model = GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5)
    
    # Train base models individually
    print("Training Linear Regression...")
    linear_model.fit(X_train, y_train)
    linear_pred = linear_model.predict(X_test)
    linear_r2 = r2_score(y_test, linear_pred)
    linear_rmse = np.sqrt(mean_squared_error(y_test, linear_pred))
    linear_mae = mean_absolute_error(y_test, linear_pred)
    
    print("Training Random Forest...")
    rf_model.fit(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_r2 = r2_score(y_test, rf_pred)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_pred))
    rf_mae = mean_absolute_error(y_test, rf_pred)
    
    print("Training XGBoost (Gradient Boosting)...")
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    xgb_r2 = r2_score(y_test, xgb_pred)
    xgb_rmse = np.sqrt(mean_squared_error(y_test, xgb_pred))
    xgb_mae = mean_absolute_error(y_test, xgb_pred)
    
    # Create Voting Regressor
    print("Training Voting Regressor...")
    voting_model = VotingRegressor([
        ('linear', LinearRegression()),
        ('rf', RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)),
        ('xgb', GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5))
    ])
    voting_model.fit(X_train, y_train)
    voting_pred = voting_model.predict(X_test)
    voting_r2 = r2_score(y_test, voting_pred)
    voting_rmse = np.sqrt(mean_squared_error(y_test, voting_pred))
    voting_mae = mean_absolute_error(y_test, voting_pred)
    
    # Create Stacking Regressor with selected meta-learner
    print(f"Training Stacking Regressor with {meta_learner} meta-learner...")
    
    # Select meta-learner based on parameter
    if meta_learner == "random_forest":
        final_estimator = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=5)
        meta_learner_name = "Random Forest"
    elif meta_learner == "xgboost":
        final_estimator = GradientBoostingRegressor(n_estimators=50, random_state=42, max_depth=3)
        meta_learner_name = "XGBoost"
    else:  # default to linear
        final_estimator = LinearRegression()
        meta_learner_name = "Linear Regression"
    
    stacking_model = StackingRegressor(
        estimators=[
            ('linear', LinearRegression()),
            ('rf', RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)),
            ('xgb', GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5))
        ],
        final_estimator=final_estimator
    )
    stacking_model.fit(X_train, y_train)
    stacking_pred = stacking_model.predict(X_test)
    stacking_r2 = r2_score(y_test, stacking_pred)
    stacking_rmse = np.sqrt(mean_squared_error(y_test, stacking_pred))
    stacking_mae = mean_absolute_error(y_test, stacking_pred)
    
    # Extract meta-learner weights (if linear regression)
    meta_weights = None
    if isinstance(stacking_model.final_estimator_, LinearRegression):
        try:
            meta_weights = {
                'linear': float(stacking_model.final_estimator_.coef_[0]),
                'rf': float(stacking_model.final_estimator_.coef_[1]),
                'xgb': float(stacking_model.final_estimator_.coef_[2])
            }
            # Normalize to percentages
            total = sum(abs(w) for w in meta_weights.values())
            if total > 0:
                meta_weights = {k: abs(v)/total for k, v in meta_weights.items()}
        except Exception as e:
            print(f"Could not extract weights: {e}")
    
    # Get feature importance from Random Forest
    feature_importance = dict(zip(feature_names, rf_model.feature_importances_))
    # Normalize to percentages
    total_importance = sum(feature_importance.values())
    feature_importance = {k: float(v/total_importance) for k, v in feature_importance.items()}
    
    # Analyze which expert wins in different scenarios
    linear_errors = np.abs(linear_pred - y_test)
    rf_errors = np.abs(rf_pred - y_test)
    xgb_errors = np.abs(xgb_pred - y_test)
    
    # Count wins (who has lowest error for each prediction)
    linear_wins = np.sum((linear_errors <= rf_errors) & (linear_errors <= xgb_errors))
    rf_wins = np.sum((rf_errors < linear_errors) & (rf_errors <= xgb_errors))
    xgb_wins = np.sum((xgb_errors < linear_errors) & (xgb_errors < rf_errors))
    
    expert_wins = {
        'linear': int(linear_wins),
        'rf': int(rf_wins),
        'xgb': int(xgb_wins)
    }
    
    print(f"Expert wins: Linear={linear_wins}, RF={rf_wins}, XGBoost={xgb_wins}")
    
    # Find best performing expert
    best_expert = max(expert_wins, key=expert_wins.get)
    best_expert_name = {'linear': 'Linear Regression', 'rf': 'Random Forest', 'xgb': 'XGBoost'}[best_expert]
    
    # Feature-stratified analysis: Which expert wins when?
    print("Analyzing which expert wins in different scenarios...")
    feature_insights = {}
    
    # Get most important feature
    if len(feature_names) > 0:
        most_important_feature = max(feature_importance, key=feature_importance.get)
        feature_idx = feature_names.index(most_important_feature)
        
        # Split by median of most important feature
        feature_values = X_test[:, feature_idx]
        median_val = np.median(feature_values)
        
        # Analyze wins in high vs low scenarios
        high_mask = feature_values > median_val
        low_mask = feature_values <= median_val
        
        # Count wins in each scenario
        linear_high = np.sum((linear_errors <= rf_errors) & (linear_errors <= xgb_errors) & high_mask)
        rf_high = np.sum((rf_errors < linear_errors) & (rf_errors <= xgb_errors) & high_mask)
        xgb_high = np.sum((xgb_errors < linear_errors) & (xgb_errors < rf_errors) & high_mask)
        
        linear_low = np.sum((linear_errors <= rf_errors) & (linear_errors <= xgb_errors) & low_mask)
        rf_low = np.sum((rf_errors < linear_errors) & (rf_errors <= xgb_errors) & low_mask)
        xgb_low = np.sum((xgb_errors < linear_errors) & (xgb_errors < rf_errors) & low_mask)
        
        # Determine winners
        high_wins = {'linear': int(linear_high), 'rf': int(rf_high), 'xgb': int(xgb_high)}
        low_wins = {'linear': int(linear_low), 'rf': int(rf_low), 'xgb': int(xgb_low)}
        
        best_high = max(high_wins, key=high_wins.get)
        best_low = max(low_wins, key=low_wins.get)
        
        feature_insights = {
            'most_important_feature': most_important_feature,
            'median_value': float(median_val),
            'high_scenario': {
                'condition': f'> {median_val:.2f}',
                'best_expert': {'linear': 'Linear Regression', 'rf': 'Random Forest', 'xgb': 'XGBoost'}[best_high],
                'wins': high_wins
            },
            'low_scenario': {
                'condition': f'≤ {median_val:.2f}',
                'best_expert': {'linear': 'Linear Regression', 'rf': 'Random Forest', 'xgb': 'XGBoost'}[best_low],
                'wins': low_wins
            }
        }
        
        print(f"High {most_important_feature}: {feature_insights['high_scenario']['best_expert']} wins most")
        print(f"Low {most_important_feature}: {feature_insights['low_scenario']['best_expert']} wins most")
    
    # Cross-validation for reliable scores
    print("Running cross-validation (testing 5 times for reliability)...")
    try:
        # 5-fold cross-validation
        voting_cv_scores = cross_val_score(
            VotingRegressor([
                ('linear', LinearRegression()),
                ('rf', RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)),
                ('xgb', GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5))
            ]),
            X_train, y_train, cv=5, scoring='r2'
        )
        
        stacking_cv_scores = cross_val_score(
            StackingRegressor(
                estimators=[
                    ('linear', LinearRegression()),
                    ('rf', RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)),
                    ('xgb', GradientBoostingRegressor(n_estimators=100, random_state=42, max_depth=5))
                ],
                final_estimator=final_estimator
            ),
            X_train, y_train, cv=5, scoring='r2'
        )
        
        # Calculate statistics
        voting_cv_mean = float(np.mean(voting_cv_scores))
        voting_cv_std = float(np.std(voting_cv_scores))
        stacking_cv_mean = float(np.mean(stacking_cv_scores))
        stacking_cv_std = float(np.std(stacking_cv_scores))
        
        # Statistical significance test
        t_stat, p_value = stats.ttest_rel(stacking_cv_scores, voting_cv_scores)
        is_significant = p_value < 0.05
        
        cross_validation = {
            'voting': {
                'mean_r2': voting_cv_mean,
                'std_r2': voting_cv_std,
                'confidence_95': [float(voting_cv_mean - 1.96*voting_cv_std), float(voting_cv_mean + 1.96*voting_cv_std)],
                'all_scores': [float(s) for s in voting_cv_scores]
            },
            'stacking': {
                'mean_r2': stacking_cv_mean,
                'std_r2': stacking_cv_std,
                'confidence_95': [float(stacking_cv_mean - 1.96*stacking_cv_std), float(stacking_cv_mean + 1.96*stacking_cv_std)],
                'all_scores': [float(s) for s in stacking_cv_scores]
            },
            'statistical_test': {
                'p_value': float(p_value),
                'is_significant': bool(is_significant),
                'confidence_level': '95%'
            }
        }
        
        print(f"Voting CV: {voting_cv_mean:.4f} ± {voting_cv_std:.4f}")
        print(f"Stacking CV: {stacking_cv_mean:.4f} ± {stacking_cv_std:.4f}")
        print(f"Statistically significant: {is_significant} (p={p_value:.4f})")
        
    except Exception as e:
        print(f"Cross-validation failed: {e}")
        cross_validation = None
    
    # Get sample predictions (first 10 from test set)
    sample_indices = np.random.choice(len(X_test), min(10, len(X_test)), replace=False)
    
    # Voting predictions sample
    voting_predictions_sample = []
    for idx in sample_indices:
        voting_predictions_sample.append({
            'actual': float(y_test.iloc[idx] if hasattr(y_test, 'iloc') else y_test[idx]),
            'predicted': float(voting_pred[idx]),
            'linear_reg': float(linear_pred[idx]),
            'random_forest': float(rf_pred[idx]),
            'xgboost': float(xgb_pred[idx])
        })
    
    # Stacking predictions sample
    stacking_predictions_sample = []
    for idx in sample_indices:
        stacking_predictions_sample.append({
            'actual': float(y_test.iloc[idx] if hasattr(y_test, 'iloc') else y_test[idx]),
            'predicted': float(stacking_pred[idx]),
            'linear_reg': float(linear_pred[idx]),
            'random_forest': float(rf_pred[idx]),
            'xgboost': float(xgb_pred[idx])
        })
    
    # Prepare results
    best_base_r2 = max(linear_r2, rf_r2, xgb_r2)
    voting_improvement = ((voting_r2 - best_base_r2) / best_base_r2 * 100) if best_base_r2 > 0 else 0
    stacking_improvement = ((stacking_r2 - best_base_r2) / best_base_r2 * 100) if best_base_r2 > 0 else 0
    
    # Format improvement strings with appropriate precision
    def format_improvement(improvement):
        if abs(improvement) < 0.1:
            return f"<0.1%" if improvement >= 0 else f">-0.1%"
        else:
            return f"{improvement:.1f}%"
    
    voting_improvement_str = format_improvement(voting_improvement)
    stacking_improvement_str = format_improvement(stacking_improvement)
    
    # Performance summary
    print(f"\n===== PERFORMANCE COMPARISON =====")
    print(f"Linear Regression R²: {linear_r2:.6f}")
    print(f"Random Forest R²:     {rf_r2:.6f}")
    print(f"XGBoost R²:           {xgb_r2:.6f}")
    print(f"Best Base Model R²:   {best_base_r2:.6f}")
    print(f"----------------------------------")
    print(f"Voting R²:            {voting_r2:.6f} ({voting_improvement:+.2f}%)")
    print(f"Stacking R²:          {stacking_r2:.6f} ({stacking_improvement:+.2f}%)")
    print(f"===================================\n")
    
    results = {
        'voting': {
            'algorithm': 'Voting Regressor',
            'voting_strategy': 'average',
            'base_models': {
                'Linear Regression': {
                    'r2_score': float(linear_r2),
                    'rmse': float(linear_rmse),
                    'mae': float(linear_mae)
                },
                'Random Forest': {
                    'r2_score': float(rf_r2),
                    'rmse': float(rf_rmse),
                    'mae': float(rf_mae)
                },
                'XGBoost': {
                    'r2_score': float(xgb_r2),
                    'rmse': float(xgb_rmse),
                    'mae': float(xgb_mae)
                }
            },
            'ensemble_performance': {
                'r2_score': float(voting_r2),
                'rmse': float(voting_rmse),
                'mae': float(voting_mae),
                'improvement_over_best_base': voting_improvement_str,
                'raw_improvement': float(voting_improvement)
            },
            'feature_importance': feature_importance,
            'predictions_sample': voting_predictions_sample
        },
        'stacking': {
            'algorithm': 'Stacking Regressor',
            'meta_learner': meta_learner_name,
            'base_models': {
                'Linear Regression': {
                    'r2_score': float(linear_r2),
                    'rmse': float(linear_rmse),
                    'mae': float(linear_mae)
                },
                'Random Forest': {
                    'r2_score': float(rf_r2),
                    'rmse': float(rf_rmse),
                    'mae': float(rf_mae)
                },
                'XGBoost': {
                    'r2_score': float(xgb_r2),
                    'rmse': float(xgb_rmse),
                    'mae': float(xgb_mae)
                }
            },
            'meta_model_performance': {
                'r2_score': float(stacking_r2),
                'rmse': float(stacking_rmse),
                'mae': float(stacking_mae),
                'improvement_over_best_base': stacking_improvement_str,
                'raw_improvement': float(stacking_improvement)
            },
            'meta_weights': meta_weights,
            'expert_wins': expert_wins,
            'best_expert': best_expert_name,
            'feature_importance': feature_importance,
            'predictions_sample': stacking_predictions_sample,
            'feature_insights': feature_insights,
            'cross_validation': cross_validation
        },
        'dataset_info': {
            'dataset_id': dataset_id,
            'n_samples': data['n_samples'],
            'n_features': data['n_features'],
            'feature_names': feature_names,
            'is_classification': False,
            'task_type': 'regression',
            'target_variable': target_variable,
            'train_size': len(X_train),
            'test_size': len(X_test)
        }
    }
    
    print("Ensemble analysis complete!")
    print(f"Voting R²: {voting_r2:.4f}, RMSE: {voting_rmse:.4f}")
    print(f"Stacking R²: {stacking_r2:.4f}, RMSE: {stacking_rmse:.4f}")
    
    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python run_ensemble.py <csv_path> [meta_learner]")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    meta_learner = sys.argv[2] if len(sys.argv) > 2 else "linear"
    results = run_ensemble_analysis(csv_path, meta_learner)
    
    # Output results as JSON
    print("\n" + "="*50)
    print("RESULTS_JSON_START")
    print(json.dumps(results, indent=2))
    print("RESULTS_JSON_END")

