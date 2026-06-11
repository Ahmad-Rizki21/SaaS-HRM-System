import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

/**
 * Shared utility to download a file (PDF or Excel) from the backend API.
 * Eliminates duplicated handleDownload logic across leaves, permits, and overtimes pages.
 */
export const downloadFile = async (
  urlPath: string,
  fileName: string,
  format: 'pdf' | 'excel'
): Promise<void> => {
  try {
    const response = await axiosInstance.get(urlPath, {
      responseType: 'blob'
    });
    const url = globalThis.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
    toast.error(`Gagal mendownload ${format === 'pdf' ? 'PDF' : 'Excel'}.`);
  }
};

/**
 * Helper to sanitize a name for use in filenames (replace spaces with underscores).
 */
export const sanitizeFileName = (name: string): string =>
  name.replaceAll(/\s+/g, '_');
