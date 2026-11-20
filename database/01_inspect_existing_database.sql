-- READ ONLY. Run in Supabase SQL Editor before installing the migration.
-- Export these results if installation reports an incompatible schema/trigger.
select table_name, column_name, data_type, udt_name, is_nullable, column_default,
       is_generated
from information_schema.columns
where table_schema = 'public' and table_name in
 ('orders','order_items','products','customers','users','staff_members')
order by table_name, ordinal_position;

select n.nspname, p.proname, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_pos_order';

select c.relname as table_name, t.tgname, pg_get_triggerdef(t.oid) as trigger_definition,
       pg_get_functiondef(t.tgfoid) as function_definition
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
and c.relname in ('orders','order_items','products','customers');
