import { io, type Socket } from "socket.io-client";
import { ApiError, apiPost } from "./http";
import type { NetworkTopologyResponse } from "./networkMonitorApi";

const API_PREFIX = "/qlmvt";

export type NetworkMonitorConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "unauthorized";

type NetworkMonitorSocket = Socket;

type NetworkMonitorSocketHandlers = {
  onSnapshot: (snapshot: NetworkTopologyResponse) => void;
  onStatus: (status: NetworkMonitorConnectionState) => void;
  onError: (message: string) => void;
};

type RefreshTokenResponse = {
  access: string;
  refresh?: string;
};

async function refreshAccessToken(): Promise<
  "refreshed" | "unauthorized" | "unavailable"
> {
  const refreshToken = window.localStorage.getItem("refreshToken");
  if (!refreshToken) return "unauthorized";

  try {
    const response = await apiPost<RefreshTokenResponse>(
      `${API_PREFIX}/api_refresh_token/`,
      { refresh: refreshToken },
    );
    if (!response.access) return "unavailable";
    window.localStorage.setItem("accessToken", response.access);
    if (response.refresh) {
      window.localStorage.setItem("refreshToken", response.refresh);
    }
    return "refreshed";
  } catch (error) {
    if (error instanceof ApiError && [400, 401].includes(error.status)) {
      return "unauthorized";
    }
    return "unavailable";
  }
}

function getSocketOrigin(): string {
  const baseUrl = import.meta.env.DEV
    ? window.location.origin
    : import.meta.env.VITE_DEFAULT_API_BASE_URL || window.location.origin;
  return new URL(baseUrl).origin;
}

export function connectNetworkMonitorSocket(
  handlers: NetworkMonitorSocketHandlers,
): () => void {
  let disposed = false;
  let refreshing = false;
  let refreshTimer: number | undefined;
  let socket: NetworkMonitorSocket | null = null;

  const refreshAndReconnect = async () => {
    if (refreshing || disposed || refreshTimer !== undefined) return;
    refreshing = true;
    const result = await refreshAccessToken();
    refreshing = false;

    if (disposed) return;
    if (result === "refreshed") {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = undefined;
      handlers.onStatus("connecting");
      socket?.disconnect();
      socket?.connect();
    } else if (result === "unauthorized") {
      handlers.onStatus("unauthorized");
    } else {
      handlers.onError("Không thể làm mới access token cho Socket.IO.");
      handlers.onStatus("disconnected");
      refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        void refreshAndReconnect();
      }, 5000);
    }
  };

  handlers.onStatus("connecting");
  socket = io(getSocketOrigin(), {
    path: "/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
    auth: (callback) => {
      callback({ token: window.localStorage.getItem("accessToken") });
    },
  });

  socket.on("connect", () => {
    if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    refreshTimer = undefined;
    handlers.onStatus("connected");
    socket?.emit("subscribe_network_monitor");
  });
  socket.on("network_snapshot", (snapshot: NetworkTopologyResponse) => {
    handlers.onSnapshot(snapshot);
  });
  socket.on("network_error", (payload: { message: string }) => {
    const errorMessage = payload.message;
    handlers.onError(errorMessage);
  });
  socket.on("auth_expired", () => {
    void refreshAndReconnect();
  });
  socket.on("connect_error", (error) => {
    if (error.message.toLowerCase().includes("unauthorized")) {
      void refreshAndReconnect();
      return;
    }
    handlers.onError(error.message);
    handlers.onStatus("disconnected");
  });
  socket.on("disconnect", () => {
    if (!disposed) handlers.onStatus("disconnected");
  });

  socket.connect();

  return () => {
    disposed = true;
    if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
  };
}
