import Link from 'next/link'

export default function PortalHome() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secundaria">Bem-vindo</h1>
        <p className="opacity-70">
          Abra e acompanhe seus processos na Prefeitura de Dourados.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/abrir" className="rounded-lg border p-5 transition hover:border-primaria hover:shadow-sm">
          <div className="font-semibold">Abrir processo</div>
          <div className="text-sm opacity-60">Iniciar uma nova solicitação</div>
        </Link>
        <Link href="/portal/meus-processos" className="rounded-lg border p-5 transition hover:border-primaria hover:shadow-sm">
          <div className="font-semibold">Meus processos</div>
          <div className="text-sm opacity-60">Acompanhar o andamento</div>
        </Link>
      </div>
    </section>
  )
}
