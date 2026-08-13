import "server-only";
import crypto from "crypto";
import { getSupabase } from "./supabase";
import { isAdmin } from "./auth";
import { NATALIA_FAMILY_ID } from "./families";

/**
 * Private "memories" feature — stories + photos shared for the kids.
 *
 * Everything here is private: media lives in a NON-public Supabase Storage
 * bucket, and the only way to view a file is a short-lived signed URL that is
 * generated on the server *after* confirming the viewer is an authenticated
 * admin. Nothing is ever rendered on the public site.
 */

export const MEMORIES_BUCKET = "memories";

// Photos only (no video), per project decision.
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per photo
export const MAX_FILES = 10;
const SIGNED_URL_TTL_SECONDS = 600; // 10 minutes — short-lived

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export type MemoryMedia = {
  id: string;
  memory_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export type Memory = {
  id: string;
  author_name: string | null;
  author_email: string | null;
  story: string | null;
  is_public: boolean;
  created_at: string;
  media: MemoryMedia[];
};

export type MemoryMediaWithUrls = MemoryMedia & {
  viewUrl: string | null;
  downloadUrl: string | null;
};

export type MemoryWithUrls = Omit<Memory, "media"> & {
  media: MemoryMediaWithUrls[];
};

export type IncomingFile = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type SaveMemoryResult = {
  ok: boolean;
  memoryId?: string;
  photoCount: number;
  error?: string;
};

function extFor(contentType: string, fileName: string): string {
  if (EXT_BY_TYPE[contentType]) return EXT_BY_TYPE[contentType];
  const dot = fileName.lastIndexOf(".");
  if (dot > -1 && dot < fileName.length - 1) {
    return fileName.slice(dot).toLowerCase().replace(/[^.a-z0-9]/g, "");
  }
  return "";
}

/** Persist a memory (optional story) plus its uploaded photos. */
export async function saveMemory(input: {
  authorName?: string | null;
  authorEmail?: string | null;
  story?: string | null;
  files: IncomingFile[];
}): Promise<SaveMemoryResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, photoCount: 0, error: "Storage isn't connected yet." };
  }

  const { data: memory, error: memErr } = await supabase
    .from("memories")
    .insert({
      author_name: input.authorName || null,
      author_email: input.authorEmail || null,
      story: input.story || null,
    })
    .select("id")
    .single();

  if (memErr || !memory) {
    console.error("[saveMemory] insert memory failed:", memErr);
    return { ok: false, photoCount: 0, error: "Couldn't save. Please try again." };
  }

  const memoryId = (memory as { id: string }).id;
  let photoCount = 0;

  for (const file of input.files) {
    const path = `${memoryId}/${crypto.randomUUID()}${extFor(
      file.contentType,
      file.fileName
    )}`;

    const { error: upErr } = await supabase.storage
      .from(MEMORIES_BUCKET)
      .upload(path, file.buffer, {
        contentType: file.contentType,
        upsert: false,
      });

    if (upErr) {
      console.error("[saveMemory] upload failed:", upErr);
      continue; // skip this file but keep the story + other photos
    }

    const { error: mediaErr } = await supabase.from("memory_media").insert({
      memory_id: memoryId,
      storage_path: path,
      file_name: file.fileName.slice(0, 200),
      content_type: file.contentType,
      size_bytes: file.sizeBytes,
    });

    if (mediaErr) {
      console.error("[saveMemory] media row failed:", mediaErr);
      // Clean up the orphaned object so nothing is left unreferenced.
      await supabase.storage.from(MEMORIES_BUCKET).remove([path]);
      continue;
    }

    photoCount += 1;
  }

  return { ok: true, memoryId, photoCount };
}

/** List all memories (admin only). Returns [] for non-admins. */
export async function listMemories(): Promise<Memory[]> {
  if (!isAdmin()) return [];
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("memories")
    .select("*, media:memory_media(*)")
    .eq("family_id", NATALIA_FAMILY_ID)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("[listMemories]", error);
    return [];
  }

  return (data as Memory[]).map((m) => ({
    ...m,
    media: (m.media || []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }));
}

/**
 * Attach short-lived signed URLs to each media item. Only works for an
 * authenticated admin; otherwise every URL is null so nothing leaks.
 */
