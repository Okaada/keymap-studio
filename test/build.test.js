import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { normalizeRun, findUf2 } from "../src/sync/build.js";

test("normalizeRun: vazio → none", () => {
  assert.deepEqual(normalizeRun("[]"), { none: true });
  assert.deepEqual(normalizeRun(""), { none: true });
  assert.deepEqual(normalizeRun("lixo não-json"), { none: true });
});

test("normalizeRun: em andamento / sucesso / falha", () => {
  const prog = normalizeRun(JSON.stringify([{ databaseId: 1, status: "in_progress", conclusion: null, url: "u", workflowName: "Build" }]));
  assert.equal(prog.status, "in_progress");
  assert.equal(prog.conclusion, null);
  assert.equal(prog.runId, 1);

  const ok = normalizeRun(JSON.stringify([{ databaseId: 2, status: "completed", conclusion: "success", url: "u" }]));
  assert.equal(ok.status, "completed");
  assert.equal(ok.conclusion, "success");

  const fail = normalizeRun(JSON.stringify([{ databaseId: 3, status: "completed", conclusion: "failure", url: "u" }]));
  assert.equal(fail.conclusion, "failure");
});

test("findUf2: seleciona .uf2 recursivamente, ignora o resto; vazio → []", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zmk-fw-"));
  try {
    await mkdir(join(dir, "firmware"), { recursive: true });
    await writeFile(join(dir, "firmware", "lily58_left-nice_nano.uf2"), "x");
    await writeFile(join(dir, "firmware", "lily58_right-nice_nano.uf2"), "x");
    await writeFile(join(dir, "firmware", "notes.txt"), "x");
    const found = await findUf2(dir);
    const names = found.map((f) => f.name).sort();
    assert.deepEqual(names, ["lily58_left-nice_nano.uf2", "lily58_right-nice_nano.uf2"]);

    const empty = await mkdtemp(join(tmpdir(), "zmk-fw-empty-"));
    assert.deepEqual(await findUf2(empty), []);
    await rm(empty, { recursive: true, force: true });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
