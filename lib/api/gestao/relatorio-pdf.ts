import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

/**
 * Converte o .docx já preenchido em PDF com o LibreOffice do servidor, para o
 * PDF sair idêntico ao Word (fontes, tabela, cabeçalho). Requer `soffice` e a
 * fonte Carlito (métrica do Calibri) instalados — RUNBOOK §2.
 */
export async function docxParaPdf(docx: Uint8Array): Promise<Uint8Array> {
  const pasta = await mkdtemp(path.join(tmpdir(), "relatorio-"));
  try {
    const entrada = path.join(pasta, "relatorio.docx");
    await writeFile(entrada, docx);
    // Perfil próprio por conversão: dois downloads ao mesmo tempo não disputam o lock do LibreOffice.
    await promisify(execFile)(
      process.env.SOFFICE_PATH || "soffice",
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=${pathToFileURL(path.join(pasta, "perfil")).href}`,
        "--convert-to",
        "pdf",
        "--outdir",
        pasta,
        entrada,
      ],
      { timeout: 60_000, cwd: pasta, env: { ...process.env, HOME: pasta } },
    );
    return new Uint8Array(await readFile(path.join(pasta, "relatorio.pdf")));
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}
