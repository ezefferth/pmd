import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CudClient } from './cud.client'

@Injectable()
export class SincronizacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cud: CudClient,
  ) {}

  /** Publica toda a árvore de unidades e a ficha funcional dos servidores no CUD (RN-RH-018). */
  async publicarTudo() {
    const unidades = await this.prisma.unidadeOrganizacional.findMany()
    const setores = unidades.map((u) => ({
      rhId: u.id,
      nome: u.nome,
      sigla: u.sigla ?? undefined,
      paiRhId: u.paiId ?? undefined,
    }))
    const resultadoSetores = await this.cud.enviar('/sincronizacao/setores', {
      setores,
    })

    const servidores = await this.prisma.servidor.findMany({
      include: { cargo: { select: { nome: true } } },
    })
    const payload = servidores.map((s) => ({
      cpf: s.cpf,
      matricula: s.matricula ?? undefined,
      cargo: s.cargo?.nome,
      tipoVinculo: s.tipoVinculo,
      situacaoFuncional: s.situacao,
      unidadeRhId: s.unidadeLotacaoId,
      rhId: s.id,
      dataAdmissao: s.dataAdmissao.toISOString(),
      dataExoneracao: s.dataExoneracao?.toISOString(),
    }))
    const resultadoServidores = await this.cud.enviar(
      '/sincronizacao/servidores',
      { servidores: payload },
    )

    return { setores: resultadoSetores, servidores: resultadoServidores }
  }
}
