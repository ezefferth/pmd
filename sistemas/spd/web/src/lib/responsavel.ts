import type { Prisma } from '@prisma/client'

export interface DestinoResolvido {
  /** Servidor a quem o processo será atribuído no destino; null = aberto ao setor. */
  usuarioAtribuidoId: string | null
  /** Quando o titular está inativo e a estratégia manda devolver à origem. */
  retornarOrigem: boolean
  /** Justificativa do redirecionamento (RN-088), quando houver desvio do titular. */
  motivoRedirecionamento?: string
}

/**
 * Resolve para quem encaminhar um processo ao chegar num organograma (RN-086/087/088).
 *
 * Considera o responsável titular do setor. Se ele estiver **funcionalmente inativo**
 * (proxy local: `Usuario.ativo = false`, até a sincronização da situação funcional do CUD),
 * aplica a `estrategiaResponsavelInativo` configurada no setor:
 *  - USUARIO_SECUNDARIO → suplente pré-declarado (`substitutoId`), se ativo;
 *  - ABERTO_SETOR       → sem responsável fixo (qualquer servidor do setor assume);
 *  - RETORNAR_ORIGEM    → sinaliza para a action devolver ao setor de origem.
 */
export async function resolverDestinoAtivo(
  tx: Prisma.TransactionClient,
  organogramaId: string,
): Promise<DestinoResolvido> {
  const titular = await tx.responsavelOrganograma.findFirst({
    where: { organogramaId, ehTitular: true },
    include: { usuario: { select: { id: true, ativo: true } } },
  })

  // sem titular cadastrado: processo fica aberto ao setor
  if (!titular) return { usuarioAtribuidoId: null, retornarOrigem: false }

  if (titular.usuario.ativo) {
    return { usuarioAtribuidoId: titular.usuario.id, retornarOrigem: false }
  }

  // titular inativo — aplica a estratégia do setor (RN-087)
  const config = await tx.configuracaoAtribuicaoOrganograma.findUnique({
    where: { organogramaId },
    select: { estrategiaResponsavelInativo: true },
  })
  const estrategia = config?.estrategiaResponsavelInativo ?? 'RETORNAR_ORIGEM'

  if (estrategia === 'USUARIO_SECUNDARIO' && titular.substitutoId) {
    const suplente = await tx.usuario.findUnique({
      where: { id: titular.substitutoId },
      select: { id: true, ativo: true },
    })
    if (suplente?.ativo) {
      return {
        usuarioAtribuidoId: suplente.id,
        retornarOrigem: false,
        motivoRedirecionamento:
          'Responsável titular inativo — encaminhado ao suplente (RN-087).',
      }
    }
  }

  if (estrategia === 'RETORNAR_ORIGEM') {
    return {
      usuarioAtribuidoId: null,
      retornarOrigem: true,
      motivoRedirecionamento:
        'Responsável titular inativo — processo devolvido ao setor de origem (RN-087).',
    }
  }

  // ABERTO_SETOR (ou suplente indisponível): sem responsável fixo
  return {
    usuarioAtribuidoId: null,
    retornarOrigem: false,
    motivoRedirecionamento:
      'Responsável titular inativo — processo aberto ao setor (RN-087).',
  }
}
