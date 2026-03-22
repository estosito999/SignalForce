"use client";

import Link from "next/link";

import { RankBadge } from "@/components/dashboard/rank-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ThesisResponse } from "@/lib/api/types";

interface HistoryTableProps {
  items: ThesisResponse[];
  loading: boolean;
  error: string | null;
  notice?: string | null;
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(isoDate));
}

function riskBadge(level: ThesisResponse["risk_level"]) {
  if (level === "high") {
    return <Badge variant="danger">Alto</Badge>;
  }
  if (level === "medium") {
    return <Badge variant="warning">Medio</Badge>;
  }
  return <Badge variant="success">Bajo</Badge>;
}

function statusBadge(status: ThesisResponse["status"]) {
  if (status === "resolved") {
    return <Badge variant="success">Resuelta</Badge>;
  }
  if (status === "invalidated") {
    return <Badge variant="danger">Invalidada</Badge>;
  }
  if (status === "active") {
    return <Badge variant="default">Activa</Badge>;
  }
  return <Badge variant="outline">Pendiente on-chain</Badge>;
}

const explorerBaseUrl = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_BASE_URL || "https://sepolia.etherscan.io";

export function HistoryTable({ items, loading, error, notice }: HistoryTableProps) {
  return (
    <Card className="animate-fade-up border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle>Feed de tesis</CardTitle>
        <CardDescription>Publicaciones ancladas y estado de cada tesis de mercado.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : notice ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{notice}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Tesis</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Link href={`/u/${item.author_wallet}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                          {item.author_pseudonym}
                        </Link>
                        <RankBadge rank={item.author_rank} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {item.asset} · {item.horizon}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.summary}</p>
                      </div>
                    </TableCell>
                    <TableCell>{riskBadge(item.risk_level)}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell>{item.is_premium ? <Badge variant="warning">Premium</Badge> : <Badge variant="outline">Publico</Badge>}</TableCell>
                    <TableCell>
                      {item.source === "onchain" && item.tx_hash ? (
                        <a
                          href={`${explorerBaseUrl}/tx/${item.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Ver tx
                        </a>
                      ) : (
                        <Link href={`/theses/${item.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                          Ver
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Tesis</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aun no hay tesis publicadas.
                  </TableCell>
                </TableRow>
              )}

              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Link href={`/u/${item.author_wallet}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                        {item.author_pseudonym}
                      </Link>
                      <RankBadge rank={item.author_rank} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {item.asset} · {item.horizon}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.summary}</p>
                    </div>
                  </TableCell>
                  <TableCell>{riskBadge(item.risk_level)}</TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell>{item.is_premium ? <Badge variant="warning">Premium</Badge> : <Badge variant="outline">Publico</Badge>}</TableCell>
                  <TableCell>
                    {item.source === "onchain" && item.tx_hash ? (
                      <a
                        href={`${explorerBaseUrl}/tx/${item.tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Ver tx
                      </a>
                    ) : (
                      <Link href={`/theses/${item.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                        Ver
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
