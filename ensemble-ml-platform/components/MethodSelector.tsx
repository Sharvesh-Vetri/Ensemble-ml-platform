"use client"

import { motion } from "framer-motion"
import { Users, Layers, ArrowRight, TrendingUp, Network } from "lucide-react"

interface MethodSelectorProps {
  onSelectMethod: (method: string) => void
  onBack: () => void
  datasetName: string
}

// Determine if the dataset is classification or regression
const getDatasetType = (datasetName: string): 'classification' | 'regression' => {
  return datasetName === 'loan' ? 'classification' : 'regression'
}

// Get industry-specific insights for each dataset
const getIndustryInsight = (datasetName: string): string => {
  switch(datasetName) {
    case 'automobile':
      return "🚗 In the automotive industry, car manufacturers use voting when quick decisions are needed (e.g., production line defect detection). They prefer stacking when accuracy is critical for long-term cost optimization, as the meta-learner can better balance fuel efficiency predictions across different vehicle types.";
    case 'concrete':
      return "🏗️ In construction and civil engineering, voting methods work well for routine quality checks where safety margins are built in. Stacking is preferred for large infrastructure projects where precise concrete strength predictions save millions—the meta-learner learns project-specific patterns better than simple averaging.";
    case 'loan':
      return "🏦 In banking and finance, voting classifiers provide fair decisions with explainability (important for regulatory compliance). Stacking classifiers are used for critical lending decisions because the meta-learner adapts to fraud patterns and market conditions, reducing default risk more effectively than fixed voting rules.";
    default:
      return "";
  }
};

/**
 * Allows users to compare and choose between Voting vs Stacking ensembles
 * for the currently selected dataset while surfacing contextual insights.
 */
export function MethodSelector({ onSelectMethod, onBack, datasetName }: MethodSelectorProps) {
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
                <p className="text-sm text-zinc-400 font-medium mt-0.5">Choose Your Ensemble Method</p>
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
          <span className="text-sm font-medium">Back to Datasets</span>
        </motion.button>

        {/* Title Section */}
        <div className="text-center space-y-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                Choose Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Ensemble Method
              </span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            Selected dataset: <span className="text-white font-semibold capitalize">{datasetName}</span>
          </motion.p>
        </div>

        {/* Industry Insights */}
        {getIndustryInsight(datasetName) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12 p-6 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 backdrop-blur-sm"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">💡 Real-World Insights</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {getIndustryInsight(datasetName)}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Method Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Voting Method Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onSelectMethod("voting")}
            className="group relative h-[500px] rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            {/* Gradient Accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Icon */}
            <div className="absolute top-6 right-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>

              <div className="relative p-8 flex flex-col h-full pt-24">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {isClassification ? 'Voting Classifier' : 'Voting Regressor'}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {isClassification 
                    ? 'Combines predictions from multiple classifiers through majority voting. Like asking three experts and choosing the most common answer.'
                    : 'Simple averaging of predictions from multiple models. Like asking three experts and taking the average of their answers.'
                  }
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Democratic Decision</div>
                      <div className="text-xs text-zinc-500">Equal weight to all models</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <Users className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Straightforward</div>
                      <div className="text-xs text-zinc-500">Easy to understand and interpret</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 flex-shrink-0 mt-0.5">
                      <Network className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Robust</div>
                      <div className="text-xs text-zinc-500">Reduces overfitting through averaging</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <span className="text-sm font-semibold text-blue-400">Explore Voting</span>
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          {/* Stacking Method Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onSelectMethod("stacking")}
            className="group relative h-[500px] rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            {/* Gradient Accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Icon */}
            <div className="absolute top-6 right-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="relative p-8 flex flex-col h-full pt-24">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {isClassification ? 'Stacking Classifier' : 'Stacking Regressor'}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Intelligent meta-learning that learns the optimal way to combine model predictions. A supervisor learns from expert opinions.
                </p>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <Layers className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Meta-Learning</div>
                      <div className="text-xs text-zinc-500">Learns optimal model weighting</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Higher Accuracy</div>
                      <div className="text-xs text-zinc-500">Often outperforms voting</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                      <Network className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Adaptive</div>
                      <div className="text-xs text-zinc-500">Adjusts weights based on performance</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6 flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <span className="text-sm font-semibold text-emerald-400">Explore Stacking</span>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

