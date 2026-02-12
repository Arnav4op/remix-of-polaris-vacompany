import { supabase } from "@/integrations/supabase/client";

export async function sendDiscordNotification(payload: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke("discord-rank-notification", {
    body: payload,
  });

  if (error) {
    throw error;
  }
}
