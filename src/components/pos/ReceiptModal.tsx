import React, { useEffect, useRef } from 'react';

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

  const {

    activeReceiptOrder,

    setActiveReceiptOrder,

    settings,

    currentUser,

    cashierPermissions,

    setActiveView,

  } = useApp();



  const printPending = useRef(false);

  const canPrint =

    currentUser?.role !== 'Cashier' || cashierPermissions.receipts;



  const configuredWidth =

    (settings.receiptPaperWidth ?? '80mm') === '58mm' ? '58mm' : '80mm';



  // Standard printable width for thermal paper rolls:

  // - 80mm roll has 72mm active print head width (e.g. XP-80C standard 576 dots at 203 DPI)

  // - 58mm roll has 48mm active print head width (384 dots at 203 DPI)

  const printableWidth = configuredWidth === '58mm' ? '48mm' : '72mm';



  const fontSize =

    (settings.receiptFontSize ?? 'Standard') === 'Compact'

      ? '9px'

      : (settings.receiptFontSize ?? 'Standard') === 'Comfortable'

        ? '11.5px'

        : '10px';



  const lineHeight =

    (settings.receiptFontSize ?? 'Standard') === 'Compact'

      ? 1.25

      : (settings.receiptFontSize ?? 'Standard') === 'Comfortable'

        ? '1.4'

        : '1.3';



  
