import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = env.VITE_DEFAULT_API_BASE_URL;

    return {
        plugins: [react()],
        build: {
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            {
                                name: "react-vendor",
                                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                                priority: 20,
                            },
                            {
                                name: "antd-vendor",
                                test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/,
                                priority: 10,
                                maxSize: 350_000,
                            },
                        ],
                    },
                },
            },
        },
        server: {
            watch: {
                usePolling: true,
            },
            host: true,
            port: 5173,
            ...(apiTarget
                ? {
                      proxy: {
                          "/qlmvt": {
                              target: apiTarget,
                              changeOrigin: true,
                              secure: false,
                          },
                          "/socket.io": {
                              target: apiTarget,
                              changeOrigin: true,
                              secure: false,
                              ws: true,
                          },
                      },
                  }
                : {}),
        },
    };
});
