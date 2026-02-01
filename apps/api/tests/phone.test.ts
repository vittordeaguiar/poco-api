import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhone } from "../src/lib/phone";

test("normalizePhone removes non-digits and keeps DDI/DDD", () => {
  assert.equal(normalizePhone("+55 (11) 9 9999-9999"), "5511999999999");
  assert.equal(normalizePhone("11-9999-9999"), "1199999999");
  assert.equal(normalizePhone("11999999999"), "11999999999");
});

test("normalizePhone returns null when empty", () => {
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone("  "), null);
  assert.equal(normalizePhone("abc"), null);
  assert.equal(normalizePhone(undefined), null);
});
