"use client";

import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RiskFormValues {
  asset: string;
  horizon: string;
  bias: "bullish" | "bearish" | "neutral";
  priceVolatility: number;
  expectedDemand: number;
  summary: string;
  thesisText: string;
  premiumText: string;
  isPremium: boolean;
  premiumPriceWei: string;
  invalidationCondition: string;
}

interface RiskFormProps {
  isLoading: boolean;
  onSubmit: (values: RiskFormValues) => Promise<void>;
}

function SliderRow({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function RiskForm({ isLoading, onSubmit }: RiskFormProps) {
  const initialValues = useMemo<RiskFormValues>(
    () => ({
      asset: "BTC",
      horizon: "7d",
      bias: "bullish",
      priceVolatility: 50,
      expectedDemand: 50,
      summary: "Tesis de ejemplo para publicar en SignalForce.",
      thesisText:
        "Desarrollo de tesis: momentum, zonas de liquidez, invalidacion y escenario base para el horizonte elegido.",
      premiumText: "Escenarios extendidos con niveles adicionales y gestion avanzada de riesgo.",
      isPremium: false,
      premiumPriceWei: "1000000000000000",
      invalidationCondition: "Cierre diario por debajo del soporte principal"
    }),
    []
  );

  const [values, setValues] = useState<RiskFormValues>(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <Card className="animate-fade-up border-primary/10 bg-card/95 shadow-glow">
      <CardHeader>
        <CardTitle>Composer de tesis</CardTitle>
        <CardDescription>Publica una lectura estructurada con parametros difusos y fecha limite.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="asset">Activo</Label>
              <Input id="asset" value={values.asset} onChange={(e) => setValues((prev) => ({ ...prev, asset: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horizon">Horizonte</Label>
              <Input
                id="horizon"
                value={values.horizon}
                onChange={(e) => setValues((prev) => ({ ...prev, horizon: e.target.value }))}
                placeholder="4h, 1d, 1w"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bias">Sesgo</Label>
              <select
                id="bias"
                value={values.bias}
                onChange={(e) => setValues((prev) => ({ ...prev, bias: e.target.value as RiskFormValues["bias"] }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="bullish">Alcista</option>
                <option value="bearish">Bajista</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <SliderRow
            label="Volatilidad"
            hint="0 = estable, 100 = extrema"
            value={values.priceVolatility}
            onChange={(value) => setValues((prev) => ({ ...prev, priceVolatility: value }))}
          />
          <SliderRow
            label="Demanda esperada"
            hint="0 = debil, 100 = muy fuerte"
            value={values.expectedDemand}
            onChange={(value) => setValues((prev) => ({ ...prev, expectedDemand: value }))}
          />

          <div className="space-y-2">
            <Label htmlFor="summary">Resumen publico</Label>
            <Input
              id="summary"
              value={values.summary}
              onChange={(e) => setValues((prev) => ({ ...prev, summary: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thesis-text">Comentario humano</Label>
            <textarea
              id="thesis-text"
              value={values.thesisText}
              onChange={(e) => setValues((prev) => ({ ...prev, thesisText: e.target.value }))}
              className="min-h-28 w-full rounded-lg border border-input bg-background p-3 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invalidation">Condicion de invalidacion (opcional)</Label>
            <Input
              id="invalidation"
              value={values.invalidationCondition}
              onChange={(e) => setValues((prev) => ({ ...prev, invalidationCondition: e.target.value }))}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 bg-background/50 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.isPremium}
                onChange={(e) => setValues((prev) => ({ ...prev, isPremium: e.target.checked }))}
              />
              Marcar contenido premium
            </label>
            {values.isPremium && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="premium-text">Contenido premium extendido</Label>
                  <textarea
                    id="premium-text"
                    value={values.premiumText}
                    onChange={(e) => setValues((prev) => ({ ...prev, premiumText: e.target.value }))}
                    className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium-price">Precio sugerido (wei)</Label>
                  <Input
                    id="premium-price"
                    value={values.premiumPriceWei}
                    onChange={(e) => setValues((prev) => ({ ...prev, premiumPriceWei: e.target.value || "0" }))}
                  />
                </div>
              </>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creando tesis..." : "Crear tesis"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
