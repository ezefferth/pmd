import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'spd-documentos'

function cliente(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Storage não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }
  // service role: uso server-side apenas (nunca expor a chave no cliente)
  return createClient(url, key, { auth: { persistSession: false } })
}

async function garantirBucket(supabase: SupabaseClient): Promise<void> {
  const { data } = await supabase.storage.getBucket(BUCKET)
  if (!data) {
    // bucket privado — acesso só por URL assinada (RN-077: visibilidade controlada)
    await supabase.storage.createBucket(BUCKET, { public: false })
  }
}

/** Envia o arquivo ao bucket privado e devolve o caminho do objeto (guardado em Documento.urlArquivo). */
export async function enviarDocumento(
  processoId: string,
  arquivo: File,
): Promise<{ caminho: string; tamanho: number }> {
  const supabase = cliente()
  await garantirBucket(supabase)

  const extensao = arquivo.name.includes('.') ? arquivo.name.split('.').pop() : 'bin'
  const caminho = `${processoId}/${crypto.randomUUID()}.${extensao}`
  const buffer = Buffer.from(await arquivo.arrayBuffer())

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, buffer, {
    contentType: arquivo.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`)

  return { caminho, tamanho: buffer.byteLength }
}

/** Gera URL assinada temporária para baixar/visualizar a peça (bucket privado). */
export async function urlAssinada(
  caminho: string,
  segundos = 3600,
): Promise<string | null> {
  const supabase = cliente()
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, segundos)
  return data?.signedUrl ?? null
}
