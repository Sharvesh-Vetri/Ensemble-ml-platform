/**
 * Type definitions for the Ensemble ML Platform
 */

// Dataset types
export interface DatasetInfo {
  dataset_id: string
  n_samples: number
  n_features: number
  feature_names: string[]
  is_classification: boolean
  n_classes?: number | null
  class_names?: string[] | null
  task_type: "classification" | "regression"
  target_variable: string
}

// Base model performance metrics
export interface BaseModelMetrics {
  r2_score?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  rmse?: number
  mae?: number
}

// Ensemble performance metrics
export interface EnsemblePerformance {
  r2_score?: number
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  rmse?: number
  mae?: number
  improvement_over_best_base: string
  raw_improvement?: number
}

// Prediction sample
export interface PredictionSample {
  actual: string
  predicted: string
  linear_reg?: string
  logistic_reg?: string
  random_forest: string
  xgboost: string
}

// Voting results
export interface VotingResults {
  algorithm: string
  voting_strategy: string
  base_models: Record<string, BaseModelMetrics>
  ensemble_performance: EnsemblePerformance
  feature_importance: Record<string, number>
  predictions_sample: PredictionSample[]
}

// Stacking results
export interface StackingResults {
  algorithm: string
  meta_learner: string
  base_models: Record<string, BaseModelMetrics>
  meta_model_performance: EnsemblePerformance
  meta_weights?: Record<string, number>
  expert_wins?: Record<string, number>
  best_expert?: string
  feature_importance: Record<string, number>
  predictions_sample: PredictionSample[]
  feature_insights?: any
  cross_validation?: any
}

// Complete results structure
export interface MLResults {
  voting: VotingResults
  stacking: StackingResults
  dataset_info: DatasetInfo
}

// API response types
export interface ProcessDatasetResponse {
  success: boolean
  data?: MLResults
  error?: string
}

export interface DatasetRowsResponse {
  success: boolean
  headers?: string[]
  rows?: string[][]
  error?: string
}

// Component prop types
export interface VisualizationDashboardProps {
  results: MLResults
  method: string
  metaLearner: string | null
  onBackToMethodSelector: () => void
  onReset: () => void
}

export interface DatasetCardProps {
  title: string
  description: string
  datasetSize: string
  factors: string
  cta: string
  onClick: () => void
  onPreview: () => void
  accent: "red" | "amber" | "cyan"
}
