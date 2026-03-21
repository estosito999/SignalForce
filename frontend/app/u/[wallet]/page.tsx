"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { RankBadge } from "@/components/dashboard/rank-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile, listTheses } from "@/lib/api/client";
import { ProfileResponse, ThesisResponse } from "@/lib/api/types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export default function ProfilePage() {
  const params = useParams<{ wallet: string }>();
  const wallet = params?.wallet ?? "";

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [theses, setTheses] = useState<ThesisResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!wallet) {
        setLoading(false);
        setError("Wallet de perfil invalida.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileData, thesisData] = await Promise.all([
          getProfile(wallet),
          listTheses({ authorWallet: wallet, includePending: true })
        ]);

        setProfile(profileData);
        setTheses(thesisData);
      } catch {
        setError("No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [wallet]);

  if (loading) {
    return (
      <main className="container py-8">
        <p className="text-sm text-muted-foreground">Cargando perfil...</p>
      </main>
    );
  }

  if (!wallet) {
    return (
      <main className="container py-8">
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">Wallet de perfil invalida.</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="container py-8 space-y-3">
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error || "Perfil no encontrado"}</p>
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          Volver al feed
        </Link>
      </main>
    );
  }

  return (
    <main className="container space-y-6 py-8">
      <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Volver al feed
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{profile.pseudonym}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <RankBadge rank={profile.rank} />
            <span>{profile.wallet_address}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs uppercase text-muted-foreground">Reputacion</p>
            <p className="text-2xl font-semibold">{profile.reputation_score.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs uppercase text-muted-foreground">Verificable</p>
            <p className="text-2xl font-semibold">{profile.verifiable_score.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs uppercase text-muted-foreground">Social</p>
            <p className="text-2xl font-semibold">{profile.social_score.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <p className="text-xs uppercase text-muted-foreground">Ingresos</p>
            <p className="text-lg font-semibold">{profile.creator_earnings_wei} wei</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de tesis</CardTitle>
          <CardDescription>{theses.length} publicaciones registradas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {theses.length === 0 && <p className="text-sm text-muted-foreground">Aun no hay tesis en este perfil.</p>}
          {theses.map((thesis) => (
            <div key={thesis.id} className="rounded-lg border border-border/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {thesis.asset} · {thesis.horizon}
                </Badge>
                <Badge variant={thesis.status === "active" ? "success" : "outline"}>{thesis.status}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(thesis.created_at)}</span>
              </div>
              <p className="mt-2 text-sm">{thesis.summary}</p>
              <Link href={`/theses/${thesis.id}`} className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
                Ver detalle
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
