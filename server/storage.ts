import { supabaseAdmin } from "./supabase";

const BUCKET = "product-images";

function normalizeKey(relKey: string) {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  return lastDot === -1 ? `${relKey}_${hash}` : `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(relKey: string, data: Buffer | Uint8Array | string, contentType = "application/octet-stream") {
  const key = `products/${appendHashSuffix(normalizeKey(relKey))}`;
  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(key, body, { contentType, upsert: false });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
  const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
  return { key, url: publicData.publicUrl };
}

export async function storageGet(relKey: string) {
  const key = normalizeKey(relKey);
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(key);
  return { key, url: data.publicUrl };
}

export async function storageGetSignedUrl(relKey: string) {
  const key = normalizeKey(relKey);
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(key, 3600);
  if (error || !data?.signedUrl) throw new Error(`Supabase Storage signed URL failed: ${error?.message ?? "unknown error"}`);
  return data.signedUrl;
}
