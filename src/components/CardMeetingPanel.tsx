import { useState } from "react";
import { useMeetingData } from "@/hooks/useMeetingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Plus, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Props {
  cardId: string;
}

export function CardMeetingPanel({ cardId }: Props) {
  const { meetings, attach } = useMeetingData(cardId);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleAttach = () => {
    if (!meetingUrl.trim()) return;
    attach.mutate({ meetingUrl: meetingUrl.trim() }, {
      onSuccess: () => { setMeetingUrl(""); setShowInput(false); },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-4 w-4" /> Reuniões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meetings.data?.map((m) => (
          <div key={m.id} className="text-xs space-y-1 border-b border-border pb-2">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{m.provider.replace("_", " ")}</span>
              {m.occurred_at && (
                <span className="text-muted-foreground">
                  {format(new Date(m.occurred_at), "dd/MM/yy HH:mm")}
                </span>
              )}
            </div>
            {m.meeting_url && (
              <a href={m.meeting_url} target="_blank" rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="h-3 w-3" /> Link
              </a>
            )}
            {m.summary && <p className="text-muted-foreground">{m.summary}</p>}
          </div>
        ))}
        {meetings.data?.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma reunião vinculada</p>
        )}

        {showInput ? (
          <div className="flex gap-2">
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="URL do Google Meet..."
              className="text-xs h-8"
            />
            <Button size="sm" onClick={handleAttach} disabled={!meetingUrl.trim() || attach.isPending} className="h-8">
              {attach.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowInput(true)}>
            <Plus className="h-3 w-3 mr-1" /> Vincular Reunião
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
