"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PremiumLockProps {
  premiumPriceWei: string;
  loading: boolean;
  onUnlock: () => Promise<void>;
}

function formatEth(wei: string) {
  try {
    const value = BigInt(wei);
    const base = 10n ** 18n;
    const whole = value / base;
    const fraction = (value % base).toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${fraction}`;
  } catch {
    return "0.0000";
  }
}

export function PremiumLock({ premiumPriceWei, loading, onUnlock }: PremiumLockProps) {
  return (
    <Card className="border-accent/35 bg-accent/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-4 w-4" />
          Contenido premium
        </CardTitle>
        <CardDescription>
          Suscribete al autor para desbloquear parametros completos y la tesis extendida.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Precio de suscripcion sugerido: {formatEth(premiumPriceWei)} ETH</p>
        <Button onClick={onUnlock} disabled={loading} className="w-full">
          {loading ? "Procesando suscripcion..." : "Desbloquear contenido premium"}
        </Button>
      </CardContent>
    </Card>
  );
}
