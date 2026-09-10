import test from "node:test";
import assert from "node:assert/strict";
import { validatePhoto, validateContact, MAX_PHOTO_BYTES } from "../lib/layeredfx/validation.mjs";
test("valid contact", () => assert.deepEqual(validateContact({ name: "Test Person", email: "test@example.com" }), {}));
test("blank name and invalid email", () => assert.deepEqual(Object.keys(validateContact({ name: "  ", email: "bad" })).sort(), ["email", "name"]));
test("accept jpg", () => assert.equal(validatePhoto({ type: "image/jpeg", size: 100 }), null));
test("reject SVG uploads", () => assert.ok(validatePhoto({ type: "image/svg+xml", size: 100 })));
test("reject oversized uploads", () => assert.ok(validatePhoto({ type: "image/png", size: MAX_PHOTO_BYTES + 1 })));
test("allow exact size limit", () => assert.equal(validatePhoto({ type: "image/webp", size: MAX_PHOTO_BYTES }), null));
