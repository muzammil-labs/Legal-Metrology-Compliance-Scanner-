import { get, set, update } from "idb-keyval";

const OFFLINE_SCANS_KEY = "offline_scans";

/**
 * Persist a scan (metadata, image, and evaluation result) locally.
 */
export async function saveOfflineScan(imageFile, ocrText, evaluationResult) {
  try {
    const scanRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      imageFile,
      ocrText,
      evaluationResult,
    };
    await update(OFFLINE_SCANS_KEY, (val) => {
      const scans = val || [];
      return [...scans, scanRecord];
    });
    console.log("Saved offline scan to local storage.");
  } catch (error) {
    console.error("Failed to save offline scan:", error);
  }
}

/**
 * Retrieve pending offline scans.
 */
export async function getOfflineScans() {
  try {
    return (await get(OFFLINE_SCANS_KEY)) || [];
  } catch (error) {
    console.error("Failed to get offline scans:", error);
    return [];
  }
}

/**
 * Remove a specific offline scan by ID.
 */
export async function removeOfflineScan(id) {
  try {
    await update(OFFLINE_SCANS_KEY, (val) => {
      const scans = val || [];
      return scans.filter((scan) => scan.id !== id);
    });
  } catch (error) {
    console.error("Failed to remove offline scan:", error);
  }
}

/**
 * Attempt to upload pending offline scans to the server.
 */
export async function syncOfflineScans() {
  const scans = await getOfflineScans();
  if (scans.length === 0) return;

  console.log(`Attempting to sync ${scans.length} offline scans...`);
  for (const scan of scans) {
    try {
      const formData = new FormData();
      if (scan.imageFile) {
        formData.append("file", scan.imageFile);
      }
      formData.append("ocr_text", scan.ocrText || "");
      // Note: we can also pass the evaluationResult if the backend expects it,
      // but usually the backend will re-evaluate or just store it.

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        console.log(`Synced scan ${scan.id} successfully.`);
        await removeOfflineScan(scan.id);
      } else {
        console.error(
          `Failed to sync scan ${scan.id}: HTTP ${response.status}`,
        );
      }
    } catch (error) {
      console.error(`Error syncing scan ${scan.id}:`, error);
      // Stop syncing on first network error, likely still offline
      break;
    }
  }
}

// Automatically try to sync when network comes online
if (typeof window !== "undefined") {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((swRegistration) => {
      return swRegistration.sync.register('sync-offline-scans');
    }).catch((error) => {
      console.error('Background sync registration failed:', error);
      window.addEventListener("online", syncOfflineScans);
    });
  } else {
    window.addEventListener("online", syncOfflineScans);
  }
}