export async function attachSignedUrls(
  memories: Memory[]
): Promise<MemoryWithUrls[]> {
  const supabase = getSupabase();
  if (!supabase || !isAdmin()) {
    return memories.map((m) => ({
      ...m,
      media: m.media.map((md) => ({ ...md, viewUrl: null, downloadUrl: null })),
    }));
  }

  const result: MemoryWithUrls[] = [];
  for (const m of memories) {
    const media: MemoryMediaWithUrls[] = [];
    for (const md of m.media) {
      const [view, download] = await Promise.all([
        supabase.storage
          .from(MEMORIES_BUCKET)
          .createSignedUrl(md.storage_path, SIGNED_URL_TTL_SECONDS),
        supabase.storage
          .from(MEMORIES_BUCKET)
          .createSignedUrl(md.storage_path, SIGNED_URL_TTL_SECONDS, {
            download: md.file_name || true,
          }),
      ]);
      media.push({
        ...md,
        viewUrl: view.data?.signedUrl ?? null,
        downloadUrl: download.data?.signedUrl ?? null,
      });
    }
    result.push({ ...m, media });
  }
  return result;
}

/** Delete a memory and all of its stored photos (admin only). */
export async function deleteMemoryEverywhere(id: string): Promise<void> {
  if (!isAdmin()) return;
  const supabase = getSupabase();
  if (!supabase) return;

  const { data } = await supabase
    .from("memory_media")
    .select("storage_path")
    .eq("memory_id", id);

  const paths = (data as { storage_path: string }[] | null)?.map(
    (r) => r.storage_path
  );
  if (paths && paths.length > 0) {
    await supabase.storage.from(MEMORIES_BUCKET).remove(paths);
  }

  // memory_media rows cascade-delete with the parent memory.
  await supabase.from("memories").delete().eq("id", id);
}

// ------------------------------------------------------------------
// Multi-tenant (family) versions — scoped by family_id. The family page
// submits memories publicly; the family views them from their manage screen
// (already gated by their secret edit token, so no isAdmin() check here).
// ------------------------------------------------------------------

/** Persist a memory + photos for a specific family. */
export async function saveFamilyMemory(
  familyId: string,
  input: {
    authorName?: string | null;
    authorEmail?: string | null;
    story?: string | null;
    isPublic?: boolean;
    files: IncomingFile[];
  }
): Promise<SaveMemoryResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, photoCount: 0, error: "Storage isn't connected yet." };
  }

  const { data: memory, error: memErr } = await supabase
    .from("memories")
    .insert({
      family_id: familyId,
      author_name: input.authorName || null,
      author_email: input.authorEmail || null,
      story: input.story || null,
      is_public: input.isPublic === true,
    })
    .select("id")
    .single();

  if (memErr || !memory) {
    console.error("[saveFamilyMemory] insert failed:", memErr);
    return { ok: false, photoCount: 0, error: "Couldn't save. Please try again." };
  }

  const memoryId = (memory as { id: string }).id;
  let photoCount = 0;

  for (const file of input.files) {
    const path = `${familyId}/${memoryId}/${crypto.randomUUID()}${extFor(
      file.contentType,
      file.fileName
    )}`;

    const { error: upErr } = await supabase.storage
      .from(MEMORIES_BUCKET)
      .upload(path, file.buffer, { contentType: file.contentType, upsert: false });
    if (upErr) {
      console.error("[saveFamilyMemory] upload failed:", upErr);
      continue;
    }

    const { error: mediaErr } = await supabase.from("memory_media").insert({
      family_id: familyId,
      memory_id: memoryId,
      storage_path: path,
      file_name: file.fileName.slice(0, 200),
      content_type: file.contentType,
      size_bytes: file.sizeBytes,
    });
    if (mediaErr) {
      console.error("[saveFamilyMemory] media row failed:", mediaErr);
      await supabase.storage.from(MEMORIES_BUCKET).remove([path]);
      continue;
    }
    photoCount += 1;
  }

  return { ok: true, memoryId, photoCount };
}

/** A family's memories with short-lived signed photo URLs (for the manage screen). */
export async function getFamilyMemoriesWithUrls(
  familyId: string
): Promise<MemoryWithUrls[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("memories")
    .select("*, media:memory_media(*)")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("[getFamilyMemoriesWithUrls]", error);
    return [];
  }

  const memories = (data as Memory[]).map((m) => ({
    ...m,
    media: (m.media || []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));

  const result: MemoryWithUrls[] = [];
  for (const m of memories) {
    const media: MemoryMediaWithUrls[] = [];
    for (const md of m.media) {
      const view = await supabase.storage
        .from(MEMORIES_BUCKET)
        .createSignedUrl(md.storage_path, SIGNED_URL_TTL_SECONDS);
      media.push({ ...md, viewUrl: view.data?.signedUrl ?? null, downloadUrl: null });
    }
    result.push({ ...m, media });
  }
  return result;
}
