const test = require("node:test");
const assert = require("node:assert/strict");
const query = require("query-string");
test("Expo route query decoding preserves Unicode, dates, duplicates, and literal percent signs", () => {
  const parsed = query.parse(
    "source=daily&date=2026-09-25&label=%F0%9F%8D%B1+%26+rice&item=1&item=2&raw=100%25",
  );
  assert.equal(parsed.label, "🍱 & rice");
  assert.deepEqual(parsed.item, ["1", "2"]);
  assert.equal(parsed.raw, "100%");
  assert.equal(
    query.parse(query.stringify({ date: parsed.date, label: parsed.label }))
      .label,
    parsed.label,
  );
});
test("malformed percent encoding stays bounded and does not throw", () => {
  const started = performance.now();
  const parsed = query.parse("label=" + "%FF".repeat(20000));
  assert.equal(typeof parsed.label, "string");
  assert.ok(performance.now() - started < 1500);
});
test("Xcode build tooling still receives CommonJS uuid.v4", () => {
  const uuid = require(
    require.resolve("uuid", { paths: [require.resolve("xcode")] }),
  );
  assert.match(uuid.v4(), /^[0-9a-f-]{36}$/);
});
