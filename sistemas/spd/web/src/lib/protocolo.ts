import type { Prisma } from '@prisma/client'

/**
 * Gera o número de protocolo `NNNNNN/AAAA` (RN-022/023).
 * Incremento atômico via upsert na SequenciaProtocolo (uma linha por ano);
 * reseta naturalmente a cada ano (RN-024). Use dentro de uma transação.
 */
export async function gerarNumeroProtocolo(
  tx: Prisma.TransactionClient,
  ano: number,
): Promise<{ numeroSequencial: number; numeroProtocolo: string }> {
  const seq = await tx.sequenciaProtocolo.upsert({
    where: { ano },
    create: { ano, ultimaSequencia: 1 },
    update: { ultimaSequencia: { increment: 1 } },
  })
  const numeroSequencial = seq.ultimaSequencia
  const numeroProtocolo = `${String(numeroSequencial).padStart(6, '0')}/${ano}`
  return { numeroSequencial, numeroProtocolo }
}
