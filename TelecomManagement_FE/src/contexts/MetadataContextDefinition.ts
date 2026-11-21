import { createContext } from "react";

export type SelectOption = {
  value: number;
  label: string;
};

export interface MetadataContextType {
  deviceOptions: SelectOption[];
  employeeOptions: SelectOption[];
  loading: boolean;
  refreshMetadata: () => Promise<void>;
}

export const MetadataContext = createContext<MetadataContextType | undefined>(
  undefined,
);
