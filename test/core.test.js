const assert = require("node:assert/strict");
const test = require("node:test");
const { parseExpansions, buildOpenHtml, fetchExpansions } = require("../core.js");

test("parseExpansions accepts plain JSON", () => {
  const parsed = parseExpansions(
    '{"expansions":[{"s":"a monad","long":"a monad is a type that wraps values"}]}',
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].s, "a monad");
});

test("parseExpansions strips markdown fences and surrounding text", () => {
  const parsed = parseExpansions(
    "Here you go:\n```json\n{\"expansions\":[{\"s\":\"x\",\"long\":\"x y z\"}]}\n```\nDone.",
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].long, "x y z");
});

test("parseExpansions drops entries whose long does not start with s", () => {
  const parsed = parseExpansions(
    '{"expansions":[{"s":"a","long":"z a"},{"s":"b","long":"b c"}]}',
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].s, "b");
});

test("parseExpansions throws on non-JSON answers", () => {
  assert.throws(() => parseExpansions("sorry, I cannot do that"), /no JSON/);
  assert.throws(() => parseExpansions('{"expansions":[]}'), /no usable expansion/);
  assert.throws(() => parseExpansions('{"wrong":1}'), /no usable expansion/);
});

test("buildOpenHtml keeps the original phrase marked as the anchor", () => {
  const html = buildOpenHtml({ s: "a monad", long: "In programming, a monad is a generic type" }, 3);
  assert.match(html, /data-sttp="3"/);
  assert.match(html, /<mark class="sttp-orig">a monad<\/mark>/);
  assert.ok(html.startsWith("<span class=\"sttp-open\""));
});

test("fetchExpansions posts with the caller key and parses the reply", async (t) => {
  t.mock.method(globalThis, "fetch", async (input, init) => {
    assert.equal(String(input), "https://gen.pollinations.ai/v1/chat/completions");
    assert.equal(new Headers(init.headers).get("authorization"), "Bearer sk_test");
    assert.ok(JSON.parse(init.body).messages.length === 2);
    return Response.json({
      choices: [{ message: { content: '{"expansions":[{"s":"hello","long":"hello world"}]}' } }],
    });
  });
  const expansions = await fetchExpansions("hello", "sk_test");
  assert.equal(expansions[0].long, "hello world");
});

test("fetchExpansions maps 401 to a readable key hint", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: { message: "Bad key" } }, { status: 401 }),
  );
  await assert.rejects(
    () => fetchExpansions("phrase", "sk_bad"),
    /Check your Pollinations API key/,
  );
});

test("fetchExpansions requires a key and sane phrase length", async () => {
  await assert.rejects(() => fetchExpansions("x", ""), /API key missing/);
  await assert.rejects(() => fetchExpansions(" ", "sk_test"), /between 1 and 500/);
});