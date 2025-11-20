"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, Users, TrendingUp, Lightbulb, Car, Gauge, Weight, Zap, Sparkles, ArrowRight, Landmark, CreditCard, User, Calendar, DollarSign, Banknote, ChevronDown, ChevronUp, BarChart3, LineChart, BookOpen, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { InteractiveCharts } from "@/components/InteractiveCharts"
import { BeginnerFriendlyInsights } from "@/components/BeginnerFriendlyInsights"
import type { MLResults } from "@/types"

interface VisualizationDashboardProps {
  results: MLResults
  method: string
  metaLearner: string | null
  onBackToMethodSelector: () => void
  onReset: () => void
}

/**
 * Full-screen storytelling dashboard that compares base learners vs ensembles,
 * renders interactive charts, and provides guided insights per dataset.
 */
export function VisualizationDashboard({ results, method, metaLearner, onBackToMethodSelector, onReset }: VisualizationDashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [animateProgress, setAnimateProgress] = useState(false)
  const [showExpertDetails, setShowExpertDetails] = useState(true)  // OPEN BY DEFAULT - Show the story!
  const [showMethodDetails, setShowMethodDetails] = useState(false)
  const [showRealExamples, setShowRealExamples] = useState(true)  // OPEN BY DEFAULT - Show examples!

  useEffect(() => {
    setMounted(true)
    setTimeout(() => setAnimateProgress(true), 300)
  }, [])

  // Use the selected method's data (voting or stacking)
  const methodData = method === "stacking" ? results?.stacking : results?.voting
  const datasetInfo = results?.dataset_info
  
  // Detect which dataset we're displaying
  const isConcrete = datasetInfo?.target_variable === "concrete_compressive_strength"
  const isAutomobile = datasetInfo?.target_variable === "mpg"
  const isLoan = datasetInfo?.dataset_id === 'loan'
  const isClassification = datasetInfo?.is_classification === true || datasetInfo?.task_type === "classification"

  // Define theme colors for each dataset
  const themeColors = {
    primary: isAutomobile ? "red-500" : isConcrete ? "yellow-500" : "cyan-400",
    primaryHover: isAutomobile ? "red-600" : isConcrete ? "yellow-600" : "cyan-500",
    primaryLight: isAutomobile ? "red-500/20" : isConcrete ? "yellow-500/20" : "cyan-400/20",
    primaryBg: isAutomobile ? "bg-red-500" : isConcrete ? "bg-yellow-500" : "bg-cyan-400",
    primaryText: isAutomobile ? "text-red-500" : isConcrete ? "text-yellow-500" : "text-cyan-400",
    primaryBorder: isAutomobile ? "border-red-500" : isConcrete ? "border-yellow-500" : "border-cyan-400",
    primaryGradient: isAutomobile 
      ? "from-red-500/20 via-red-500/10 to-transparent" 
      : isConcrete 
      ? "from-yellow-500/20 via-yellow-500/10 to-transparent"
      : "from-cyan-400/20 via-cyan-400/10 to-transparent",
  }

  // Debug logging
  useEffect(() => {
    if (results) {
      console.log("[Dashboard] Full results:", results)
      console.log("[Dashboard] Method:", method)
      console.log("[Dashboard] Method data:", methodData)
      console.log("[Dashboard] Base models:", methodData?.base_models)
      console.log("[Dashboard] Ensemble:", methodData?.ensemble_performance || methodData?.meta_model_performance)
      console.log("[Dashboard] Dataset type - Concrete:", isConcrete, "Automobile:", isAutomobile, "Loan:", isLoan)
      console.log("[Dashboard] Is classification:", isClassification)
    }
  }, [results, method, methodData, isConcrete, isAutomobile, isLoan, isClassification])

  const getAccuracyPercentage = (score: number) => {
    if (!score && score !== 0) {
      console.warn("[Dashboard] No score provided:", score)
      return 0
    }
    // For classification, accuracy is already a percentage (0-1), convert to 0-100
    // For regression, r2_score is also 0-1, convert to 0-100
    return Math.round(score * 100)
  }

  // Two-decimal percentage formatter for UI display and widths
  const formatPct = (v?: number) =>
    Number.isFinite(v as number) ? `${(Number(v) * 100).toFixed(2)}%` : '0.00%'

  const getSimpleError = (rmse: number) => {
    if (!rmse) {
      console.warn("[Dashboard] No RMSE provided:", rmse)
      return "0.0"
    }
    return rmse.toFixed(1)
  }
  
  // Get the appropriate metric based on task type
  const getMainMetric = (modelData: any) => {
    if (isClassification) {
      return modelData?.accuracy || modelData?.test_accuracy || 0
    }
    return modelData?.r2_score || 0
  }
  
  const getMainMetricName = () => {
    return isClassification ? "Accuracy" : "R² Score (Accuracy)"
  }

  const toSafeNumber = (value: any) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const formatTwoDecimals = (value: any) => {
    return toSafeNumber(value).toFixed(2)
  }

  const datasetUnitLabel = isClassification ? "%" : isConcrete ? "MPa" : isAutomobile ? "MPG" : "%"
  const datasetSubject = isConcrete ? "concrete batch" : isAutomobile ? "car" : "loan applicant"

  const toNumberOrNull = (value: any) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }

  const formatValueDisplay = (value: number | null, includeUnits = false) => {
    if (value === null) return null
    const base = formatTwoDecimals(value)
    if (!includeUnits) return base
    if (isClassification) return `${base}%`
    return `${base} ${datasetUnitLabel}`
  }

  const sampleValues = (() => {
    if (!Array.isArray(methodData?.predictions_sample) || methodData.predictions_sample.length === 0) {
      return null
    }
    const sample = methodData.predictions_sample[0]
    const pattern = toNumberOrNull(sample?.linear_reg ?? sample?.logistic_reg)
    const detail = toNumberOrNull(sample?.random_forest)
    const quick = toNumberOrNull(sample?.xgboost)
    if (pattern === null || detail === null || quick === null) {
      return null
    }
    const team = toNumberOrNull(sample?.predicted)
    const actual = toNumberOrNull(sample?.actual)
    const average = (pattern + detail + quick) / 3
    return {
      pattern,
      detail,
      quick,
      team,
      actual,
      average,
      patternPlain: formatValueDisplay(pattern),
      detailPlain: formatValueDisplay(detail),
      quickPlain: formatValueDisplay(quick),
      averagePlain: formatValueDisplay(average),
      patternWithUnits: formatValueDisplay(pattern, true),
      detailWithUnits: formatValueDisplay(detail, true),
      quickWithUnits: formatValueDisplay(quick, true),
      averageWithUnits: formatValueDisplay(average, true),
      teamWithUnits: formatValueDisplay(team, true),
      actualWithUnits: formatValueDisplay(actual, true),
    }
  })()

  const sampleIntroDesc = sampleValues
    ? `Real ${datasetSubject}: Pattern Finder predicts ${sampleValues.patternWithUnits}, Detail Expert predicts ${sampleValues.detailWithUnits}, Quick Learner predicts ${sampleValues.quickWithUnits}.`
    : null

  const fallbackStackingSteps = [
    { step: 1, title: "Step 1: Base models make predictions", desc: "Loading actual prediction data..." },
    { step: 2, title: "Step 2: Supervisor learns who to trust", desc: "Processing..." },
    { step: 3, title: "Step 3: Supervisor stays close to reality", desc: "Calculating..." },
  ]

  const fallbackVotingSteps = [
    { step: 1, title: "Step 1: Each expert makes a prediction", desc: "Loading actual prediction data..." },
    { step: 2, title: "Step 2: We average their opinions", desc: "Processing..." },
    { step: 3, title: "Step 3: The team is more accurate", desc: "Calculating..." },
  ]

  const buildStackingSteps = () => {
    if (!sampleValues) return fallbackStackingSteps

    const weights = methodData?.meta_weights
    const linearWeight = typeof weights?.linear === "number" ? Math.round(weights.linear * 100) : null
    const rfWeight = typeof weights?.rf === "number" ? Math.round(weights.rf * 100) : null
    const xgbWeight = typeof weights?.xgb === "number" ? Math.round(weights.xgb * 100) : null
    const weightSummary = linearWeight !== null && rfWeight !== null && xgbWeight !== null
      ? `Supervisor weights Pattern Finder ${linearWeight}%, Detail Expert ${rfWeight}%, Quick Learner ${xgbWeight}%.`
      : methodData?.meta_learner
        ? `Supervisor trains a ${methodData.meta_learner} meta-learner that decides whose advice to trust for each ${datasetSubject}.`
        : "Supervisor studies thousands of past predictions to decide whose advice to trust."
    const averageComparison = sampleValues.averageWithUnits && sampleValues.teamWithUnits
      ? ` Simple average would be ${sampleValues.averageWithUnits}, but the meta-model predicted ${sampleValues.teamWithUnits}.`
      : ""

    const wins = methodData?.expert_wins
    const winsText = wins
      ? `Pattern Finder won ${wins.linear ?? 0} cases, Detail Expert ${wins.rf ?? 0}, Quick Learner ${wins.xgb ?? 0}.`
      : null
    const outcomeParts = [
      sampleValues.actualWithUnits && sampleValues.teamWithUnits
        ? `Actual outcome was ${sampleValues.actualWithUnits}, and the meta-model predicted ${sampleValues.teamWithUnits}.`
        : null,
      winsText,
      "By keeping score of every case, the supervisor knows who to amplify.",
    ].filter(Boolean)

    return [
      {
        step: 1,
        title: "Step 1: Base models make predictions",
        desc: sampleIntroDesc || "Loading actual prediction data...",
      },
      {
        step: 2,
        title: "Step 2: Supervisor learns who to trust",
        desc: `${weightSummary}${averageComparison}`.trim(),
      },
      {
        step: 3,
        title: "Step 3: Supervisor stays close to reality",
        desc: outcomeParts.join(" "),
      },
    ]
  }

  const buildVotingSteps = () => {
    if (!sampleValues) return fallbackVotingSteps

    const averageFormula = sampleValues.patternPlain && sampleValues.detailPlain && sampleValues.quickPlain
      ? `(${sampleValues.patternPlain} + ${sampleValues.detailPlain} + ${sampleValues.quickPlain}) / 3`
      : "Average of the three predictions"
    const averageLine = sampleValues.averageWithUnits
      ? `${averageFormula} = ${sampleValues.averageWithUnits} team prediction.`
      : `${averageFormula} becomes the team prediction.`

    const accuracyParts = [
      sampleValues.actualWithUnits
        ? `Actual outcome was ${sampleValues.actualWithUnits}.`
        : null,
      sampleValues.teamWithUnits
        ? `Averaging produced ${sampleValues.teamWithUnits}, smoothing out individual mistakes.`
        : "By combining perspectives, we reduce individual mistakes.",
    ].filter(Boolean)

    return [
      {
        step: 1,
        title: "Step 1: Each expert makes a prediction",
        desc: sampleIntroDesc || "Loading actual prediction data...",
      },
      {
        step: 2,
        title: "Step 2: We average their opinions",
        desc: averageLine,
      },
      {
        step: 3,
        title: "Step 3: The team is more accurate",
        desc: accuracyParts.join(" "),
      },
    ]
  }

  const howItWorksItems = method === "stacking" ? buildStackingSteps() : buildVotingSteps()

  // Transform classification metrics to match regression base_models structure
  const baseModels = (() => {
    // If we have base_models directly (regression), use them
    if (methodData?.base_models && typeof methodData.base_models === 'object' && !Array.isArray(methodData.base_models)) {
      return methodData.base_models
    }
    
    // If we have metrics (classification), transform them
    if (methodData?.metrics) {
      const transformed: any = {}
      Object.entries(methodData.metrics).forEach(([modelName, metrics]: [string, any]) => {
        if (modelName !== 'Voting Ensemble') {
          transformed[modelName] = metrics
        }
      })
      return transformed
    }
    
    // NO FALLBACK - Return empty object to force proper error handling
    console.error("[Dashboard] Missing base models data!")
    return {}
  })()

  const preferredClassificationKey = baseModels?.['Logistic Regression'] ? 'Logistic Regression' : 'Linear Regression'
  const primaryModelKey = isClassification ? preferredClassificationKey : "Linear Regression"
  const primaryModelLabel = isClassification ? "Logistic Regression" : "Linear Regression"
  const primaryModelMetrics = baseModels?.[primaryModelKey] ?? {}

  // If stacking (regression) arrives without rmse/mae, derive APPROXIMATE values from predictions_sample
  // ⚠️ WARNING: This is only approximate - calculated from 5 samples, not the full test set
  // Should only be used as fallback when Python doesn't provide these metrics
  const baseModelsEnhanced = (() => {
    if (isClassification) return baseModels
    const needFix = (
      !baseModels?.["Linear Regression"]?.rmse ||
      !baseModels?.["Random Forest"]?.rmse ||
      !baseModels?.["XGBoost"]?.rmse
    )
    const preds: any[] = Array.isArray(methodData?.predictions_sample) ? methodData?.predictions_sample : []
    if (!needFix || preds.length === 0) return baseModels

    // ⚠️ APPROXIMATE calculation from sample predictions only
    // Real RMSE/MAE should come from Python (calculated on full test set)
    const compute = (predKey: string) => {
      const diffs = preds
        .map((p) => {
          const a = Number(p?.actual)
          const b = Number(p?.[predKey])
          return Number.isFinite(a) && Number.isFinite(b) ? a - b : null
        })
        .filter((d): d is number => d !== null)
      if (diffs.length === 0) return { rmse: 0, mae: 0 }
      const mae = diffs.reduce((s, d) => s + Math.abs(d), 0) / diffs.length
      const mse = diffs.reduce((s, d) => s + d * d, 0) / diffs.length
      const rmse = Math.sqrt(mse)
      return { rmse, mae, isApproximate: true }
    }

    const approxLinear = compute('linear_reg')
    const approxRF = compute('random_forest')
    const approxXGB = compute('xgboost')

    return {
      ...baseModels,
      'Linear Regression': {
        ...baseModels?.['Linear Regression'],
        rmse: baseModels?.['Linear Regression']?.rmse ?? approxLinear.rmse,
        mae: baseModels?.['Linear Regression']?.mae ?? approxLinear.mae,
      },
      'Random Forest': {
        ...baseModels?.['Random Forest'],
        rmse: baseModels?.['Random Forest']?.rmse ?? approxRF.rmse,
        mae: baseModels?.['Random Forest']?.mae ?? approxRF.mae,
      },
      'XGBoost': {
        ...baseModels?.['XGBoost'],
        rmse: baseModels?.['XGBoost']?.rmse ?? approxXGB.rmse,
        mae: baseModels?.['XGBoost']?.mae ?? approxXGB.mae,
      }
    }
  })()
  // Get ensemble performance (voting uses ensemble_performance, stacking uses meta_model_performance)
  // For classification, extract from metrics['Voting Ensemble'] or metrics['Stacking Ensemble']
  const ensemble = (() => {
    if (methodData?.ensemble_performance) return methodData.ensemble_performance
    if (methodData?.meta_model_performance) return methodData.meta_model_performance
    if (methodData?.metrics?.['Voting Ensemble']) return methodData.metrics['Voting Ensemble']
    if (methodData?.metrics?.['Stacking Ensemble']) return methodData.metrics['Stacking Ensemble']
    
    // NO FALLBACK - Return null to force proper error handling
    console.error("[Dashboard] Missing ensemble performance data!")
    return null
  })()

  console.log("[Dashboard] Using baseModels:", baseModelsEnhanced)
  console.log("[Dashboard] Using ensemble:", ensemble)
  console.log("[Dashboard] Task type:", isClassification ? "Classification" : "Regression")
  console.log("[Dashboard] Full methodData:", methodData)

  // Derive improvement if the backend didn't provide it (protects stacking cases)
  const derivedImprovement = (() => {
    const metricKey = isClassification ? 'accuracy' : 'r2_score'
    const baseKeys = [primaryModelKey, 'Random Forest', 'XGBoost']
    const baseValues = baseKeys
      .map((key) => baseModelsEnhanced?.[key]?.[metricKey])
      .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[]
    const ensembleVal = (ensemble as any)?.[metricKey]
    if (!baseValues.length || typeof ensembleVal !== 'number') return null
    const bestBase = Math.max(...baseValues)
    const raw = (ensembleVal - bestBase) * 100
    return {
      raw,
      formatted: `${raw.toFixed(1)}%`
    }
  })()

  // Compute unified improvement info and best base model for messaging
  const metricKeyForBest = isClassification ? 'accuracy' : 'r2_score'
  const improvementRaw: number | null = typeof (ensemble as any)?.raw_improvement === 'number'
    ? (ensemble as any).raw_improvement
    : (derivedImprovement?.raw ?? null)
  const improvementAbs = typeof improvementRaw === 'number' ? Math.abs(improvementRaw) : null
  const improvementFmt = typeof improvementRaw === 'number' ? `${improvementRaw.toFixed(1)}%` : null

  const baseKeysForBest = [primaryModelKey, 'Random Forest', 'XGBoost']
  let bestBaseKey: string | null = null
  let bestBaseVal = -Infinity
  baseKeysForBest.forEach((k) => {
    const v = baseModelsEnhanced?.[k]?.[metricKeyForBest]
    if (typeof v === 'number' && v > bestBaseVal) {
      bestBaseVal = v
      bestBaseKey = k
    }
  })

  // Dynamic gradient colors based on dataset
  const gradientFrom = isAutomobile ? "from-red-500" : isConcrete ? "from-amber-400" : "from-cyan-400"
  const gradientTo = isAutomobile ? "to-orange-500" : isConcrete ? "to-yellow-500" : "to-sky-500"
  const glowColor = isAutomobile ? "shadow-red-500/50" : isConcrete ? "shadow-amber-400/50" : "shadow-cyan-400/50"

  return (
    <div className="min-h-screen w-full pb-20">
      {/* Header with Back Button */}
      <header className="w-full border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex items-center gap-3">
          <Button
            onClick={onBackToMethodSelector}
            variant="outline"
            className="gap-2 border-zinc-700 hover:border-primary/50 hover:bg-primary/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Method
          </Button>
          <Button
            onClick={onReset}
            className={`gap-2 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white hover:opacity-90 shadow-lg ${glowColor} transition-all`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Datasets
          </Button>
        </div>
      </header>

      <div className="w-full py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-10">
        {/* Hero Header - More Concise */}
        <div className="text-center space-y-6">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Badge variant="outline" className="border-violet-500/50 text-violet-300 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              {method === "stacking" 
                ? (isClassification ? "Stacking Classifier" : "Stacking Regressor")
                : (isClassification ? "Voting Classifier" : "Voting Regressor")
              }
            </Badge>
            {method === "stacking" && metaLearner && (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 px-4 py-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Meta-Learner: {methodData?.meta_learner || "Linear Regression"}
              </Badge>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            <span className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
              {isConcrete ? "Building Strength" : isAutomobile ? "Fuel Efficiency" : "Loan Approval"}
            </span>
            {" "}
            <span className="text-white">Results</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Analyzed <span className={`font-bold ${themeColors.primaryText}`}>{datasetInfo?.n_samples}</span> samples using ensemble learning
          </p>

          {/* Key Metrics - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white shadow-lg`}>
              <p className="text-xs font-semibold opacity-80">{getMainMetricName()}</p>
              <p className="text-2xl font-black">{formatPct(getMainMetric(ensemble))}</p>
            </div>
            {!isClassification && (
              <div className="px-6 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white">
                <p className="text-xs font-semibold text-zinc-400">Typical Error</p>
                <p className="text-2xl font-black">±{getSimpleError(ensemble?.rmse || 0)} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "%"}</p>
              </div>
            )}
          </div>
        </div>

        {/* The Three Experts Story - Collapsible */}
        <Collapsible open={showExpertDetails} onOpenChange={setShowExpertDetails}>
          <Card className="border-2 border-zinc-800/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className={`h-6 w-6 ${themeColors.primaryText}`} />
                    <div className="text-left">
                      <CardTitle className="text-2xl">
                        {isConcrete ? "The Three Expert Engineers" : isAutomobile ? "The Three Expert Mechanics" : "The Three Expert Loan Officers"}
                      </CardTitle>
                      <CardDescription>
                        {showExpertDetails ? "Click to collapse" : "Click to see how each expert makes predictions"}
                      </CardDescription>
                    </div>
                  </div>
                  {showExpertDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">

          <div className="grid gap-8 md:grid-cols-3">
            {/* Linear Regression Expert */}
            <div className={`relative rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 border-2 ${isAutomobile ? 'border-red-500/40' : isConcrete ? 'border-amber-400/40' : 'border-cyan-400/40'} overflow-hidden group hover:-translate-y-2 transition-all duration-300`}>
              {/* Glow effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition duration-500`} />
              
              <div className="relative p-8 space-y-5">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg ${glowColor}`}>
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">The Pattern Finder</h3>
                  <p className="text-sm text-zinc-400 font-semibold">{primaryModelLabel}</p>
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  {isConcrete 
                    ? "Looks for simple patterns. Like noticing \"more cement = stronger concrete\" or \"older concrete = better strength.\""
                    : isAutomobile
                    ? "Looks for simple patterns. Like noticing \"heavier cars = worse mileage\" or \"newer cars = better mileage.\""
                    : "Looks for simple patterns. Like noticing \"higher income = approval\" or \"better credit score = approval.\""}
                </p>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-zinc-400">{getMainMetricName()}</span>
                    <span className={`text-5xl font-black bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent tabular-nums`}>
                    {animateProgress ? formatPct(getMainMetric(primaryModelMetrics)) : '0.00%'}
                  </span>
                </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                      className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} h-3 rounded-full transition-all duration-1000 ease-out shadow-lg ${glowColor}`}
                    style={{
                      width: animateProgress
                        ? `${formatPct(getMainMetric(primaryModelMetrics))}`
                        : "0%",
                    }}
                  />
                </div>
                  {!isClassification && (
                    <p className="text-sm text-zinc-400 font-medium">
                      Typically off by <span className="text-white font-bold">±{getSimpleError(primaryModelMetrics?.rmse || 0)} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "% points"}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Random Forest Expert */}
            <div className="relative rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 border-2 border-emerald-500/40 overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition duration-500" />
              
              <div className="relative p-8 space-y-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">The Detail Expert</h3>
                  <p className="text-sm text-zinc-400 font-semibold">Random Forest</p>
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  {isConcrete
                    ? "Considers hundreds of specific scenarios. Like \"300kg cement + 150kg water + 28 days old = 35 MPa strength.\""
                    : isAutomobile
                    ? "Considers hundreds of specific scenarios. Like \"small 4-cylinder cars from the 80s with manual transmission get 35+ MPG.\""
                    : "Considers hundreds of specific scenarios. Like \"$50K income + 750 credit + graduate + employed = 85% approval chance.\""}
                </p>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-zinc-400">{getMainMetricName()}</span>
                    <span className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent tabular-nums">
                    {animateProgress ? formatPct(getMainMetric(baseModels["Random Forest"])) : '0.00%'}
                  </span>
                </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                      className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out delay-100 shadow-lg shadow-emerald-500/50"
                    style={{
                      width: animateProgress
                        ? `${formatPct(getMainMetric(baseModels["Random Forest"]))}`
                        : "0%",
                    }}
                  />
                </div>
                  {!isClassification && (
                    <p className="text-sm text-zinc-400 font-medium">
                      Typically off by <span className="text-white font-bold">±{getSimpleError(baseModels["Random Forest"]?.rmse || 0)} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "% points"}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* XGBoost Expert */}
            <div className="relative rounded-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 border-2 border-blue-500/40 overflow-hidden group hover:-translate-y-2 transition-all duration-300">
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition duration-500" />
              
              <div className="relative p-8 space-y-5">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">The Quick Learner</h3>
                  <p className="text-sm text-zinc-400 font-semibold">XGBoost</p>
                </div>
                <p className="text-base text-zinc-300 leading-relaxed">
                  {isConcrete
                    ? "Learns from every mistake. \"I predicted too high on that mix, let me adjust for the next sample.\""
                    : isAutomobile
                    ? "Learns from every mistake. \"I guessed too high on that heavy car, let me adjust my prediction for the next one.\""
                    : "Learns from every mistake. \"I approved that risky applicant and they defaulted. Let me be more careful with similar profiles.\""}
                </p>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold text-zinc-400">{getMainMetricName()}</span>
                    <span className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tabular-nums">
                    {animateProgress ? formatPct(getMainMetric(baseModels["XGBoost"])) : '0.00%'}
                  </span>
                </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out delay-200 shadow-lg shadow-blue-500/50"
                    style={{
                      width: animateProgress ? `${formatPct(getMainMetric(baseModels["XGBoost"]))}` : "0%",
                    }}
                  />
                </div>
                  {!isClassification && (
                    <p className="text-sm text-zinc-400 font-medium">
                      Typically off by <span className="text-white font-bold">±{getSimpleError(baseModels["XGBoost"]?.rmse || 0)} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "% points"}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <LineChart className="h-4 w-4" />
              Charts & Data
            </TabsTrigger>
            <TabsTrigger value="learn" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Learn More
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
        {/* The Voting/Stacking Process */}
        <Card className={`border-2 ${themeColors.primaryBorder}/50 bg-gradient-to-br ${themeColors.primaryLight} via-transparent to-transparent`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <div className="relative">
              <Users className={`h-8 w-8 ${themeColors.primaryText}`} />
              <Sparkles className={`h-4 w-4 ${themeColors.primaryText} absolute -top-1 -right-1`} />
            </div>
            {method === "stacking" ? "The Power of Meta-Learning" : "The Power of Teamwork"}
          </CardTitle>
          <CardDescription className="text-lg">
            {method === "stacking" 
              ? "A supervisor learns the optimal way to combine expert opinions - not simple averaging!" 
              : "Instead of trusting just one expert, we combine all three opinions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="font-bold text-2xl flex items-center gap-2">
                {method === "stacking" ? "How Meta-Learning Works" : "How Voting Works"}
                <ArrowRight className="h-5 w-5 text-primary" />
              </h3>
              <div className="space-y-4">
                {howItWorksItems.map((item) => (


                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-primary-foreground text-lg">{item.step}</span>
                    </div>
                    <div>
                      <p className="font-bold text-base">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-2xl">{method === "stacking" ? "Meta-Learner Performance" : "Team Performance"}</h3>
              <div className="p-8 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary shadow-lg shadow-primary/10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium">{method === "stacking" ? `Meta-Model ${getMainMetricName()}` : `Team ${getMainMetricName()}`}</span>
                  <span className="text-5xl font-bold text-primary tabular-nums">
                    {animateProgress ? formatPct(getMainMetric(ensemble)) : '0.00%'}
                  </span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary via-primary/80 to-primary h-6 rounded-full transition-all duration-1500 ease-out"
                    style={{ width: animateProgress ? `${formatPct(getMainMetric(ensemble))}` : "0%" }}
                  />
                </div>
                <div className="pt-4 border-t border-primary/20 space-y-2">
                  {!isClassification && (
                    <p className="text-base font-bold">Typically off by ±{getSimpleError(ensemble?.rmse || 0)} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "% points"}</p>
                  )}
                  {typeof improvementRaw === 'number' && improvementAbs !== null ? (
                    improvementAbs < 0.1 ? (
                      <p className="text-sm text-muted-foreground">
                        {method === "stacking" 
                          ? "The base models are already excellent! The meta-learner matches their performance."
                          : "Nearly matches the best individual expert!"}
                      </p>
                    ) : improvementRaw > 0 ? (
                      <p className="text-sm text-muted-foreground">That's better than any single expert working alone!</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {method === "stacking"
                          ? `In this dataset, ${bestBaseKey || 'the best single expert'} performs slightly better (${Math.abs(improvementRaw).toFixed(1)}%). The simpler Voting approach or that expert may be preferable.`
                          : `In this dataset, ${bestBaseKey || 'the best single expert'} performs slightly better (${Math.abs(improvementRaw).toFixed(1)}%). Consider trying Stacking or using that expert.`}
                      </p>
                    )
                  ) : null}
                </div>
                <Badge variant="default" className={`text-base px-4 py-2 ${
                  improvementAbs !== null && improvementAbs < 0.1
                    ? 'bg-zinc-700'
                    : improvementRaw !== null && improvementRaw < 0
                      ? 'bg-rose-600'
                      : 'bg-primary'
                }`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {improvementFmt
                    ? (improvementAbs !== null && improvementAbs < 0.1
                        ? `${improvementFmt} change`
                        : (improvementRaw as number) > 0
                          ? `${improvementFmt} more accurate`
                          : `${Math.abs(improvementRaw as number).toFixed(1)}% less accurate`)
                    : (derivedImprovement
                        ? (Math.abs(derivedImprovement.raw) < 0.1
                            ? `${derivedImprovement.formatted} change`
                            : (derivedImprovement.raw > 0
                                ? `${derivedImprovement.formatted} more accurate`
                                : `${Math.abs(derivedImprovement.raw).toFixed(1)}% less accurate`))
                        : '0% change')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* What Do These Numbers Mean? */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <Sparkles className="h-8 w-8 text-primary" />
            What Does This Mean For You?
          </CardTitle>
          <CardDescription className="text-lg">
            Let's break down the accuracy in everyday terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Accuracy Explained */}
            <div className="space-y-4 p-6 rounded-xl bg-card border-2 border-primary/30">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">
                  {formatPct(getMainMetric(ensemble))} {isClassification ? 'Accurate' : 'R² Score (Accuracy)'}
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {isClassification ? (
                  <>Out of every 10 predictions, we get <span className="font-bold text-primary">{Math.round(getMainMetric(ensemble) * 10)}</span> exactly right. 
                  That's like correctly identifying loan approval {Math.round(getMainMetric(ensemble) * 10)} out of 10 times!</>
                ) : (
                  <>Out of every 10 predictions, about <span className="font-bold text-primary">{Math.round(getMainMetric(ensemble) * 10)}</span> are very close to the real value.</>
                )}
              </p>
            </div>

            {/* Error Explained - Only for Regression */}
            {!isClassification && (
            <div className="space-y-4 p-6 rounded-xl bg-card border-2 border-chart-2/30">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-chart-2/20 flex items-center justify-center">
                  <Gauge className="h-8 w-8 text-chart-2" />
                </div>
                <h3 className="text-xl font-bold">
                  ±{getSimpleError(ensemble?.rmse || (isConcrete ? 5.2 : isAutomobile ? 3.3 : 8.5))} {isConcrete ? "MPa" : isAutomobile ? "MPG" : "% points"} Error
                </h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {isConcrete ? (
                  <>
                    If your concrete actually has 40 MPa strength, our model predicts between{" "}
                    <span className="font-bold text-chart-2">{(40 - parseFloat(getSimpleError(ensemble?.rmse || 5.2))).toFixed(2)}-{(40 + parseFloat(getSimpleError(ensemble?.rmse || 5.2))).toFixed(2)} MPa</span>.
                    That's pretty impressive for a machine learning on its own!
                  </>
                ) : isAutomobile ? (
                  <>
                    If your car actually gets 25 MPG, our model predicts between{" "}
                    <span className="font-bold text-chart-2">{(25 - parseFloat(getSimpleError(ensemble?.rmse || 3.3))).toFixed(2)}-{(25 + parseFloat(getSimpleError(ensemble?.rmse || 3.3))).toFixed(2)} MPG</span>.
                    That's pretty impressive for a machine learning on its own!
                  </>
                ) : (
                  <>
                    If an applicant has 75% actual approval chance, our model predicts between{" "}
                    <span className="font-bold text-chart-2">{(75 - parseFloat(getSimpleError(ensemble?.rmse || 8.5))).toFixed(2)}-{(75 + parseFloat(getSimpleError(ensemble?.rmse || 8.5))).toFixed(2)}%</span>.
                    That's pretty impressive for a machine learning on its own!
                  </>
                )}
              </p>
            </div>
            )}
          </div>


          {/* Real-World Scenario */}
          <div className="mt-6 p-6 rounded-xl bg-primary/10 border border-primary/30">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              {isConcrete ? <Weight className="h-5 w-5 text-primary" /> : isAutomobile ? <Car className="h-5 w-5 text-primary" /> : <TrendingUp className="h-5 w-5 text-primary" />}
              Imagine This Scenario:
            </h4>
            <div className="space-y-3 text-base text-muted-foreground">
              {isConcrete ? (
                <>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">1.</span>
                    <span>
                      You're building a bridge. Your concrete has <span className="font-bold text-foreground">350 kg cement</span>, 
                      <span className="font-bold text-foreground"> 180 kg water</span>, and is{" "}
                      <span className="font-bold text-foreground">28 days old</span>.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">2.</span>
                    <span>
                      Our model predicts it has around <span className="font-bold text-primary">35 MPa strength</span> (±{getSimpleError(ensemble?.rmse || 5.2)} MPa).
                    </span>
                  </p>
                </>
              ) : isAutomobile ? (
                <>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">1.</span>
                    <span>
                      You're shopping for a used car. It weighs <span className="font-bold text-foreground">3,500 lbs</span>, 
                      has a <span className="font-bold text-foreground">6-cylinder engine</span>, and was made in{" "}
                      <span className="font-bold text-foreground">1985</span>.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">2.</span>
                    <span>
                      Our model predicts it gets around <span className="font-bold text-primary">22 MPG</span> (±{getSimpleError(ensemble?.rmse || 3.3)} MPG).
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">1.</span>
                    <span>
                      You're evaluating a loan application. The applicant has <span className="font-bold text-foreground">$65,000 income</span>, 
                      a <span className="font-bold text-foreground">credit score of 690</span>, and{" "}
                      <span className="font-bold text-foreground">2 years employment</span>.
                    </span>
                  </p>
                  <p className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">2.</span>
                    <span>
                      Our model predicts around <span className="font-bold text-primary">68% approval chance</span> (±{getSimpleError(ensemble?.rmse || 8.5)}% points).
                    </span>
                  </p>
                </>
              )}
              <p className="flex items-start gap-3">
                <span className="text-primary font-bold mt-1">3.</span>
                <span>
                  {isConcrete ? (
                    <>
                      You test it in the lab: <span className="font-bold text-primary">37 MPa strength</span>. 
                      Our prediction was spot on! ✓
                    </>
                  ) : isAutomobile ? (
                    <>
                      You test drive it and check the actual mileage: <span className="font-bold text-primary">24 MPG</span>. 
                      Our prediction was spot on! ✓
                    </>
                  ) : (
                    <>
                      The loan gets approved: <span className="font-bold text-primary">Approved</span>. 
                      Our prediction was accurate! ✓
                    </>
                  )}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* What Matters Most */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            {isConcrete ? (
              <Weight className="h-8 w-8 text-primary" />
            ) : isAutomobile ? (
              <Car className="h-8 w-8 text-primary" />
            ) : (
              <Landmark className="h-8 w-8 text-primary" />
            )}
            {isConcrete ? "What Really Affects Concrete Strength?" : isAutomobile ? "What Really Affects Fuel Efficiency?" : "What Really Affects Loan Approval?"}
          </CardTitle>
          <CardDescription className="text-lg">
            {isConcrete 
              ? "Our experts agree on which ingredients matter most for MPa strength"
              : isAutomobile 
              ? "Our experts agree on which car features matter most for MPG"
              : "Our experts agree on which applicant factors matter most for approval"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {methodData?.feature_importance &&
              Object.entries(methodData.feature_importance)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 5)
                .map(([feature, importance]: [string, any], idx) => {
                  // Choose icons based on dataset context
                  const icons = isConcrete
                    ? [Weight, Gauge, Zap, Car, TrendingUp]
                    : isAutomobile
                    ? [Car, Zap, Gauge, Weight, TrendingUp]
                    : [Landmark, CreditCard, User, Calendar, DollarSign]
                  const Icon = icons[idx] || (isLoan ? Landmark : Car)
                   const colors = [
                    { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
                    { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
                    { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
                    { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
                    { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
                  ]
                  const color = colors[idx] || colors[0]

                  const explanations: Record<string, string> = isConcrete ? {
                    cement: "The main binding agent — more cement generally means stronger concrete",
                    water: "Too much weakens it, too little makes it hard to work with — balance is key",
                    age: "Like aging wine — concrete gets stronger over time as chemical reactions continue",
                    "blast_furnace_slag": "Industrial byproduct that enhances long-term strength",
                    "fly_ash": "Coal combustion residue that improves durability",
                    superplasticizer: "Reduces water needs while maintaining workability",
                    "coarse_aggregate": "The rocks that form the structural backbone",
                    "fine_aggregate": "Sand that fills gaps and binds everything together",
                  } : isAutomobile ? {
                    weight: "Like carrying heavy luggage — the heavier your car, the more fuel it needs to move",
                    displacement: "Engine size matters — a bigger engine is like a bigger appetite for gas",
                    horsepower: "More horses pulling = more hay eaten. More power = more fuel consumed",
                    cylinders: "Think of cylinders as mouths to feed — more mouths means more fuel",
                    acceleration: "Fast acceleration is like sprinting vs. walking — it uses way more energy",
                    "model year": "Technology improves over time — newer cars are built smarter and more efficient",
                    origin: "Where a car is made affects its design philosophy and efficiency standards",
                  } : {
                    income: "Higher income means better ability to repay loans",
                    "credit_score": "Past financial behavior is the best predictor of future behavior",
                    "loan_amount": "Larger loans carry more risk — even to qualified applicants",
                    "employment_length": "Job stability indicates reliable income stream",
                    "debt_to_income": "Existing debt limits capacity to take on new obligations",
                    education: "Education level correlates with earning potential and financial literacy",
                    age: "Age can indicate financial stability and credit history length",
                    assets: "Savings and assets provide backup repayment ability",
                  }

                  // Format feature name: remove underscores and capitalize each word
                  const formatFeatureName = (name: string) => {
                    return name
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')
                  }

                  return (
                    <div key={feature} className="space-y-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full ${color.bg} flex items-center justify-center border ${color.border}`}>
                          <Icon className={`h-6 w-6 ${color.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{formatFeatureName(feature)}</span>
                            <span className="text-base font-bold text-muted-foreground tabular-nums">
                              {Math.round(importance * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {explanations[feature.toLowerCase()] || (isConcrete ? "Affects concrete strength" : isAutomobile ? "Affects fuel efficiency" : "Affects loan approval")}
                          </p>
                        </div>
                      </div>
                      <div className="ml-16">
                        <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary/80 to-primary h-4 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: animateProgress ? `${importance * 100}%` : "0%",
                            transitionDelay: `${(idx + 4) * 100}ms`,
                          }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
          </div>
        </CardContent>
      </Card>
          </TabsContent>

          {/* Charts & Data Tab */}
          <TabsContent value="charts" className="space-y-8">
            <InteractiveCharts 
              featureImportance={methodData?.feature_importance || {}}
              predictions={methodData?.predictions_sample || []}
              baseModels={baseModelsEnhanced || {}}
              ensemblePerformance={ensemble || {}}
              isConcrete={isConcrete}
              isAutomobile={isAutomobile}
              isLoan={isLoan}
              isClassification={isClassification}
              themeColors={themeColors}
              visualizations={methodData?.visualizations || null}
            />

        {/* Real Examples - Collapsible */}
        <Collapsible open={showRealExamples} onOpenChange={setShowRealExamples}>
          <Card className="border-2 border-zinc-800/50">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className={`h-6 w-6 ${themeColors.primaryText}`} />
                    <div className="text-left">
                      <CardTitle className="text-2xl">Real Predictions</CardTitle>
                      <CardDescription>
                        {showRealExamples ? "Click to collapse" : "See actual predictions from the dataset"}
                      </CardDescription>
                    </div>
                  </div>
                  {showRealExamples ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
          <div className="mb-6 p-5 rounded-xl bg-primary/10 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-bold text-foreground">💡 How to read this:</span> Each card shows a real {isConcrete ? "concrete sample's actual strength (MPa)" : isAutomobile ? "car's actual MPG" : "applicant's approval chance (%)"} on the left, 
              then each expert's individual prediction, and finally the team's combined prediction.
            </p>
            <div className="grid gap-2 text-xs text-muted-foreground pl-4 border-l-2 border-primary/30">
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span><span className="font-bold text-foreground">Good predictions</span> are within {isConcrete ? "2-5 MPa" : isAutomobile ? "1-3 MPG" : "5-10%"} of the actual value</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span><span className="font-bold text-foreground">Individual experts</span> might be off by {isConcrete ? "3-7 MPa" : isAutomobile ? "2-4 MPG" : "8-12%"} occasionally</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span><span className="font-bold text-foreground">The team average</span> combines their opinions and gets closer to reality!</span>
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {methodData?.predictions_sample?.slice(0, 10).map((pred: any, idx: number) => {
              const primaryExpertLabel = isClassification ? "Logistic Regression" : "Pattern Finder"
              const primaryExpertRaw = isClassification ? (pred?.logistic_reg ?? pred?.linear_reg) : pred?.linear_reg
              const actualValue = toSafeNumber(pred?.actual)
              const teamValue = toSafeNumber(pred?.predicted)
              const primaryValue = formatTwoDecimals(primaryExpertRaw)
              const rfValue = formatTwoDecimals(pred?.random_forest)
              const xgbValue = formatTwoDecimals(pred?.xgboost)
              const diffValue = Math.abs(teamValue - actualValue)
              const diffFormatted = formatTwoDecimals(diffValue)
              const units = isConcrete ? "MPa" : isAutomobile ? "MPG" : "%"
              const targetThreshold = isConcrete ? 5.2 : isAutomobile ? 2.7 : 8.5
              const withinTarget = diffValue <= targetThreshold

              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl border-2 border-border hover:border-primary/50 bg-gradient-to-br from-card to-muted/20 space-y-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Actual {isConcrete ? "Strength" : isAutomobile ? "MPG" : "Approval"}</p>
                      <p className="text-4xl font-bold text-foreground tabular-nums">{formatTwoDecimals(actualValue)}</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-muted-foreground" />
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground font-medium">Team Prediction</p>
                      <p className="text-4xl font-bold text-primary tabular-nums">{formatTwoDecimals(teamValue)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-border">
                    <div className="text-center p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">{primaryExpertLabel}</p>
                      <p className="text-2xl font-bold text-primary tabular-nums">{primaryValue}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-chart-2/10 hover:bg-chart-2/20 transition-colors">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Detail Expert</p>
                      <p className="text-2xl font-bold text-chart-2 tabular-nums">{rfValue}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-chart-3/10 hover:bg-chart-3/20 transition-colors">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Learner</p>
                      <p className="text-2xl font-bold text-chart-3 tabular-nums">{xgbValue}</p>
                    </div>
                  </div>
                  <div className="text-sm text-center pt-2">
                    <p className="text-muted-foreground">
                      The team's average <span className="font-bold text-primary">({formatTwoDecimals(teamValue)} {units})</span> is{" "}
                      <span className="font-bold text-foreground">
                        {diffFormatted} {units} off
                      </span>{" "}
                      from reality <span className="font-bold text-foreground">({formatTwoDecimals(actualValue)} {units})</span>
                    </p>
                    {withinTarget && (
                      <p className="text-xs text-primary mt-1 font-medium">✓ Within our target!</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
          </TabsContent>

          {/* Learn More Tab */}
          <TabsContent value="learn" className="space-y-8">
            <BeginnerFriendlyInsights 
              featureInsights={methodData?.feature_insights}
              crossValidation={methodData?.cross_validation}
              isConcrete={isConcrete}
              isAutomobile={isAutomobile}
              isLoan={isLoan}
              isClassification={isClassification}
              method={method}
            />

        {/* Key Takeaway */}
        <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <CardContent className="pt-8">
          <div className="space-y-6">
          <div className="flex items-start gap-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-8 w-8 text-primary-foreground" />
            </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  {method === "stacking" ? "The Big Idea: Stacking vs Voting" : "The Big Idea: Wisdom of the Crowd"}
                </h3>
              <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
                {method === "stacking" ? (
                  isConcrete ? (
                    <>
                      <p className="text-xl font-bold text-foreground">🤔 What's the difference between Stacking and Voting?</p>
                      
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="font-bold text-blue-400 text-lg mb-2">📘 Voting (Simple Team Average):</p>
                        <p className="mb-2">Like taking a poll: <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-sm">(answer1 + answer2 + answer3) ÷ 3</span></p>
                        <p>Everyone gets <span className="font-bold text-foreground">equal say (33.33%)</span>—even if some experts are clearly better!</p>
                        <p className="mt-2 text-sm text-zinc-400">Example: If 3 friends guess your age (25, 30, 35), the team says 30. Fair, but treats all guesses equally even if Friend B is usually right.</p>
                      </div>
                      
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="font-bold text-emerald-400 text-lg mb-2">📗 Stacking (Smart Supervisor):</p>
                        <p className="mb-2">A supervisor (<span className="font-bold text-primary text-xl">{methodData?.meta_learner}</span>) watches all the experts and learns who to trust:</p>
                        <p className="font-mono bg-zinc-800 px-3 py-2 rounded text-sm my-2">Final = 20%×answer1 + 60%×answer2 + 20%×answer3</p>
                        <p className="mb-2">The supervisor <span className="font-bold text-foreground">chooses these percentages</span> by seeing thousands of past predictions!</p>
                        <p className="text-sm text-zinc-400">Example: Supervisor notices Detail Expert is amazing at {isConcrete ? "high-cement concrete" : isAutomobile ? "heavy cars" : "high-income applicants"} (60% trust) but Pattern Finder is better at {isConcrete ? "low-cement" : isAutomobile ? "light cars" : "moderate-income applicants"} (60% trust for that case). It adjusts who to listen to!</p>
                      </div>
                      
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="font-bold text-foreground text-lg mb-2">🎯 Why Stacking Usually Wins:</p>
                        <p>Imagine you're lost. Would you trust directions equally from: (1) a tourist, (2) a local who lives here, (3) a taxi driver? NO! You'd listen more to the local and driver.</p>
                        <p className="mt-2">That's Stacking—it figures out <span className="font-bold text-primary">who's the expert in each situation</span> instead of treating everyone the same. Usually 5-15% more accurate!</p>
                      </div>
                    </>
                  ) : isAutomobile ? (
                    <>
                      <p className="text-xl font-bold text-foreground">🤔 What's the difference between Stacking and Voting?</p>
                      
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="font-bold text-blue-400 text-lg mb-2">📘 Voting (Simple Team Average):</p>
                        <p className="mb-2">Like taking a poll: <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-sm">(answer1 + answer2 + answer3) ÷ 3</span></p>
                        <p>Everyone gets <span className="font-bold text-foreground">equal say (33.33%)</span>—even if some experts are clearly better!</p>
                        <p className="mt-2 text-sm text-zinc-400">Example: If 3 friends guess your age (25, 30, 35), the team says 30. Fair, but treats all guesses equally even if Friend B is usually right.</p>
                      </div>
                      
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="font-bold text-emerald-400 text-lg mb-2">📗 Stacking (Smart Supervisor):</p>
                        <p className="mb-2">A supervisor (<span className="font-bold text-primary text-xl">{methodData?.meta_learner}</span>) watches all the experts and learns who to trust:</p>
                        <p className="font-mono bg-zinc-800 px-3 py-2 rounded text-sm my-2">Final = 20%×answer1 + 60%×answer2 + 20%×answer3</p>
                        <p className="mb-2">The supervisor <span className="font-bold text-foreground">chooses these percentages</span> by seeing thousands of past predictions!</p>
                        <p className="text-sm text-zinc-400">Example: Supervisor notices Detail Expert is amazing at heavy cars (60% trust) but Pattern Finder is better at light cars (60% trust for that case). It adjusts who to listen to!</p>
                      </div>
                      
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="font-bold text-foreground text-lg mb-2">🎯 Why Stacking Usually Wins:</p>
                        <p>Imagine you're lost. Would you trust directions equally from: (1) a tourist, (2) a local who lives here, (3) a taxi driver? NO! You'd listen more to the local and driver.</p>
                        <p className="mt-2">That's Stacking—it figures out <span className="font-bold text-primary">who's the expert in each situation</span> instead of treating everyone the same. Usually 5-15% more accurate!</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-foreground">🤔 What's the difference between Stacking and Voting?</p>
                      
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="font-bold text-blue-400 text-lg mb-2">📘 Voting (Simple Team Average):</p>
                        <p className="mb-2">Like taking a poll: <span className="font-mono bg-zinc-800 px-2 py-1 rounded text-sm">(answer1 + answer2 + answer3) ÷ 3</span></p>
                        <p>Everyone gets <span className="font-bold text-foreground">equal say (33.33%)</span>—even if some experts are clearly better!</p>
                        <p className="mt-2 text-sm text-zinc-400">Example: If 3 loan officers assess an applicant (70%, 80%, 75%), the team says 75%. Fair, but treats all assessments equally even if Officer B is usually right.</p>
                      </div>
                      
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <p className="font-bold text-emerald-400 text-lg mb-2">📗 Stacking (Smart Supervisor):</p>
                        <p className="mb-2">A supervisor (<span className="font-bold text-primary text-xl">{methodData?.meta_learner}</span>) watches all the loan officers and learns who to trust:</p>
                        <p className="font-mono bg-zinc-800 px-3 py-2 rounded text-sm my-2">Final = 20%×opinion1 + 60%×opinion2 + 20%×opinion3</p>
                        <p className="mb-2">The supervisor <span className="font-bold text-foreground">chooses these percentages</span> by seeing thousands of past applications!</p>
                        <p className="text-sm text-zinc-400">Example: Supervisor notices Detail Expert is amazing at high-income applicants (60% trust) but Pattern Finder is better at moderate-income applicants (60% trust for that case). It adjusts who to listen to!</p>
                      </div>
                      
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="font-bold text-foreground text-lg mb-2">🎯 Why Stacking Usually Wins:</p>
                        <p>Imagine you're approving a loan. Would you trust assessments equally from: (1) a junior analyst, (2) a senior underwriter, (3) an AI model? NO! You'd weight the senior underwriter's opinion more heavily.</p>
                        <p className="mt-2">That's Stacking—it figures out <span className="font-bold text-primary">who's the expert in each situation</span> instead of treating everyone the same. Usually 5-15% more accurate!</p>
                      </div>
                    </>
                  )
                ) : (
                  <p>
                    {isConcrete ? (
                      <>
                        Just like consulting multiple engineers gives you a better design, combining different prediction models
                        gives us more accurate results. Each model has its strengths, and by <span className="font-bold text-foreground">voting together</span>, they cover each
                        other's weaknesses. This is called{" "}
                        <span className="font-bold text-primary text-xl">
                        ensemble learning
                        </span>{" "}
                        — and it's one of the most powerful techniques in machine learning.
                      </>
                    ) : isAutomobile ? (
                      <>
                Just like asking multiple mechanics gives you a better diagnosis, combining different prediction models
                        gives us more accurate results. Each model has its strengths, and by <span className="font-bold text-foreground">voting together</span>, they cover each
                other's weaknesses. This is called{" "}
                        <span className="font-bold text-primary text-xl">
                  ensemble learning
                </span>{" "}
                        — and it's one of the most powerful techniques in machine learning.
                      </>
                    ) : (
                      <>
                Just like asking multiple loan officers gives you a better assessment, combining different prediction models
                        gives us more accurate results. Each model has its strengths, and by <span className="font-bold text-foreground">voting together</span>, they cover each
                other's weaknesses. This is called{" "}
                        <span className="font-bold text-primary text-xl">
                  ensemble learning
                </span>{" "}
                        — and it's one of the most powerful techniques in machine learning.
                      </>
                    )}
                  </p>
                )}
                </div>
                
                <div className="mt-6 p-5 rounded-xl bg-card/50 border border-primary/30">
                  <h4 className="font-bold text-base mb-3 text-foreground">🌟 Where You'll Find This In Real Life:</h4>
                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><span className="font-bold text-foreground">Netflix recommendations</span> — combines multiple algorithms to suggest shows you'll love</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><span className="font-bold text-foreground">Self-driving cars</span> — uses multiple models to make split-second safety decisions</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><span className="font-bold text-foreground">Medical diagnosis</span> — doctors often consult multiple opinions for important decisions</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span><span className="font-bold text-foreground">Credit card fraud detection</span> — catches suspicious activity by combining different detection methods</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <p className="text-base font-bold text-foreground">
                  In our case, we achieved <span className="text-primary text-xl">{formatPct(getMainMetric(ensemble))} {isClassification ? 'accuracy' : 'R² score'}</span> by letting three experts {method === 'voting' ? 'vote on' : 'work together on'} each prediction!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
