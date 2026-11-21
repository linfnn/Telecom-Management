import { useContext } from "react";
import { MetadataContext } from "./MetadataContextDefinition";

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error("useMetadata phải được bọc trong MetadataProvider");
  }
  return context;
};
