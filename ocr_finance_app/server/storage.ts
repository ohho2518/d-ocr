import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Storage config missing: set SUPABASE_URL and SUPABASE_SERVICE_KEY",
    );
  }

  return createClient(url, key);
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseClient();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body = typeof data === "string" ? Buffer.from(data) : data;

  const { error } = await supabase.storage
    .from("documents")
    .upload(key, body, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from("documents")
    .getPublicUrl(key);

  return { key, url: publicData.publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseClient();
  const key = normalizeKey(relKey);

  const { data } = supabase.storage.from("documents").getPublicUrl(key);
  return { key, url: data.publicUrl };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const supabase = getSupabaseClient();
  const key = normalizeKey(relKey);

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(key, 3600);

  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed URL failed: ${error?.message}`);
  }

  return data.signedUrl;
}
