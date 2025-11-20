'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, BarChart3 } from "lucide-react"
import { getDatasetRows } from '@/app/actions'

interface DatasetPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  datasetId: string
}

const DATASET_INFO: Record<string, {
  name: string
  description: string
  rows: number
  features: number
  target: string
  sampleData: Array<Record<string, any>>
  columns: string[]
  stats: {
    missing: number
    numeric: number
    categorical: number
  }
}> = {
  automobile: {
    name: "🚗 Automobile Performance",
    description: "Predicting fuel efficiency (MPG) based on vehicle characteristics",
    rows: 398,
    features: 7,
    target: "MPG (Miles Per Gallon)",
    columns: ['mpg', 'cylinders', 'displacement', 'horsepower', 'weight', 'acceleration', 'model_year', 'origin'],
    sampleData: [
      { mpg: '18.0', cylinders: '8', displacement: '307.0', horsepower: '130', weight: '3504', acceleration: '12.0', model_year: '70', origin: 'USA' },
      { mpg: '15.0', cylinders: '8', displacement: '350.0', horsepower: '165', weight: '3693', acceleration: '11.5', model_year: '70', origin: 'USA' },
      { mpg: '18.0', cylinders: '8', displacement: '318.0', horsepower: '150', weight: '3436', acceleration: '11.0', model_year: '70', origin: 'USA' },
      { mpg: '16.0', cylinders: '8', displacement: '304.0', horsepower: '150', weight: '3433', acceleration: '12.0', model_year: '70', origin: 'USA' },
      { mpg: '17.0', cylinders: '8', displacement: '302.0', horsepower: '140', weight: '3449', acceleration: '10.5', model_year: '70', origin: 'USA' },
    ],
    stats: {
      missing: 0,
      numeric: 7,
      categorical: 1
    }
  },
  concrete: {
    name: "🏗️ Concrete Strength",
    description: "Predicting compressive strength based on mixture components and age",
    rows: 1030,
    features: 8,
    target: "Compressive Strength (MPa)",
    columns: ['cement', 'blast_furnace_slag', 'fly_ash', 'water', 'superplasticizer', 'coarse_aggregate', 'fine_aggregate', 'age', 'strength'],
    sampleData: [
      { cement: '540.0', blast_furnace_slag: '0.0', fly_ash: '0.0', water: '162.0', superplasticizer: '2.5', coarse_aggregate: '1040.0', fine_aggregate: '676.0', age: '28', strength: '79.99' },
      { cement: '540.0', blast_furnace_slag: '0.0', fly_ash: '0.0', water: '162.0', superplasticizer: '2.5', coarse_aggregate: '1055.0', fine_aggregate: '676.0', age: '28', strength: '61.89' },
      { cement: '332.5', blast_furnace_slag: '142.5', fly_ash: '0.0', water: '228.0', superplasticizer: '0.0', coarse_aggregate: '932.0', fine_aggregate: '594.0', age: '270', strength: '40.27' },
      { cement: '332.5', blast_furnace_slag: '142.5', fly_ash: '0.0', water: '228.0', superplasticizer: '0.0', coarse_aggregate: '932.0', fine_aggregate: '594.0', age: '365', strength: '41.05' },
      { cement: '198.6', blast_furnace_slag: '132.4', fly_ash: '0.0', water: '192.0', superplasticizer: '0.0', coarse_aggregate: '978.4', fine_aggregate: '825.5', age: '360', strength: '44.30' },
    ],
    stats: {
      missing: 0,
      numeric: 9,
      categorical: 0
    }
  },
  loan: {
    name: "🏦 Loan Approval Risk",
    description: "Predicting loan approval likelihood based on applicant and financial features",
    rows: 4269,
    features: 12,
    target: "Loan Status (Approved/Rejected)",
    columns: [],
    sampleData: [],
    stats: {
      missing: 0,
      numeric: 10,
      categorical: 3
    }
  }
}

export function DatasetPreview({ isOpen, onClose, onConfirm, datasetId }: DatasetPreviewProps) {
  const dataset = DATASET_INFO[datasetId] || DATASET_INFO['loan']

  const [headers, setHeaders] = useState<string[] | null>(null)
  const [rows, setRows] = useState<string[][] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch full dataset when modal opens
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!isOpen || !datasetId) return
      setIsLoading(true)
      const res = await getDatasetRows(datasetId)
      if (!cancelled && res?.success) {
        setHeaders(res.headers)
        setRows(res.rows)
      }
      setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, datasetId])

  if (!dataset) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] sm:w-[95vw] max-h-[95vh] sm:h-[90vh] bg-gradient-to-br from-zinc-900/95 to-zinc-900/80 border-2 border-primary/30 backdrop-blur-xl overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
            <FileText className="h-6 w-6 text-primary" />
            {dataset.name}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-base">
            {dataset.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] sm:h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Dataset Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-sm text-zinc-400 uppercase font-semibold mb-2">Total Samples</p>
                <p className="text-3xl font-bold text-white">{rows ? rows.length.toLocaleString() : dataset.rows.toLocaleString()}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-sm text-zinc-400 uppercase font-semibold mb-2">Features</p>
                <p className="text-3xl font-bold text-white">{headers ? headers.length - 1 : dataset.features}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-sm text-zinc-400 uppercase font-semibold mb-2">Missing Values</p>
                <p className="text-3xl font-bold text-green-500">{dataset.stats.missing}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-sm text-zinc-400 uppercase font-semibold mb-2">Data Quality</p>
                <p className="text-3xl font-bold text-green-500">Clean</p>
              </div>
            </div>

            {/* Target Variable */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <p className="text-sm font-bold text-white">Target Variable</p>
              </div>
              <p className="text-xl text-zinc-300 font-semibold">{dataset.target}</p>
              <p className="text-sm text-zinc-500 mt-1">This is what the ML model will predict</p>
            </div>

            {/* Full Data Table */}
            <div className="space-y-3">
              <p className="text-lg font-bold text-white">Dataset Preview (All Rows)</p>
              <div className="overflow-auto rounded-lg border border-zinc-700/50 bg-zinc-900/50" style={{ maxHeight: 480 }}>
                {isLoading && (
                  <div className="p-6 text-sm text-zinc-400">Loading full table…</div>
                )}
                {!isLoading && headers && rows && (
                  <table className="min-w-full text-sm divide-y divide-zinc-700">
                    <thead className="bg-zinc-800">
                      <tr>
                        {headers.map((col) => (
                          <th key={col} className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider whitespace-nowrap">
                            {col.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {rows.map((row, idx) => (
                        <tr key={idx}>
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="px-6 py-3 whitespace-nowrap text-zinc-400">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {!isLoading && rows && (
                <p className="text-sm text-zinc-500">Showing {rows.length.toLocaleString()} rows • {headers?.length ?? 0} columns</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 p-6 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onConfirm}>Analyze Dataset</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

