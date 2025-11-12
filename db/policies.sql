alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- MENU: publik read-only
drop policy if exists "menu read" on public.menu_items;
create policy "menu read" on public.menu_items
for select using (true);

-- optional: batasi write menu ke service role saja (API admin)
drop policy if exists "menu write service role" on public.menu_items;
create policy "menu write service role" on public.menu_items
  for all to service_role using (true) with check (true);

-- ORDERS: anyone can insert order
drop policy if exists "orders insert" on public.orders;
create policy "orders insert" on public.orders
for insert with check (true);

-- ORDERS: select by code via API (server) — kita pakai service role untuk GET detail.
-- Jika mau allow select publik berdasarkan code:
drop policy if exists "orders select by code" on public.orders;
create policy "orders select by code" on public.orders
for select using (true);

-- ORDER_ITEMS: insert bebas untuk item milik order yang baru dibuat (server-side recompute)
drop policy if exists "order_items insert" on public.order_items;
create policy "order_items insert" on public.order_items
for insert with check (true);

drop policy if exists "order_items select" on public.order_items;
create policy "order_items select" on public.order_items
for select using (true);
