-- Schemas isolados por sistema dentro do PostgreSQL compartilhado do Supabase
-- O Prisma de cada sistema gerencia suas próprias migrations dentro do schema correspondente

create schema if not exists cud;
create schema if not exists spd;
create schema if not exists keycloak;

-- Permissão total para o usuário padrão do Supabase local
grant all on schema cud to postgres;
grant all on schema spd to postgres;
grant all on schema keycloak to postgres;
