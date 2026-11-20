import React from 'react';
import { X, Printer, Leaf } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import logoImage from '../../images/logo.jpg';
import qrImage from '../../images/qr.jpeg';

const generateKotNumber = (orderId: string): number => {
  let hash = 0;

  for (let index = 0; index < orderId.length; index += 1) {
    hash = (hash * 31 + orderId.charCodeAt(index)) | 0;
  }

  return 1000 + (Math.abs(hash) % 9000);
};

export const ReceiptModal: React.FC = () => {
  const { activeReceiptOrder, setActiveReceiptOrder, settings, currentUser, cashierPermissions } = useApp();

  if (!activeReceiptOrder) return null;
  const kotNumber = generateKotNumber(activeReceiptOrder.id);
  const handlePrint = (): void => {
    // The @media print rules in index.css remove modal height/overflow limits,
    // so the complete receipt + KOT prints as one continuous thermal bill.
    window.requestAnimationFrame(() => {
      window.print();
    });
  };

  // Email and WhatsApp receipt sharing are intentionally hidden for now.
  // They can be enabled later as additional features.


  return (
    <div className="receipt-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="receipt-modal-card bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="receipt-controls no-print p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Receipt Preview</span>
          <button
            onClick={() => setActiveReceiptOrder(null)}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Thermal Receipt Area */}
        <div
          className="receipt-preview-scroll flex-1 overflow-y-auto overflow-x-hidden bg-white"
        >
          <div
            id="printable-receipt"
            className="receipt-print-area p-5 font-mono text-gray-800 bg-white mx-auto"
            style={{
              width: (settings.receiptPaperWidth ?? '80mm') === '58mm' ? '58mm' : '80mm',
              maxWidth: '100%',
              fontSize:
                (settings.receiptFontSize ?? 'Standard') === 'Compact'
                  ? '9px'
                  : (settings.receiptFontSize ?? 'Standard') === 'Comfortable'
                    ? '13px'
                    : '11px',
              lineHeight:
                (settings.receiptFontSize ?? 'Standard') === 'Compact'
                  ? '1.2'
                  : (settings.receiptFontSize ?? 'Standard') === 'Comfortable'
                    ? '1.6'
                    : '1.4',
              ['--receipt-paper-width' as string]:
                (settings.receiptPaperWidth ?? '80mm') === '58mm' ? '58mm' : '80mm',
            }}
          >
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            {/* Logo */}
            {(settings.showLogoOnReceipt ?? true) && (
              <img
                src={settings.logo || logoImage}
                alt="Kanthaaram Logo"
                className="w-17.5 h-17.5 mx-auto mb-1 object-contain"
              />
            )}
            <h2 className="font-extrabold text-base text-emerald-950 font-serif leading-tight">
              {settings.receiptHeaderTitle ?? settings.storeName}
            </h2>
            {(settings.receiptHeaderTagline) && (
              <p className="text-[9px] text-gray-400 italic font-sans">{settings.receiptHeaderTagline}</p>
            )}
            {(settings.showAddressOnReceipt ?? true) && (
              <>
                <p className="text-[10px] text-gray-500 max-w-50 mx-auto font-sans leading-tight">
                  {settings.address}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  Tel: {settings.phone}
                </p>
              </>
            )}
          </div>

          <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-gray-300 text-gray-600">
            <p className="font-bold text-center text-xs text-gray-900 uppercase tracking-widest my-1">Receipt</p>
            <div className="flex justify-between">
              <span>Bill No: <strong className="text-gray-900">{activeReceiptOrder.id}</strong></span>
              <span>Date: {activeReceiptOrder.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Time: {activeReceiptOrder.time}</span>
              {(settings.showCashierOnReceipt ?? true) && (
                <span>Cashier: {activeReceiptOrder.cashierName}</span>
              )}
            </div>
            {(settings.showCustomerOnReceipt ?? true) && activeReceiptOrder.customerName && (
              <div className="flex justify-between pt-1 font-semibold text-gray-800">
                <span>Customer: {activeReceiptOrder.customerName}</span>
                <span>Type: {activeReceiptOrder.type}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-gray-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-[10px] uppercase">
                  <th className="pb-1 font-bold">Item</th>
                  <th className="pb-1 text-center font-bold">Qty</th>
                  <th className="pb-1 text-right font-bold">Price</th>
                  <th className="pb-1 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                {activeReceiptOrder.items.map((item, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="py-1.5 font-medium">{item.product.name}</td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-right">
  {item.price.toFixed(2)}
</td>

<td className="py-1.5 text-right font-bold">
  {(item.price * item.quantity).toFixed(2)}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="py-2.5 text-xs space-y-1.5 border-b border-dashed border-gray-300">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{activeReceiptOrder.subtotal.toFixed(2)}</span>
            </div>
            {activeReceiptOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>- {activeReceiptOrder.discount.toFixed(2)}</span>
              </div>
            )}
            {(settings.showTaxBreakdownOnReceipt ??
  true) &&
  activeReceiptOrder.tax > 0 && (
    <div className="flex justify-between text-gray-600">
      <span>Tax</span>

      <span>{activeReceiptOrder.tax.toFixed(2)}</span>
    </div>
  )}

            <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
             <span className="text-base text-amber-800">
  {activeReceiptOrder.total.toFixed(2)}
</span>
            </div>
            {(settings.showPaymentMethodOnReceipt ?? true) && (
              <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                <span>Payment Mode</span>
                <span className="font-bold">{activeReceiptOrder.paymentMethod}</span>
              </div>
            )}
            {(settings.showNotesOnReceipt ?? true) && activeReceiptOrder.notes && (
              <div className="text-[10px] text-gray-500 pt-1 border-t border-dotted border-gray-200 leading-normal">
                <span className="font-bold">Notes: </span>
                <span>{activeReceiptOrder.notes}</span>
              </div>
            )}
          </div>

          {/* QR Code & Thank You Footer */}
          <div className="pt-4 text-center space-y-2">
            {/* QR Code and Receipt Footer */}
            <div className="pt-4 text-center space-y-2">
              {(settings.showQrCodeOnReceipt ?? true) && (
                <img
                  src={qrImage}
                  alt="Kanthaaram QR Code"
                  className="w-20 h-20 mx-auto rounded-lg border border-gray-200 p-1 object-contain"
                />
              )}

              <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-xs pt-1 font-sans">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />

                <span>
                  {settings.receiptFooter}
                </span>
              </div>
            </div>

          </div>

          {/* Separate KOT for Takeaway (Parcel) orders */}
          {(activeReceiptOrder.type === 'Takeaway' ||
  activeReceiptOrder.type === 'Dine In') && (
            <div className="mt-6 pt-6 border-t border-dashed border-gray-400 text-gray-800 font-mono">
              {/* Scissors cutting line */}
              <div className="relative flex justify-center items-center text-[10px] text-gray-400 select-none pb-4 font-sans">
                <span className="absolute left-0 right-0 border-b border-dotted border-gray-300"></span>
                <span className="bg-white px-2 relative z-10 flex items-center gap-1 font-bold">
                  ✂️ KOT (CUT HERE FOR KITCHEN / COUNTER)
                </span>
              </div>

              {/* KOT Header */}
             <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                <h3 className="font-extrabold text-base text-gray-900 tracking-wider">
                  KITCHEN ORDER TICKET
                </h3>

                <p className="text-xl font-black text-gray-950 tracking-widest">
                  KOT #{kotNumber}
                </p>

                <p className="text-[10px] text-gray-500 font-sans">
                  {activeReceiptOrder.type === 'Takeaway'
                    ? 'For Parcel / Counter Dispatch'
                    : 'For Dine In Service'}
                </p>
              </div>

              {/* KOT Meta Info */}
              <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-gray-300 text-gray-600">
                <div className="flex justify-between">
                  <span>
                      Bill No:{' '}
                      <strong className="text-gray-900">
                        {activeReceiptOrder.id}
                      </strong>
                    </span>
                  <span>Date: {activeReceiptOrder.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time: {activeReceiptOrder.time}</span>
                 <span>
                    Type:{' '}
                    <strong className="text-emerald-800 uppercase">
                      {activeReceiptOrder.type === 'Takeaway'
                        ? 'Takeaway (Parcel)'
                        : 'Dine In'}
                    </strong>
                  </span>
                </div>
                {activeReceiptOrder.customerName && (
                  <div className="flex justify-between pt-1">
                    <span>Customer: {activeReceiptOrder.customerName}</span>
                  </div>
                )}
              </div>

              {/* KOT Items List */}
              <div className="py-3 border-b border-dashed border-gray-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-250 text-gray-500 text-[10px] uppercase">
                      <th className="pb-1 font-bold">Item Description</th>
                      <th className="pb-1 text-center font-bold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                    {activeReceiptOrder.items.map((item, idx) => (
                      <tr key={idx} className="text-gray-900 font-bold">
                        <td className="py-1.5">{item.product.name}</td>
                        <td className="py-1.5 text-center">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* KOT Footer / Notes */}
              {activeReceiptOrder.notes && (
                <div className="text-[10px] text-gray-500 pt-2.5 leading-normal">
                  <span className="font-bold">Kitchen Instructions: </span>
                  <span className="italic">{activeReceiptOrder.notes}</span>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Print is the only active receipt action.
            Email and WhatsApp are reserved as future additional features. */}
        <div className="receipt-actions no-print p-3 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrint}
            disabled={currentUser?.role === 'Cashier' && !cashierPermissions.receipts}
            className="w-full p-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            Print Bill
          </button>

          {/*
            Future additional features:

            <button onClick={handleEmail}>Email</button>
            <button onClick={handleWhatsApp}>WhatsApp</button>
          */}
        </div>
      </div>
    </div>
  );
};