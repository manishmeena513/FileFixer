import JSZip from "jszip";
import { triggerDownload } from "./file-utils";

export interface ZipEntry {
  filename: string;
  blob: Blob;
}

export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.filename, entry.blob);
  }
  return await zip.generateAsync({ type: "blob" });
}

export async function downloadAsZip(
  entries: ZipEntry[],
  zipName = "filefixer_output.zip"
): Promise<Blob> {
  const zipBlob = await createZipBlob(entries);
  triggerDownload(zipBlob, zipName);
  return zipBlob;
}
