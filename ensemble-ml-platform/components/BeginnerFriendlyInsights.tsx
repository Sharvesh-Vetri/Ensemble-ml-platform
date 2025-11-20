"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, TrendingUp, Target, Zap, Sparkles } from "lucide-react"

interface FeatureInsights {
  most_important_feature?: string
  high_scenario?: {
    best_expert?: string
    wins: Record<string, number>
  }
  low_scenario?: {
    best_expert?: string
    wins: Record<string, number>
  }
  median_value?: number
}

interface CrossValidation {
  voting: {
    mean_r2: number
    std_r2: number
    all_scores: number[]
  }
  stacking: {
    mean_r2: number
    std_r2: number
    all_scores: number[]
  }
  statistical_test: {
    is_significant: boolean
    p_value: number
  }
}

interface BeginnerFriendlyInsightsProps {
  featureInsights?: FeatureInsights
  crossValidation?: CrossValidation
  isConcrete: boolean
  isAutomobile: boolean
  isLoan: boolean
  isClassification: boolean
  method: string
}

export function BeginnerFriendlyInsights({ 
  featureInsights, 
  crossValidation, 
  isConcrete, 
  isAutomobile,
  isLoan,
  isClassification,
  method 
}: BeginnerFriendlyInsightsProps) {
  if (!featureInsights || !crossValidation) return null

  const mostImportantFeature = featureInsights.most_important_feature?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const highExpert = featureInsights.high_scenario?.best_expert || ''
  const lowExpert = featureInsights.low_scenario?.best_expert || ''
  const medianValue = featureInsights.median_value?.toFixed(2) || ''

  const resolveExpertWinKey = (expert: string) => {
    const normalized = expert?.toLowerCase() || ''
    if (normalized.includes('logistic')) return 'logistic'
    if (normalized.includes('linear')) return 'linear'
    if (normalized.includes('random')) return 'rf'
    if (normalized.includes('forest')) return 'rf'
    if (normalized.includes('xg')) return 'xgb'
    return normalized
  }

  const isSignificant = crossValidation.statistical_test?.is_significant
  const methodName = method === "stacking" ? "Stacking" : "Voting"
  const otherMethodName = method === "stacking" ? "Voting" : "Stacking"

  return (
    <div className="space-y-8">
      {/* Which Expert Wins When? */}
      <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-emerald-500" />
            🤔 Which Expert Wins When?
          </CardTitle>
          <CardDescription className="text-base">
            Not all experts are good at everything! Let's see who's the champion in different situations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-card rounded-xl border-2 border-emerald-500/20">
            <h3 className="text-lg font-bold mb-4 text-foreground">
              📊 Most Important Factor: <span className="text-emerald-500">{mostImportantFeature}</span>
            </h3>
            <p className="text-muted-foreground mb-4">
              Imagine sorting {isConcrete ? 'concrete samples' : isAutomobile ? 'cars' : 'loan applications'} into two piles: <span className="font-bold">high {mostImportantFeature}</span> and <span className="font-bold">low {mostImportantFeature}</span>. 
              Let's see which expert gives the best advice for each pile!
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* High Scenario */}
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h4 className="font-bold text-blue-400">High {mostImportantFeature}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isConcrete ? `When ${mostImportantFeature} is above ${medianValue}` : `When ${mostImportantFeature} is above ${medianValue}`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🏆</span>
                  <div className="text-right">
                    <p className="font-bold text-white">{highExpert}</p>
                    <p className="text-xs text-blue-400">Most Accurate</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500/20 text-xs text-muted-foreground">
                  Won {featureInsights.high_scenario?.wins?.[resolveExpertWinKey(highExpert)] ?? 0} times
                </div>
              </div>

              {/* Low Scenario */}
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h4 className="font-bold text-purple-400">Low {mostImportantFeature}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {isConcrete ? `When ${mostImportantFeature} is ${medianValue} or below` : `When ${mostImportantFeature} is ${medianValue} or below`}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🏆</span>
                  <div className="text-right">
                    <p className="font-bold text-white">{lowExpert}</p>
                    <p className="text-xs text-purple-400">Most Accurate</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-muted-foreground">
                  Won {featureInsights.low_scenario?.wins?.[resolveExpertWinKey(lowExpert)] ?? 0} times
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                What This Means:
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {highExpert === lowExpert ? (
                  `${highExpert} is the champion for BOTH scenarios! It's consistently the best expert.`
                ) : (
                  `Different experts are better at different things! ${highExpert} excels with high ${mostImportantFeature}, while ${lowExpert} is better with low ${mostImportantFeature}. That's why combining them is so powerful!`
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Are We Sure? Cross-Validation */}
      <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle2 className="h-6 w-6 text-blue-500" />
            🎯 Are We Sure {methodName} Is Better?
          </CardTitle>
          <CardDescription className="text-base">
            Instead of testing once, we tested <span className="font-bold">5 times</span> with different data to make sure we're not just lucky!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-card rounded-xl border-2 border-blue-500/20">
            <h3 className="text-lg font-bold mb-4">🧪 The Reliability Test</h3>
            <p className="text-muted-foreground mb-6">
              Imagine flipping a coin. If you flip it once and get heads, you can't be sure it's a fair coin. 
              But if you flip it <span className="font-bold">100 times</span> and get 50 heads, now you're confident!
              <br/><br/>
              We did the same thing here: tested our models <span className="font-bold text-blue-400">5 times</span> with different data samples.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Voting Results */}
              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-blue-400">
                    {isClassification ? 'Voting Classifier' : 'Voting Regressor'}
                  </h4>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    Simple Average
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Average Score (5 tests)</p>
                    <p className="text-3xl font-bold text-white">
                      {(crossValidation.voting.mean_r2 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Consistency</p>
                    <p className="text-lg font-semibold text-blue-400">
                      ±{(crossValidation.voting.std_r2 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="pt-3 border-t border-blue-500/20">
                    <p className="text-xs text-muted-foreground mb-1">All 5 Test Scores:</p>
                    <div className="flex flex-wrap gap-1">
                      {crossValidation.voting.all_scores.map((score: number, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {(score * 100).toFixed(1)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stacking Results */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-xl border border-emerald-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-emerald-400">
                    {isClassification ? 'Stacking Classifier' : 'Stacking Regressor'}
                  </h4>
                  <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                    Smart Supervisor
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Average Score (5 tests)</p>
                    <p className="text-3xl font-bold text-white">
                      {(crossValidation.stacking.mean_r2 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Consistency</p>
                    <p className="text-lg font-semibold text-emerald-400">
                      ±{(crossValidation.stacking.std_r2 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="pt-3 border-t border-emerald-500/20">
                    <p className="text-xs text-muted-foreground mb-1">All 5 Test Scores:</p>
                    <div className="flex flex-wrap gap-1">
                      {crossValidation.stacking.all_scores.map((score: number, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {(score * 100).toFixed(1)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistical Significance */}
            <div className={`mt-6 p-5 rounded-xl border-2 ${
              isSignificant 
                ? 'bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30' 
                : 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30'
            }`}>
              <div className="flex items-start gap-3">
                {isSignificant ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                )}
                <div>
                  <h4 className={`font-bold text-lg mb-2 ${isSignificant ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isSignificant ? '✅ Yes, We\'re 95% Sure!' : '⚠️ Results Are Too Close'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {isSignificant ? (
                      <>
                        After testing 5 times, we're <span className="font-bold text-green-400">95% confident</span> that {methodName} really is better than {otherMethodName}. 
                        This isn't just luck—the difference is <span className="font-bold">real and repeatable</span>!
                        <br/><br/>
                        <span className="text-xs text-muted-foreground">
                          (Statistical p-value: {crossValidation.statistical_test.p_value.toFixed(4)} &lt; 0.05)
                        </span>
                      </>
                    ) : (
                      <>
                        After testing 5 times, the difference between {methodName} and {otherMethodName} is <span className="font-bold text-yellow-400">too small</span> to be sure. 
                        They're pretty much <span className="font-bold">equally good</span> for this dataset!
                        <br/><br/>
                        <span className="text-xs text-muted-foreground">
                          (Statistical p-value: {crossValidation.statistical_test.p_value.toFixed(4)} ≥ 0.05)
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p className="text-sm font-bold text-blue-400 mb-2">💡 What "95% Confident" Means:</p>
              <p className="text-sm text-muted-foreground">
                If you ran this test 100 times, at least 95 times you'd get the same result. That's like saying "I'm 95 out of 100 sure this isn't just random chance!"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


