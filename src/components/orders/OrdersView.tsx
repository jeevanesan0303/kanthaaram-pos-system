import React from 'react';
import './OrderEditModal.css';
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  X,
  WalletCards,
} from 'lucide-react';
import { orderEditTotals, validateOrderEdit } from '../../utils/orderEdit';
import Swal from 'sweetalert2';
import {
  closeSalesDay, openSalesDay, getSalesSessions, getSalesOrders, getClosingOrders,
  formatSalesTimestamp, suggestedOpeningTime, sriLankaDate,
} from '../../services/salesSessionService';
import type { SalesSession } from '../../services/salesSessionService';
import { useApp } from '../../context/AppContext';
import { Order, OrderType, PaymentMethod, OrderPaymentStatus, UpdateOrderInput } from '../../types';

type TypeFilter = 'All' | OrderType;
type PaymentMethodFilter = 'All' | PaymentMethod;

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'QR',
  'Card',
  'Bank Transfer',
  'Split Payment',
  'Credit Customer',
  'Gift Card',
];

const PAGE_SIZE = 10;

const csvCell = (value: unknown): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

const escapeSalesHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
} as Record<string, string>)[character] || character);

type SalesItemQuantity = { name: string; quantity: number };

const collectSalesItemQuantities = (orders: Order[]): SalesItemQuantity[] => {
  const totals = new Map<string, SalesItemQuantity>();
  for (const order of orders) {
    for (const item of order.items) {
      const name = item.product.name || 'Unnamed item';
      // Keep differently named historical items separate even if product IDs match.
      const key = JSON.stringify([item.productId || item.product.id || '', name]);
      const previous = totals.get(key);
      totals.set(key, { name, quantity: (previous?.quantity || 0) + Number(item.quantity) });
    }
  }
  return Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const salesItemsTable = (orders: Order[], dark: boolean): string => {
  const items = collectSalesItemQuantities(orders);
  const border = dark ? '#30483b' : '#e5e7eb';
  const muted = dark ? '#abc2b4' : '#64748b';
  const head = dark ? '#1c3227' : '#f3f6f4';
  const rows = items.map(item => `<tr><td style="padding:10px 12px;border-bottom:1px solid ${border};overflow-wrap:anywhere">${escapeSalesHtml(item.name)}</td><td style="padding:10px 12px;border-bottom:1px solid ${border};text-align:right;font-weight:700;white-space:nowrap">${escapeSalesHtml(item.quantity.toLocaleString('en-GB', { maximumFractionDigits: 3 }))}</td></tr>`).join('');
  return `<div style="margin-top:16px;border:1px solid ${border};border-radius:12px;overflow:hidden"><div style="max-height:240px;overflow-y:auto;overscroll-behavior:contain"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:14px;color:inherit"><thead style="position:sticky;top:0;background:${head}"><tr><th scope="col" style="padding:10px 12px">Sales item</th><th scope="col" style="padding:10px 12px;text-align:right">Quantity</th></tr></thead><tbody>${rows || `<tr><td colspan="2" style="padding:18px;text-align:center;color:${muted}">No items in this period.</td></tr>`}</tbody></table></div><div style="padding:10px 12px;background:${head};display:flex;justify-content:space-between;font-size:13px;font-weight:700"><span>Total quantity</span><span>${escapeSalesHtml(items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-GB', { maximumFractionDigits: 3 }))}</span></div></div>`;
};

/** Browser PDF printing retains Tamil shaping and searchable Unicode text. */
const exportClosedSalesPdf = (
  session: SalesSession, orders: Order[] | null, storeName: string, currency: string,
): void => {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) throw new Error('Allow pop-ups for this site, then click Export PDF again.');
  const saved = session.closing_snapshot!;
  const esc = escapeSalesHtml;
  const money = (value: number) => esc(`${currency} ${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  const details = new Map((orders || []).map(order => [order.id, order]));
  const items = collectSalesItemQuantities(orders || []);
  const itemRows = items.map(item => `<tr><td>${esc(item.name)}</td><td class="number">${esc(item.quantity)}</td></tr>`).join('');
  const orderSections = saved.orders.map(order => {
    const detail = details.get(order.order_number);
    const lines = detail?.items.map(item => `<tr><td>${esc(item.product.name)}</td><td class="number">${esc(item.quantity)}</td><td class="number">${money(item.price)}</td><td class="number">${money(item.price * item.quantity)}</td></tr>`).join('');
    return `<section><h3>${esc(order.order_number)} · ${esc(formatSalesTimestamp(order.created_at))}</h3><p>${esc(order.order_type)} · ${esc(order.payment_method)} · ${esc(order.payment_status)}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${lines || '<tr><td colspan="4">Item details unavailable.</td></tr>'}</tbody></table><p class="number">Subtotal: ${money(order.subtotal)} · Discount: ${money(order.discount)} · Tax: ${money(order.tax)}<br><strong>Saved order total: ${money(order.total)}</strong></p></section>`;
  }).join('');
  reportWindow.document.open();
  reportWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sales-day-${esc(session.business_date)}-${esc(session.id.slice(0, 8))}</title><style>
    @page { size:A4; margin:15mm; } *{box-sizing:border-box} body{font-family:Arial,"Nirmala UI","Latha",sans-serif;color:#17251c;margin:24px;font-size:12px;line-height:1.6} h1{font-size:23px;margin-bottom:0} h2{font-size:17px;margin-top:24px} h3{font-size:13px;margin:20px 0 4px} p{margin:7px 0} table{width:100%;border-collapse:collapse;margin:10px 0;table-layout:fixed} th,td{padding:8px;border:1px solid #d4ded7;text-align:left;overflow-wrap:anywhere} th{background:#edf3ef} thead{display:table-header-group} tr{break-inside:avoid} .number{text-align:right} .note{color:#58675d;font-size:10px} .controls{padding:14px;background:#edf3ef;margin-bottom:20px} button{padding:10px 18px;cursor:pointer;background:#17633a;color:white;border:0;border-radius:6px} @media print{.controls{display:none}body{margin:0}h2,h3{break-after:avoid}}
    </style></head><body><div class="controls"><button id="save-pdf">Print / Save as PDF</button><p>Select <strong>Save as PDF</strong> as the printer destination.</p></div><h1>${esc(storeName || 'Kanthaaram')}</h1><h2>Sales day closing report</h2><p><strong>Business date:</strong> ${esc(session.business_date)}<br><strong>Opened:</strong> ${esc(formatSalesTimestamp(session.opened_at))}<br><strong>Closed:</strong> ${esc(formatSalesTimestamp(session.closed_at!))}<br>All times: Sri Lanka</p><p><strong>Completed orders:</strong> ${saved.completed_orders} · <strong>Paid orders:</strong> ${saved.paid_orders}<br><strong>Paid revenue:</strong> ${money(saved.paid_revenue)}<br><strong>Pending payments:</strong> ${saved.pending_orders} · <strong>Refunded orders:</strong> ${saved.refunded_orders}</p><h2>Items and quantities</h2><table><thead><tr><th>Sales item</th><th>Quantity</th></tr></thead><tbody>${itemRows || '<tr><td colspan="2">No item details available.</td></tr>'}</tbody><tfoot><tr><th>Total quantity</th><th class="number">${items.reduce((sum, item) => sum + item.quantity, 0)}</th></tr></tfoot></table><p class="note">Financial totals are from the saved closing report. Item details reflect bills retrieved after closing and may differ if bills were subsequently edited or removed. Quantities include all completed orders, including pending-payment and refunded orders.</p><h2>Order details</h2>${orderSections}</body></html>`);
  reportWindow.document.close();
  const downloadButton = reportWindow.document.getElementById(
  'save-pdf',
) as HTMLButtonElement | null;

if (downloadButton) {
  downloadButton.textContent = 'Download PDF';

  const message = downloadButton.parentElement?.querySelector('p');
  if (message) message.textContent = 'Click to download your sales report.';

  downloadButton.addEventListener('click', async () => {
    if (downloadButton.disabled) return;

    downloadButton.disabled = true;
    downloadButton.textContent = 'Downloading…';

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      await reportWindow.document.fonts.ready;

      const canvas = await html2canvas(reportWindow.document.body, {
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: element => element.classList.contains('controls'),
        onclone: clonedDocument => {
          clonedDocument.body.style.width = '746px';
          clonedDocument.body.style.margin = '24px';
        },
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const margin = 12;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const sliceHeight = Math.floor(
        (pageHeight / pageWidth) * canvas.width,
      );

      const pageCanvas = reportWindow.document.createElement('canvas');
      pageCanvas.width = canvas.width;

      for (let top = 0; top < canvas.height; top += sliceHeight) {
        pageCanvas.height = Math.min(sliceHeight, canvas.height - top);

        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('Could not generate PDF.');

        context.drawImage(
          canvas,
          0, top, canvas.width, pageCanvas.height,
          0, 0, canvas.width, pageCanvas.height,
        );

        if (top > 0) pdf.addPage();

        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          pageWidth,
          (pageCanvas.height / canvas.width) * pageWidth,
        );
      }

      pdf.save(
        `Sales-day-${session.business_date}-${session.id.slice(0, 8)}.pdf`,
      );

      if (message) message.textContent = 'PDF download started.';
    } catch (error) {
      if (message) {
        message.textContent =
          error instanceof Error ? error.message : 'PDF download failed.';
      }
    } finally {
      downloadButton.disabled = false;
      downloadButton.textContent = 'Download PDF';
    }
  });
}
};

