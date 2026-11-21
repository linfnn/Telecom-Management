export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type QueryParams = Record<string, QueryValue>;

export type ApiSuccessEnvelope<T = unknown> = {
  success: boolean;
  message?: string;
  warning?: string;
  data?: T;
};

export type Role = "Admin" | "Technician" | "Supervisor";

export type UserContext = {
  requesterRole?: string;
  requesterId?: string | number;
  assigneeId?: string | number;
};
