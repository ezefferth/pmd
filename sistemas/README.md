# sistemas/

Subprojetos da suíte PMD. Cada sistema é independente em código, mas compartilha a infraestrutura
(um único PostgreSQL com schemas isolados) e integra-se via **API HTTP** — nunca por acesso direto ao
banco do outro.

```
sistemas/
├── cud/   # Central de Usuários de Dourados — IdP, identidade e acessos
│   ├── auth-api/   # NestJS/Fastify (domínio + contrato de integração)
│   └── admin-web/  # Next.js (gerenciador de usuários)  ← a criar
├── spd/   # Sistema de Protocolo Digital                ← a criar
└── rh/    # Recursos Humanos (dado-mestre funcional)    ← a criar
```

## Integração (resumo)
- **SPD → CUD:** `GET /acessos/verificar` (permissão granular).
- **RH → CUD:** sincroniza ficha funcional + árvore de setores.
- Banco: um único PostgreSQL, schemas `cud` / `spd` / `rh` isolados (ver raiz `CLAUDE.md`).

Regras de negócio de cada sistema na raiz do workspace: `rn-central-de-usuarios.md`,
`rn-protocolo.md`, `rn-recursos-humanos.md`.
