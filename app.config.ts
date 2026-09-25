import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const appId = process.env.BENTO_APP_ID;
  const projectId = process.env.EAS_PROJECT_ID;
  return {
    ...config,
    name: config.name ?? "Bento Blocks",
    slug: config.slug ?? "bento-blocks",
    ios: { ...config.ios, ...(appId ? { bundleIdentifier: appId } : {}) },
    android: { ...config.android, ...(appId ? { package: appId } : {}) },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { projectId } } : {}),
      developerName: process.env.EXPO_PUBLIC_DEVELOPER_NAME ?? "",
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "",
      website: process.env.EXPO_PUBLIC_WEBSITE_URL ?? "",
    },
  };
};
