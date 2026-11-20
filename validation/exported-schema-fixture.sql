create role anon; create role authenticated; create schema auth;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table public.categories("id" uuid,
"name" text,
"description" text,
"created_at" timestamptz,
"updated_at" timestamptz,
"image" text,
primary key (id));
create table public.customers("id" uuid default gen_random_uuid() not null,
"name" text not null,
"mobile" text not null,
"email" text,
"dob" date,
"gender" text,
"address" text,
"photo" text,
"wallet_balance" numeric default 0 not null,
"total_orders" int4 default 0 not null,
"total_spent" numeric default 0 not null,
"status" text default 'Active'::text not null,
"notes" text,
"created_at" timestamptz default timezone('utc'::text, now()) not null,
"updated_at" timestamptz default timezone('utc'::text, now()) not null,
primary key (id));
create table public.order_items("id" uuid default gen_random_uuid() not null,
"order_id" uuid not null,
"product_id" uuid,
"product_name" text not null,
"quantity" int4 not null,
"unit_price" numeric not null,
"line_total" numeric generated always as (quantity*unit_price) stored,
"notes" text,
"created_at" timestamptz default now() not null,
primary key (id));
create table public.orders("id" uuid default gen_random_uuid() not null,
"order_number" text not null,
"customer_id" uuid,
"customer_name" text default 'Walk-in Customer'::text not null,
"customer_phone" text,
"cashier_id" uuid,
"cashier_name" text not null,
"subtotal" numeric not null,
"discount" numeric default 0 not null,
"tax" numeric default 0 not null,
"total" numeric not null,
"order_type" text not null,
"order_status" text default 'Completed'::text not null,
"payment_method" text not null,
"payment_status" text default 'Paid'::text not null,
"notes" text,
"qr_code_url" text,
"created_at" timestamptz default now() not null,
"updated_at" timestamptz default now() not null,
"is_deleted" bool default false not null,
"deleted_at" timestamptz,
"deleted_by" uuid,
primary key (id),
unique(order_number));
create table public.products("id" uuid default gen_random_uuid() not null,
"name" text not null,
"category_id" uuid not null,
"description" text,
"price" numeric not null,
"image" text,
"created_at" timestamptz default timezone('utc'::text, now()) not null,
"updated_at" timestamptz default timezone('utc'::text, now()) not null,
"image_object_key" text,
"purchase_price" numeric default 0 not null,
"stock" numeric default 9999 not null,
"low_stock_alert" numeric default 0 not null,
"barcode" text,
"sku" text,
"tax" numeric default 0 not null,
"unit" text default 'Cup'::text not null,
"status" text default 'Active'::text not null,
"is_stock_item" bool default false not null,
primary key (id));
create table public.staff_members("id" uuid default gen_random_uuid() not null,
"auth_user_id" uuid,
"user_type" text not null,
"full_name" text not null,
"email" text,
"phone" text default ''::text not null,
"role" text not null,
"photo" text default ''::text not null,
"salary" numeric default 0 not null,
"date_of_birth" date not null,
"gender" text not null,
"working_type" text not null,
"attendance" text default 'Present'::text not null,
"status" text default 'Active'::text not null,
"permissions" text[] default '{}'::text[] not null,
"created_by" uuid,
"created_at" timestamptz default now() not null,
"updated_at" timestamptz default now() not null,
primary key (id));
create table public.users("id" uuid not null,
"name" text not null,
"email" text not null,
"status" text default 'Active'::text not null,
"role" text default 'Cashier'::text not null,
"staff_id" text,
"phone_number" text,
"dob" date,
"profile" text,
"gender" text,
"created_at" timestamptz default timezone('utc'::text, now()) not null,
"updated_at" timestamptz default timezone('utc'::text, now()) not null,
primary key (id));
create sequence public.order_number_seq;
create table public.offers(id uuid default gen_random_uuid(),type text,discount numeric,status text,start_date date,end_date date,product_id uuid);
CREATE OR REPLACE FUNCTION public.update_customers_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    new.updated_at =
        timezone('utc', now());

    return new;
end;
$function$
;
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_customers_updated_at();
CREATE OR REPLACE FUNCTION public.sync_product_stock_from_order_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_stock numeric(14,3);
  v_available numeric(14,3);
  v_difference numeric(14,3);

  v_new_is_food boolean := false;
  v_old_is_food boolean := false;
