import Constants from "expo-constants";
const extra = Constants.expoConfig?.extra;
export const release = {
  version: Constants.expoConfig?.version ?? "1.0.0",
  developer:
    typeof extra?.developerName === "string" ? extra.developerName : "",
  supportEmail:
    typeof extra?.supportEmail === "string" ? extra.supportEmail : "",
  website:
    typeof extra?.website === "string" ? extra.website.replace(/\/$/, "") : "",
};
