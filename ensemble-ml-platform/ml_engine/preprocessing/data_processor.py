"""
Data Processing Utilities for ML Algorithms
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import json

def load_and_preprocess_csv(file_path, target_column=None, test_size=0.3, random_state=42):
    """
    Load CSV file and preprocess data for ML algorithms
    
    Args:
        file_path: Path to CSV file
        target_column: Name or index of target column (default: last column)
        test_size: Proportion of test set
        random_state: Random seed for reproducibility
    
    Returns:
        Dictionary containing processed data and metadata
    """
    # Load data
    df = pd.read_csv(file_path)
    
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")
    
    # Handle missing values
    if df.isnull().any().any():
        print(f"Found missing values, filling with median/mode")
        for col in df.columns:
            if df[col].dtype in ['float64', 'int64']:
                df[col].fillna(df[col].median(), inplace=True)
            else:
                df[col].fillna(df[col].mode()[0], inplace=True)
    
    # Determine target column
    if target_column is None:
        # For automobile dataset, use mpg as target
        if 'mpg' in df.columns:
            target_column = 'mpg'
        # For concrete dataset, use concrete_compressive_strength as target  
        elif 'concrete_compressive_strength' in df.columns:
            target_column = 'concrete_compressive_strength'
        # For loan dataset, look for approval/status column
        elif any(col.lower() in ['loan_status', 'approval', 'approved', 'status'] for col in df.columns):
            target_column = next(col for col in df.columns if col.lower() in ['loan_status', 'approval', 'approved', 'status'])
        # Default: use last column (common ML convention)
        else:
            target_column = df.columns[-1]
        print(f"Using column as target: {target_column}")
    
    # Separate features and target
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Store original feature names
    feature_names = X.columns.tolist()
    
    # Encode categorical features
    label_encoders = {}
    for col in X.columns:
        if X[col].dtype == 'object':
            print(f"Encoding categorical feature: {col}")
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le
    
    # Encode target if categorical
    target_encoder = None
    is_classification = False
    if y.dtype == 'object' or len(np.unique(y)) < 20:
        print(f"Detected classification task")
        is_classification = True
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y.astype(str))
        class_names = target_encoder.classes_.tolist()
    else:
        print(f"Detected regression task")
        class_names = None
    
    # Convert to numpy arrays
    X = X.values
    if hasattr(y, 'values'):
        y = y.values
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y if is_classification else None
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"Train set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    return {
        'X_train': X_train_scaled,
        'X_test': X_test_scaled,
        'y_train': y_train,
        'y_test': y_test,
        'X_train_raw': X_train,
        'X_test_raw': X_test,
        'feature_names': feature_names,
        'class_names': class_names,
        'is_classification': is_classification,
        'n_samples': len(df),
        'n_features': len(feature_names),
        'n_classes': len(np.unique(y)) if is_classification else None,
        'scaler': scaler,
        'label_encoders': label_encoders,
        'target_encoder': target_encoder
    }

def detect_optimal_clusters(X, max_clusters=10):
    """
    Detect optimal number of clusters using elbow method
    
    Args:
        X: Feature matrix
        max_clusters: Maximum number of clusters to test
    
    Returns:
        Optimal number of clusters
    """
    from sklearn.cluster import KMeans
    
    max_clusters = min(max_clusters, len(X) // 2)
    inertias = []
    
    for k in range(2, max_clusters + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X)
        inertias.append(kmeans.inertia_)
    
    # Simple elbow detection: find point with maximum curvature
    if len(inertias) < 2:
        return 3
    
    # Calculate second derivative
    diffs = np.diff(inertias)
    second_diffs = np.diff(diffs)
    
    # Find elbow (maximum second derivative)
    elbow_idx = np.argmax(np.abs(second_diffs)) + 2
    
    print(f"Detected optimal clusters: {elbow_idx}")
    return elbow_idx

if __name__ == '__main__':
    # Example usage
    print("Data processor utility module")
    print("Use this module to preprocess CSV files for ML algorithms")
