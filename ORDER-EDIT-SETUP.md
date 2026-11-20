# Kanthaaram Order Items Edit — V2 (CSV-matched)

Includes the redesigned order editor. For the two-file UI-only update, read UI-UPDATE.md.

This version supersedes the earlier generic patch. Use the SQL from THIS ZIP.
Prepared on 6 November 2026 against the three supplied CSV exports: table columns, create_pos_order, and the four existing trigger definitions.

## Install

1. Back up the existing application/database and first use a staging copy where possible.
2. In Supabase SQL Editor, paste and run the entire `database/02_order_item_edit.sql` from THIS ZIP. It runs as one transaction. It verifies the reviewed trigger bodies before installing. A successful run adds/replaces only the edit RPC and its protected audit table. Existing stock/timestamp triggers and create_pos_order are retained.
3. If SQL reports a trigger/schema mismatch, stop and share that exact error. Do not disable triggers. The supplied exports are now integrated; no additional export is needed unless the database has changed.
4. Replace the source files listed below in your existing project. Keep your existing `.env` and hosting configuration. Full source is supplied; node_modules, secrets and old builds are not included.
5. From the project folder run:

```bash
npm ci
npm run lint
npm run build
```

6. Deploy the fresh dist folder using your existing hosting method. Sign in as Admin, open Orders, and click the existing pencil button.
7. Test one order, reload, verify receipt, Food stock and reports before using routinely.

If you already installed the earlier SQL, run this entire V2 migration; it replaces the same RPC and preserves its audit records. If you already copied V1 frontend files, replace them with V2 too, especially orderEdit.ts (tax/snapshot), OrdersView.tsx (Food stock and quantity limit), orderService.ts and dashboardservice.ts (soft-deleted filtering).

## Replacement paths

| File | Purpose |
|---|---|
| src/components/orders/OrderEditModal.css | Scoped responsive popup design |
| src/components/orders/OrdersView.tsx | Pencil-button product editor, quantities, bill prices, discount, live preview |
| src/services/orderService.ts | Atomic RPC, saved item IDs/names, customer link, soft-deleted filtering |
| src/context/AppContext.tsx | Update Orders/receipt and refresh products/customers after commit |
| src/types.ts | Edit payload and saved item/customer identifiers |
| src/utils/orderEdit.ts | Validation, stale-edit snapshot and pre-discount tax preview |
| src/components/dashboard/DashboardView.tsx | Refetch metrics when an order changes |
| src/services/dashboardservice.ts | Exclude soft-deleted sales from dashboard queries |
| src/components/reports/ReportsView.tsx | Customer reports use account IDs when available |
| src/data/mockData.ts | Correct inherited sample-data type errors |

Add `database/02_order_item_edit.sql`; the other database inspection script is retained for future diagnostics.

## Behavior matched to your exported database

- Stock: your sync_product_stock_from_order_item trigger controls stock for category name Food (case/space normalized). is_stock_item is not the controlling flag. V2 never directly updates products.stock. Non-Food products do not consume stock.
- Edits release removed/decreased quantities before applying increases and new lines. This supports multiple lines for the same product even with zero free stock. Existing item IDs/names and notes are retained. To replace a product, remove its line and add the replacement.
- Quantity: whole numbers from 1 to 1,000, matching create_pos_order's limit. At least one item remains. Negative/invalid prices and excessive discounts are rejected.
- line_total is a generated column and is never written manually.
- Tax: your creation function calculates tax on subtotal BEFORE discount. V2 applies saved tax / saved subtotal to the new subtotal, then subtracts the discount. The original exact rate is not stored, so this preserves the saved effective rate; rounded historical tax can make that an approximation. Zero-tax orders stay zero-tax.
- Prices: existing saved prices are preserved. New lines start at current catalogue prices; Admin can change bill prices explicitly. Order edits do not change catalogue prices or automatically reapply today's offers/combos. Review the retained absolute discount when changing promotional items.
- Customer totals: the exported create_pos_order does not maintain customers.total_orders/total_spent. V2 recalculates only the edited order's linked customer from current non-deleted Completed orders: count includes all payment statuses, spending includes Paid only. It does not reject zero/stale stored counters. Wallet balances and unrelated customer records are untouched. Existing new-sale/customer-counter behavior is not changed by this patch; after future new sales those legacy stored counters can again lag until reconciled. Sales reports derive amounts from orders.
- Customer name/phone edits are bill details; the customer_id account link remains the same. Name edits do not transfer sales to another account.
- Soft-deleted or non-Completed orders cannot be edited. Original order number, date and cashier stay unchanged. Soft-deleted orders are excluded from fetched history and dashboard queries.
- Changing payment information records bookkeeping only. It does not charge or refund an external payment provider.
- Stock Management/inventory_items remains separate; there is no product-to-ingredient recipe mapping in the supplied project.

## Transaction and access behavior

The edit RPC locks the order, existing items and affected products, validates a snapshot of the original sale and saves item changes, totals, linked-customer counters and an audit record atomically. Failure rolls everything back. Another admin's changed order is rejected as stale. Retrying a request ID cannot duplicate stock changes; changing the payload after that request has already succeeded requires reopening the order.

The RPC verifies an active Admin in users or active POS Access Admin in staff_members. Only authenticated callers can invoke it. Audit records are not granted to browser roles. Existing database RLS policies and role-assignment permissions are not replaced.

## Validation completed

- TypeScript: passed. The original sample data had 19 type errors; these were corrected.
- Production build: passed; existing large-bundle warning remains.
- Local PostgreSQL-compatible tests use the EXACT supplied create_pos_order and four trigger function bodies. Column types/defaults/nullability come from the supplied export. Tests cover Food products with is_stock_item=false and non-Food products with is_stock_item=true, proving category-based stock behavior.
- Tested: add/remove, quantity/price/discount edits, pre-discount tax, customer reconciliation from zero counters, rollback on insufficient stock, duplicate-product reallocation at zero stock, item replacement, generated line_total, deleted-product history, soft-deleted orders, stale saves, duplicate retries, invalid inputs, unauthorized users and trigger mismatch rejection.
- Basic React DOM interaction checks: pencil opens editor, product add submits the complete payload, empty order is rejected, cancel closes without save.
- Tests are local, not executed on your live database. The export did not include constraints, indexes, RLS policies or the generation expression; the test fixture assumes line_total = quantity * unit_price and conventional UUID primary keys. Live printer output and visual mobile/browser layout are not verified.

To rerun local database tests (no connection to your live service):

```bash
cd validation
npm install
npm test
```

`validation/exported-schema-fixture.sql` is FOR TESTS ONLY. Never run it on Supabase. Run only `database/02_order_item_edit.sql` for installation.

## Quick acceptance check

1. On a Food product order, increase quantity 2 to 3: stock decreases by 1; reduce to 1: stock increases by 2.
2. Remove one product and add another: verify each stock balance, generated amount and receipt.
3. Change price only: stock does not move.
4. Request too much stock: the complete edit fails with no partial changes.
5. Open the same order in two sessions: the second must refresh after the first saves.
6. Verify tax, discount, order total, receipt, dashboard and reports after a full reload.
7. For a linked customer, verify their count/spending is rebuilt from non-deleted Completed orders; Pending/Refunded sales do not contribute spending.

## Rollback

Restore the old frontend and rebuild if needed. The additive RPC/audit table can remain; the old frontend does not call the new RPC. To disable editing, revoke its execute permission from authenticated. Preserve audit records. Reverting code does not undo successful bill edits; review those separately rather than overwriting newer live sales with an old database backup.
