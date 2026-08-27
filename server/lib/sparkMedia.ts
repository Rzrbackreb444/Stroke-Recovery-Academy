import { ObjectStorageService } from "../replit_integrations/object_storage/objectStorage";

// Uploads a server-generated buffer (Imagen image / ElevenLabs audio) to object
// storage and returns the normalized /objects/<id> path. Sparks are published
// content, so media is stored public.
export async function uploadSparkMedia(
  buffer: Buffer,
  contentType: string,
  ownerId: string,
): Promise<string> {
  const svc = new ObjectStorageService();
  const uploadUrl = await svc.getObjectEntityUploadURL({
    ownerId,
    metadata: {
      name: contentType.startsWith("audio/") ? "spark-media.mp3" : "spark-media",
      size: buffer.length,
      contentType,
    },
  });

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });
  if (!put.ok) {
    throw new Error(`Spark media upload failed: ${put.status} ${put.statusText}`);
  }

  return svc.trySetObjectEntityAclPolicy(
    uploadUrl,
    { owner: ownerId, visibility: "public" },
    { requireUploadIntent: true },
  );
}
