import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  cardId?: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "secondary",
  running: "outline",
  failed: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Sucesso",
  pending: "Pendente",
  running: "Executando",
  failed: "Falhou",
};

export function AutomationLogTable({ cardId }: Props) {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["automation-runs", cardId],
    queryFn: async () => {
      let query = supabase
        .from("automation_runs")
        .select("id, rule_id, status, executed_at, error_message")
        .order("executed_at", { ascending: false })
        .limit(50);

      if (cardId) query = query.eq("card_id", cardId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!runs?.length) return <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Regra</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Executado</TableHead>
          <TableHead>Erro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell className="text-xs font-mono">{run.rule_id.slice(0, 8)}...</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>
                {STATUS_LABEL[run.status] ?? run.status}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {run.executed_at
                ? formatDistanceToNow(new Date(run.executed_at), { addSuffix: true, locale: ptBR })
                : "—"}
            </TableCell>
            <TableCell className="text-xs text-destructive max-w-[200px] truncate">
              {run.error_message ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
