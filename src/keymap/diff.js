// Helper de diff textual compartilhado (preview do editor + preview do sync).
// Encapsula `git --no-index diff` sobre arquivos temporários; degrada sem lançar
// quando o git/ambiente não permite, ainda reportando `changed` corretamente.

import { execFile } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function exec(cmd, args, opts = {}) {
  return new Promise((resolveP) => {
    execFile(cmd, args, { maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) => {
      resolveP({ code: err ? (err.code ?? 1) : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

const safe = (s) => String(s).replace(/[^\w.-]/g, "_") || "f";

// Diff unificado entre dois textos. `labelA`/`labelB` nomeiam os lados no cabeçalho.
// Retorna { changed, diff }. `diff` vazio quando os textos são idênticos.
export async function diffText(a, b, { labelA = "a", labelB = "b" } = {}) {
  if (a === b) return { changed: false, diff: "" };
  let dir;
  try {
    dir = await mkdtemp(join(tmpdir(), "zmk-diff-"));
    const pa = join(dir, safe(labelA));
    const pb = join(dir, safe(labelB));
    await Promise.all([writeFile(pa, a ?? ""), writeFile(pb, b ?? "")]);
    const d = await exec("git", ["--no-pager", "diff", "--no-index", "--", pa, pb]);
    return { changed: true, diff: d.stdout || "(arquivos diferem; diff indisponível)" };
  } catch {
    return { changed: true, diff: "(arquivos diferem; diff indisponível)" };
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
