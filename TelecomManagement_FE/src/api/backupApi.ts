import { apiGetBlob, apiPostFormData } from "./http";
import type { ApiSuccessEnvelope } from "./types";

const API_PREFIX = "/qlmvt";

export type RestoreDatabaseResponse = ApiSuccessEnvelope<{
  [model: string]: { added: number; skipped: number };
}>;

export function backupDatabase(): Promise<Blob> {
  return apiGetBlob(`${API_PREFIX}/api_backup_database`);
}

export function restoreDatabaseByFile(
  file: File,
): Promise<RestoreDatabaseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<RestoreDatabaseResponse>(
    `${API_PREFIX}/api_restore_database`,
    formData,
  );
}
