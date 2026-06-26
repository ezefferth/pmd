import Link from 'next/link'

export default function InicioPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-secundaria">Protocolo Digital</h1>
      <p className="opacity-70">Área interna — gestão e tramitação de processos.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/organograma" className="rounded-lg border p-4 hover:border-primaria">
          <div className="font-semibold">Organograma</div>
          <div className="text-sm opacity-60">Níveis e unidades</div>
        </Link>
        <Link href="/assuntos" className="rounded-lg border p-4 hover:border-primaria">
          <div className="font-semibold">Assuntos</div>
          <div className="text-sm opacity-60">Tipos de processo por secretaria</div>
        </Link>
      </div>
    </section>
  )
}
