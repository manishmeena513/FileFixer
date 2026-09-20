import JSZip from "jszip";
import { triggerDownload } from "./file-utils";

export interface ZipEntry {
  filename: string;
  blob: Blob;
}

export async function downloadAsZip(
  entries: ZipEntry[],
  zipName = "filefixer_output.zip"
): Promise<void> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.filename, entry.blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerDownload(zipBlob, zipName);
}
