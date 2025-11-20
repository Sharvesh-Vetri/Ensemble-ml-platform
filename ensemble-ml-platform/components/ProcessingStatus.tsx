"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ProcessingStatus() {
  return (
    <div className="max-w-2xl mx-auto mt-24">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-6" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Dataset</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Training models and computing metrics...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


