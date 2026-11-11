begin;
create table circuito.equipe(id uuid primary key references auth.users on delete cascade,cafe uuid references public.cic_cafes,admin boolean not null default false,check(admin or cafe is not null));
create function public.cic_painel() returns jsonb language plpgsql security definer set search_path='' as $$
declare e circuito.equipe; resultado jsonb;
begin
select * into e from circuito.equipe where id=auth.uid();
if not found then raise exception 'Acesso restrito';end if;
select jsonb_build_object('cafes',coalesce(jsonb_agg(to_jsonb(x) order by x.name),'[]'::jsonb)) into resultado from (
select c.name,c.combo,p.token,count(v.cafe) total,count(v.cafe) filter(where (v.instante at time zone 'America/Sao_Paulo')::date=(now() at time zone 'America/Sao_Paulo')::date) hoje from public.cic_cafes c join circuito.placas p on p.cafe=c.id left join public.cic_visitas v on v.cafe=c.id and v.valida where e.admin or c.id=e.cafe group by c.id,p.token)x;
if e.admin then
with participantes as(select v.pessoa,min(v.instante) inicio,max(v.instante) fim,count(*) total from public.cic_visitas v join public.cic_cafes c on c.id=v.cafe and c.active where v.valida group by v.pessoa)
select resultado||jsonb_build_object('primeiros',(select jsonb_agg(to_jsonb(x) order by inicio,pessoa) from(select u.email,p.inicio,p.pessoa from participantes p join auth.users u on u.id=p.pessoa order by inicio,pessoa limit 50)x),'conclusoes',(select jsonb_agg(to_jsonb(x) order by fim,pessoa) from(select u.email,p.fim,p.pessoa from participantes p join auth.users u on u.id=p.pessoa where total=(select count(*) from public.cic_cafes where active) order by fim,pessoa limit 10)x),'origens',(select jsonb_agg(to_jsonb(x)) from(select cidade,uf,count(*) participantes from public.cic_perfis group by cidade,uf)x)) into resultado;
end if;return resultado;end$$;
revoke all on function public.cic_painel() from public,anon;
grant execute on function public.cic_painel() to authenticated;
commit;
