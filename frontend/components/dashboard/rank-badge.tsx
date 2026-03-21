import { Badge } from "@/components/ui/badge";
import { ReputationRank } from "@/lib/api/types";

function getVariant(rank: ReputationRank) {
  if (rank === "Experto") {
    return "success" as const;
  }

  if (rank === "Pro") {
    return "default" as const;
  }

  if (rank === "Oro") {
    return "warning" as const;
  }

  if (rank === "Plata") {
    return "secondary" as const;
  }

  return "outline" as const;
}

export function RankBadge({ rank }: { rank: ReputationRank }) {
  return <Badge variant={getVariant(rank)}>{rank}</Badge>;
}
