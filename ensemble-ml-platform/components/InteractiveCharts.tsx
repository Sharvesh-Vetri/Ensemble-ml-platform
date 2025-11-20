"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList } from 'recharts'
import { TrendingUp, Target, Zap, Users } from "lucide-react"

interface InteractiveChartsProps {
  featureImportance: Record<string, number>
  predictions: Array<{
    actual: number
    predicted: number
    linear_reg?: number
    logistic_reg?: number
    random_forest: number
    xgboost: number
  }>
  baseModels: {
    [key: string]: {
      r2_score?: number
      accuracy?: number
      rmse?: number
      mae?: number
      precision?: number
      recall?: number
      f1_score?: number
    }
  }
  ensemblePerformance: {
    r2_score?: number
    accuracy?: number
    rmse?: number
    mae?: number
    precision?: number
    recall?: number
    f1_score?: number
  }
  isConcrete: boolean
  isAutomobile: boolean
  isLoan: boolean
  isClassification: boolean
  themeColors: any
  visualizations?: any
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 bg-zinc-800" />
        <Skeleton className="h-4 w-1/2 bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-[350px] w-full bg-zinc-800" />
      </div>
    </div>
  )
}

/**
 * Renders the interactive chart grid (feature importance, predictions,
 * residuals, etc.) and adapts layouts for regression vs classification flows.
 */
