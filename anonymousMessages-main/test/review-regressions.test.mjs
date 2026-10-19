import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
test("message endpoint enforces schema/body, conditional acceptance and bounded inbox", () => {
  const route = read("../src/app/api/send-message/route.ts");
  assert.match(route, /MAX_BODY_BYTES = 8 \* 1024/);
  assert.match(route, /requestSchema\.safeParse/);
  assert.match(read("../src/lib/readBoundedBody.ts"), /reader\.read\(\)/);
  assert.match(route, /isAcceptingMessage: true/);
  assert.match(route, /messages\.99.*\$exists: false/);
  assert.match(route, /\$slice: -100/);
});
test("public AI route bounds input, history, output and request frequency", () => {
  const route = read("../src/app/api/suggest-messages/route.ts");
  assert.match(route, /MAX_BODY_BYTES = 12 \* 1024/);
  assert.match(route, /readBoundedBody/);
  assert.match(route, /MAX_MESSAGES = 8/);
  assert.match(route, /MAX_OUTPUT_TOKENS = 256/);
  assert.match(route, /REQUESTS_PER_WINDOW = 10/);
  assert.match(route, /requestSchema\.safeParse/);
  assert.match(read("../src/lib/readBoundedBody.ts"), /reader\.read\(\)/);
});
test("registration sends only safe template and checks delivery result", () => {
  const route = read("../src/app/api/sign-up/route.ts");
  assert.match(route, /signUpSchema\.safeParse/);
  assert.match(route, /sendVerificationEmail\(email, username, verifyCode\)/);
  assert.doesNotMatch(route, /html:\s*`/);
  assert.doesNotMatch(route, /new Resend/);
  assert.match(read("../src/helpers/sendverificationEmail.ts"), /result\.error/);
});
test("verification is schema-validated and one-time; deleted user filter uses owner id", () => {
  const verify = read("../src/app/api/verify-code/route.ts");
  assert.match(verify, /verifySchema\.safeParse/);
  assert.match(verify, /findOneAndUpdate/);
  assert.match(verify, /verifyAttempts: \{ \$lt: 5 \}/);
  assert.match(verify, /readBoundedBody/);
  assert.match(verify, /verifyCode: \"\"/);
  assert.match(read("../src/app/api/delete-message/[messageid]/route.ts"), /_id: _user\._id/);
});
test("preference updates validate payload and avoid returning full user documents", () => {
  const route = read("../src/app/api/accept-messages/route.ts");
  assert.match(route, /acceptMessageSchema\.safeParse/);
  assert.doesNotMatch(route, /updatedUser\s*[,}]/);
});
test("database connection errors propagate instead of exiting the process", () => {
  assert.doesNotMatch(read("../src/lib/dbConnect.ts"), /process\.exit/);
  assert.match(read("../src/lib/dbConnect.ts"), /throw error/);
});
