import { prisma } from '@/lib/prisma'
import { obterUsuarioAtual } from '@/lib/sessao'
import { AbrirForm, type AssuntoPortal } from './abrir-form'

export default async function AbrirPage() {
  const usuario = await obterUsuarioAtual()

  const [assuntosDb, organogramas] = await Promise.all([
    prisma.assunto.findMany({
      where: {
        disponivelParaNovasAberturas: true,
        permiteAberturaExterna: true,
        ativo: true,
      },
      include: { camposAdicionais: { orderBy: { ordem: 'asc' } } },
      orderBy: { nome: 'asc' },
    }),
    prisma.organograma.findMany({ select: { id: true, sigla: true, codigo: true } }),
  ])

  const nomeOrg = (id: string) => {
    const org = organogramas.find((o) => o.id === id)
    return org?.sigla ?? org?.codigo ?? id
  }

  const assuntos: AssuntoPortal[] = assuntosDb.map((a) => ({
    id: a.id,
    nome: a.nome,
    secretariaId: a.secretariaId,
    secretariaNome: nomeOrg(a.secretariaId),
    campos: a.camposAdicionais.map((c) => ({
      id: c.id,
      rotulo: c.rotulo,
      tipo: c.tipo,
      placeholder: c.placeholder,
      obrigatorio: c.obrigatorio,
    })),
  }))

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-secundaria">Abrir processo</h1>
      {assuntos.length === 0 ? (
        <p className="text-sm opacity-70">
          Nenhum assunto disponível para abertura no momento.
        </p>
      ) : (
        <AbrirForm
          assuntos={assuntos}
          cpfInicial={usuario?.cpf ?? ''}
          nomeInicial={usuario?.nome ?? ''}
        />
      )}
    </section>
  )
}