BEGIN

  -- Identify whether the new product belongs to Food
  IF TG_OP IN ('INSERT', 'UPDATE')
     AND NEW.product_id IS NOT NULL THEN

    SELECT lower(btrim(c.name)) = 'food'
      INTO v_new_is_food
    FROM public.products p
    LEFT JOIN public.categories c
      ON c.id = p.category_id
    WHERE p.id = NEW.product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Product % was not found.', NEW.product_id;
    END IF;

    v_new_is_food := coalesce(v_new_is_food, false);
  END IF;

  -- Identify whether the old product belongs to Food
  IF TG_OP IN ('DELETE', 'UPDATE')
     AND OLD.product_id IS NOT NULL THEN

    SELECT lower(btrim(c.name)) = 'food'
      INTO v_old_is_food
    FROM public.products p
    LEFT JOIN public.categories c
      ON c.id = p.category_id
    WHERE p.id = OLD.product_id;

    v_old_is_food := coalesce(v_old_is_food, false);
  END IF;

  -- INSERT
  IF TG_OP = 'INSERT' THEN

    IF NEW.product_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
      RAISE EXCEPTION
        'Order quantity must be greater than zero.';
    END IF;

    -- Non-food products do not require stock tracking
    IF NOT v_new_is_food THEN
      RETURN NEW;
    END IF;

    SELECT stock
      INTO v_stock
    FROM public.products
    WHERE id = NEW.product_id
    FOR UPDATE;

    IF coalesce(v_stock, 0) < NEW.quantity THEN
      RAISE EXCEPTION
        'Insufficient stock for %. Available: %, requested: %',
        coalesce(NEW.product_name, NEW.product_id::text),
        coalesce(v_stock, 0),
        NEW.quantity;
    END IF;

    UPDATE public.products
    SET stock = stock - NEW.quantity,
        updated_at = now()
    WHERE id = NEW.product_id;

    RETURN NEW;
  END IF;

  -- DELETE
  IF TG_OP = 'DELETE' THEN

    IF OLD.product_id IS NOT NULL AND v_old_is_food THEN

      UPDATE public.products
      SET stock = stock + OLD.quantity,
          updated_at = now()
      WHERE id = OLD.product_id;

    END IF;

    RETURN OLD;
  END IF;

  -- UPDATE: product changed
  IF OLD.product_id IS DISTINCT FROM NEW.product_id THEN

    -- Restore old Food product stock
    IF OLD.product_id IS NOT NULL AND v_old_is_food THEN

      UPDATE public.products
      SET stock = stock + OLD.quantity,
          updated_at = now()
      WHERE id = OLD.product_id;

    END IF;

    -- Deduct new Food product stock
    IF NEW.product_id IS NOT NULL AND v_new_is_food THEN

      SELECT stock
        INTO v_available
      FROM public.products
      WHERE id = NEW.product_id
      FOR UPDATE;

      IF coalesce(v_available, 0) < NEW.quantity THEN
        RAISE EXCEPTION
          'Insufficient stock for %. Available: %, requested: %',
          coalesce(NEW.product_name, NEW.product_id::text),
          coalesce(v_available, 0),
          NEW.quantity;
      END IF;

      UPDATE public.products
      SET stock = stock - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.product_id;

    END IF;

    RETURN NEW;
  END IF;

  -- UPDATE: same product
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Non-food products do not adjust stock
  IF NOT v_new_is_food THEN
    RETURN NEW;
  END IF;

  v_difference := NEW.quantity - OLD.quantity;

  -- Quantity increased
  IF v_difference > 0 THEN

    SELECT stock
      INTO v_available
    FROM public.products
    WHERE id = NEW.product_id
    FOR UPDATE;

    IF coalesce(v_available, 0) < v_difference THEN
      RAISE EXCEPTION
        'Insufficient stock for %. Available additional: %, requested additional: %',
        coalesce(NEW.product_name, NEW.product_id::text),
        coalesce(v_available, 0),
        v_difference;
    END IF;

    UPDATE public.products
    SET stock = stock - v_difference,
        updated_at = now()
    WHERE id = NEW.product_id;

  -- Quantity decreased
  ELSIF v_difference < 0 THEN

    UPDATE public.products
    SET stock = stock + abs(v_difference),
        updated_at = now()
    WHERE id = NEW.product_id;

  END IF;

  RETURN NEW;

END;
$function$
;
CREATE TRIGGER trg_order_items_product_stock BEFORE INSERT OR DELETE OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION sync_product_stock_from_order_item();
CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
;
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_orders_updated_at();
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    new.updated_at =
        timezone('utc', now());

    return new;
