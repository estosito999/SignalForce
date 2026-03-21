"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThesisResponse } from "@/lib/api/types";

interface ResultCardProps {
  result: ThesisResponse | null;
  loading: boolean;
  error: string | null;
  chainError: string | null;
  chainSuccess: string | null;
  canRecordOnchain: boolean;
  recordingOnchain: boolean;
  onRecordOnchain: () => Promise<void>;
}

function getRiskVariant(riskLevel: ThesisResponse["risk_level"]) {
  if (riskLevel === "high") {
    return "danger" as const;
  }
  if (riskLevel === "medium") {
    return "warning" as const;
  }
  return "success" as const;
}

function getRiskLabel(riskLevel: ThesisResponse["risk_level"]) {
  if (riskLevel === "high") {
    return "Riesgo alto";
  }
  if (riskLevel === "medium") {
    return "Riesgo medio";
  }
  return "Riesgo bajo";
}

export function ResultCard({
  result,
  loading,
  error,
  chainError,
  chainSuccess,
  canRecordOnchain,
  recordingOnchain,
  onRecordOnchain
}: ResultCardProps) {
  return (
    <Card className="animate-fade-up border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Vista previa de tesis</CardTitle>
        <CardDescription>Resultado difuso, hash de anclaje y estado on-chain de publicacion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando riesgo y preparando hash de publicacion...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!loading && result && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">Risk score</p>
                <p className="font-display text-3xl font-semibold">{result.risk_score.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">Nivel</p>
                <Badge variant={getRiskVariant(result.risk_level)} className="mt-2 text-sm">
                  {getRiskLabel(result.risk_level)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/60 bg-background/80 p-4">
              <p className="text-xs uppercase text-muted-foreground">Resumen publico</p>
              <p className="text-sm">{result.summary}</p>
              <p className="font-mono text-xs text-muted-foreground">Hash: {result.post_hash.slice(0, 18)}...</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={onRecordOnchain} disabled={!canRecordOnchain || recordingOnchain} className="w-full">
                {recordingOnchain ? "Anclando publicacion..." : "Registrar publicacion en blockchain"}
              </Button>

              {!canRecordOnchain && <p className="text-xs text-muted-foreground">Conecta wallet y crea una tesis para anclarla.</p>}

              {chainError && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{chainError}</p>
              )}

              {chainSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {chainSuccess}
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !result && !error && (
          <p className="text-sm text-muted-foreground">No hay tesis creada aun. Completa el composer para iniciar.</p>
        )}
      </CardContent>
    </Card>
  );
}
