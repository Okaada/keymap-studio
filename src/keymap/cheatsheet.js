// Export de cheatsheet (D6): keymap-drawer PARSEIA o arquivo real (read-only, a
// perda de informação do parser dele é irrelevante para uma imagem) e DESENHA com
// o layout embutido (`layout: {zmk_keyboard: lily58}` que o próprio parse emite),
// mantendo consistência de layout com o editor. Depois SVG→PDF via rsvg-convert.

import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 1 << 24, ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        reject(err);
      } else resolve({ stdout, stderr });
    });
  });
}

async function has(cmd, args = ["--version"]) {
  try {
    await run(cmd, args);
    return true;
  } catch {
    return false;
  }
}

// Gera SVG (sempre, se possível) e PDF (se rsvg-convert existir).
// Retorna { svg, pdfPath|null, warning|null }.
// `keyboard` força o layout físico no draw (ex.: "lily58"), em vez de deixar o
// keymap-drawer inferir pelo nome do arquivo — robusto e consistente com o editor.
export async function buildCheatsheet(keymapPath, outDir, keyboard = "lily58") {
  if (!(await has("uvx", ["--help"]))) {
    throw new Error(
      "`uvx` não encontrado. Instale o uv (https://docs.astral.sh/uv/) — o cheatsheet usa `uvx keymap-drawer`."
    );
  }

  await mkdir(outDir, { recursive: true });
  const tmp = await mkdtemp(join(tmpdir(), "zmk-cheatsheet-"));
  const yamlPath = join(tmp, "keymap.yaml");
  const svgPath = join(outDir, "cheatsheet.svg");
  const pdfPath = join(outDir, "cheatsheet.pdf");

  // 1) parse → YAML (com layout embutido)
  const { stdout: yaml } = await run("uvx", [
    "--from",
    "keymap-drawer",
    "keymap",
    "parse",
    "-z",
    keymapPath,
  ]);
  await writeFile(yamlPath, yaml);

  // 2) draw → SVG (layout físico forçado via -z <keyboard>)
  await run("uvx", ["--from", "keymap-drawer", "keymap", "draw", "-z", keyboard, yamlPath, "-o", svgPath]);
  const svg = await readFile(svgPath, "utf8");

  // 3) SVG → PDF (opcional)
  let warning = null;
  let pdf = null;
  if (await has("rsvg-convert")) {
    await run("rsvg-convert", [svgPath, "-f", "pdf", "-o", pdfPath]);
    pdf = pdfPath;
  } else {
    warning =
      "rsvg-convert não encontrado: PDF não gerado. Alternativa: abrir o SVG no navegador e usar Imprimir → Salvar como PDF.";
  }

  return { svg, svgPath, pdfPath: pdf, warning };
}
