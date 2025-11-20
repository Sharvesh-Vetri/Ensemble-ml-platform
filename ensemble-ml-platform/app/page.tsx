"use client"

import { useState } from "react"
import { VisualizationDashboard } from "@/components/VisualizationDashboard"
import { ProcessingStatus } from "@/components/ProcessingStatus"
import { DatasetPreview } from "@/components/DatasetPreview"
import { processDataset } from "./actions"
import { DatasetCard } from '@/components/DatasetCard'
import { MethodSelector } from '@/components/MethodSelector'
import { MetaLearnerSelector } from '@/components/MetaLearnerSelector'
import { ErrorBoundary } from "@/components/ErrorBoundary"
import type { MLResults } from '@/types'
import { toast } from 'sonner'

/**
 * Main application page component
 * 
 * Handles the complete ML visualization workflow:
 * 1. Dataset selection
 * 2. Method selection (Voting/Stacking)
 * 3. Meta-learner selection (for Stacking)
 * 4. Processing and results display
 */

export default function Home() {
  const [previewDataset, setPreviewDataset] = useState<string | null>(null)
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [selectedMetaLearner, setSelectedMetaLearner] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<MLResults | null>(null)

  const resetState = () => {
    setPreviewDataset(null)
    setSelectedDataset(null)
    setSelectedMethod(null)
    setSelectedMetaLearner(null)
    setIsProcessing(false)
    setResults(null)
  }

  const handleDatasetClick = (datasetId: string) => {
    // Show preview modal first
    setPreviewDataset(datasetId)
  }

  const handleConfirmDataset = () => {
    // Confirm dataset selection from preview
    setSelectedDataset(previewDataset)
    setPreviewDataset(null)
  }

  const handleSelectDataset = (datasetId: string) => {
    setSelectedDataset(datasetId)
    // Don't process yet - wait for method selection
  }

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method)
    // For voting, process immediately. For stacking, show meta-learner selector
    if (method === "voting") {
      handleProcess(method, "linear") // Meta-learner not used for voting
    }
  }

  const handleSelectMetaLearner = (metaLearner: string) => {
    setSelectedMetaLearner(metaLearner)
    handleProcess("stacking", metaLearner)
  }

  const handleProcess = async (method: string, metaLearner: string) => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("dataset", selectedDataset!)
      formData.append("meta_learner", metaLearner)

      const result = await processDataset(formData)

      if (!result.success) {
        throw new Error(result.error || "Processing failed")
      }

      setResults(result.data)
    } catch (error) {
      console.error("Error processing dataset:", error)
      toast.error(error instanceof Error ? error.message : "Unknown error occurred", {
        description: "Please check that Python and required packages are installed.",
        duration: 5000,
      })
      setSelectedDataset(null)
      setSelectedMethod(null)
      setSelectedMetaLearner(null)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ErrorBoundary
      onReset={resetState}
      fallbackRender={({ error, reset }) => (
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 px-6 py-16 text-center text-zinc-100">
          <div className="w-full max-w-xl space-y-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/80 px-10 py-12 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">We hit a snag</h2>
              <p className="text-sm text-zinc-400">
                {error?.message || "An unexpected error occurred while rendering this experience. Reset the story to continue exploring ensemble learning."}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex w-full items-center justify-center rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:w-auto"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex w-full items-center justify-center rounded-md border border-zinc-700/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 sm:w-auto"
              >
                Reset Story
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <div className="min-h-screen w-full">
        {/* Method Selection Screen */}
        {selectedDataset && !selectedMethod && !isProcessing && !results && (
          <MethodSelector
            onSelectMethod={handleSelectMethod}
            onBack={() => setSelectedDataset(null)}
            datasetName={selectedDataset}
          />
        )}

        {/* Meta-Learner Selection Screen (only for Stacking) */}
        {selectedDataset && selectedMethod === "stacking" && !selectedMetaLearner && !isProcessing && !results && (
          <MetaLearnerSelector
            onSelectMetaLearner={handleSelectMetaLearner}
            onBack={() => setSelectedMethod(null)}
            datasetName={selectedDataset}
          />
        )}

        {/* Hero Header */}
        {!selectedDataset && !isProcessing && !results && (
          <>
            <header className="w-full border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/80 to-zinc-950/40 backdrop-blur-xl sticky top-0 z-50">
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
                      <p className="text-sm text-zinc-400 font-medium mt-0.5">Interactive Machine Learning Stories</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Section */}
            <section className="w-full pt-16 pb-12">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-semibold mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  Interactive ML Storytelling
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Choose Your Story
                  </span>
                </h2>
                
                <p className="text-xl text-zinc-300 leading-relaxed max-w-3xl mx-auto">
                  Each dataset tells a different story about how machine learning works. 
                  Pick one to see how <span className="text-violet-400 font-semibold">three AI experts</span> team up to make accurate predictions.
                </p>
                </div>
              </div>
            </section>

            {/* Cards Section */}
            <section className="w-full pb-24">
              <div className="max-w-7xl mx-auto px-6 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <DatasetCard
                  title="🚗 Car Fuel Efficiency"
                  description="Explore 398 real cars from 1970–1982 and discover what makes them fuel-efficient."
                  datasetSize="398 cars"
                  factors="Weight, Engine, Year & more"
                  cta="Analyze Now"
                  onClick={() => handleSelectDataset('automobile')}
                  onPreview={() => handleDatasetClick('automobile')}
                  accent="red"
                />
                <DatasetCard
                  title="🏗️ Building Strength"
                  description="Predict concrete strength from 1,030 samples and learn which ingredients matter most."
                  datasetSize="1,030 samples"
                  factors="Cement, Water, Age & more"
                  cta="Analyze Now"
                  onClick={() => handleSelectDataset('concrete')}
                  onPreview={() => handleDatasetClick('concrete')}
                  accent="amber"
                />
                <DatasetCard
                  title="🏦 Loan Approval Risk"
                  description="Predict loan approval likelihood and understand which applicant factors drive decisions."
                  datasetSize="4,269 applications"
                  factors="Income, Credit Score, Assets & more"
                  cta="Analyze Now"
                  onClick={() => handleSelectDataset('loan')}
                  onPreview={() => handleDatasetClick('loan')}
                  accent="cyan"
                />
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-zinc-800/50 bg-zinc-950/80">
              <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">Ensemble ML Platform</span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    © 2025 Ensemble ML · Interactive Ensemble Learning Platform
                  </p>
                </div>
              </div>
            </footer>
          </>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="w-full py-16">
            <div className="max-w-6xl mx-auto px-6 md:px-8">
              <ProcessingStatus />
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {results && !isProcessing && selectedMethod && (
          <VisualizationDashboard
            results={results}
            method={selectedMethod}
            metaLearner={selectedMetaLearner}
            onBackToMethodSelector={() => {
              // Go back to method selection (keep dataset, clear method/results)
              setResults(null)
              setSelectedMethod(null)
              setSelectedMetaLearner(null)
            }}
            onReset={() => {
              // Go back to dataset selection (clear everything)
              setResults(null)
              setSelectedDataset(null)
              setSelectedMethod(null)
              setSelectedMetaLearner(null)
            }}
          />
        )}

        {/* Dataset Preview Modal */}
        <DatasetPreview
          isOpen={!!previewDataset}
          onClose={() => setPreviewDataset(null)}
          onConfirm={handleConfirmDataset}
          datasetId={previewDataset || ''}
        />
      </div>
    </ErrorBoundary>
  )
}
