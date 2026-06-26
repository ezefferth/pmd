import { Injectable } from '@nestjs/common'
import { SituacaoFuncional, TipoVinculo } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import {
  SincronizarSetoresDto,
  SincronizarServidoresDto,
  ServidorSyncDto,
} from './dto/sincronizar.dto'

@Injectable()
export class SincronizacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert da árvore de setores vinda do RH (por rhId). RN-RH-018. */
  async sincronizarSetores(dto: SincronizarSetoresDto) {
    // 1ª passada: upsert sem pai
    for (const s of dto.setores) {
      await this.prisma.setor.upsert({
        where: { rhId: s.rhId },
        create: { rhId: s.rhId, nome: s.nome, sigla: s.sigla },
        update: { nome: s.nome, sigla: s.sigla },
      })
    }
    // 2ª passada: resolve o pai por rhId
    for (const s of dto.setores) {
      if (!s.paiRhId) continue
      const pai = await this.prisma.setor.findUnique({
        where: { rhId: s.paiRhId },
        select: { id: true },
      })
      if (pai) {
        await this.prisma.setor.update({
          where: { rhId: s.rhId },
          data: { paiId: pai.id },
        })
      }
    }
    return { sincronizados: dto.setores.length }
  }

  /** Sincroniza ficha funcional + vínculo/lotação dos servidores (por CPF). */
  async sincronizarServidores(dto: SincronizarServidoresDto) {
    const naoEncontrados: string[] = []
    let aplicados = 0

    for (const servidor of dto.servidores) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { cpf: servidor.cpf },
        select: { id: true },
      })
      if (!usuario) {
        naoEncontrados.push(servidor.cpf)
        continue
      }
      await this.aplicarServidor(usuario.id, servidor)
      aplicados++
    }

    return { aplicados, naoEncontrados }
  }

  private async aplicarServidor(usuarioId: string, dado: ServidorSyncDto) {
    const setorId = dado.unidadeRhId
      ? (
          await this.prisma.setor.findUnique({
            where: { rhId: dado.unidadeRhId },
            select: { id: true },
          })
        )?.id ?? null
      : null

    const desligado =
      dado.situacaoFuncional === SituacaoFuncional.EXONERADO ||
      dado.situacaoFuncional === SituacaoFuncional.APOSENTADO

    // RN-CUD-054: exonerado/aposentado rebaixa para EXTERNO
    const tipoVinculo = desligado ? TipoVinculo.EXTERNO : dado.tipoVinculo

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { tipoVinculo, setorId, matricula: dado.matricula ?? null },
    })

    await this.prisma.fichaFuncional.upsert({
      where: { usuarioId },
      create: {
        usuarioId,
        rhId: dado.rhId,
        matricula: dado.matricula,
        cargo: dado.cargo,
        setorLotacaoId: setorId,
        situacaoFuncional: dado.situacaoFuncional,
        dataAdmissao: dado.dataAdmissao ? new Date(dado.dataAdmissao) : undefined,
        dataExoneracao: dado.dataExoneracao
          ? new Date(dado.dataExoneracao)
          : undefined,
      },
      update: {
        rhId: dado.rhId,
        matricula: dado.matricula,
        cargo: dado.cargo,
        setorLotacaoId: setorId,
        situacaoFuncional: dado.situacaoFuncional,
        dataExoneracao: dado.dataExoneracao
          ? new Date(dado.dataExoneracao)
          : undefined,
      },
    })

    // RN-CUD-051: desligado perde acessos a perfis internos (permiteExterno = false)
    if (desligado) {
      await this.prisma.acesso.updateMany({
        where: { usuarioId, ativo: true, perfil: { permiteExterno: false } },
        data: { ativo: false },
      })
    }
  }
}
