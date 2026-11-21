import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import axiosClient from "./axiosClient";
import type { QueryParams } from "./types";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function toSearchParams(params: QueryParams = {}): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item == null) continue;
        searchParams.append(key, String(item));
      }
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams;
}

function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 0;
    const data = axiosError.response?.data;
    const fallback = status > 0 ? `HTTP ${status}` : "Network error";
    let message: string | undefined;
    if (typeof data === "object" && data !== null) {
      const body = data as Record<string, unknown>;
      if (typeof body.message === "string") {
        message = body.message;
      } else if (typeof body.error === "string") {
        message = body.error;
      } else if (body.error !== undefined) {
        message = JSON.stringify(body.error);
      } else if (Object.keys(body).length > 0) {
        message = JSON.stringify(body);
      }
    } else if (typeof data === "string" && data.trim()) {
      message = data;
    }

    return new ApiError(message ?? axiosError.message ?? fallback, status, data);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, undefined);
  }

  return new ApiError("Unknown API error", 0, undefined);
}

export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await axiosClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function apiGet<T = unknown>(
  url: string,
  params?: QueryParams,
): Promise<T> {
  return apiRequest<T>({
    url,
    method: "GET",
    params,
    paramsSerializer: (rawParams) =>
      toSearchParams(rawParams as QueryParams).toString(),
  });
}

export async function apiPost<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  params?: QueryParams,
): Promise<T> {
  return apiRequest<T>({
    url,
    method: "POST",
    data: body,
    params,
    paramsSerializer: (rawParams) =>
      toSearchParams(rawParams as QueryParams).toString(),
  });
}

export async function apiPut<T = unknown, TBody = unknown>(
  url: string,
  body?: TBody,
  params?: QueryParams,
): Promise<T> {
  return apiRequest<T>({
    url,
    method: "PUT",
    data: body,
    params,
    paramsSerializer: (rawParams) =>
      toSearchParams(rawParams as QueryParams).toString(),
  });
}

export async function apiDelete<T = unknown>(
  url: string,
  params?: QueryParams,
): Promise<T> {
  return apiRequest<T>({
    url,
    method: "DELETE",
    params,
    paramsSerializer: (rawParams) =>
      toSearchParams(rawParams as QueryParams).toString(),
  });
}

export async function apiPostFormData<T = unknown>(
  url: string,
  formData: FormData,
  params?: QueryParams,
): Promise<T> {
  return apiRequest<T>({
    url,
    method: "POST",
    data: formData,
    params,
    paramsSerializer: (rawParams) =>
      toSearchParams(rawParams as QueryParams).toString(),
  });
}

export async function apiGetBlob(
  url: string,
  params?: QueryParams,
): Promise<Blob> {
  try {
    const response = await axiosClient.request<Blob>({
      url,
      method: "GET",
      responseType: "blob",
      params,
      paramsSerializer: (rawParams) =>
        toSearchParams(rawParams as QueryParams).toString(),
    });

    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
