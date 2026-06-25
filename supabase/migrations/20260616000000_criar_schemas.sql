-- Schemas isolados por sistema dentro do PostgreSQL compartilhado do Supabase.
-- O Prisma de cada sistema gerencia suas próprias migrations dentro do schema correspondente.
-- O schema `public` é gerenciado pelo Supabase.

create schema if not exists cud; -- Central de Usuários de Dourados
create schema if not exists spd; -- Sistema de Protocolo Digital
create schema if not exists rh;  -- Recursos Humanos

-- Permissão total para o usuário padrão do Supabase local
grant all on schema cud to postgres;
grant all on schema spd to postgres;
grant all on schema rh to postgres;