/** Reads the app's rendered theme, including projects that don't use a .dark class. */
const useSalesDarkMode = (root: React.RefObject<HTMLDivElement | null>): boolean => {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const update = () => {
      let element: HTMLElement | null = root.current;
      while (element) {
        const background = window.getComputedStyle(element).backgroundColor;
        const channels = background.match(/[\d.]+/g)?.map(Number);
        if (channels && channels.length >= 3 && (channels.length < 4 || channels[3] > 0.9)) {
          setDark((channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722) < 128);
          return;
        }
        element = element.parentElement;
      }
      setDark(document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') || document.documentElement.dataset.theme === 'dark' || document.body.dataset.theme === 'dark');
    };
    update();
    const observer = new MutationObserver(update);
    // Only watch theme-bearing ancestors, not every order row or dropdown button.
    let element: HTMLElement | null = root.current;
    while (element) {
      observer.observe(element, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-mode'] });
      element = element.parentElement;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, [root]);
  return dark;
};

const salesPickerDarkCss = `
.kan-sales-picker[data-dark="true"] .kan-period-trigger,
.kan-sales-picker[data-dark="true"] .kan-period-menu,
.kan-sales-picker[data-dark="true"] input { background:#111f18!important; color:#edf5f0!important; border-color:#324b3d!important; color-scheme:dark; }
.kan-sales-picker[data-dark="true"] label,
.kan-sales-picker[data-dark="true"] > span { color:#c2d5c8!important; }
.kan-sales-picker[data-dark="true"] .kan-period-menu > div { border-color:#324b3d!important; }
.kan-sales-picker[data-dark="true"] .kan-period-option { background:transparent!important; color:#e4eee8!important; border:1px solid transparent!important; }
.kan-sales-picker[data-dark="true"] .kan-period-option * { color:inherit!important; }
.kan-sales-picker[data-dark="true"] .kan-period-option[aria-pressed="true"] { background:#284534!important; color:#fff0b8!important; border-color:#766327!important; }
.kan-sales-picker[data-dark="true"] .kan-period-option:hover:not(:disabled),
.kan-sales-picker[data-dark="true"] .kan-period-option:focus-visible { background:#213d2d!important; color:#ffffff!important; }
.kan-sales-picker[data-dark="true"] .kan-period-option[aria-pressed="true"]:hover { background:#345440!important; color:#fff0b8!important; }
.kan-sales-picker[data-dark="true"] .kan-period-menu { box-shadow:0 12px 35px #0008; }
`;

interface SalesPeriodPickerProps {
  dark: boolean;
  sessions: SalesSession[];
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Search affects this menu only; selecting an option changes the sales period. */
const SalesPeriodPicker: React.FC<SalesPeriodPickerProps> = ({ sessions, value, disabled, onChange, dark }) => {
  const [open, setOpen] = React.useState(false);
  const [dateSearch, setDateSearch] = React.useState('');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dateRef = React.useRef<HTMLInputElement>(null);
  const menuId = React.useId();
  const labelId = React.useId();
  const selected = sessions.find(session => session.id === value);
  const title = value === 'current' ? 'Current sales day' : value === 'all' ? 'All order history'
    : selected ? `${selected.business_date} · ${selected.closed_at ? 'Closed' : 'Open'} · ${formatSalesTimestamp(selected.opened_at)}`
    : 'Selected sales day';
  const matches = React.useMemo(() => sessions
    .filter(session => !dateSearch || session.business_date === dateSearch)
    .slice().sort((a, b) => b.opened_at.localeCompare(a.opened_at)), [sessions, dateSearch]);

  React.useEffect(() => {
    if (!open) return;
    dateRef.current?.focus();
    const outside = (event: Event) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [open]);

  const choose = (nextValue: string) => {
    if (disabled) return;
    setOpen(false);
    setDateSearch('');
    triggerRef.current?.focus();
    onChange(nextValue);
  };

  const optionClass = (selectedValue: string) => `kan-period-option block w-full rounded-lg px-3 py-2.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${value === selectedValue ? 'bg-amber-100 font-bold text-amber-900' : 'text-gray-700 hover:bg-amber-50'}`;

  return (
    <div ref={rootRef} data-dark={dark ? 'true' : 'false'} className="kan-sales-picker relative w-full sm:w-96" style={{ minWidth: 0 }} onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        event.preventDefault(); event.stopPropagation(); setOpen(false); triggerRef.current?.focus();
      }
    }}>
      <span id={labelId} className="mb-1 block text-xs font-bold text-gray-700">Sales period</span>
      <button ref={triggerRef} type="button" disabled={disabled} aria-labelledby={labelId}
        aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(previous => !previous)}
        onKeyDown={event => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true); } }}
        className="kan-period-trigger flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-left text-xs font-bold text-gray-700 disabled:opacity-60"
        title={title}>
        <span className="truncate">{title}</span><ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="dialog" aria-modal="false" aria-label="Choose sales period"
          className="kan-period-menu absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl"
          style={{ width: 'min(26rem, calc(100vw - 3rem))', maxWidth: 'calc(100vw - 3rem)' }}>
          <div className="border-b border-gray-200 p-3">
            <label className="mb-2 block text-[11px] font-bold text-gray-600" htmlFor={`${menuId}-date`}>Find sales days by business date</label>
            <div className="flex items-center gap-2">
              <input ref={dateRef} id={`${menuId}-date`} type="date" value={dateSearch}
                onChange={event => setDateSearch(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-amber-400" />
              {dateSearch && <button type="button" aria-label="Clear sales day date search" onClick={() => { setDateSearch(''); dateRef.current?.focus(); }} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          <div className="space-y-1 border-b border-gray-200 p-2">
            <button type="button" aria-pressed={value === 'current'} disabled={disabled} onClick={() => choose('current')} className={optionClass('current')}>Current sales day</button>
            <button type="button" aria-pressed={value === 'all'} disabled={disabled} onClick={() => choose('all')} className={optionClass('all')}>All order history</button>
          </div>
          <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase text-gray-400" aria-live="polite">Sales days · {matches.length}</div>
          <div className="space-y-1 p-2" style={{ maxHeight: 'min(260px, 35vh)', overflowY: 'auto', overscrollBehavior: 'contain' }}
            aria-label="Sales days" onKeyDown={event => {
              const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
              const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
              if (!buttons.length || index < 0) return;
              let next = index;
              if (event.key === 'ArrowDown') next = Math.min(buttons.length - 1, index + 1);
              else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = buttons.length - 1;
              else return;
              event.preventDefault(); buttons[next]?.focus();
            }}>
            {matches.map(session => (
              <button type="button" key={session.id} aria-pressed={value === session.id} disabled={disabled}
                onClick={() => choose(session.id)} className={optionClass(session.id)}>
                <span className="flex items-center justify-between gap-2"><span className="font-bold">{session.business_date}</span><span className="text-[10px]">{session.closed_at ? 'Closed' : 'Open'}</span></span>
                <span className="mt-1 block text-[10px] opacity-75">Opened {formatSalesTimestamp(session.opened_at)}</span>
              </button>
            ))}
            {!matches.length && <p className="px-3 py-5 text-center text-xs text-gray-500">{dateSearch ? 'No sales days found for this date.' : 'No saved sales days yet.'}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export const OrdersView: React.FC = () => {
  const salesRootRef = React.useRef<HTMLDivElement>(null);
  const salesDark = useSalesDarkMode(salesRootRef);
  const {
    products,
    refreshOrders: refreshContextOrders,
    deactivateOrder,
    updateOrder,
    setActiveReceiptOrder,
    settings,
    currentUser,
  } = useApp();

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<PaymentMethodFilter>('All');
  const [search, setSearch] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [salesOrders, setSalesOrders] = React.useState<Order[]>([]);
  const [sessions, setSessions] = React.useState<SalesSession[]>([]);
  const [sessionSelection, setSessionSelection] = React.useState('current');
  const [salesError, setSalesError] = React.useState('');
  const [sessionBusy, setSessionBusy] = React.useState(false);
  const requestRef = React.useRef(0);
  const mutationRef = React.useRef(false);
  const productsRef = React.useRef(products);
  productsRef.current = products;
  const isAdmin = currentUser?.role === 'Admin';
  const activeSession = sessions.find(session => !session.closed_at);
  const selectedSession = sessionSelection === 'current'
    ? activeSession : sessions.find(session => session.id === sessionSelection);
  const isClosedSession = Boolean(selectedSession?.closed_at);
  const isAllHistory = !isAdmin || sessionSelection === 'all';

  const loadSales = React.useCallback(async (): Promise<void> => {
    const request = ++requestRef.current;
    setOrdersLoading(true);
    setSalesError('');
    try {
      const available = isAdmin ? await getSalesSessions() : [];
      const selected = sessionSelection === 'current'
        ? available.find(session => !session.closed_at)
        : available.find(session => session.id === sessionSelection);
      if (isAdmin && sessionSelection !== 'all' && sessionSelection !== 'current' && !selected) {
        throw new Error('The selected sales day is unavailable. Choose another sales day.');
      }
      const result = !isAdmin || sessionSelection === 'all'
        ? await getSalesOrders(productsRef.current)
        : selected?.closed_at
          ? getClosingOrders(selected)
          : selected
            ? await getSalesOrders(productsRef.current, selected.opened_at)
            : [];
      if (request !== requestRef.current) return;
      setSessions(available);
      setSalesOrders(result);
    } catch (error) {
      if (request !== requestRef.current) return;
      setSalesOrders([]);
      setSessions([]);
      setSalesError(error instanceof Error ? error.message : 'Unable to load sales.');
    } finally {
      if (request === requestRef.current) setOrdersLoading(false);
    }
  }, [isAdmin, currentUser?.id, sessionSelection]);

  React.useEffect(() => {
    setSalesOrders([]);
    setSessions([]);
    void loadSales();
    const poll = () => {
      if (!document.hidden && !mutationRef.current) void loadSales();
    };
    const timer = window.setInterval(poll, 30000);
    window.addEventListener('focus', poll);
    return () => {
      requestRef.current += 1;
      window.clearInterval(timer);
      window.removeEventListener('focus', poll);
    };
  }, [loadSales]);

  React.useEffect(() => {
    setDateFilter(''); setCurrentPage(1); setSearch('');
    setTypeFilter('All'); setPaymentMethodFilter('All');
  }, [sessionSelection]);

  const refreshOrders = async (): Promise<void> => {
    await refreshContextOrders();
    await loadSales();
  };

  const handleOpenDay = async (): Promise<void> => {
    if (!isAdmin || mutationRef.current || ordersLoading || salesError) return;
    mutationRef.current = true;
    requestRef.current += 1;
    setSessionBusy(true);
    try {
      const choice = await Swal.fire<string>({
        title: 'Open sales day',
        html: '<p>Select the opening date and time in Sri Lanka time. For the first session, choose when this shop day started.</p>',
        input: 'datetime-local', inputValue: suggestedOpeningTime(),
        showCancelButton: true, confirmButtonText: 'Open sales day',
        confirmButtonColor: '#f59e0b',
        inputValidator: value => !value ? 'Choose an opening date and time.' : undefined,
      });
      if (!choice.isConfirmed || !choice.value) return;
      await openSalesDay(choice.value);
      setSessionSelection('current');
      await loadSales();
      await Swal.fire({ icon: 'success', title: 'Sales day opened', timer: 1400, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Could not open sales day', text: error instanceof Error ? error.message : 'Refresh and try again.' });
      await loadSales();
    } finally { mutationRef.current = false; setSessionBusy(false); }
  };

  const handleCloseDay = async (): Promise<void> => {
    if (!isAdmin || !activeSession || mutationRef.current || ordersLoading || salesError) return;
    mutationRef.current = true;
    requestRef.current += 1;
    setSessionBusy(true);
    const session = activeSession;
    let closedResult: SalesSession | null = null;
    const popupTheme = {
      background: salesDark ? '#111f18' : '#ffffff',
      color: salesDark ? '#edf5f0' : '#374151',
      confirmButtonColor: '#d97706', cancelButtonColor: '#64748b',
    };
    try {
      void Swal.fire({ title: 'Loading sales items…', ...popupTheme,
        allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
      const previewAt = new Date().toISOString();
      const previewOrders = await getSalesOrders(productsRef.current, session.opened_at, previewAt);
      const paid = previewOrders.filter(order => order.paymentStatus === 'Paid');
      const pending = previewOrders.filter(order => order.paymentStatus === 'Pending').length;
      const previewMoney = formatMoney(paid.reduce((sum, order) => sum + Number(order.total), 0));
      const choice = await Swal.fire({
        ...popupTheme, title: 'Close sales day?', width: 680,
        html: `<div style="text-align:left;font-size:14px;line-height:1.6;color:inherit">
          <p><strong>Opened:</strong> ${escapeSalesHtml(formatSalesTimestamp(session.opened_at))}<br><strong>Preview through:</strong> ${escapeSalesHtml(formatSalesTimestamp(previewAt))}</p>
          <p style="margin-top:10px"><strong>${previewOrders.length} completed orders</strong> · Paid revenue: <strong>${escapeSalesHtml(previewMoney)}</strong> · Pending payments: ${pending}</p>
          ${salesItemsTable(previewOrders, salesDark)}
          <p style="margin-top:12px;font-size:12px;opacity:.8">Quantities include items from all completed orders in this period, including pending-payment and refunded orders. Finish billing before closing. Final totals use the server's closing time and may include orders completed after this preview.</p>
        </div>`,
        showCancelButton: true, confirmButtonText: 'Close and save', focusCancel: true,
      });
      if (!choice.isConfirmed) return;
      void Swal.fire({ title: 'Saving closing summary…', ...popupTheme,
        allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });
      const closed = await closeSalesDay(session.id);
      closedResult = closed;
      setSessions(previous => previous.map(row => row.id === closed.id ? closed : row));
      setSessionSelection(closed.id);
      setSalesOrders(getClosingOrders(closed));
      const saved = closed.closing_snapshot!;
      let itemSummary = '';
      let exportOrders: Order[] | null = null;
      try {
        const finalOrders = await getSalesOrders(productsRef.current, closed.opened_at, closed.closed_at!);
        const savedOrders = new Map(saved.orders.map(order => [order.order_number, order]));
        const included = finalOrders.filter(order => savedOrders.has(order.id));
        exportOrders = included;
        const changed = included.length !== saved.orders.length || included.some(order => {
          const original = savedOrders.get(order.id)!;
          return Number(original.total) !== order.total || original.payment_status !== order.paymentStatus;
        });
        itemSummary = `<p style="margin-top:14px;font-weight:700">Items from this sales period</p>${salesItemsTable(included, salesDark)}
          <p style="margin-top:10px;font-size:12px;opacity:.8">Item quantities were read from the order details after closing. This item list reflects current bill details and is not part of the saved closing report.${changed ? ' Some order details changed or are unavailable; the item list may be incomplete.' : ''}</p>`;
      } catch {
        itemSummary = '<p style="margin-top:14px">The sales day was saved successfully, but item details could not be loaded. Your saved closing totals are available in Sales period.</p>';
      }
      await Swal.fire({ ...popupTheme, icon: 'success', title: 'Sales day closed', width: 680,
        footer: '<div><button type="button" id="kan-export-sales-pdf" class="swal2-confirm swal2-styled" style="background:#17633a">Export PDF</button><p id="kan-pdf-message" role="status" style="font-size:12px">Choose Save as PDF in the print window.</p></div>',
        didOpen: () => {
          const button = document.getElementById('kan-export-sales-pdf');
          button?.addEventListener('click', () => {
            try { exportClosedSalesPdf(closed, exportOrders, settings.storeName, currency); }
            catch (error) {
              const message = document.getElementById('kan-pdf-message');
              if (message) message.textContent = error instanceof Error ? error.message : 'Unable to open PDF export.';
            }
          });
        },
        html: `<div style="text-align:left;font-size:14px;line-height:1.6;color:inherit"><p><strong>Opened:</strong> ${escapeSalesHtml(formatSalesTimestamp(closed.opened_at))}<br><strong>Closed:</strong> ${escapeSalesHtml(formatSalesTimestamp(closed.closed_at!))}</p><p style="margin-top:10px"><strong>${saved.completed_orders} completed orders</strong><br>Paid revenue: <strong>${escapeSalesHtml(formatMoney(Number(saved.paid_revenue)))}</strong><br>Pending payments: ${saved.pending_orders}</p>${itemSummary}</div>` });
    } catch (error) {
      await Swal.fire({ ...popupTheme, icon: closedResult ? 'warning' : 'error',
        title: closedResult ? 'Sales day saved' : 'Closing was not confirmed',
        text: closedResult ? 'Closing succeeded, but the display could not be refreshed. Select the closed sales day to view its saved totals.'
          : error instanceof Error ? error.message : 'Refresh to check the sales-day status before retrying.' });
      await loadSales();
    } finally { mutationRef.current = false; setSessionBusy(false); }
  };
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateOrderInput>({
    customerName: '',
    customerPhone: '',
    orderType: 'Takeaway',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [productSearch, setProductSearch] = React.useState('');
  const editTotals = editingOrder ? orderEditTotals(editForm.items || [], editForm.discount || 0, editingOrder) : null;

  React.useEffect(() => {
    if (!editingOrder) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLInputElement>('.oe-search input')?.focus();
    return () => { document.body.style.overflow = oldOverflow; previousFocus?.focus(); };
  }, [editingOrder?.id]);

  const currency = settings.currency || 'LKR';

  const formatMoney = (amount: number): string =>
    `${currency} ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Orders page is a completed-sales history. Non-completed orders are not shown here.
  const completedOrders = React.useMemo(
    () => salesOrders.filter(order => order.status === 'Completed'),
    [salesOrders],
  );

  const filteredOrders = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedDate = dateFilter;

    return completedOrders.filter(order => {
      const matchesType = typeFilter === 'All' || order.type === typeFilter;
      const matchesPaymentMethod =
        paymentMethodFilter === 'All' || order.paymentMethod === paymentMethodFilter;
      const matchesDate = !selectedDate || sriLankaDate(order.createdAt) === selectedDate;
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.cashierName.toLowerCase().includes(term) ||
        order.paymentMethod.toLowerCase().includes(term);

      return matchesType && matchesPaymentMethod && matchesDate && matchesSearch;
    });
  }, [completedOrders, typeFilter, paymentMethodFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, paymentMethodFilter, dateFilter, search]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const summary = React.useMemo(() => ({
    totalOrders: completedOrders.length,
    paidRevenue: completedOrders
      .filter(order => order.paymentStatus === 'Paid')
      .reduce((sum, order) => sum + Number(order.total), 0),
    pendingPayments: completedOrders.filter(order => order.paymentStatus === 'Pending').length,
    paidOrders: completedOrders.filter(order => order.paymentStatus === 'Paid').length,
  }), [completedOrders]);

  const handleRefresh = async (): Promise<void> => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await refreshOrders();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Refresh failed',
        text: error instanceof Error ? error.message : 'Unable to refresh orders.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const openEditOrder = (order: Order): void => {
    if (isClosedSession) return;
    setProductSearch('');
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || 'Walk-in Customer',
      customerPhone: order.customerPhone || '',
      orderType: order.type,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes || '',
      original: order,
      requestId: crypto.randomUUID(),
      discount: order.discount,
      items: order.items.map(item => ({ itemId: item.itemId, productId: item.productId ?? null,
        name: item.product.name, quantity: item.quantity, price: item.price, notes: item.notes })),
    });
  };

  const closeEditOrder = (): void => {
    if (savingEdit) return;
    setEditingOrder(null);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingOrder || savingEdit || isClosedSession) return;
    if (!editForm.customerName.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Customer name required', text: 'Please enter a customer name or use Walk-in Customer.', confirmButtonColor: '#f59e0b' });
      return;
    }

    try {
      validateOrderEdit(editForm);
      setSavingEdit(true);
      await updateOrder(editingOrder.id, {
        ...editForm,
        customerName: editForm.customerName.trim(),
        customerPhone: editForm.customerPhone?.trim() || '',
        notes: editForm.notes?.trim() || '',
      });
      const orderId = editingOrder.id;
      setEditingOrder(null);
      await loadSales();
      await Swal.fire({ icon: 'success', title: 'Order updated', text: `${orderId} has been updated successfully.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Update failed', text: error instanceof Error ? error.message : 'Unable to update the order.', confirmButtonColor: '#f59e0b' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeactivate = async (order: Order): Promise<void> => {
    if (processingId || currentUser?.role !== 'Admin' || isClosedSession) return;

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Deactivate order?',
      html: `This will move <b>${order.id}</b> to Deactivated Orders.<br/>You can restore it later or permanently delete it there.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      width: 520,
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'px-5 py-3 rounded-xl font-bold',
        cancelButton: 'px-5 py-3 rounded-xl font-bold',
      },
    });

    if (!result.isConfirmed) return;

    try {
      setProcessingId(order.id);

      Swal.fire({
        title: 'Deactivating...',
        text: `Moving ${order.id} to Deactivated Orders`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      await deactivateOrder(order.id);
      await loadSales();

      await Swal.fire({
        icon: 'success',
        title: 'Deactivated!',
        text: `Order ${order.id} was moved to Deactivated Orders.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Deactivate failed',
        text: error instanceof Error ? error.message : 'Unable to deactivate the order.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = (): void => {
    const header = [
      'Order Number', 'Customer', 'Phone', 'Date', 'Time', 'Type',
      'Payment Method', 'Payment Status', 'Subtotal', 'Discount', 'Tax', 'Total', 'Cashier',
    ].map(csvCell).join(',');

    const rows = filteredOrders.map(order => [
      order.id,
      order.customerName,
      order.customerPhone ?? '',
      order.date,
      order.time,
      order.type,
      order.paymentMethod,
      order.paymentStatus,
      order.subtotal,
      order.discount,
      order.tax,
      order.total,
      order.cashierName,
    ].map(csvCell).join(','));

    const blob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `orders-${selectedSession?.business_date || 'history'}${isClosedSession ? '-closing-snapshot' : ''}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { label: 'Completed Orders', value: summary.totalOrders.toLocaleString(), icon: ShoppingBag, style: 'bg-blue-100 text-blue-700' },
    { label: 'Paid Revenue', value: formatMoney(summary.paidRevenue), icon: Banknote, style: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending Payments', value: summary.pendingPayments.toLocaleString(), icon: WalletCards, style: 'bg-amber-100 text-amber-700' },
    { label: 'Paid Orders', value: summary.paidOrders.toLocaleString(), icon: ClipboardList, style: 'bg-violet-100 text-violet-700' },
  ];

  const startRow = filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

  return (
    <div ref={salesRootRef} className="min-h-screen space-y-6 bg-[#FAF7F2] p-4 sm:p-6">
      <style>{salesPickerDarkCss}</style>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-xl font-black text-gray-900">
            <ClipboardList className="h-6 w-6 text-amber-600" /> Orders Management
          </h1>
          <p className="mt-1 text-xs text-gray-500">{isClosedSession ? 'Saved closing figures · Sri Lanka time' : isAllHistory ? 'Completed POS orders · Sri Lanka time' : 'Business-day sales continue across midnight · Sri Lanka time'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleRefresh()} disabled={refreshing || ordersLoading || sessionBusy} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={handleExportCSV} disabled={!filteredOrders.length || ordersLoading || Boolean(salesError)} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50">
            <Download className="h-4 w-4 text-amber-400" /> Export CSV
          </button>
        </div>
      </div>

      {isAdmin && (
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm" aria-label="Sales day">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SalesPeriodPicker dark={salesDark} sessions={sessions} value={sessionSelection}
              disabled={sessionBusy || ordersLoading} onChange={setSessionSelection} />
            <div className="flex flex-wrap gap-2">
              {!activeSession && <button type="button" onClick={() => void handleOpenDay()}
                disabled={sessionBusy || ordersLoading || Boolean(salesError)}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{sessionBusy ? 'Please wait…' : 'Open Sales Day'}</button>}
              {activeSession && <button type="button" onClick={() => void handleCloseDay()}
                disabled={sessionBusy || ordersLoading || Boolean(salesError) || selectedSession?.id !== activeSession.id}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-amber-950 disabled:opacity-50">{sessionBusy ? 'Please wait…' : 'Close Sales Day'}</button>}
            </div>
          </div>
          {selectedSession ? <div className="text-xs text-gray-600">
            <strong>{selectedSession.closed_at ? 'Closed' : 'Open'} · Business date: {selectedSession.business_date}</strong>
            <p className="mt-1">Opened: {formatSalesTimestamp(selectedSession.opened_at)} · {selectedSession.closed_at ? `Closed: ${formatSalesTimestamp(selectedSession.closed_at)}` : 'Continues until you click Close Sales Day; midnight does not reset sales.'}</p>
          </div> : <p className="text-xs text-gray-500">{isAllHistory ? 'Showing all completed orders. Select a sales day to see its totals.' : 'No sales day is open. Open one using the actual opening time, or select All order history.'}</p>}
          {isClosedSession && <p className="text-xs text-amber-800">These are the saved closing figures. Customer details and receipt items were not stored in this snapshot. To view or edit an original bill, choose All order history. Later changes do not update this closing summary.</p>}
          <p className="text-[11px] text-gray-500">Summary cards cover the whole selected period. Filters below narrow the table and CSV only. Date filter uses calendar dates in Sri Lanka. Paid revenue is the total of Paid orders, not a cash-drawer reconciliation.</p>
        </section>
      )}
      {salesError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{salesError} Use Refresh to retry. Totals are unavailable until loading succeeds.</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.style}`}><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="mt-1 font-mono text-xl font-black text-gray-900">{ordersLoading || salesError ? '—' : card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs">
            {(['All', 'Dine In', 'Takeaway'] as const).map(type => (
              <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`flex-1 rounded-lg px-3 py-2 font-bold ${typeFilter === type ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-gray-500'}`}>{type}</button>
            ))}
          </div>

          <select value={paymentMethodFilter} onChange={event => setPaymentMethodFilter(event.target.value as PaymentMethodFilter)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none">
            <option value="All">All payment methods</option>
            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
          </select>

          <input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Order, customer, cashier, payment..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs outline-none" />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Date & Time</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Payment Method</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!ordersLoading && !salesError && paginatedOrders.map(order => {
                const busy = processingId === order.id;
                return (
                  <tr key={order.id} className="transition hover:bg-amber-50/40">
                    <td className="px-3 py-3 font-mono font-black text-gray-900">{order.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-gray-800">{order.customerName || 'Walk-in Customer'}</p>
                      <p className="text-[10px] text-gray-400">{order.customerPhone || 'No phone'}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{order.date}<br /><span className="text-[10px]">{order.time}</span></td>
                    <td className="px-3 py-3 font-semibold text-gray-700">{order.type}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-black text-gray-800">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-black text-amber-700">{formatMoney(order.total)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isClosedSession ? <span className="text-[10px] text-gray-400">Closing snapshot</span> : <>
                        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin text-amber-600" />}
                        <button type="button" onClick={() => setActiveReceiptOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600" title="View receipt"><Eye className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setActiveReceiptOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600" title="Print receipt"><Printer className="h-4 w-4" /></button>
                        {currentUser?.role === 'Admin' && <button type="button" disabled={busy} onClick={() => openEditOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50" title="Edit order"><Pencil className="h-4 w-4" /></button>}
                        {currentUser?.role === 'Admin' && <button type="button" disabled={busy} onClick={() => void handleDeactivate(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Deactivate order"><Trash2 className="h-4 w-4" /></button>}
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(ordersLoading || refreshing) && <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /> Loading orders...</div>}
        {!salesError && !ordersLoading && !refreshing && !filteredOrders.length && <div className="py-14 text-center"><ClipboardList className="mx-auto h-10 w-10 text-gray-200" /><p className="mt-3 text-sm font-black text-gray-700">No completed orders found</p><p className="mt-1 text-xs text-gray-400">Choose a sales period, adjust filters, or complete a new POS payment.</p></div>}

        {!ordersLoading && !refreshing && filteredOrders.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] font-semibold text-gray-500">
              Showing <span className="font-black text-gray-800">{startRow}-{endRow}</span> of <span className="font-black text-gray-800">{filteredOrders.length}</span> orders · 10 per page
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800">
                Page {currentPage} / {totalPages}
              </span>

              <button type="button" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button type="button" onClick={() => { setSearch(''); setDateFilter(''); setTypeFilter('All'); setPaymentMethodFilter('All'); setCurrentPage(1); }} className="text-[11px] font-bold text-amber-700 hover:underline">Clear filters</button>
          </div>
        )}
      </div>


      {editingOrder && (
        <div className="oe-overlay">
          <div role="dialog" aria-modal="true" aria-label="Edit completed order" className="oe-dialog" onKeyDown={event => {
            if (event.key === 'Escape') { event.stopPropagation(); closeEditOrder(); }
            if (event.key === 'Tab') {
              const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary')).filter(el => el.getClientRects().length > 0);
              const first = controls[0], last = controls[controls.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
          }}>
            <header className="oe-header">
              <div className="oe-header-icon"><Pencil size={20} /></div>
              <div className="oe-heading"><span>ORDERS / EDIT BILL</span><h2>{editingOrder.id}</h2></div>
              <span className="oe-status">Completed sale</span>
              <button type="button" aria-label="Close order editor" onClick={closeEditOrder} disabled={savingEdit} className="oe-close"><X size={20} /></button>
            </header>
            <fieldset disabled={savingEdit} className="oe-body">
              <section className="oe-products" aria-label="Order products">
                <div className="oe-section-heading"><div><h3>Order products <span className="oe-count">{editForm.items?.length || 0}</span></h3><p>Adjust this bill’s items and prices.</p></div></div>
                <div className="oe-product-picker">
                  <div className="oe-search"><Search size={17} /><input aria-label="Search products to add" value={productSearch} onChange={event => setProductSearch(event.target.value)} placeholder="Add product — search name, SKU or barcode" /></div>
                  <div className="oe-suggestions">
                    {products.filter(product => product.status === 'Active' && `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(productSearch.toLowerCase())).slice(0, productSearch.trim() ? 30 : 4).map(product => (
                      <button key={product.id} type="button" onClick={() => { setEditForm(previous => ({ ...previous, items: [...(previous.items || []), { productId: product.id, name: product.name, quantity: 1, price: product.price }] })); setProductSearch(''); }} className="oe-suggestion"><span className="oe-add">+</span><span className="oe-suggestion-name">{product.name}<small>{product.category.trim().toLowerCase() === 'food' ? `Stock: ${product.stock}` : product.category}</small></span><strong>{formatMoney(product.price)}</strong></button>
                    ))}
                    {!products.some(product => product.status === 'Active' && `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(productSearch.toLowerCase())) && <p className="oe-no-results">No matching active products.</p>}
                  </div>
                  <p className="oe-picker-hint">{productSearch.trim() ? 'Showing up to 30 matches. Refine your search if needed.' : 'Quick add · Search to find more products.'}</p>
                </div>
                <div className="oe-lines">
                  <div className="oe-table-heading"><span>PRODUCT</span><span>QUANTITY</span><span>UNIT PRICE</span><span>AMOUNT</span><span /></div>
                  {(editForm.items || []).map((item, index) => (
                    <div key={item.itemId || `new-${index}`} className="oe-line">
                      <div className="oe-product-name"><span className="oe-line-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><small>{item.productId ? (item.itemId ? 'Existing item' : 'Added to bill') : 'Historical item · product deleted'}</small></div></div>
                      <div className="oe-quantity"><button type="button" aria-label={`Decrease quantity for ${item.name}`} disabled={savingEdit || !Number.isFinite(item.quantity) || item.quantity <= 1} onClick={() => setEditForm(previous => ({ ...previous, items: previous.items?.map((line, i) => i === index ? { ...line, quantity: Math.max(1, line.quantity - 1) } : line) }))}>−</button><input aria-label={`Quantity for ${item.name}`} type="number" min="1" max="1000" step="1" value={Number.isNaN(item.quantity) ? '' : item.quantity} onChange={event => setEditForm(previous => ({ ...previous, items: previous.items?.map((line, i) => i === index ? { ...line, quantity: event.target.value === '' ? NaN : Number(event.target.value) } : line) }))} /><button type="button" aria-label={`Increase quantity for ${item.name}`} disabled={savingEdit || !Number.isFinite(item.quantity) || item.quantity >= 1000} onClick={() => setEditForm(previous => ({ ...previous, items: previous.items?.map((line, i) => i === index ? { ...line, quantity: Math.min(1000, line.quantity + 1) } : line) }))}>+</button></div>
                      <label className="oe-price"><span className="oe-mobile-label">Unit price</span><input aria-label={`Unit price for ${item.name}`} type="number" min="0" step="0.01" value={Number.isNaN(item.price) ? '' : item.price} onChange={event => setEditForm(previous => ({ ...previous, items: previous.items?.map((line, i) => i === index ? { ...line, price: event.target.value === '' ? NaN : Number(event.target.value) } : line) }))} /></label>
                      <strong className="oe-line-total">{Number.isFinite(item.quantity * item.price) ? formatMoney(item.quantity * item.price) : '—'}</strong>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setEditForm(previous => ({ ...previous, items: previous.items?.filter((_, i) => i !== index) }))} className="oe-remove"><Trash2 size={17} /></button>
                    </div>
                  ))}
                  {!editForm.items?.length && <div className="oe-empty"><ShoppingBag size={30} /><strong>Your bill has no products</strong><span>Add a product using the search above.</span></div>}
                </div>
                <label className="oe-notes"><span>Order notes <small>Optional</small></span><textarea value={editForm.notes || ''} onChange={event => setEditForm(previous => ({ ...previous, notes: event.target.value }))} rows={2} placeholder="Add a note for this order..." /></label>
              </section>
              <aside className="oe-sidebar">
                <section className="oe-summary">
                  <h3>Bill summary</h3>
                  <div className="oe-summary-row"><span>Subtotal</span><strong>{Number.isFinite(editTotals?.subtotal) ? formatMoney(editTotals!.subtotal) : '—'}</strong></div>
                  <label className="oe-discount"><span>Order discount <small>{currency}</small></span><input aria-label="Order discount" type="number" min="0" step="0.01" value={Number.isNaN(editForm.discount) ? '' : editForm.discount ?? 0} onChange={event => setEditForm(previous => ({ ...previous, discount: event.target.value === '' ? NaN : Number(event.target.value) }))} /></label>
                  <p className="oe-summary-hint">Review the discount when changing offer or combo items.</p>
                  <div className="oe-summary-row"><span>Tax</span><strong>{Number.isFinite(editTotals?.tax) ? formatMoney(editTotals!.tax) : '—'}</strong></div>
                  <div className="oe-grand-total"><span>Updated total</span><strong>{Number.isFinite(editTotals?.total) ? formatMoney(editTotals!.total) : '—'}</strong></div>
                  <div className="oe-summary-row oe-previous"><span>Previous total</span><span>{formatMoney(editingOrder.total)}</span></div>
                  <div className="oe-summary-row oe-difference"><span>Difference</span><strong>{Number.isFinite(editTotals?.total) ? formatMoney(editTotals!.total - editingOrder.total) : '—'}</strong></div>
                </section>
                <details className="oe-details" open><summary>Customer & payment</summary><div className="oe-details-fields">
              <label className="oe-field">
                <span className="oe-field">Customer name</span>
                <input value={editForm.customerName} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, customerName: event.target.value }))} className="oe-field" />
              </label>
              <label className="oe-field">
                <span className="oe-field">Customer phone</span>
                <input value={editForm.customerPhone || ''} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, customerPhone: event.target.value }))} placeholder="Optional" className="oe-field" />
              </label>
              <label className="oe-field">
                <span className="oe-field">Order type</span>
                <select value={editForm.orderType} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, orderType: event.target.value as OrderType }))} className="oe-field">
                  <option value="Takeaway">Takeaway</option><option value="Dine In">Dine In</option>
                </select>
              </label>
              <label className="oe-field">
                <span className="oe-field">Payment method</span>
                <select value={editForm.paymentMethod} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, paymentMethod: event.target.value as PaymentMethod }))} className="oe-field">
                  {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label className="oe-field">
                <span className="oe-field">Payment status</span>
                <select value={editForm.paymentStatus} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, paymentStatus: event.target.value as OrderPaymentStatus }))} className="oe-field">
                  <option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Refunded">Refunded</option>
                </select>
              </label>

                </div></details>
                <p className="oe-payment-note">Changing this bill does not charge or refund a payment automatically.</p>
              </aside>
            </fieldset>
            <footer className="oe-footer">
              <div className="oe-footer-total"><span>Updated total</span><strong>{Number.isFinite(editTotals?.total) ? formatMoney(editTotals!.total) : '—'}</strong></div>
              <div className="oe-footer-actions"><button type="button" onClick={closeEditOrder} disabled={savingEdit} className="oe-cancel">Cancel</button><button type="button" onClick={() => void handleSaveEdit()} disabled={savingEdit} className="oe-save">{savingEdit ? <Loader2 className="animate-spin" size={16} /> : <Pencil size={16} />}{savingEdit ? 'Saving…' : 'Save Changes'}</button></div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};