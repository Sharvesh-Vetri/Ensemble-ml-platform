"use client"

import { motion } from "framer-motion"
import { Brain, ArrowRight, TrendingUp, Layers, Zap } from "lucide-react"

interface MetaLearnerSelectorProps {
  onSelectMetaLearner: (metaLearner: string) => void
  onBack: () => void
  datasetName: string
}

// Determine if the dataset is classification or regression
const getDatasetType = (datasetName: string): 'classification' | 'regression' => {
  return datasetName === 'loan' ? 'classification' : 'regression'
}

/**
 * Presents the available meta-learner strategies for stacking ensembles and
 * communicates how each option impacts performance for the active dataset.
 */
export function MetaLearnerSelector({ onSelectMetaLearner, onBack, datasetName }: MetaLearnerSelectorProps) {
  const datasetType = getDatasetType(datasetName)
  const isClassification = datasetType === 'classification'
  return (
    <div className="min-h-screen w-full py-12">
      {/* Header */}
      <header className="w-full border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl sticky top-0 z-50 mb-12">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  Ensemble ML Platform
                </h1>
                <p className="text-sm text-zinc-400 font-medium mt-0.5">Choose Your Meta-Learner</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Method Selection</span>
        </motion.button>

        {/* Title Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold mb-6">
              <Layers className="w-4 h-4" />
              <span>{isClassification ? 'Stacking Classifier' : 'Stacking Regressor'}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Choose Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Meta-Learner
              </span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed"
          >
            The <span className="text-emerald-400 font-semibold">meta-learner</span> is the "supervisor" that learns how to best combine the 3 base model predictions. 
            <br />
            <span className="text-white font-semibold">NOT simple averaging</span> - it learns optimal weights!
          </motion.p>
        </div>

        {/* Meta-Learner Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Linear Regression Meta-Learner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onSelectMetaLearner("linear")}
            className="group relative h-[460px] rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute top-6 right-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-blue-400" />
              </div>
            </div>

            <div className="relative p-6 flex flex-col h-full pt-24">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Linear Regression
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Simple & Interpretable</p>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Learns linear weights: <code className="text-emerald-400">w₁×pred₁ + w₂×pred₂ + w₃×pred₃</code>
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Fast training</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Easy to interpret weights</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Stable predictions</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <span className="text-xs font-semibold text-blue-400">Choose Linear</span>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Random Forest Meta-Learner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onSelectMetaLearner("random_forest")}
            className="group relative h-[460px] rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute top-6 right-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-7 h-7 text-emerald-400" />
              </div>
            </div>

            <div className="relative p-6 flex flex-col h-full pt-24">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  Random Forest
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Powerful & Adaptive</p>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Learns complex non-linear relationships between predictions.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Captures non-linear patterns</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Robust to overfitting</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Usually best accuracy</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <span className="text-xs font-semibold text-emerald-400">Choose Forest</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* XGBoost Meta-Learner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => onSelectMetaLearner("xgboost")}
            className="group relative h-[460px] rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute top-6 right-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-violet-400" />
              </div>
            </div>

            <div className="relative p-6 flex flex-col h-full pt-24">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                  XGBoost
                </h3>
                <p className="text-zinc-500 text-xs mb-4">Advanced & Optimized</p>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Gradient boosting with sophisticated optimization.
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-violet-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Sequential error correction</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-violet-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Handles complex patterns</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 flex-shrink-0 mt-0.5">
                      <span className="text-violet-400 text-xs">✓</span>
                    </div>
                    <div className="text-xs text-zinc-400">Often competition-winning</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <span className="text-xs font-semibold text-violet-400">Choose XGBoost</span>
                <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 max-w-4xl mx-auto p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">How Meta-Learning Works</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Instead of simply averaging predictions (Voting), the meta-learner <span className="text-emerald-400 font-semibold">learns from the base models' predictions</span>. 
                It might discover that Random Forest is best for high values, while Linear Regression is best for low values, 
                and combine them intelligently with learned weights like <code className="text-white">0.2×linear + 0.5×rf + 0.3×xgb</code> instead of <code className="text-zinc-500">0.33×linear + 0.33×rf + 0.33×xgb</code>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

