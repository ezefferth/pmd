#!/usr/bin/env bash
# Cria/atualiza as labels da suíte PMD no repositório remoto (GitHub).
# Requisitos: gh CLI autenticado (gh auth login) e um remote 'origin' já configurado.
# Uso: bash .github/scripts/setup-labels.sh

set -euo pipefail

criar() {
  local nome="$1" cor="$2" desc="$3"
  # --force atualiza se já existir
  gh label create "$nome" --color "$cor" --description "$desc" --force
}

# Tipo
criar "feat"        "1d76db" "Nova funcionalidade ou melhoria"
criar "bug"         "d73a4a" "Comportamento incorreto"
criar "refactor"    "5319e7" "Refatoração sem mudança de comportamento"
criar "docs"        "0075ca" "Documentação / regras de negócio"
criar "infra"       "455a64" "Infraestrutura, build, CI, Supabase"
criar "integração"  "fbca04" "Contrato CUD <-> SPD"
criar "test"        "0e8a16" "Testes automatizados"

# Escopo
criar "cud"          "c5def5" "Central de Usuários de Dourados"
criar "spd"          "bfd4f2" "Sistema de Protocolo Digital"
criar "rh"           "b3e5d1" "Sistema de Recursos Humanos"
criar "infra-escopo" "d4c5f9" "Infra compartilhada (Supabase, Redis)"
criar "pmd"          "e8eaf6" "Transversal ao workspace"

# Status
criar "status:backlog"      "ededed" "Aguardando início"
criar "status:em-andamento" "fbca04" "Em desenvolvimento agora"
criar "status:revisão"      "0075ca" "Em revisão / PR aberto"
criar "status:bloqueado"    "d73a4a" "Bloqueado por dependência"

echo "Labels aplicadas."
