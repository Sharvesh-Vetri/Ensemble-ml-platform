"""
Stacking Classifier Implementation
Uses Logistic Regression, Random Forest, and XGBoost as base models
with a meta-learner on top
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import xgboost as xgb
import base64
from io import BytesIO

def plot_to_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buffer = BytesIO()
    fig.savefig(buffer, format='png', dpi=100, bbox_inches='tight', facecolor='#0a0a0a')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close(fig)
    return image_base64

def train_stacking_classifier(X_train, X_test, y_train, y_test, feature_names, meta_learner='logistic'):
    """
    Train a stacking classifier with Linear Regression, Random Forest, and XGBoost
    
    Args:
        X_train, X_test: Training and test features
        y_train, y_test: Training and test labels
        feature_names: List of feature names
        meta_learner: Type of meta-learner ('logistic' or 'random_forest')
    
    Returns:
        Dictionary containing metrics and visualizations
    """
    print(f"[v0] Training Stacking Classifier with {meta_learner} meta-learner...")
    
    # Define base estimators
    base_estimators = [
        ('logistic_regression', LogisticRegression(max_iter=1000, random_state=42)),
        ('random_forest', RandomForestClassifier(n_estimators=100, random_state=42)),
        ('xgboost', xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss'))
    ]
    
    # Define meta-learner
    if meta_learner == 'logistic':
        final_estimator = LogisticRegression(max_iter=1000, random_state=42)
    elif meta_learner == 'random_forest':
        final_estimator = RandomForestClassifier(n_estimators=50, random_state=42)
    elif meta_learner == 'xgboost':
        final_estimator = xgb.XGBClassifier(n_estimators=200, max_depth=4, random_state=42, eval_metric='logloss')
    else:
        # default to logistic if unknown
        final_estimator = LogisticRegression(max_iter=1000, random_state=42)
    
    # Create stacking classifier
    stacking_clf = StackingClassifier(
        estimators=base_estimators,
        final_estimator=final_estimator,
        cv=5
    )
    
    # Train individual models for comparison
    print("[v0] Training base models...")
    logistic_model = LogisticRegression(max_iter=1000, random_state=42)
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    xgb_model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    
    logistic_model.fit(X_train, y_train)
    rf_model.fit(X_train, y_train)
    xgb_model.fit(X_train, y_train)
    
    print("[v0] Training stacking classifier...")
    stacking_clf.fit(X_train, y_train)
    
    # Make predictions
    logistic_pred = logistic_model.predict(X_test)
    rf_pred = rf_model.predict(X_test)
    xgb_pred = xgb_model.predict(X_test)
    stacking_pred = stacking_clf.predict(X_test)
    # Probabilities for positive class (index 1 if available)
    pos_idx = 1 if hasattr(logistic_model, 'predict_proba') and logistic_model.predict_proba(X_test).shape[1] > 1 else 0
    def safe_proba(m):
        try:
            p = m.predict_proba(X_test)
            return p[:, pos_idx]
        except Exception:
            return (m.predict(X_test) == 1).astype(float)
    logistic_proba = safe_proba(logistic_model)
    rf_proba = safe_proba(rf_model)
    xgb_proba = safe_proba(xgb_model)
    try:
        stack_proba = stacking_clf.predict_proba(X_test)[:, pos_idx]
    except Exception:
        stack_proba = (stacking_pred == 1).astype(float)
    
    # Calculate metrics
    models_metrics = {
        'Logistic Regression': {
            'accuracy': accuracy_score(y_test, logistic_pred),
            'precision': precision_score(y_test, logistic_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, logistic_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, logistic_pred, average='weighted', zero_division=0)
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
        'Stacking Ensemble': {
            'accuracy': accuracy_score(y_test, stacking_pred),
            'precision': precision_score(y_test, stacking_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_test, stacking_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_test, stacking_pred, average='weighted', zero_division=0)
        }
    }
    
    # Create visualizations
    visualizations = {}
    
    # 1. Model Comparison
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
    ax.set_title('Stacking vs Base Models Performance', fontsize=14, fontweight='bold', color='white', pad=20)
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
    
    # 2. Confusion Matrix
    fig, ax = plt.subplots(figsize=(6, 4), facecolor='#0a0a0a')
    cm = confusion_matrix(y_test, stacking_pred)

    # Create custom color palette matching site theme (single-hue emerald/green gradient)
    import matplotlib.colors as mcolors
    colors = ['#0f172a', '#064e3b', '#047857', '#059669', '#10b981', '#34d399']
    custom_cmap = mcolors.LinearSegmentedColormap.from_list('custom_cm', colors)

    # Create heatmap with improved styling
    sns.heatmap(cm, annot=True, fmt='d', cmap=custom_cmap,
                ax=ax, cbar_kws={'label': 'Count', 'shrink': 0.8},
                linewidths=1, linecolor='#1e293b', square=True,
                annot_kws={'size': 12, 'weight': 'bold', 'color': 'white'})

    ax.set_title('Stacking Classifier\nConfusion Matrix', fontsize=13, fontweight='bold',
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
    
    # 3. Stacking Architecture Diagram
    fig, ax = plt.subplots(figsize=(12, 8), facecolor='#0a0a0a')
    ax.set_facecolor('#0a0a0a')
    ax.axis('off')
    
    # Draw architecture
    # Base models layer
    base_y = 0.3
    base_models = ['Logistic\nRegression', 'Random\nForest', 'XGBoost']
    base_x = [0.2, 0.5, 0.8]
    
    for i, (x, model) in enumerate(zip(base_x, base_models)):
        circle = plt.Circle((x, base_y), 0.08, color=['#3b82f6', '#10b981', '#f59e0b'][i], alpha=0.8)
        ax.add_patch(circle)
        ax.text(x, base_y, model, ha='center', va='center', fontsize=10, color='white', fontweight='bold')
    
    # Meta-learner layer
    meta_y = 0.7
    meta_x = 0.5
    circle = plt.Circle((meta_x, meta_y), 0.1, color='#ef4444', alpha=0.8)
    ax.add_patch(circle)
    ax.text(meta_x, meta_y, f'Meta-Learner\n({meta_learner.title()})', ha='center', va='center', 
            fontsize=10, color='white', fontweight='bold')
    
    # Draw connections
    for x in base_x:
        ax.plot([x, meta_x], [base_y + 0.08, meta_y - 0.1], 'w-', alpha=0.3, linewidth=2)
    
    # Labels
    ax.text(0.5, 0.15, 'Base Models Layer', ha='center', fontsize=12, color='white', fontweight='bold')
    ax.text(0.5, 0.85, 'Meta-Learner Layer', ha='center', fontsize=12, color='white', fontweight='bold')
    ax.text(0.5, 0.05, 'Input Features', ha='center', fontsize=10, color='gray')
    ax.text(0.5, 0.95, 'Final Prediction', ha='center', fontsize=10, color='gray')
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    
    visualizations['architecture'] = plot_to_base64(fig)

    # Feature importance from Random Forest (normalized)
    feature_importance = dict(zip(feature_names, rf_model.feature_importances_)) if hasattr(rf_model, 'feature_importances_') else {}
    if feature_importance:
        total = sum(feature_importance.values()) or 1.0
        feature_importance = {k: float(v/total) for k, v in feature_importance.items()}

    # Build prediction samples (percentages)
    n_show = min(5, len(X_test))
    sample_indices = np.random.choice(len(X_test), n_show, replace=False)
    predictions_sample = []
    for idx in sample_indices:
        predictions_sample.append({
            'actual': float(y_test[idx] * 100.0),
            'predicted': float(stack_proba[idx] * 100.0),
            'logistic_reg': float(logistic_proba[idx] * 100.0),
            'random_forest': float(rf_proba[idx] * 100.0),
            'xgboost': float(xgb_proba[idx] * 100.0)
        })
    
    # Calculate improvement over best base model
    ensemble_accuracy = models_metrics['Stacking Ensemble']['accuracy']
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
        'meta_learner': meta_learner,
        'n_base_models': 3,
        'base_models': ['Logistic Regression', 'Random Forest', 'XGBoost'],
        'cv_folds': 5,
        'confusion_counts': cm.tolist(),
        'feature_importance': feature_importance,
        'predictions_sample': predictions_sample,
        'improvement_over_best_base': improvement_str,
        'raw_improvement': float(raw_improvement)
    }
