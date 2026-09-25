// Expo Router 57 uses query-string 7 (CommonJS). The patched decoder is ESM.
// Keep the security update compatible until Expo removes its older dependency.
const fs = require("node:fs");
const file = require.resolve("query-string");
const original = "const decodeComponent = require('decode-uri-component');";
const replacement =
  "const decodeModule = require('decode-uri-component');\nconst decodeComponent = decodeModule.default || decodeModule;";
const source = fs.readFileSync(file, "utf8");
if (source.includes(original))
  fs.writeFileSync(file, source.replace(original, replacement));
else if (!source.includes(replacement))
  throw new Error(
    "query-string changed: review and remove or update the decoder compatibility patch.",
  );
console.log("query-string: patched decoder import is compatible.");