const closeReceipt = () => {
  // Allow the user to close the receipt even if printing is pending.
  printPending.current = false;

  setActiveReceiptOrder(null);
  setActiveView('pos');
};





  const handlePrint = (): void => {

    if (!activeReceiptOrder || !canPrint || printPending.current) return;



    const source = document.getElementById('printable-receipt');

    if (!source) {

      console.error('Receipt print area was not found.');

      return;

    }



    // Print in a hidden iframe (no popup window, no extra tab).
    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(printFrame);
    const printWindow = printFrame.contentWindow as Window;
    if (!printWindow) {
      printFrame.remove();
      window.alert('Unable to start printing. Please try again.');
      return;
    }

    printPending.current = true;



    const clonedReceipt = source.cloneNode(true) as HTMLElement;

    clonedReceipt.removeAttribute('id');

    clonedReceipt.classList.add('printed-receipt-content');

    // Save the KOT separately, then remove it from the customer receipt.
    const kotSection = clonedReceipt.querySelector('.kot-section');
    const kotTicket = kotSection?.cloneNode(true) as HTMLElement | null;
    kotSection?.remove();

    clonedReceipt.style.setProperty('width', printableWidth, 'important');

    clonedReceipt.style.setProperty('min-width', printableWidth, 'important');

    clonedReceipt.style.setProperty('max-width', printableWidth, 'important');

    clonedReceipt.style.setProperty('margin', '0 auto', 'important');

    clonedReceipt.style.setProperty('padding', '1mm 1.5mm', 'important');

    clonedReceipt.style.setProperty('overflow', 'visible', 'important');

    clonedReceipt.style.setProperty('font-size', fontSize, 'important');

    clonedReceipt.style.setProperty('line-height', String(lineHeight), 'important');

    clonedReceipt.style.setProperty('box-sizing', 'border-box', 'important');

    clonedReceipt.style.setProperty('background', '#fff', 'important');

    clonedReceipt.style.setProperty('color', '#000', 'important');



    const headAssets = Array.from(

      document.head.querySelectorAll('link[rel="stylesheet"], style')

    )

      .map((element) => element.outerHTML)

      .join('\n');



    printWindow.document.open();

    printWindow.document.write(`<!doctype html>

      <html>

        <head>

          <meta charset="utf-8" />

          <meta name="viewport" content="width=device-width, initial-scale=1" />

          <title>Receipt - ${activeReceiptOrder.id}</title>

          <link rel="preconnect" href="https://fonts.googleapis.com" />

          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet" />

          ${headAssets}

          <style>

            @page {

              size: ${configuredWidth === '58mm' ? '58mm auto' : '80mm auto'};

              margin: 0;

            }

            *, *::before, *::after {

              box-sizing: border-box !important;

              -webkit-print-color-adjust: exact !important;

              print-color-adjust: exact !important;

            }

            html, body {

              display: block !important;

              width: 100% !important;

              min-width: 0 !important;

              max-width: none !important;

              height: auto !important;

              margin: 0 !important;

              padding: 0 !important;

              overflow: visible !important;

              background: #ffffff !important;

              color: #000000 !important;

              font-family: 'JetBrains Mono', 'Consolas', monospace;

            }

            body * {

              visibility: visible !important;

            }

            #receipt-print-root {

              display: flex !important;

              flex-direction: column !important;

              align-items: center !important;

              justify-content: flex-start !important;

              width: 100% !important;

              margin: 0 auto !important;

              padding: 0 !important;

              background: #ffffff !important;

            }

            .printed-receipt-content {

              display: block !important;

              width: ${printableWidth} !important;

              min-width: ${printableWidth} !important;

              max-width: ${printableWidth} !important;

              margin: 0 auto !important;

              padding: 1mm 1.5mm !important;

              background: #ffffff !important;

              color: #000000 !important;

              box-sizing: border-box !important;

              font-family: 'JetBrains Mono', 'Consolas', monospace !important;

            }

            /* High-contrast solid black for thermal printing */

            .printed-receipt-content,

            .printed-receipt-content * {

              color: #000000 !important;

            }

            /* Clean typography for Tamil title and headers */

            .printed-receipt-content .receipt-header-title {

              font-family: 'Nirmala UI', 'Mukta Malar', 'Playfair Display', serif !important;

              font-weight: 800 !important;

              color: #000000 !important;

            }

            .printed-receipt-content .receipt-header-tagline,

            .printed-receipt-content .receipt-header-address,

            .printed-receipt-content .cut-line,

            .printed-receipt-content .receipt-footer {

              font-family: 'Outfit', 'Segoe UI', -apple-system, sans-serif !important;

            }

            /* Metadata rows - NEVER wrap bill numbers or dates */

            .printed-receipt-content .receipt-meta-row {

              display: flex !important;

              justify-content: space-between !important;

              align-items: baseline !important;

              gap: 4px !important;

              width: 100% !important;

            }

            .printed-receipt-content .receipt-meta-row > span {

              white-space: nowrap !important;

              word-break: keep-all !important;

              overflow-wrap: normal !important;

              min-width: 0 !important;

            }

            .printed-receipt-content .receipt-meta-row > span.meta-truncate {

              white-space: nowrap !important;

              overflow: hidden !important;

              text-overflow: ellipsis !important;

              max-width: 60% !important;

            }

            .printed-receipt-content .receipt-kot-badge {

              text-align: center !important;

              font-weight: 900 !important;

              font-size: 13px !important;

              letter-spacing: 0.04em !important;

              margin: 2mm 0 1mm 0 !important;

              display: block !important;

              width: 100% !important;

            }

            /* Item and KOT tables */

            .printed-receipt-content table {

              width: 100% !important;

              table-layout: fixed !important;

              border-collapse: collapse !important;

            }

            .printed-receipt-content th,

            .printed-receipt-content td {

              padding: 2px 1px !important;

              vertical-align: top !important;

            }

            .printed-receipt-content .receipt-items-table th:first-child,

            .printed-receipt-content .receipt-items-table td:first-child {

              width: 44% !important;

              text-align: left !important;

              word-break: break-word !important;

              overflow-wrap: break-word !important;

            }

            .printed-receipt-content .receipt-items-table th:nth-child(2),

            .printed-receipt-content .receipt-items-table td:nth-child(2) {

              width: 12% !important;

              text-align: center !important;

              white-space: nowrap !important;

            }

            .printed-receipt-content .receipt-items-table th:nth-child(3),

            .printed-receipt-content .receipt-items-table td:nth-child(3) {

              width: 22% !important;

              text-align: right !important;

              white-space: nowrap !important;

            }

            .printed-receipt-content .receipt-items-table th:nth-child(4),

            .printed-receipt-content .receipt-items-table td:nth-child(4) {

              width: 22% !important;

              text-align: right !important;

              white-space: nowrap !important;

            }

            .printed-receipt-content .kot-items-table th:first-child,

            .printed-receipt-content .kot-items-table td:first-child {

              width: 76% !important;

              text-align: left !important;

              word-break: break-word !important;

            }

            .printed-receipt-content .kot-items-table th:nth-child(2),

            .printed-receipt-content .kot-items-table td:nth-child(2) {

              width: 24% !important;

              text-align: right !important;

              white-space: nowrap !important;

            }

            /* Crisp borders for thermal printing */

            .printed-receipt-content .border-dashed,

            .printed-receipt-content .border-dotted,

            .printed-receipt-content .receipt-separator {

              border-color: #000000 !important;

            }

            .printed-receipt-content .receipt-items-table thead tr {

              border-bottom: 1px dashed #000000 !important;

            }

            .printed-receipt-content .kot-items-table thead tr {

              border-bottom: 1px dashed #000000 !important;

            }

            .printed-receipt-content .receipt-total-row {

              border-top: 1px dashed #000000 !important;

              border-bottom: 1px dashed #000000 !important;

              padding: 3px 0 !important;

              margin: 3px 0 !important;

            }

            /* Images */

            .printed-receipt-content img {

              max-width: 100% !important;

              object-fit: contain !important;

            }

            .printed-receipt-content .receipt-logo {

              width: 18mm !important;

              height: 18mm !important;

              margin: 0 auto 1.5mm auto !important;

            }

            .printed-receipt-content .receipt-qr {

              width: 20mm !important;

              height: 20mm !important;

              margin: 0 auto !important;

              image-rendering: -webkit-optimize-contrast !important;

              image-rendering: crisp-edges !important;

            }

            .printed-receipt-content .receipt-section,

            .printed-receipt-content tr,

            .printed-receipt-content img {

              break-inside: avoid !important;

              page-break-inside: avoid !important;

            }

            .printed-receipt-content .kot-section {

              margin-top: 4mm !important;

              padding-top: 3mm !important;

            }

          </style>

        </head>

        <body><main id="receipt-print-root"></main></body>

      </html>`);

    printWindow.document.close();



    const root = printWindow.document.getElementById('receipt-print-root');

    if (root) root.appendChild(clonedReceipt);



    // Put the KOT in the SAME print job, on its own page, so one Print / Enter
    // produces both tickets. The page break lets the thermal printer cut between them.
    if (kotTicket && root) {
      const kotWrapper = printWindow.document.createElement('div');
      kotWrapper.className = 'printed-receipt-content kot-page';
      kotWrapper.style.setProperty('width', printableWidth, 'important');
      kotWrapper.style.setProperty('min-width', printableWidth, 'important');
      kotWrapper.style.setProperty('max-width', printableWidth, 'important');
      kotWrapper.style.setProperty('margin', '0 auto', 'important');
      kotWrapper.style.setProperty('padding', '1mm 1.5mm', 'important');
      kotWrapper.style.setProperty('box-sizing', 'border-box', 'important');
      kotWrapper.style.setProperty('background', '#fff', 'important');
      kotWrapper.style.setProperty('color', '#000', 'important');
      kotWrapper.style.setProperty('font-size', fontSize, 'important');
      kotWrapper.style.setProperty('line-height', String(lineHeight), 'important');
      kotWrapper.style.setProperty('break-before', 'page', 'important');
      kotWrapper.style.setProperty('page-break-before', 'always', 'important');
      kotTicket.style.setProperty('margin-top', '0', 'important');
      kotTicket.style.setProperty('border-top', 'none', 'important');
      kotTicket.style.setProperty('padding-top', '0', 'important');
      kotWrapper.appendChild(kotTicket);
      root.appendChild(kotWrapper);
    }

    let printStarted = false;
    let printFinished = false;

    const finishPrinting = () => {
      if (printFinished) return;
      printFinished = true;
      printPending.current = false;

      window.setTimeout(() => printFrame.remove(), 500);
      setActiveReceiptOrder(null);
      setActiveView('pos');
    };

    const startPrintWhenReady = async () => {
      if (printStarted) return;

      try {
        if (printWindow.document.fonts) {
          await printWindow.document.fonts.ready;
        }
      } catch {
        // Continue if font readiness cannot be checked.
      }

      const images = Array.from(printWindow.document.images);
      if (!images.every((image) => image.complete)) {
        window.setTimeout(startPrintWhenReady, 100);
        return;
      }

      printStarted = true;
      printWindow.addEventListener('afterprint', finishPrinting);
      printWindow.focus();
      printWindow.print(); // ONE print call = bill + KOT together
    };

    // Wait for fonts and images, then print once.
    window.setTimeout(startPrintWhenReady, 350);

  };

  useEffect(() => {

    if (!activeReceiptOrder) return;



    const onAfterPrint = () => {

      if (!printPending.current) return;

      printPending.current = false;

      setActiveReceiptOrder(null);

      setActiveView('pos');

    };



    window.addEventListener('afterprint', onAfterPrint);

    return () => window.removeEventListener('afterprint', onAfterPrint);

  }, [activeReceiptOrder, setActiveReceiptOrder, setActiveView]);



  useEffect(() => {

    if (!activeReceiptOrder) return;



    const onKey = (event: KeyboardEvent) => {

      const target = event.target;

      const isTyping =

        target instanceof HTMLInputElement ||

        target instanceof HTMLTextAreaElement ||

        target instanceof HTMLSelectElement ||

        (target instanceof HTMLElement && target.isContentEditable);



      if (event.key === 'Escape' && !printPending.current) {

        event.preventDefault();

        event.stopImmediatePropagation();

        closeReceipt();

      } else if (

        event.key === 'Enter' &&

        !isTyping &&

        !event.repeat &&

        canPrint &&

        !printPending.current

      ) {

        event.preventDefault();

        event.stopImmediatePropagation();

        handlePrint();

      }

    };



    window.addEventListener('keydown', onKey, true);

    return () => window.removeEventListener('keydown', onKey, true);

  }, [activeReceiptOrder, canPrint, setActiveReceiptOrder, setActiveView]);



  if (!activeReceiptOrder) return null;



  const kotNumber = generateKotNumber(activeReceiptOrder.id);



  return (

    <>

      <style>{`

        /*

         * Thermal receipt preview & print styling

         * Configured width matches physical printer roll printable width

         */

        @page {

          size: ${configuredWidth === '58mm' ? '58mm auto' : '80mm auto'};

          margin: 0;

        }



        #printable-receipt {

          width: ${printableWidth};

          max-width: 100%;

          box-sizing: border-box;

          padding: 2mm 1.5mm;

          margin: 0 auto;

          overflow-wrap: normal;

          word-break: normal;

          background: #fff;

          color: #111;

          -webkit-print-color-adjust: exact;

          print-color-adjust: exact;

        }



        #printable-receipt *,

        #printable-receipt *::before,

        #printable-receipt *::after {

          box-sizing: border-box;

        }



        #printable-receipt table {

          width: 100%;

          table-layout: fixed;

          border-collapse: collapse;

          border-spacing: 0;

        }



        #printable-receipt th,

        #printable-receipt td {

          padding-left: 1px;

          padding-right: 1px;

          vertical-align: top;

        }



        #printable-receipt .receipt-items-table th:first-child,

        #printable-receipt .receipt-items-table td:first-child {

          width: 44%;

          text-align: left;

          word-break: break-word;

        }



        #printable-receipt .receipt-items-table th:nth-child(2),

        #printable-receipt .receipt-items-table td:nth-child(2) {

          width: 12%;

          text-align: center;

          white-space: nowrap;

        }



        #printable-receipt .receipt-items-table th:nth-child(3),

        #printable-receipt .receipt-items-table td:nth-child(3) {

          width: 22%;

          text-align: right;

          white-space: nowrap;

        }



        #printable-receipt .receipt-items-table th:nth-child(4),

        #printable-receipt .receipt-items-table td:nth-child(4) {

          width: 22%;

          text-align: right;

          white-space: nowrap;

        }



        #printable-receipt .kot-items-table th:first-child,

        #printable-receipt .kot-items-table td:first-child {

          width: 76%;

          text-align: left;

          word-break: break-word;

        }



        #printable-receipt .kot-items-table th:nth-child(2),

        #printable-receipt .kot-items-table td:nth-child(2) {

          width: 24%;

          text-align: right;

          white-space: nowrap;

        }



        #printable-receipt .receipt-separator {

          border-top: 1px dashed #777;

        }



        #printable-receipt tr,

        #printable-receipt img,

        #printable-receipt .receipt-section {

          break-inside: avoid;

          page-break-inside: avoid;

        }



        #printable-receipt .receipt-meta-row {

          display: flex;

          justify-content: space-between;

          align-items: baseline;

          gap: 4px;

          width: 100%;

        }



        #printable-receipt .receipt-meta-row > span {

          white-space: nowrap;

          word-break: keep-all;

          overflow-wrap: normal;

        }



        #printable-receipt .receipt-meta-row > span.meta-truncate {

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          max-width: 60%;

        }



        #printable-receipt .receipt-kot-badge {

          text-align: center;

          font-weight: 900;

          font-size: 13px;

          letter-spacing: 0.04em;

          margin: 6px 0 2px 0;

        }



        @media print {

          html,

          body,

          #root {

            width: 100% !important;

            min-width: 0 !important;

            max-width: none !important;

            height: auto !important;

            margin: 0 !important;

            padding: 0 !important;

            background: #fff !important;

            overflow: visible !important;

          }



          body * {

            visibility: hidden !important;

          }



          .receipt-modal-overlay,

          .receipt-modal-card,

          .receipt-preview-scroll,

          #printable-receipt,

          #printable-receipt * {

            visibility: visible !important;

          }



          .receipt-modal-overlay {

            position: static !important;

            inset: auto !important;

            display: flex !important;

            justify-content: center !important;

            width: 100% !important;

            min-width: 0 !important;

            max-width: none !important;

            height: auto !important;

            min-height: 0 !important;

            margin: 0 !important;

            padding: 0 !important;

            overflow: visible !important;

            background: #fff !important;

            backdrop-filter: none !important;

          }



          .receipt-modal-card {

            position: static !important;

            display: flex !important;

            justify-content: center !important;

            width: 100% !important;

            min-width: 0 !important;

            max-width: none !important;

            height: auto !important;

            max-height: none !important;

            margin: 0 !important;

            padding: 0 !important;

            overflow: visible !important;

            border: 0 !important;

            border-radius: 0 !important;

            box-shadow: none !important;

            animation: none !important;

            background: #fff !important;

          }



          .receipt-controls,

          .receipt-actions,

          .no-print {

            display: none !important;

            visibility: hidden !important;

          }



          .receipt-preview-scroll {

            display: flex !important;

            justify-content: center !important;

            width: 100% !important;

            height: auto !important;

            max-height: none !important;

            margin: 0 !important;

            padding: 0 !important;

            overflow: visible !important;

            background: #fff !important;

          }



          #printable-receipt {

            position: static !important;

            display: block !important;

            width: ${printableWidth} !important;

            min-width: ${printableWidth} !important;

            max-width: ${printableWidth} !important;

            height: auto !important;

            min-height: 0 !important;

            margin: 0 auto !important;

            padding: 1mm 1.5mm !important;

            overflow: visible !important;

            font-size: ${fontSize} !important;

            line-height: ${lineHeight} !important;

            color: #000 !important;

            background: #fff !important;

            box-shadow: none !important;

          }



          #printable-receipt,

          #printable-receipt * {

            color: #000 !important;

          }



          #printable-receipt .receipt-section {

            margin-top: 0 !important;

          }



          #printable-receipt .receipt-separator,

          #printable-receipt .border-dashed,

          #printable-receipt .border-dotted {

            border-color: #000 !important;

          }



          #printable-receipt img {

            max-width: 100% !important;

            object-fit: contain !important;

          }



          #printable-receipt .receipt-logo {

            width: 18mm !important;

            height: 18mm !important;

            margin: 0 auto 1.5mm auto !important;

          }



          #printable-receipt .receipt-qr {

            width: 20mm !important;

            height: 20mm !important;

            margin: 0 auto !important;

            padding: 0.5mm !important;

            border: 0 !important;

            border-radius: 0 !important;

            image-rendering: -webkit-optimize-contrast !important;

            image-rendering: crisp-edges !important;

          }



          #printable-receipt .receipt-meta-row {

            display: flex !important;

            justify-content: space-between !important;

            align-items: baseline !important;

            gap: 4px !important;

            width: 100% !important;

          }



          #printable-receipt .receipt-meta-row > span {

            white-space: nowrap !important;

            word-break: keep-all !important;

            overflow-wrap: normal !important;

            min-width: 0 !important;

          }



          #printable-receipt .receipt-meta-row > span.meta-truncate {

            white-space: nowrap !important;

            overflow: hidden !important;

            text-overflow: ellipsis !important;

            max-width: 60% !important;

          }



          #printable-receipt .receipt-kot-badge {

            text-align: center !important;

            font-weight: 900 !important;

            font-size: 13px !important;

            letter-spacing: 0.04em !important;

            margin: 2mm 0 1mm 0 !important;

            color: #000 !important;

          }



          #printable-receipt .receipt-total-row {

            border-top: 1px dashed #000000 !important;

            border-bottom: 1px dashed #000000 !important;

            padding: 3px 0 !important;

            margin: 3px 0 !important;

          }



          #printable-receipt .kot-section {

            margin-top: 4mm !important;

            padding-top: 3mm !important;

            border-top: 1px dashed #000 !important;

          }



          #printable-receipt .cut-line {

            padding-bottom: 2mm !important;

          }

        }

      `}</style>



      <div className="receipt-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">

        <div className="receipt-modal-card flex max-h-[94vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">

          <div className="receipt-controls no-print flex items-center justify-between border-b border-gray-100 bg-gray-50 p-3">

            <span className="text-xs font-bold text-gray-700">

              Receipt Preview

            </span>

      
<button
  type="button"
  onClick={closeReceipt}
  className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 hover:text-red-600 transition-all"
  aria-label="Cancel printing and close receipt"
  title="Cancel and close receipt"
>
  <X className="h-4 w-4" />
</button>



          </div>



          <div className="receipt-preview-scroll flex-1 overflow-y-auto overflow-x-hidden bg-white">

            <div

              id="printable-receipt"

              className="receipt-print-area mx-auto bg-white font-mono text-gray-800"

              style={{

                width: printableWidth,

                maxWidth: '100%',

                boxSizing: 'border-box',

                padding: '2mm 1.5mm',

                fontSize,

                lineHeight,

                ['--receipt-paper-width' as string]: printableWidth,

              }}

            >

              {/* Store header */}

              <div className="receipt-section space-y-1 border-b border-dashed border-gray-300 pb-3 text-center">

                {(settings.showLogoOnReceipt ?? true) && (

                  <img

                    src={settings.logo || logoImage}

                    alt="Kanthaaram Logo"

                    className="receipt-logo mx-auto mb-1 h-16 w-16 object-contain"

                  />

                )}



                <h2 className="receipt-header-title font-serif text-base font-extrabold leading-tight text-emerald-950">

                  {settings.receiptHeaderTitle ?? settings.storeName}

                </h2>



                {settings.receiptHeaderTagline && (

                  <p className="receipt-header-tagline font-sans text-[9px] italic text-gray-500">

                    {settings.receiptHeaderTagline}

                  </p>

                )}



                {(settings.showAddressOnReceipt ?? true) && (

                  <>

                    <p className="receipt-header-address mx-auto max-w-full font-sans text-[10px] leading-tight text-gray-600">

                      {settings.address}

                    </p>

                    <p className="font-mono text-[10px] text-gray-600">

                      Tel: {settings.phone}

                    </p>

                  </>

                )}

              </div>



              {/* Receipt metadata */}

              <div className="receipt-section space-y-1 border-b border-dashed border-gray-300 py-2.5 text-[10px] text-gray-700">

                <p className="my-1 text-center text-xs font-bold uppercase tracking-widest text-gray-900">

                  Receipt

                </p>

                <div className="receipt-meta-row flex justify-between items-baseline gap-1">

                  <span className="whitespace-nowrap">

                    Bill No: <strong className="text-gray-900">{activeReceiptOrder.id}</strong>

                  </span>

                  <span className="whitespace-nowrap">Date: {activeReceiptOrder.date}</span>

                </div>

                <div className="receipt-meta-row flex justify-between items-baseline gap-1">

                  <span className="whitespace-nowrap">Time: {activeReceiptOrder.time}</span>

                  {(settings.showCashierOnReceipt ?? true) && (

                    <span className="whitespace-nowrap">Cashier: {activeReceiptOrder.cashierName}</span>

                  )}

                </div>

                {(settings.showCustomerOnReceipt ?? true) &&

                  activeReceiptOrder.customerName && (

                    <div className="receipt-meta-row flex justify-between items-baseline gap-1 pt-0.5 font-semibold text-gray-800">

                      <span className="meta-truncate truncate">Customer: {activeReceiptOrder.customerName}</span>

                      <span className="whitespace-nowrap shrink-0">Type: {activeReceiptOrder.type}</span>

                    </div>

                  )}

                <div className="receipt-kot-badge my-1.5 text-center">

                  <span className="text-sm font-black tracking-wider text-gray-950">

                    KOT No: #{kotNumber}

                  </span>

                </div>

              </div>



              {/* Receipt item table */}

              <div className="receipt-section border-b border-dashed border-gray-300 py-2">

                <table className="receipt-items-table w-full border-collapse text-left">

                  <thead>

                    <tr className="border-b border-gray-300 text-[9px] uppercase text-gray-600">

                      <th className="pb-1 font-bold">Item</th>

                      <th className="pb-1 text-center font-bold">Qty</th>

                      <th className="pb-1 text-right font-bold">Price</th>

                      <th className="pb-1 text-right font-bold">Total</th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100 text-[10px]">

                    {activeReceiptOrder.items.map((item, index) => (

                      <tr key={`${item.product.name}-${index}`} className="text-gray-900">

                        <td className="py-1.5 pr-1 font-medium">{item.product.name}</td>

                        <td className="py-1.5 text-center whitespace-nowrap">{item.quantity}</td>

                        <td className="py-1.5 text-right whitespace-nowrap">{item.price.toFixed(2)}</td>

                        <td className="py-1.5 text-right font-bold whitespace-nowrap">

                          {(item.price * item.quantity).toFixed(2)}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>



              {/* Totals */}

              <div className="receipt-section space-y-1.5 border-b border-dashed border-gray-300 py-2.5 text-xs">

                <div className="flex justify-between gap-2 text-gray-700">

                  <span>Subtotal</span>

                  <span className="font-mono font-medium">{activeReceiptOrder.subtotal.toFixed(2)}</span>

                </div>



                {activeReceiptOrder.discount > 0 && (

                  <div className="flex justify-between gap-2 text-emerald-700">

                    <span>Discount</span>

                    <span className="font-mono font-medium">- {activeReceiptOrder.discount.toFixed(2)}</span>

                  </div>

                )}



                {(settings.showTaxBreakdownOnReceipt ?? true) &&

                  activeReceiptOrder.tax > 0 && (

                    <div className="flex justify-between gap-2 text-gray-700">

                      <span>Tax</span>

                      <span className="font-mono font-medium">{activeReceiptOrder.tax.toFixed(2)}</span>

                    </div>

                  )}



                <div className="receipt-total-row flex justify-between gap-2 border-t border-gray-300 pt-1 text-sm font-black text-gray-900">

                  <span>Total</span>

                  <span className="text-base text-amber-800 font-mono font-bold">

                    {activeReceiptOrder.total.toFixed(2)}

                  </span>

                </div>



                {(settings.showPaymentMethodOnReceipt ?? true) && (

                  <div className="flex justify-between gap-2 pt-1 text-[10px] text-gray-600">

                    <span>Payment Mode</span>

                    <span className="font-bold">{activeReceiptOrder.paymentMethod}</span>

                  </div>

                )}



                {(settings.showNotesOnReceipt ?? true) && activeReceiptOrder.notes && (

                  <div className="border-t border-dotted border-gray-300 pt-1 text-[10px] leading-normal text-gray-700">

                    <span className="font-bold">Notes: </span>

                    <span>{activeReceiptOrder.notes}</span>

                  </div>

                )}

              </div>



              {/* QR and footer */}

              <div className="receipt-section space-y-2 pt-3 text-center">

                {(settings.showQrCodeOnReceipt ?? true) && (

                  <img

                    src={qrImage}

                    alt="Kanthaaram QR Code"

                    className="receipt-qr mx-auto h-20 w-20 object-contain"

                  />

                )}



                <div className="receipt-footer flex items-center justify-center gap-1 pt-1 font-sans text-xs font-bold text-emerald-800">

                  <Leaf className="h-3.5 w-3.5 text-emerald-600" />

                  <span>{settings.receiptFooter}</span>

                </div>

              </div>



              {/* KOT section: prints directly after the receipt */}

              {(activeReceiptOrder.type === 'Takeaway' ||

                activeReceiptOrder.type === 'Dine In') && (

                <div className="kot-section receipt-section mt-6 border-t border-dashed border-gray-400 pt-4 font-mono text-gray-900">

                  <div className="cut-line relative flex items-center justify-center pb-3 text-center font-sans text-[9px] text-gray-600">

                    <span className="absolute left-0 right-0 border-b border-dotted border-gray-400" />

                    <span className="relative z-10 bg-white px-2 font-bold">

                      ✂ KOT (CUT HERE FOR KITCHEN / COUNTER)

                    </span>

                  </div>



                  <div className="receipt-section space-y-1 border-b border-dashed border-gray-300 pb-3 text-center">

                    <h3 className="text-sm font-extrabold tracking-wider">

                      KITCHEN ORDER TICKET

                    </h3>

                    <p className="text-xl font-black tracking-widest">

                      KOT #{kotNumber}

                    </p>

                    <p className="font-sans text-[10px] text-gray-600">

                      {activeReceiptOrder.type === 'Takeaway'

                        ? 'For Parcel / Counter Dispatch'

                        : 'For Dine In Service'}

                    </p>

                  </div>



                  <div className="receipt-section space-y-1 border-b border-dashed border-gray-300 py-2.5 text-[10px] text-gray-700">

                    <div className="receipt-meta-row flex justify-between items-baseline gap-1">

                      <span className="whitespace-nowrap">

                        Bill No: <strong className="text-gray-900">{activeReceiptOrder.id}</strong>

                      </span>

                      <span className="whitespace-nowrap">Date: {activeReceiptOrder.date}</span>

                    </div>

                    <div className="receipt-meta-row flex justify-between items-baseline gap-1">

                      <span className="whitespace-nowrap">Time: {activeReceiptOrder.time}</span>

                      <span className="whitespace-nowrap">

                        Type:{' '}

                        <strong className="font-bold uppercase text-emerald-800">

                          {activeReceiptOrder.type === 'Takeaway'

                            ? 'Takeaway (Parcel)'

                            : 'Dine In'}

                        </strong>

                      </span>

                    </div>

                    {activeReceiptOrder.customerName && (

                      <div className="receipt-meta-row flex justify-between items-baseline gap-1 pt-0.5">

                        <span className="meta-truncate truncate">Customer: {activeReceiptOrder.customerName}</span>

                      </div>

                    )}

                  </div>



                  <div className="receipt-section border-b border-dashed border-gray-300 py-2">

                    <table className="kot-items-table w-full border-collapse text-left">

                      <thead>

                        <tr className="border-b border-gray-300 text-[9px] uppercase text-gray-600">

                          <th className="pb-1 font-bold">Item Description</th>

                          <th className="pb-1 text-right font-bold">Quantity</th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100 text-[10px]">

                        {activeReceiptOrder.items.map((item, index) => (

                          <tr key={`${item.product.name}-kot-${index}`} className="font-bold text-gray-900">

                            <td className="py-1.5 pr-1">{item.product.name}</td>

                            <td className="py-1.5 text-right whitespace-nowrap">{item.quantity}</td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>



                  {activeReceiptOrder.notes && (

                    <div className="receipt-section pt-2.5 text-[10px] leading-normal text-gray-700">

                      <span className="font-bold">Kitchen Instructions: </span>

                      <span className="italic">{activeReceiptOrder.notes}</span>

                    </div>

                  )}

                </div>

              )}

            </div>

          </div>



          <div className="receipt-actions no-print border-t border-gray-100 bg-gray-50 p-3">

            <button

              type="button"

              id="receipt-print-button"

              onClick={handlePrint}

              disabled={!canPrint || printPending.current}

              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 p-2.5 text-xs font-bold text-amber-950 shadow-sm hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"

            >

              <Printer className="h-4 w-4" />

              Print Bill

            </button>

          </div>

        </div>

      </div>

    </>

  );

};