export function InteractiveCharts({ 
  featureImportance, 
  predictions, 
  baseModels,
  ensemblePerformance,
  isConcrete,
  isAutomobile,
  isLoan,
  isClassification,
  themeColors,
  visualizations
}: InteractiveChartsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Simulate loading for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])
  
  // Define primary color first
  const primaryColor = themeColors.primary === "red-500" ? "#ef4444" : themeColors.primary === "yellow-500" ? "#eab308" : "#8b5cf6"

  // Robust numeric coercion (some payloads may provide strings)
  // Preserves full precision - rounding only happens for display
  const toNum = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // Helper function to get main metric
  const getMainMetric = (modelData: any) => {
    if (isClassification) {
      return modelData?.accuracy || modelData?.test_accuracy || 0
    }
    return modelData?.r2_score || 0
  }

  // Two-decimal percentage formatter for UI display
  const formatPct = (v?: number) =>
    Number.isFinite(v as number) ? `${(Number(v) * 100).toFixed(2)}%` : '0.00%'

  // Prepare feature importance data
  // Preserves full precision internally, rounds only for display
  // For classification, featureImportance may be empty (it's in visualizations instead)
  const featureData = featureImportance && Object.keys(featureImportance).length > 0
    ? Object.entries(featureImportance)
        .map(([name, value]) => {
          const imp = toNum(value)
          return {
            name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            importance: Number((imp * 100).toFixed(1)), // Display: 1 decimal place
            fullImportance: imp // Internal: full precision
          }
        })
        .sort((a, b) => b.fullImportance - a.fullImportance) // Sort by full precision
        .slice(0, 8) // Top 8 features
    : []

  // Prepare prediction scatter data
  // Values rounded to 2 decimal places for display, but calculations use full precision
  const scatterData = predictions.slice(0, 20)
    .map((pred, idx) => {
      const actualVal = toNum((pred as any)?.actual)
      const predictedVal = toNum((pred as any)?.predicted)
      if (!Number.isFinite(actualVal) || !Number.isFinite(predictedVal)) return null
      return {
        name: `Sample ${idx + 1}`,
        actual: Number(actualVal.toFixed(2)), // Display: 2 decimals
        predicted: Number(predictedVal.toFixed(2)), // Display: 2 decimals
        error: Number(Math.abs(actualVal - predictedVal).toFixed(2)) // Display: 2 decimals
      }
    })
    .filter((d): d is { name: string; actual: number; predicted: number; error: number } => d !== null)
  
  const hasLogisticBase = Boolean(baseModels?.['Logistic Regression'])
  const primaryModelKey = isClassification ? (hasLogisticBase ? 'Logistic Regression' : 'Linear Regression') : 'Linear Regression'
  const primaryModelLabel = primaryModelKey
  const primaryPredictionKey = primaryModelKey === 'Linear Regression' ? 'linear_reg' : 'logistic_reg'
  const alternatePredictionKey = primaryPredictionKey === 'linear_reg' ? 'logistic_reg' : 'linear_reg'
  const toDisplayNumber = (value: any) => Number(toNum(value).toFixed(2))
  const getPrimaryExpertValue = (pred: any) => {
    if (pred && Object.prototype.hasOwnProperty.call(pred, primaryPredictionKey)) {
      return toNum((pred as any)?.[primaryPredictionKey])
    }
    return toNum((pred as any)?.[alternatePredictionKey])
  }
  const errorThreshold = isClassification ? 10 : (isConcrete ? 5 : 2.5)

  console.log('[InteractiveCharts] Scatter data:', scatterData)
  console.log('[InteractiveCharts] Predictions:', predictions)
  console.log('[InteractiveCharts] baseModels received:', baseModels)
  console.log(`[InteractiveCharts] Primary model (${primaryModelLabel}) data:`, baseModels?.[primaryModelKey])
  console.log('[InteractiveCharts] ensemblePerformance:', ensemblePerformance)

  // Prepare performance comparison data with quality indicators
  const baseModelConfigs = [
    { key: primaryModelKey, label: primaryModelLabel, color: '#64748b' },
    { key: 'Random Forest', label: 'Random Forest', color: '#64748b' },
    { key: 'XGBoost', label: 'XGBoost', color: '#64748b' },
  ]

  const performanceData = [
    ...baseModelConfigs
      .filter(({ key }) => baseModels && baseModels[key])
      .map(({ key, label, color }) => {
        const metrics = baseModels[key]
        const mainMetricValue = toNum(getMainMetric(metrics))
        return {
          model: label,
          mainMetric: Number(mainMetricValue.toFixed(2)),
          r2: toDisplayNumber(metrics?.r2_score),
          accuracy: toDisplayNumber(metrics?.accuracy),
          rmse: toDisplayNumber(metrics?.rmse),
          mae: toDisplayNumber(metrics?.mae),
          precision: toDisplayNumber(metrics?.precision),
          recall: toDisplayNumber(metrics?.recall),
          f1: toDisplayNumber(metrics?.f1_score),
          color,
        }
      }),
    {
      model: 'Ensemble',
      mainMetric: Number(toNum(getMainMetric(ensemblePerformance)).toFixed(2)),
      r2: toDisplayNumber(ensemblePerformance.r2_score),
      accuracy: toDisplayNumber(ensemblePerformance.accuracy),
      rmse: toDisplayNumber(ensemblePerformance.rmse),
      mae: toDisplayNumber(ensemblePerformance.mae),
      precision: toDisplayNumber(ensemblePerformance.precision),
      recall: toDisplayNumber(ensemblePerformance.recall),
      f1: toDisplayNumber(ensemblePerformance.f1_score),
      color: primaryColor
    }
  ]

  // Helper function to get performance quality
  const getPerformanceQuality = (metric: string, value: number) => {
    if (metric === 'r2' || metric === 'accuracy' || metric === 'mainMetric') {
      if (value >= 0.85) return { label: 'Excellent', color: '#10b981', icon: '🏆' }
      if (value >= 0.75) return { label: 'Good', color: '#f59e0b', icon: '✓' }
      return { label: 'Fair', color: '#ef4444', icon: '⚠' }
    }
    if (metric === 'precision' || metric === 'recall' || metric === 'f1') {
      if (value >= 0.85) return { label: 'Excellent', color: '#10b981', icon: '🏆' }
      if (value >= 0.75) return { label: 'Good', color: '#f59e0b', icon: '✓' }
      return { label: 'Fair', color: '#ef4444', icon: '⚠' }
    }
    if (metric === 'rmse' || metric === 'mae') {
      const threshold = isConcrete ? (metric === 'rmse' ? 8 : 6) : (metric === 'rmse' ? 3 : 2)
      if (value <= threshold) return { label: 'Excellent', color: '#10b981', icon: '🏆' }
      if (value <= threshold * 1.5) return { label: 'Good', color: '#f59e0b', icon: '✓' }
      return { label: 'Fair', color: '#ef4444', icon: '⚠' }
    }
    return { label: 'Unknown', color: '#6b7280', icon: '?' }
  }

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Section 1: Understanding the Data */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <div className="h-8 w-1 bg-primary rounded-full"></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Understanding the Data</h2>
            <p className="text-sm text-zinc-400">What features drive the predictions?</p>
          </div>
        </div>

      {/* Top visual: For classification, show confusion matrix if available; otherwise fall back to feature importances */}
      {isClassification && visualizations?.confusion_matrix ? (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Confusion Matrix
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Visual breakdown of correct vs. incorrect predictions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <img
                  src={`data:image/png;base64,${visualizations.confusion_matrix}`}
                  alt="Confusion matrix"
                  className="w-full rounded-lg border border-zinc-800"
                />
              </div>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <p className="font-semibold text-white mb-1">How to read this</p>
                  <p>Rows are the <span className="font-semibold">actual</span> class and columns are the <span className="font-semibold">predicted</span> class.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <p className="font-semibold text-white mb-1">Green = better</p>
                  <p>Darker cells on the diagonal mean more correct predictions. Off‑diagonal cells are mistakes.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <p className="font-semibold text-white mb-1">Quick glossary</p>
                  <ul className="list-disc list-inside text-zinc-400">
                    <li>True Positive: predicted "Approved" and it was Approved.</li>
                    <li>True Negative: predicted "Rejected" and it was Rejected.</li>
                    <li>False Positive: predicted Approved but it was Rejected.</li>
                    <li>False Negative: predicted Rejected but it was Approved.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xs text-zinc-400">Accuracy</div>
                <div className="text-lg font-bold text-emerald-400">{formatPct(toNum(ensemblePerformance.accuracy))}</div>
              </div>
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xs text-zinc-400">Precision</div>
                <div className="text-lg font-bold text-emerald-400">{Number(toNum(ensemblePerformance.precision)*100).toFixed(2)}%</div>
              </div>
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xs text-zinc-400">Recall</div>
                <div className="text-lg font-bold text-emerald-400">{Number(toNum(ensemblePerformance.recall)*100).toFixed(2)}%</div>
              </div>
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xs text-zinc-400">F1 Score</div>
                <div className="text-lg font-bold text-emerald-400">{Number(toNum(ensemblePerformance.f1_score)*100).toFixed(2)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : featureData.length > 0 ? (
      /* Feature Importance Interactive Bar Chart */
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Feature Importance
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Which features have the most influence on predictions? {isMobile ? 'Tap' : 'Hover over'} bars for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 350}>
            <BarChart data={featureData} margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 0 : 20, bottom: isMobile ? 60 : 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={isMobile ? 80 : 100}
                tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis 
                label={!isMobile ? { value: 'Importance (%)', angle: -90, position: 'insideLeft', fill: '#a1a1aa', fontSize: 12 } as any : undefined}
                tick={{ fill: '#cbd5e1', fontSize: isMobile ? 11 : 12 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                wrapperStyle={{ outline: 'none', background: 'transparent' }}
                contentStyle={{ 
                  background: '#18181b',
                  border: 'none',
                  borderRadius: '12px',
                  padding: 0,
                  boxShadow: 'none'
                }}
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div style={{
                        background: '#18181b',
                        border: `2px solid ${primaryColor}`,
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0), 0 20px 25px -5px rgba(0, 0, 0, 0.8)`,
                        minWidth: '180px',
                        color: '#ffffff'
                      }}>
                        <p style={{ 
                          fontWeight: 'bold', 
                          color: '#ffffff', 
                          fontSize: '16px', 
                          marginBottom: '12px' 
                        }}>
                          {data.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: primaryColor 
                          }}></div>
                          <p style={{ 
                            color: primaryColor, 
                            fontWeight: '600', 
                            fontSize: '24px',
                            margin: 0
                          }}>
                            {data.importance}%
                          </p>
                        </div>
                        <p style={{ 
                          color: '#9ca3af', 
                          fontSize: '12px', 
                          marginTop: '8px',
                          marginBottom: 0
                        }}>
                          Feature Importance
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey="importance" 
                fill={primaryColor}
                radius={[6, 6, 0, 0]}
                animationDuration={900}
                barSize={isMobile ? 24 : 30}
              >
                {featureData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`${primaryColor}`}
                    stroke="#0b0b0c"
                    strokeOpacity={0.2}
                  />
                ))}
                <LabelList dataKey="importance" position="top" formatter={(v: any) => `${v}%`} style={{ fill: '#e5e7eb', fontSize: isMobile ? 10 : 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
          <p className="text-xs md:text-sm text-muted-foreground text-center mt-4">
            💡 <span className="font-bold">Tip:</span> The model pays most attention to the tallest bars when making predictions!
          </p>
        </CardContent>
      </Card>
      ) : null}
      </div>

      {/* Section 2: Prediction Accuracy */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <div className="h-8 w-1 bg-primary rounded-full"></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Prediction Accuracy</h2>
            <p className="text-sm text-zinc-400">How well do the models perform?</p>
          </div>
        </div>

      {/* Predictions vs Actual Scatter Plot (regression only) */}
      {!isClassification && (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            How Accurate Are The Predictions?
          </CardTitle>
          <CardDescription className="text-sm">
            Each dot is a prediction. {isMobile ? 'Tap' : 'Hover'} to see details. Closer to the diagonal line = more accurate!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
            ) : scatterData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <ScatterChart margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 0 : 20, bottom: isMobile ? 30 : 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                dataKey="actual" 
                name="Actual" 
                label={!isMobile ? { value: `Actual ${isConcrete ? 'Strength (MPa)' : isAutomobile ? 'MPG' : 'Approval (%)'}`, position: 'bottom', fill: '#9ca3af' } : undefined}
                tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis 
                type="number" 
                dataKey="predicted" 
                name="Predicted"
                label={!isMobile ? { value: `Predicted ${isConcrete ? 'Strength (MPa)' : isAutomobile ? 'MPG' : 'Approval (%)'}`, angle: -90, position: 'insideLeft', fill: '#9ca3af' } : undefined}
                tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip 
                wrapperStyle={{ outline: 'none', background: 'transparent' }}
                contentStyle={{ 
                  background: '#18181b',
                  border: 'none',
                  borderRadius: '12px',
                  padding: 0,
                  boxShadow: 'none'
                }}
                cursor={{ strokeDasharray: '3 3', stroke: primaryColor, strokeWidth: 2 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const isAccurate = parseFloat(data.error) < errorThreshold
                    return (
                      <div style={{
                        background: '#18181b',
                        border: `2px solid ${primaryColor}`,
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: `0 0 0 9999px rgba(0,0,0,0), 0 20px 25px -5px rgba(0, 0, 0, 0.8)`,
                        minWidth: '220px',
                        color: '#ffffff'
                      }}>
                        <p style={{ 
                          fontWeight: 'bold', 
                          color: '#ffffff', 
                          fontSize: '15px', 
                          marginBottom: '12px',
                          marginTop: 0
                        }}>
                          {data.name}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>Actual:</span>
                            <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '16px' }}>
                              {data.actual} {isConcrete ? 'MPa' : isAutomobile ? 'MPG' : '%'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>Predicted:</span>
                            <span style={{ color: primaryColor, fontWeight: '600', fontSize: '16px' }}>
                              {data.predicted} {isConcrete ? 'MPa' : isAutomobile ? 'MPG' : '%'}
                            </span>
                          </div>
                          <div style={{ 
                            paddingTop: '8px', 
                            borderTop: '1px solid #3f3f46',
                            marginTop: '4px',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>Error:</span>
                            <span style={{ 
                              color: isAccurate ? '#4ade80' : '#fb923c', 
                              fontWeight: 'bold', 
                              fontSize: '16px' 
                            }}>
                              ±{data.error} {isConcrete ? 'MPa' : isAutomobile ? 'MPG' : '%'}
                            </span>
                          </div>
                        </div>
                        {isAccurate && (
                          <div style={{ 
                            marginTop: '8px', 
                            paddingTop: '8px', 
                            borderTop: '1px solid #3f3f46' 
                          }}>
                            <p style={{ 
                              color: '#4ade80', 
                              fontSize: '12px', 
                              fontWeight: '500',
                              margin: 0
                            }}>
                              ✓ Great prediction!
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter 
                name="Predictions" 
                data={scatterData} 
                fill={primaryColor}
                animationDuration={1000}
              >
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={parseFloat(entry.error) < errorThreshold ? '#10b981' : primaryColor}
                    opacity={0.7}
                  />
                ))}
              </Scatter>
              {/* Perfect prediction line */}
              <Scatter 
                name="Perfect Predictions" 
                data={[
                  { actual: Math.min(...scatterData.map(d => d.actual)), predicted: Math.min(...scatterData.map(d => d.actual)) },
                  { actual: Math.max(...scatterData.map(d => d.actual)), predicted: Math.max(...scatterData.map(d => d.actual)) }
                ]}
                fill="#6b7280"
                line={{ stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5 5' }}
                shape="line"
              />
            </ScatterChart>
          </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-zinc-400">
              {isClassification ? 'No classification samples available yet.' : 'No regression points available for this dataset/method.'}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-4 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Great Prediction (low error)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              <span className="text-muted-foreground">Good Prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-zinc-500" style={{ borderTop: '2px dashed #6b7280' }}></div>
              <span className="text-muted-foreground">Perfect Line</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Model Performance Showdown - Clean Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Metric (R² Score (Accuracy) or Accuracy) */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              {isClassification ? 'Accuracy' : 'R² Score (Accuracy)'}
            </CardTitle>
            <CardDescription className="text-xs">
              Higher = better predictions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-3">
                {performanceData.map((model, idx) => {
                  const quality = getPerformanceQuality('mainMetric', model.mainMetric)
                  const isEnsemble = model.model === 'Ensemble'
                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isEnsemble ? 'text-white' : 'text-zinc-300'}`}>
                          {model.model}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isEnsemble ? 'text-white' : 'text-zinc-400'}`}>
                            {isClassification ? formatPct(model.mainMetric) : model.mainMetric}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{quality.icon}</span>
                            <span className="text-xs font-medium" style={{ color: quality.color }}>
                              {quality.label}
                            </span>
                          </div>
                        </div>
                      </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden" aria-label="r2-bar">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isEnsemble ? 'shadow-lg' : ''}`}
                          style={{ 
                    width: `${Math.max(2, Math.min(100, model.mainMetric * 100))}%`, 
                            backgroundColor: isEnsemble ? primaryColor : '#64748b',
                            boxShadow: isEnsemble ? `0 0 10px ${primaryColor}40` : 'none'
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RMSE (Root Mean Square Error) - Only for Regression */}
        {!isClassification && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              RMSE (Error)
            </CardTitle>
            <CardDescription className="text-xs">
              Lower = better. Target: &lt;{isConcrete ? '8 MPa' : '3 MPG'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-3">
                {performanceData.map((model, idx) => {
                  const quality = getPerformanceQuality('rmse', model.rmse)
                  const isEnsemble = model.model === 'Ensemble'
                  const minRmse = Math.min(...performanceData.map(m => m.rmse))
                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isEnsemble ? 'text-white' : 'text-zinc-300'}`}>
                          {model.model}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isEnsemble ? 'text-white' : 'text-zinc-400'}`}>
                            {model.rmse} {isConcrete ? 'MPa' : 'MPG'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{quality.icon}</span>
                            <span className="text-xs font-medium" style={{ color: quality.color }}>
                              {quality.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden" aria-label="rmse-bar">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isEnsemble ? 'shadow-lg' : ''}`}
                          style={{ 
                            width: `${Math.max(2, Math.min(100, (minRmse / Math.max(model.rmse, 0.0001)) * 100))}%`, 
                            backgroundColor: isEnsemble ? primaryColor : '#64748b',
                            boxShadow: isEnsemble ? `0 0 10px ${primaryColor}40` : 'none'
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* MAE (Mean Absolute Error) - Only for Regression */}
        {!isClassification && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              MAE (Precision)
            </CardTitle>
            <CardDescription className="text-xs">
              Lower = more precise. Target: &lt;{isConcrete ? '6 MPa' : '2 MPG'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
                <Skeleton className="h-8 w-full bg-zinc-800" />
              </div>
            ) : (
              <div className="space-y-3">
                {performanceData.map((model, idx) => {
                  const quality = getPerformanceQuality('mae', model.mae)
                  const isEnsemble = model.model === 'Ensemble'
                  const minMae = Math.min(...performanceData.map(m => m.mae))
                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isEnsemble ? 'text-white' : 'text-zinc-300'}`}>
                          {model.model}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isEnsemble ? 'text-white' : 'text-zinc-400'}`}>
                            {model.mae} {isConcrete ? 'MPa' : 'MPG'}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{quality.icon}</span>
                            <span className="text-xs font-medium" style={{ color: quality.color }}>
                              {quality.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isEnsemble ? 'shadow-lg' : ''}`}
                          style={{ 
                            width: `${Math.max(10, Math.min(100, (minMae / Math.max(model.mae, 0.0001)) * 100))}%`, 
                            backgroundColor: isEnsemble ? primaryColor : '#64748b',
                            boxShadow: isEnsemble ? `0 0 10px ${primaryColor}40` : 'none'
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}
        
        {/* Classification Metrics - Precision & Recall */}
        {isClassification && (
          <>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  Precision
                </CardTitle>
                <CardDescription className="text-xs">
                  How many positive predictions were correct? Higher = better.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.map((model, idx) => {
                    const quality = getPerformanceQuality('precision', model.precision)
                    const isEnsemble = model.model === 'Ensemble'
                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isEnsemble ? 'text-white' : 'text-zinc-300'}`}>
                            {model.model}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isEnsemble ? 'text-white' : 'text-zinc-400'}`}>
                              {model.precision}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{quality.icon}</span>
                              <span className="text-xs font-medium" style={{ color: quality.color }}>
                                {quality.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isEnsemble ? 'shadow-lg' : ''}`}
                            style={{ 
                              width: `${model.precision * 100}%`, 
                              backgroundColor: isEnsemble ? primaryColor : '#64748b',
                              boxShadow: isEnsemble ? `0 0 10px ${primaryColor}40` : 'none'
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  F1-Score
                </CardTitle>
                <CardDescription className="text-xs">
                  Balance between precision and recall. Higher = better.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceData.map((model, idx) => {
                    const quality = getPerformanceQuality('f1', model.f1)
                    const isEnsemble = model.model === 'Ensemble'
                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isEnsemble ? 'text-white' : 'text-zinc-300'}`}>
                            {model.model}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isEnsemble ? 'text-white' : 'text-zinc-400'}`}>
                              {model.f1}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{quality.icon}</span>
                              <span className="text-xs font-medium" style={{ color: quality.color }}>
                                {quality.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isEnsemble ? 'shadow-lg' : ''}`}
                            style={{ 
                              width: `${model.f1 * 100}%`, 
                              backgroundColor: isEnsemble ? primaryColor : '#64748b',
                              boxShadow: isEnsemble ? `0 0 10px ${primaryColor}40` : 'none'
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      </div>

      {/* Section 4: Ensemble Insights */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <div className="h-8 w-1 bg-primary rounded-full"></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Ensemble Insights</h2>
            <p className="text-sm text-zinc-400">Understanding how the models work together</p>
          </div>
        </div>

      {/* Model Agreement Visualization - NEW! */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Model Agreement
          </CardTitle>
          <CardDescription className="text-base mt-2">
            When do all 3 experts agree? When do they disagree? This reveals the power of ensemble learning.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            (() => {
              // Calculate agreement levels using relative thresholds
              // Uses percentage difference relative to average value (more accurate for different scales)
              const agreementData = predictions.map(pred => {
                const values = [
                  getPrimaryExpertValue(pred),
                  toNum((pred as any)?.random_forest),
                  toNum((pred as any)?.xgboost),
                ]
                const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1)
                const maxDiff = Math.max(...values) - Math.min(...values)
                
                // Use relative percentage difference (more accurate than fixed thresholds)
                // 5% relative difference = models agree closely
                // 15% relative difference = moderate agreement
                const percentDiff = avg !== 0 ? (maxDiff / Math.abs(avg)) * 100 : 0
                
                if (percentDiff < 5) return 'all_agree'
                if (percentDiff < 15) return 'mostly_agree'
                return 'disagree'
              })
              
              const allAgree = agreementData.filter(a => a === 'all_agree').length
              const mostlyAgree = agreementData.filter(a => a === 'mostly_agree').length
              const disagree = agreementData.filter(a => a === 'disagree').length
              const total = predictions.length
              
              const agreementChartData = [
                { name: 'All 3 Agree', value: allAgree, percent: ((allAgree/total)*100).toFixed(0), color: '#10b981', icon: '🤝' },
                { name: '2 Agree', value: mostlyAgree, percent: ((mostlyAgree/total)*100).toFixed(0), color: '#f59e0b', icon: '👥' },
                { name: 'All Disagree', value: disagree, percent: ((disagree/total)*100).toFixed(0), color: '#ef4444', icon: '🤔' }
              ]
              
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {agreementChartData.map((item, idx) => (
                      <div key={idx} className="text-center p-4 rounded-lg border" style={{ 
                        backgroundColor: `${item.color}10`,
                        borderColor: `${item.color}30`
                      }}>
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <h4 className="font-bold text-white mb-1">{item.name}</h4>
                        <p className="font-bold text-2xl" style={{ color: item.color }}>
                          {item.percent}%
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {item.value} of {total} predictions
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <p className="text-sm text-zinc-300">
                      <span className="font-bold text-white">💡 Why this matters:</span> When models disagree, 
                      the ensemble can find a balanced middle ground. When they all agree, we can be more confident 
                      in the prediction. This is the power of ensemble learning!
                    </p>
                  </div>
                </div>
              )
            })()
          )}
        </CardContent>
      </Card>

      {/* Error Distribution - NEW! */}
      {!isClassification && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Error Distribution
            </CardTitle>
            <CardDescription className="text-base mt-2">
              How far off are our predictions? This histogram reveals accuracy patterns and potential biases.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              (() => {
                // Calculate errors
                const errors = predictions.map(p => toNum(p.predicted) - toNum(p.actual))
                
                // Create histogram bins
                const minError = Math.min(...errors)
                const maxError = Math.max(...errors)
                const binCount = 10
                const binSize = (maxError - minError) / binCount
                
                const bins = Array.from({ length: binCount }, (_, i) => {
                  const binStart = minError + (i * binSize)
                  const binEnd = binStart + binSize
                  const count = errors.filter(e => e >= binStart && e < binEnd).length
                  return {
                    range: `${binStart.toFixed(1)} to ${binEnd.toFixed(1)}`,
                    count: count,
                    binStart: binStart,
                    color: Math.abs(binStart + binSize/2) < binSize ? '#10b981' : 
                           Math.abs(binStart + binSize/2) < binSize * 2 ? '#f59e0b' : '#ef4444'
                  }
                })
                
                const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
                const absErrors = errors.map(e => Math.abs(e))
                const avgAbsError = absErrors.reduce((a, b) => a + b, 0) / absErrors.length
                
                return (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bins} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="range" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          label={{ value: 'Error Range', position: 'insideBottom', offset: -10, fill: '#a1a1aa' }}
                        />
                        <YAxis 
                          label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }}
                          tick={{ fill: '#cbd5e1' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#18181b',
                            border: `2px solid ${primaryColor}`,
                            borderRadius: '12px',
                            padding: '12px'
                          }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {bins.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList dataKey="count" position="top" style={{ fill: '#ffffff', fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <p className="text-xs text-zinc-400">Average Error</p>
                        <p className="text-xl font-bold" style={{ 
                          color: Math.abs(avgError) < 1 ? '#10b981' : Math.abs(avgError) < 3 ? '#f59e0b' : '#ef4444' 
                        }}>
                          {avgError > 0 ? '+' : ''}{avgError.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <p className="text-xs text-zinc-400">Avg Absolute Error</p>
                        <p className="text-xl font-bold text-primary">
                          {avgAbsError.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <p className="text-xs text-zinc-400">Error Range</p>
                        <p className="text-xl font-bold text-zinc-300">
                          {minError.toFixed(1)} to {maxError.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <p className="text-sm text-zinc-300">
                        <span className="font-bold text-white">📊 Reading this chart:</span> Errors near zero (green) are good! 
                        If most bars are centered around zero, the model is unbiased. If shifted left/right, the model 
                        consistently over or under-predicts.
                      </p>
                    </div>
                  </div>
                )
              })()
            )}
          </CardContent>
        </Card>
      )}

      {/* Prediction Confidence Bands - NEW! */}
      {!isClassification && predictions.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Prediction Confidence
            </CardTitle>
            <CardDescription className="text-base mt-2">
              How certain are we about each prediction? When models agree (green), we're more confident.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              (() => {
                const confidenceData = predictions.map((pred, idx) => {
                  const values = [toNum(pred.linear_reg), toNum(pred.random_forest), toNum(pred.xgboost)]
                  const min = Math.min(...values)
                  const max = Math.max(...values)
                  const range = max - min
                  const ensemble = toNum(pred.predicted)
                  const actual = toNum(pred.actual)
                  
                  return {
                    index: idx + 1,
                    ensemble: ensemble,
                    actual: actual,
                    min: min,
                    max: max,
                    range: range,
                    confidence: range < 2 ? 'High' : range < 5 ? 'Medium' : 'Low'
                  }
                })
                
                const highConfidence = confidenceData.filter(d => d.confidence === 'High').length
                const mediumConfidence = confidenceData.filter(d => d.confidence === 'Medium').length
                const lowConfidence = confidenceData.filter(d => d.confidence === 'Low').length
                
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-xs text-zinc-400">High Confidence</p>
                        <p className="text-2xl font-bold text-green-400">{highConfidence}</p>
                        <p className="text-xs text-zinc-500">Range &lt; 2</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <p className="text-xs text-zinc-400">Medium</p>
                        <p className="text-2xl font-bold text-yellow-400">{mediumConfidence}</p>
                        <p className="text-xs text-zinc-500">Range 2-5</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <p className="text-xs text-zinc-400">Low Confidence</p>
                        <p className="text-2xl font-bold text-red-400">{lowConfidence}</p>
                        <p className="text-xs text-zinc-500">Range &gt; 5</p>
                      </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          type="number" 
                          dataKey="index" 
                          name="Prediction #"
                          tick={{ fill: '#cbd5e1' }}
                          label={{ value: 'Prediction Number', position: 'insideBottom', offset: -10, fill: '#a1a1aa' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="ensemble" 
                          name="Value"
                          tick={{ fill: '#cbd5e1' }}
                          label={{ value: 'Predicted Value', angle: -90, position: 'insideLeft', fill: '#a1a1aa' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#18181b',
                            border: `2px solid ${primaryColor}`,
                            borderRadius: '12px',
                            padding: '12px'
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div style={{ background: '#18181b', border: `2px solid ${primaryColor}`, borderRadius: '12px', padding: '12px' }}>
                                  <p style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}>
                                    Prediction #{data.index}
                                  </p>
                                  <p style={{ color: primaryColor, fontSize: '14px' }}>
                                    Ensemble: {data.ensemble.toFixed(2)}
                                  </p>
                                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    Actual: {data.actual.toFixed(2)}
                                  </p>
                                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                    Range: {data.min.toFixed(2)} - {data.max.toFixed(2)}
                                  </p>
                                  <p style={{ 
                                    color: data.confidence === 'High' ? '#10b981' : data.confidence === 'Medium' ? '#f59e0b' : '#ef4444',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    marginTop: '4px'
                                  }}>
                                    {data.confidence} Confidence
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Scatter name="Predictions" data={confidenceData} fill={primaryColor}>
                          {confidenceData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.confidence === 'High' ? '#10b981' : entry.confidence === 'Medium' ? '#f59e0b' : '#ef4444'}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                      <p className="text-sm text-zinc-300">
                        <span className="font-bold text-white">🎯 Understanding confidence:</span> When all 3 models 
                        give similar predictions (narrow range), we can be more confident. When they disagree widely, 
                        the ensemble helps by finding a balanced middle ground, but the prediction is less certain.
                      </p>
                    </div>
                  </div>
                )
              })()
            )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* Section 5: Overall Performance */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800">
          <div className="h-8 w-1 bg-primary rounded-full"></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Overall Performance</h2>
            <p className="text-sm text-zinc-400">Final results and key metrics</p>
          </div>
        </div>

      {/* Performance Summary */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Key Takeaways
          </CardTitle>
          <CardDescription className="text-base mt-2">
            How does our ensemble compare to industry standards and individual models?
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Best Model */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-bold text-white mb-1">Champion</h4>
                <p className="text-primary font-bold text-lg">
                  {performanceData.reduce((best, current) => 
                    current.r2 > best.r2 ? current : best
                  ).model}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  R² Score (Accuracy): {performanceData.reduce((best, current) => 
                    current.r2 > best.r2 ? current : best
                  ).r2}
                </p>
              </div>

              {/* Improvement */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="text-3xl mb-2">📈</div>
                <h4 className="font-bold text-white mb-1">Improvement</h4>
                <p className="text-green-400 font-bold text-lg">
                  {((performanceData.find(m => m.model === 'Ensemble')?.r2 || 0) - 
                    Math.max(...performanceData.filter(m => m.model !== 'Ensemble').map(m => m.r2)) > 0 ? '+' : '')
                  }{(((performanceData.find(m => m.model === 'Ensemble')?.r2 || 0) - 
                    Math.max(...performanceData.filter(m => m.model !== 'Ensemble').map(m => m.r2))) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  vs best individual model
                </p>
              </div>

              {/* Industry Grade */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <div className="text-3xl mb-2">
                  {(performanceData.find(m => m.model === 'Ensemble')?.r2 || 0) >= 0.85 ? '⭐' : 
                   (performanceData.find(m => m.model === 'Ensemble')?.r2 || 0) >= 0.75 ? '✅' : '⚠️'}
                </div>
                <h4 className="font-bold text-white mb-1">Grade</h4>
                <p className="text-blue-400 font-bold text-lg">
                  {getPerformanceQuality('r2', performanceData.find(m => m.model === 'Ensemble')?.r2 || 0).label}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Industry standard
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

