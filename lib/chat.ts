export const chatMessageLimit = 1000;

export type ChatMessage = {
  id: string;
  sender: "client" | "driver";
  body: string;
  created_at: string;
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
}
