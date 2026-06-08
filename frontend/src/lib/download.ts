import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

/**
 * Downloads a file from the backend and triggers a browser download.
 * 
 * @param url The API endpoint to fetch the file from.
 * @param fileName The name to save the file as.
 * @param format 'pdf' | 'excel' (affects the filename suffix and logging).
 */
export async function downloadFile(url: string, fileName: string, format: 'pdf' | 'excel' = 'pdf') {
  try {
    const response = await axiosInstance.get(url, {
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const blobUrl = globalThis.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = blobUrl;
    
    // Ensure filename ends correctly
    let finalName = fileName;
    const suffix = format === 'pdf' ? '.pdf' : '.xlsx';
    if (!finalName.toLowerCase().endsWith(suffix)) {
      finalName += suffix;
    }
    
    link.setAttribute('download', finalName);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    globalThis.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (err) {
    console.error(`Gagal mendownload ${format.toUpperCase()}:`, err);
    toast.error(`Gagal mendownload file ${format.toUpperCase()}.`);
    return false;
  }
}
