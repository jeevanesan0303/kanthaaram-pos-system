-- Additive migration. Does not replace create_pos_order, delete sales or disable RLS.
-- V2: matched to the three CSV exports supplied on 6 November 2026.
-- See ORDER-EDIT-SETUP.md. Existing stock and timestamp triggers are retained.
begin;

-- Catch missing columns and incompatible custom line-total fields before deployment.
do $check$
declare v_missing text;
begin
  select string_agg(req.tbl || '.' || req.col, ', ') into v_missing
  from (values
    ('orders','customer_id'),('orders','order_number'),('orders','subtotal'),('orders','discount'),('orders','tax'),('orders','total'),
    ('order_items','id'),('order_items','order_id'),('order_items','product_id'),('order_items','product_name'),('order_items','quantity'),('order_items','unit_price'),('order_items','notes'),
    ('categories','name'),('products','category_id'),('orders','is_deleted'),('products','stock'),('customers','total_spent'),('staff_members','auth_user_id')
  ) req(tbl,col)
  where not exists(select 1 from information_schema.columns c where c.table_schema='public' and c.table_name=req.tbl and c.column_name=req.col);
  if v_missing is not null then raise exception 'Missing database columns: %. Export 01_inspect_existing_database.sql results.',v_missing; end if;
  select string_agg(column_name,', ') into v_missing from information_schema.columns
    where table_schema='public' and table_name='order_items' and is_generated='NEVER'
    and ((column_name not in ('order_id','product_id','product_name','quantity','unit_price','notes')
      and is_nullable='NO' and column_default is null and is_identity='NO')
      or column_name in ('line_total','total_price','subtotal','total'));
  if v_missing is not null then raise exception 'Custom order_items columns need integration: %. Export schema before installing.',v_missing; end if;
end $check$;

do $triggers$
declare v_trigger text;
begin
  -- Verify the four reviewed trigger bodies. Never disable/replace them.
  with expected(tbl, name, body_hash) as (values
    ('customers','trigger_customers_updated_at','31d110f848074259d7f62f2158cc6d46'),
    ('order_items','trg_order_items_product_stock','3e7e184ac1d12d81684cc20e94723ebd'),
    ('orders','orders_set_updated_at','d258fba5feeb9ce8126471bef81c3228'),
    ('products','trigger_products_updated_at','31d110f848074259d7f62f2158cc6d46')
  ), actual as (
    select c.relname::text tbl, t.tgname::text name,
      md5(regexp_replace(lower(f.prosrc), '\s', '', 'g')) body_hash,
      t.tgenabled, t.tgtype, t.tgqual, t.tgnargs
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace join pg_proc f on f.oid=t.tgfoid
    where n.nspname='public' and c.relname in ('orders','order_items','products','customers')
      and not t.tgisinternal
  )
  select string_agg(coalesce(e.tbl,a.tbl)||'.'||coalesce(e.name,a.name),', ') into v_trigger
  from expected e full join actual a on a.tbl=e.tbl and a.name=e.name
  where e.body_hash is distinct from a.body_hash or a.tgenabled not in ('O','A')
    or a.tgqual is not null or a.tgnargs<>0
    or a.tgtype <> case when e.tbl='order_items' then 31 else 19 end;
  if v_trigger is not null then
    raise exception 'Database triggers differ from the reviewed export: %. Export current definitions; do not disable triggers.', v_trigger;
  end if;
end $triggers$;

create table if not exists public.pos_order_edit_audit (
  request_id uuid primary key,
  order_id uuid not null,
  actor_id uuid not null,
  edited_at timestamptz not null default now(),
  request_body jsonb not null,
  before_sale jsonb not null,
  after_sale jsonb not null
);
alter table public.pos_order_edit_audit enable row level security;
revoke all on public.pos_order_edit_audit from public, anon, authenticated;

