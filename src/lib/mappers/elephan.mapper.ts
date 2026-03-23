export interface ElephanWebhookPayload {
  card_id?: string;
  meeting_id?: string;
  transcript_text?: string;
  recording_url?: string;
  summary?: string;
  ai_extract?: Record<string, unknown>;
  occurred_at?: string;
}

export interface MeetingRecordInsert {
  card_id: string;
  provider: "elephan";
  meeting_external_id: string;
  meeting_url: string | null;
  transcript_text: string | null;
  recording_url: string | null;
  summary: string | null;
  ai_extract: Record<string, unknown> | null;
  occurred_at: string;
}

export function mapElephanPayload(payload: ElephanWebhookPayload): Partial<MeetingRecordInsert> {
  return {
    provider: "elephan",
    meeting_external_id: payload.meeting_id ?? "unknown",
    meeting_url: null,
    transcript_text: payload.transcript_text ?? null,
    recording_url: payload.recording_url ?? null,
    summary: payload.summary ?? null,
    ai_extract: payload.ai_extract ?? null,
    occurred_at: payload.occurred_at ?? new Date().toISOString(),
  };
}
