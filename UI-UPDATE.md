# Order editor design update

This package keeps the V2 database/save logic and redesigns only the order-edit popup.

If V2 already works, replace just these TWO files at the same paths in your current project:

1. src/components/orders/OrdersView.tsx
2. src/components/orders/OrderEditModal.css (new file; copy it too)

Keep your existing .env. No SQL change or database migration is required for this design update.

Then restart the development server:

```bash
npm run dev
```

For deployment:

```bash
npm run lint
npm run build
```

Deploy the newly built dist directory through your existing hosting method.

## Design changes

- Desktop: wide products area on the left; bill summary and customer/payment fields on the right.
- Smaller screens: stacked layout with scrollable content and a visible bottom action bar.
- Compact product rows, plus/minus quantity controls, editable unit prices and clear remove buttons.
- Search-first product picker with four quick-add choices; up to 30 search matches.
- Green bill summary with subtotal, discount, tax, previous total and difference.
- Fixed footer shows the updated total with Cancel and Save Changes.
- Keyboard focus moves into the editor and returns after closing; Escape closes when not saving.
- Changes are scoped to this popup; SQL, stock calculations and other page layouts are unchanged.

Validation: TypeScript and production build passed. DOM checks passed for opening, adding products, quantity stepper, save payload, preventing empty-order saves, cancelling and modal scroll locking.

For first-time V2 installation, see ORDER-EDIT-SETUP.md. This UI update does not resolve an old V1 database function; install V2 SQL as previously instructed if that old error is still present.

Browser validation on the mock-data editor: 1366×768, 820×640 and 390×844 passed overflow/footer checks. Quantity input and Save interaction passed. This is UI verification, not a live Supabase write.