create or replace function public.edit_completed_pos_order(
  p_order_number text, p_request_id uuid, p_expected jsonb,
  p_header jsonb, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_new public.orders%rowtype;
  v_olditem public.order_items%rowtype;
  v_line jsonb;
  v_before jsonb;
  v_after jsonb;
  v_snapshot jsonb;
  v_item_id uuid;
  v_product_id uuid;
  v_name text;
  v_ids uuid[] := array[]::uuid[];
  v_qty numeric;
  v_price numeric;
  v_subtotal numeric := 0;
  v_discount numeric;
  v_tax numeric;
  v_total numeric;
  v_trigger text;
  v_replay public.pos_order_edit_audit%rowtype;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  -- Match the app's administrator identity rules; never trust a browser role flag.
  if not exists (select 1 from public.users where id = auth.uid() and role = 'Admin' and status = 'Active')
     and not exists (select 1 from public.staff_members where auth_user_id = auth.uid()
       and role = 'Admin' and status = 'Active' and user_type = 'POS Access') then
    raise exception 'Only an active administrator can edit completed orders.';
  end if;
  if p_request_id is null or p_expected is null then raise exception 'Reopen the order before editing.'; end if;

  select * into v_order from public.orders where order_number = p_order_number for update;
  if not found then raise exception 'Order not found.'; end if;

  -- An uncertain network response may be retried with the SAME request id.
  select * into v_replay from public.pos_order_edit_audit where request_id = p_request_id;
  if found then
    if v_replay.order_id <> v_order.id or v_replay.actor_id <> auth.uid() then
      raise exception 'Invalid save request identifier.';
    end if;
    if v_replay.request_body is distinct from jsonb_build_object('header',p_header,'items',p_items) then
      raise exception 'The previous save succeeded. Close the editor, refresh Orders, and reopen before making another edit.';
    end if;
    select to_jsonb(o) || jsonb_build_object('order_items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.id) from public.order_items i where i.order_id=o.id
    ), '[]'::jsonb)) into v_after from public.orders o where o.id=v_order.id;
    return v_after;
  end if;
  if v_order.is_deleted then raise exception 'A deleted order cannot be edited.'; end if;
  if v_order.order_status <> 'Completed' then raise exception 'Only completed orders can be edited.'; end if;

  -- Verify the four reviewed trigger bodies. Never disable/replace them.
  with expected(tbl, name, body_hash) as (values
    ('customers','trigger_customers_updated_at','31d110f848074259d7f62f2158cc6d46'),
    ('order_items','trg_order_items_product_stock','3e7e184ac1d12d81684cc20e94723ebd'),
    ('orders','orders_set_updated_at','d258fba5feeb9ce8126471bef81c3228'),
    ('products','trigger_products_updated_at','31d110f848074259d7f62f2158cc6d46')
  ), actual as (
    select c.relname::text tbl, t.tgname::text name,
      md5(regexp_replace(lower(f.prosrc), '\s', '', 'g')) body_hash,
      t.tgenabled, t.tgtype, t.tgqual, t.tgnargs
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace join pg_proc f on f.oid=t.tgfoid
    where n.nspname='public' and c.relname in ('orders','order_items','products','customers')
      and not t.tgisinternal
  )
  select string_agg(coalesce(e.tbl,a.tbl)||'.'||coalesce(e.name,a.name),', ') into v_trigger
  from expected e full join actual a on a.tbl=e.tbl and a.name=e.name
  where e.body_hash is distinct from a.body_hash or a.tgenabled not in ('O','A')
    or a.tgqual is not null or a.tgnargs<>0
    or a.tgtype <> case when e.tbl='order_items' then 31 else 19 end;
  if v_trigger is not null then
    raise exception 'Database triggers differ from the reviewed export: %. Export current definitions; do not disable triggers.', v_trigger;
  end if;

  perform 1 from public.order_items where order_id=v_order.id order by id for update;
  select to_jsonb(v_order) || jsonb_build_object('order_items', coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]'::jsonb)),
    jsonb_build_object('header', jsonb_build_object(
      'customer_id',v_order.customer_id,      'customer_name',v_order.customer_name,'customer_phone',nullif(v_order.customer_phone,''),
      'order_type',v_order.order_type,'order_status',v_order.order_status,
      'payment_method',v_order.payment_method,'payment_status',v_order.payment_status,
      'notes',nullif(v_order.notes,''),'subtotal',v_order.subtotal,'discount',v_order.discount,
      'tax',v_order.tax,'total',v_order.total),
      'items',coalesce(jsonb_agg(jsonb_build_object(
        'id',i.id,'product_id',i.product_id,'product_name',i.product_name,
        'quantity',i.quantity,'unit_price',i.unit_price,'notes',nullif(i.notes,'')) order by i.id),'[]'::jsonb))
    into v_before, v_snapshot from public.order_items i where i.order_id=v_order.id;
  if v_snapshot is distinct from p_expected then
    raise exception 'This order changed since you opened it. Close the editor, refresh Orders, and reopen it.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Invalid order items.'; end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 200 then
    raise exception 'Keep between 1 and 200 product lines.';
  end if;
  if jsonb_typeof(p_header) is distinct from 'object' or coalesce(trim(p_header->>'customer_name'),'')='' then
    raise exception 'Customer name is required.';
  end if;
  if coalesce(p_header->>'order_type','') not in ('Takeaway','Dine In') or
     coalesce(p_header->>'payment_method','') not in ('Cash','Card','QR','Bank Transfer','Split Payment','Credit Customer','Gift Card') or
     coalesce(p_header->>'payment_status','') not in ('Paid','Pending','Refunded') then
    raise exception 'Invalid order type or payment details.';
  end if;
  v_discount := (p_header->>'discount')::numeric;
  if v_discount is null or v_discount::text in ('NaN','Infinity','-Infinity') or v_discount < 0 or round(v_discount,2) <> v_discount then
    raise exception 'Invalid discount.';
  end if;

  -- Lock every affected product in UUID order. The existing Food-category trigger performs stock adjustments.
  perform 1 from public.products p where p.id in (
    select product_id from public.order_items where order_id=v_order.id
    union select (x->>'product_id')::uuid from jsonb_array_elements(p_items) x
  ) order by p.id for update;

  for v_line in select value from jsonb_array_elements(p_items) loop
    v_item_id := (v_line->>'id')::uuid;
    v_product_id := (v_line->>'product_id')::uuid;
    v_qty := (v_line->>'quantity')::numeric;
    v_price := (v_line->>'unit_price')::numeric;
    if v_qty is null or v_qty::text in ('NaN','Infinity','-Infinity') or v_qty<1 or v_qty>1000 or trunc(v_qty)<>v_qty then
      raise exception 'Quantity must be a whole number from 1 to 1,000.';
    end if;
    if v_price is null or v_price::text in ('NaN','Infinity','-Infinity') or v_price<0 or v_price>100000 or round(v_price,2)<>v_price then
      raise exception 'Invalid unit price.';
    end if;
    if v_item_id is not null then
      if v_item_id=any(v_ids) then raise exception 'Duplicate order line.'; end if;
      v_ids := array_append(v_ids,v_item_id);
      select * into v_olditem from public.order_items where id=v_item_id and order_id=v_order.id;
      if not found then raise exception 'An order line no longer exists.'; end if;
      if v_product_id is distinct from v_olditem.product_id then
        raise exception 'To replace a product, remove its line and add the replacement.';
      end if;
    else
      if v_product_id is null then raise exception 'Choose a product for every new line.'; end if;
      if not exists (select 1 from public.products where id=v_product_id and status='Active') then
        raise exception 'A selected product is missing or inactive.';
      end if;
    end if;
    v_subtotal := v_subtotal + round(v_qty*v_price,2);
  end loop;
  if v_discount>v_subtotal then raise exception 'Discount cannot exceed the subtotal.'; end if;
  if v_order.subtotal<=0 and v_order.tax<>0 then
    raise exception 'Historical tax needs review before editing items.';
  end if;
  v_tax := case when v_order.subtotal>0 then
    round(v_subtotal*v_order.tax/v_order.subtotal,2) else 0 end;
  v_total := round(v_subtotal-v_discount+v_tax,2);

  -- NO direct products.stock updates: the existing trigger owns Food stock.
  -- Preserve existing item IDs and historical names, including deleted-product lines.
  delete from public.order_items where order_id=v_order.id and not (id=any(v_ids));
  for v_line in
    select x from jsonb_array_elements(p_items) x
    left join public.order_items old on old.id=(x->>'id')::uuid and old.order_id=v_order.id
    order by case when old.id is not null and (x->>'quantity')::numeric<=old.quantity then 0 else 1 end,
      x->>'product_id', x->>'id'
  loop
    v_item_id := (v_line->>'id')::uuid;
    if v_item_id is not null then
      update public.order_items set quantity=(v_line->>'quantity')::numeric,
        unit_price=(v_line->>'unit_price')::numeric,notes=nullif(trim(v_line->>'notes'),'')
        where id=v_item_id and order_id=v_order.id;
    else
      select name into v_name from public.products where id=(v_line->>'product_id')::uuid;
      insert into public.order_items(order_id,product_id,product_name,quantity,unit_price,notes)
      values(v_order.id,(v_line->>'product_id')::uuid,v_name,(v_line->>'quantity')::numeric,
        (v_line->>'unit_price')::numeric,nullif(trim(v_line->>'notes'),''));
    end if;
  end loop;

  -- Typed record supports schemas using either text or enum payment/order columns.
  v_new := jsonb_populate_record(v_order, p_header);
  update public.orders set customer_name=trim(v_new.customer_name),
    customer_phone=nullif(trim(v_new.customer_phone),''),order_type=v_new.order_type,
    payment_method=v_new.payment_method,payment_status=v_new.payment_status,
    notes=nullif(trim(v_new.notes),''),subtotal=v_subtotal,discount=v_discount,tax=v_tax,total=v_total
    where id=v_order.id;

  -- create_pos_order does not maintain stored customer counters. Rebuild only
  -- this linked customer's counters from actual completed, non-deleted orders.
  -- Lock the customer to serialize edits to different orders for this customer.
  if v_order.customer_id is not null then
    perform 1 from public.customers where id=v_order.customer_id for update;
    update public.customers c set
      total_orders=(select count(*) from public.orders o where o.customer_id=c.id
        and o.order_status='Completed' and not o.is_deleted),
      total_spent=(select coalesce(sum(o.total),0) from public.orders o where o.customer_id=c.id
        and o.order_status='Completed' and not o.is_deleted and o.payment_status='Paid')
      where c.id=v_order.customer_id;
  end if;

  select to_jsonb(o) || jsonb_build_object('order_items',coalesce((
    select jsonb_agg(to_jsonb(i) order by i.id) from public.order_items i where i.order_id=o.id
  ),'[]'::jsonb)) into v_after from public.orders o where o.id=v_order.id;
  insert into public.pos_order_edit_audit(request_id,order_id,actor_id,request_body,before_sale,after_sale)
    values(p_request_id,v_order.id,auth.uid(),jsonb_build_object('header',p_header,'items',p_items),v_before,v_after);
  return v_after;
end;
$$;
revoke all on function public.edit_completed_pos_order(text,uuid,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.edit_completed_pos_order(text,uuid,jsonb,jsonb,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
