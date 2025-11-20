"""
Voting Classifier Implementation
Combines Linear Regression, Random Forest, and XGBoost with soft voting
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import xgboost as xgb
import base64
from io import BytesIO
import json

def plot_to_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buffer = BytesIO()
    fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight', facecolor='#0a0a0a')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close(fig)
    return image_base64

def train_voting_classifier(X_train, X_test, y_train, y_test, feature_names, voting='soft'):
    """
    Train a voting classifier with Linear Regression, Random Forest, and XGBoost
    
    Args:
        X_train, X_test: Training and test features
        y_train, y_test: Training and test labels
        feature_names: List of feature names
        voting: 'soft' or 'hard' voting strategy
    
    Returns:
        Dictionary containing metrics and visualizations
    """
    print(f"[v0] Training Voting Classifier with {voting} voting...")
    
    # Define base estimators
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    xgb_model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    
    # Create voting classifier
    voting_clf = VotingClassifier(
        estimators=[
            ('logistic_regression', lr_model),
            ('random_forest', rf_model),
            ('xgboost', xgb_model)
        ],
        voting=voting
    )
    
    # Train individual models and voting classifier
    print("[v0] Training individual models...")
    lr_model.fit(X_train, y_train)
    rf_model.fit(X_train, y_train)
    xgb_model.fit(X_train, y_train)
    
    print("[v0] Training voting classifier...")
    voting_clf.fit(X_train, y_train)
    
    # Make predictions
    lr_pred = lr_model.predict(X_test)
    rf_pred = rf_model.predict(X_test)
    xgb_pred = xgb_model.predict(X_test)
    voting_pred = voting_clf.predict(X_test)
    
    # Calculate metrics for each model
    models_metrics = {
        'Logistic Regression': {
            'accuracy': accuracy_score(y_test, lr_pred),
            'precision': precision_score(y_test, lr_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, lr_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, lr_pred, average='weighted', zero_division=0)
        },
        'Random Forest': {
            'accuracy': accuracy_score(y_test, rf_pred),
            'precision': precision_score(y_test, rf_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, rf_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, rf_pred, average='weighted', zero_division=0)
        },
        'XGBoost': {
            'accuracy': accuracy_score(y_test, xgb_pred),
            'precision': precision_score(y_test, xgb_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, xgb_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, xgb_pred, average='weighted', zero_division=0)
        },
        'Voting Ensemble': {
            'accuracy': accuracy_score(y_test, voting_pred),
            'precision': precision_score(y_test, voting_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, voting_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, voting_pred, average='weighted', zero_division=0)
        }
    }
    
    # Create visualizations
    visualizations = {}
    
    # 1. Model Comparison Bar Chart
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='#0a0a0a')
    ax.set_facecolor('#0a0a0a')
    
    models = list(models_metrics.keys())
    metrics = ['accuracy', 'precision', 'recall', 'f1_score']
    x = np.arange(len(models))
    width = 0.2
    
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    for i, metric in enumerate(metrics):
        values = [models_metrics[model][metric] for model in models]
        ax.bar(x + i * width, values, width, label=metric.replace('_', ' ').title(), color=colors[i])
    
    ax.set_xlabel('Models', fontsize=12, color='white')
    ax.set_ylabel('Score', fontsize=12, color='white')
    ax.set_title('Model Performance Comparison', fontsize=14, fontweight='bold', color='white', pad=20)
    ax.set_xticks(x + width * 1.5)
    ax.set_xticklabels(models, rotation=15, ha='right', color='white')
    ax.legend(loc='lower right', framealpha=0.9)
    ax.grid(True, alpha=0.2, color='white')
    ax.tick_params(colors='white')
    ax.spines['bottom'].set_color('white')
    ax.spines['left'].set_color('white')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    visualizations['comparison'] = plot_to_base64(fig)
    
    # 2. Confusion Matrix for Voting Classifier
    fig, ax = plt.subplots(figsize=(6, 4), facecolor='#0a0a0a')
    cm = confusion_matrix(y_test, voting_pred)

    # Create custom color palette matching site theme (single-hue cyan gradient)
    import matplotlib.colors as mcolors
    colors = ['#0f172a', '#0e7490', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9']
    custom_cmap = mcolors.LinearSegmentedColormap.from_list('custom_cm', colors)

    # Create heatmap with improved styling
    sns.heatmap(cm, annot=True, fmt='d', cmap=custom_cmap,
                ax=ax, cbar_kws={'label': 'Count', 'shrink': 0.8},
                linewidths=1, linecolor='#1e293b', square=True,
                annot_kws={'size': 12, 'weight': 'bold', 'color': 'white'})

    ax.set_title('Voting Classifier\nConfusion Matrix', fontsize=13, fontweight='bold',
                 color='white', pad=15, linespacing=1.2)
    ax.set_xlabel('Predicted', fontsize=11, color='#94a3b8', labelpad=10)
    ax.set_ylabel('Actual', fontsize=11, color='#94a3b8', labelpad=10)

    # Style ticks
    ax.tick_params(colors='white', labelsize=10)
    ax.tick_params(axis='x', pad=8)
    ax.tick_params(axis='y', pad=8)

    # Style colorbar text to white for dark theme
    try:
        cbar = ax.collections[0].colorbar
        cbar.ax.yaxis.label.set_color('white')
        cbar.ax.tick_params(colors='white')
        cbar.outline.set_edgecolor('#334155')
    except Exception:
        pass

    # Add subtle grid lines
    ax.grid(False)

    # Style spines
    for spine in ax.spines.values():
        spine.set_visible(False)
    
    visualizations['confusion_matrix'] = plot_to_base64(fig)
    
    # 3. Feature Importance (from Random Forest)
    if hasattr(rf_model, 'feature_importances_'):
        fig, ax = plt.subplots(figsize=(10, 6), facecolor='#0a0a0a')
        ax.set_facecolor('#0a0a0a')
        
        importances = rf_model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]  # Top 10 features
        
        ax.barh(range(len(indices)), importances[indices], color='#3b82f6')
        ax.set_yticks(range(len(indices)))
        ax.set_yticklabels([feature_names[i] if i < len(feature_names) else f'Feature {i}' for i in indices], color='white')
        ax.set_xlabel('Importance', fontsize=12, color='white')
        ax.set_title('Feature Importance (Random Forest)', fontsize=14, fontweight='bold', color='white', pad=20)
        ax.tick_params(colors='white')
        ax.spines['bottom'].set_color('white')
        ax.spines['left'].set_color('white')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.grid(True, alpha=0.2, axis='x', color='white')
        
        visualizations['feature_importance'] = plot_to_base64(fig)
    
    # 4. Voting Process Visualization
    fig, ax = plt.subplots(figsize=(12, 6), facecolor='#0a0a0a')
    ax.set_facecolor('#0a0a0a')
    
    # Show predictions for first 20 samples
    n_samples = min(20, len(y_test))
    sample_indices = range(n_samples)
    
    # Create a stacked visualization showing individual predictions
    predictions_df = pd.DataFrame({
        'LR': lr_pred[:n_samples],
        'RF': rf_pred[:n_samples],
        'XGB': xgb_pred[:n_samples],
        'Voting': voting_pred[:n_samples],
        'True': y_test[:n_samples]
    })
    
    # Plot as heatmap
    sns.heatmap(predictions_df.T, annot=True, fmt='g', cmap='RdYlGn', ax=ax, 
                cbar_kws={'label': 'Class'}, linewidths=0.5)
    ax.set_title(f'Voting Process Visualization (First {n_samples} Samples)', 
                 fontsize=14, fontweight='bold', color='white', pad=20)
    ax.set_xlabel('Sample Index', fontsize=12, color='white')
    ax.set_ylabel('Model', fontsize=12, color='white')
    ax.tick_params(colors='white')
    
    visualizations['voting_process'] = plot_to_base64(fig)
    
    # Feature importance from Random Forest (normalized)
    feature_importance = dict(zip(feature_names, rf_model.feature_importances_)) if hasattr(rf_model, 'feature_importances_') else {}
    if feature_importance:
        total = sum(feature_importance.values()) or 1.0
        feature_importance = {k: float(v/total) for k, v in feature_importance.items()}

    # Build prediction samples (percentages)
    n_show = min(10, len(X_test))
    sample_indices = np.random.choice(len(X_test), n_show, replace=False)
    predictions_sample = []
    pos_idx = 1 if hasattr(lr_model, 'predict_proba') and lr_model.predict_proba(X_test).shape[1] > 1 else 0
    
    def safe_proba(m):
        try:
            p = m.predict_proba(X_test)
            return p[:, pos_idx]
        except Exception:
            return (m.predict(X_test) == 1).astype(float)
    
    lr_proba = safe_proba(lr_model)
    rf_proba = safe_proba(rf_model)
    xgb_proba = safe_proba(xgb_model)
    try:
        voting_proba = voting_clf.predict_proba(X_test)[:, pos_idx]
    except Exception:
        voting_proba = (voting_pred == 1).astype(float)
    
    for idx in sample_indices:
        predictions_sample.append({
            'actual': float(y_test[idx] * 100.0),
            'predicted': float(voting_proba[idx] * 100.0),
            'logistic_reg': float(lr_proba[idx] * 100.0),
            'random_forest': float(rf_proba[idx] * 100.0),
            'xgboost': float(xgb_proba[idx] * 100.0)
        })
    
    # Calculate improvement over best base model
    ensemble_accuracy = models_metrics['Voting Ensemble']['accuracy']
    best_base_accuracy = max(
        models_metrics['Logistic Regression']['accuracy'],
        models_metrics['Random Forest']['accuracy'],
        models_metrics['XGBoost']['accuracy']
    )
    raw_improvement = ((ensemble_accuracy - best_base_accuracy) / best_base_accuracy * 100) if best_base_accuracy > 0 else 0
    
    # Format improvement string
    if abs(raw_improvement) < 0.1:
        improvement_str = "<0.1%" if raw_improvement >= 0 else ">-0.1%"
    else:
        improvement_str = f"{raw_improvement:+.1f}%"
    
    return {
        'metrics': models_metrics,
        'visualizations': visualizations,
        'voting_strategy': voting,
        'n_estimators': 3,
        'base_models': ['Logistic Regression', 'Random Forest', 'XGBoost'],
        'confusion_counts': cm.tolist(),
        'feature_importance': feature_importance,
        'predictions_sample': predictions_sample,
        'improvement_over_best_base': improvement_str,
        'raw_improvement': float(raw_improvement)
    }
