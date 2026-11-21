import { ConfigProvider, theme } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { useTheme } from "./contexts/useTheme";
import { AuthProvider } from "./features/auth/AuthContext";
import { router } from "./routes";

import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import { MetadataProvider } from "./contexts/MetadataContext";

const App: React.FC = () => {
  const { dark } = useTheme();
  const { i18n } = useTranslation();
  const antdLocale = i18n.language.startsWith("en") ? enUS : viVN;
  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
        },
      }}
    >
      <AuthProvider>
        <MetadataProvider>
          <RouterProvider router={router} />
        </MetadataProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
