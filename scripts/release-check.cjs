const { loadEnvFiles } = require(
  require.resolve("@expo/env", {
    paths: [require.resolve("expo/package.json")],
  }),
);
loadEnvFiles(process.cwd(), { mode: "production" });
const native = !process.argv.includes("--web");
const checks = [
  [
    "EXPO_PUBLIC_DEVELOPER_NAME",
    (v) => v.trim().length > 1,
    "Set your public developer/company name.",
  ],
  [
    "EXPO_PUBLIC_SUPPORT_EMAIL",
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Set a working support inbox.",
  ],
  [
    "EXPO_PUBLIC_WEBSITE_URL",
    (v) => {
      try {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          !/localhost|example\.(com|org)|yourcompany/.test(u.hostname)
        );
      } catch {
        return false;
      }
    },
    "Set your real HTTPS website.",
  ],
  ...(native
    ? [
        [
          "BENTO_APP_ID",
          (v) =>
            /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(v) &&
            !/example|yourcompany/.test(v),
          "Set a permanent reverse-domain bundle/package ID you control.",
        ],
        [
          "EAS_PROJECT_ID",
          (v) =>
            /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
              v,
            ),
          "Link your own Expo project.",
        ],
      ]
    : []),
];
const missing = checks.filter(([key, valid]) => !valid(process.env[key] || ""));
if (missing.length) {
  console.error("Release identity is incomplete. Local previews still work.");
  missing.forEach(([key, , message]) => console.error(`${key}: ${message}`));
  process.exitCode = 1;
} else
  console.log(
    "Release identity is configured. Store credentials, device testing, public URLs, and security review still require verification.",
  );
