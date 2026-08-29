import type { Express, RequestHandler } from "express";
import { updateRecoveryJournalSchema } from "@shared/schema";
import { storage, type IStorage } from "./storage";
import { getUserId } from "./lib/authUtils";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";

type JournalStorage = Pick<IStorage, "updateJournalEntry">;

export async function syncJournalMediaAcl(entry: any, ownerId: string): Promise<void> {
  // storage.create/updateJournalEntry return raw `RETURNING *` rows
  // (snake_case), so read both casings to stay robust if a mapped row is ever
  // passed in.
  const isShared = entry?.isShared ?? entry?.is_shared;
  const visibility: "public" | "private" = isShared ? "public" : "private";
  const objectStorage = new ObjectStorageService();

  for (const mediaPath of [
    entry?.photoUrl ?? entry?.photo_url,
    entry?.voiceUrl ?? entry?.voice_url,
  ]) {
    if (typeof mediaPath === "string" && mediaPath.startsWith("/objects/")) {
      // Existing journal media may predate upload intents. Preserve the
      // share/unshare lifecycle for those objects; new attachments are
      // required to pass the owner-bound intent check at finalization.
      // Let failures reach the route so a privacy toggle is never reported
      // as successful when its media ACL was not synchronized.
      await objectStorage.trySetObjectEntityAclPolicy(
        mediaPath,
        { owner: ownerId, visibility },
        { requireUploadIntent: false },
      );
    }
  }
}

export function registerJournalUpdateRoute(
  app: Express,
  isAuthenticated: RequestHandler,
  dependencies: {
    storage?: JournalStorage;
    syncMediaAcl?: typeof syncJournalMediaAcl;
  } = {},
): void {
  const journalStorage = dependencies.storage ?? storage;
  const syncMediaAcl = dependencies.syncMediaAcl ?? syncJournalMediaAcl;

  app.patch("/api/recovery/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req)!;
      const entryId = parseInt(req.params.id);
      const validated = updateRecoveryJournalSchema.partial().safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ message: "Invalid update", details: validated.error.issues });
      }
      const entry = await journalStorage.updateJournalEntry(entryId, userId, validated.data);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      if (validated.data.isShared !== undefined) {
        await syncMediaAcl(entry, userId);
      }
      res.json(entry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });
}