end;
$function$
;
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();
CREATE OR REPLACE FUNCTION public.create_pos_order(p_customer_id uuid, p_customer_name text, p_customer_phone text, p_order_type text, p_payment_method text, p_payment_status text, p_discount numeric, p_tax_percentage numeric, p_notes text, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_order_id uuid;
    v_order_number text;
    v_cashier_name text;
    v_item jsonb;
    v_product_id uuid;
    v_product_name text;
    v_base_price numeric(12,2);
    v_unit_price numeric(12,2);
    v_quantity integer;
    v_subtotal numeric(12,2) := 0;
    v_discount numeric(12,2) := coalesce(p_discount, 0);
    v_tax numeric(12,2);
    v_total numeric(12,2);
    v_normalized_items jsonb := '[]'::jsonb;
begin
    select name into v_cashier_name
    from public.users
    where id = auth.uid()
      and status = 'Active'
      and role in ('Admin', 'Cashier');

    if v_cashier_name is null then
        raise exception 'You are not authorized to create orders.';
    end if;

    if p_order_type not in ('Takeaway', 'Dine In') then
        raise exception 'Invalid order type.';
    end if;

    if p_payment_method not in ('Cash', 'Card', 'QR', 'Bank Transfer', 'Split Payment', 'Credit Customer', 'Gift Card') then
        raise exception 'Invalid payment method.';
    end if;

    if p_payment_status not in ('Paid', 'Pending') then
        raise exception 'Invalid payment status for a new order.';
    end if;

    if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
        raise exception 'The order must contain at least one item.';
    end if;

    if v_discount < 0 or coalesce(p_tax_percentage, 0) < 0 or p_tax_percentage > 100 then
        raise exception 'Invalid discount or tax percentage.';
    end if;

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        begin
            v_product_id := (v_item->>'product_id')::uuid;
            v_quantity := (v_item->>'quantity')::integer;
        exception when others then
            raise exception 'An order item contains an invalid product or quantity.';
        end;

        if v_quantity <= 0 or v_quantity > 1000 then
            raise exception 'Item quantity must be between 1 and 1000.';
        end if;

        select name, price into v_product_name, v_base_price
        from public.products
        where id = v_product_id;

        if v_product_name is null then
            raise exception 'Product % was not found.', v_product_id;
        end if;

        select min(
            case
                when o.type = 'Percentage' then greatest(0, v_base_price * (1 - o.discount / 100))
                when o.type = 'Flat' then greatest(0, v_base_price - o.discount)
                else v_base_price
            end
        ) into v_unit_price
        from public.offers o
        where o.status = 'Active'
          and current_date between o.start_date and o.end_date
          and (o.product_id is null or o.product_id = v_product_id);

        v_unit_price := round(coalesce(v_unit_price, v_base_price), 2);
        v_subtotal := v_subtotal + round(v_unit_price * v_quantity, 2);

        v_normalized_items := v_normalized_items || jsonb_build_array(
            jsonb_build_object(
                'product_id', v_product_id,
                'product_name', v_product_name,
                'quantity', v_quantity,
                'unit_price', v_unit_price,
                'notes', nullif(btrim(v_item->>'notes'), '')
            )
        );
    end loop;

    if v_discount > v_subtotal then
        raise exception 'Discount cannot be greater than the subtotal.';
    end if;

    v_tax := round(v_subtotal * coalesce(p_tax_percentage, 0) / 100, 2);
    v_total := greatest(0, round(v_subtotal - v_discount + v_tax, 2));
    v_order_number := '#KT' || to_char(clock_timestamp(), 'YYMMDD') || '-' ||
        lpad(nextval('public.order_number_seq')::text, 5, '0');

    insert into public.orders (
        order_number, customer_id, customer_name, customer_phone,
        cashier_id, cashier_name, subtotal, discount, tax, total,
        order_type, order_status, payment_method, payment_status, notes
    ) values (
        v_order_number, p_customer_id,
        coalesce(nullif(btrim(p_customer_name), ''), 'Walk-in Customer'),
        nullif(btrim(p_customer_phone), ''), auth.uid(), v_cashier_name,
        v_subtotal, v_discount, v_tax, v_total,
        p_order_type, 'Completed', p_payment_method, p_payment_status,
        nullif(btrim(p_notes), '')
    ) returning id into v_order_id;

    insert into public.order_items (
        order_id, product_id, product_name, quantity, unit_price, notes
    )
    select
        v_order_id,
        (item->>'product_id')::uuid,
        item->>'product_name',
        (item->>'quantity')::integer,
        (item->>'unit_price')::numeric,
        item->>'notes'
    from jsonb_array_elements(v_normalized_items) item;

    return v_order_id;
end;
$function$
;
