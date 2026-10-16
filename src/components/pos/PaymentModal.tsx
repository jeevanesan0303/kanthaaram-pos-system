import React, {

  useEffect,
  useRef,

  useState

} from 'react';



import {

  X,

  CreditCard,

  Banknote,

  QrCode,

  Check,

  Receipt,

  Landmark,

  Loader2,

  AlertCircle

} from 'lucide-react';



import { useApp } from '../../context/AppContext';



import { PaymentMethod } from '../../types';



export const PaymentModal: React.FC = () => {

  const {

    isPaymentModalOpen,

    setIsPaymentModalOpen,

    cart,

    cartDiscount,

    processPayment,

    settings

  } = useApp();



  const [paymentMethod, setPaymentMethod] =

    useState<PaymentMethod>('Cash');



  const [cashAmount, setCashAmount] =

    useState<number>(0);



  const [notes, setNotes] =

    useState<string>('');



  const [cashError, setCashError] =

    useState<string>('');



  const processingRef = useRef(false);

  const [isProcessing, setIsProcessing] =

    useState<boolean>(false);



  const subtotal = cart.reduce(

    (totalAmount, item) =>

      totalAmount +

      item.price * item.quantity,

    0

  );



  const total = Math.max(

    0,

    subtotal - cartDiscount

  );



  const changeDue =

    paymentMethod === 'Cash' &&

    cashAmount >= total

      ? cashAmount - total

      : 0;



  const shortageAmount =

    paymentMethod === 'Cash' &&

    cashAmount < total

      ? total - cashAmount

      : 0;



  const isCashInsufficient =

    paymentMethod === 'Cash' &&

    cashAmount < total;



  const paymentMethods: {

    id: PaymentMethod;

    label: string;

    icon: React.ReactNode;

  }[] = [

    {

      id: 'Cash',

      label: 'Cash',

      icon: (

        <Banknote className="w-5 h-5" />

      )

    },

    {

      id: 'Card',

      label: 'Card',

      icon: (

        <CreditCard className="w-5 h-5" />

      )

    },

    {

      id: 'QR',

      label: 'QR Payment',

      icon: (

        <QrCode className="w-5 h-5" />

      )

    },

    {

      id: 'Bank Transfer',

      label: 'Bank Transfer',

      icon: (

        <Landmark className="w-5 h-5" />

      )

    }

  ];



  useEffect(() => {

    if (isPaymentModalOpen) {

      setPaymentMethod('Cash');

      setCashAmount(0);

      setNotes('');

      setCashError('');

      setIsProcessing(false);

    }

  }, [isPaymentModalOpen]);



  useEffect(() => {
    if (!isPaymentModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (processingRef.current) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsPaymentModalOpen(false);
        setCashError('');
        return;
      }

      if (event.key !== 'Enter' || event.repeat || processingRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target instanceof HTMLButtonElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target?.isContentEditable) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('confirm-payment-button')?.click();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isPaymentModalOpen, setIsPaymentModalOpen]);

  if (!isPaymentModalOpen) {

    return null;

  }



  const handleClose = (): void => {

    if (processingRef.current) {

      return;

    }



    setIsPaymentModalOpen(false);

    setCashError('');

  };



  const handlePaymentMethodChange = (

    method: PaymentMethod

  ): void => {

    setPaymentMethod(method);

    setCashError('');



    if (method !== 'Cash') {

      setCashAmount(0);

    }

  };



  const handleCashAmountChange = (

    value: string

  ): void => {

    const amount =

      value === ''

        ? 0

        : Number(value);



    setCashAmount(amount);



    if (

      Number.isFinite(amount) &&

      amount >= total

    ) {

      setCashError('');

    }

  };



  const validatePayment = (): boolean => {

    if (cart.length === 0) {

      alert('Your cart is empty.');

      return false;

    }



    if (total <= 0) {

      alert(

        'The order total must be greater than zero.'

      );



      return false;

    }



    if (paymentMethod === 'Cash') {

      if (

        !Number.isFinite(cashAmount) ||

        cashAmount <= 0

      ) {

        setCashError(

          'Please enter the cash received.'

        );



        return false;

      }



      if (cashAmount < total) {

        setCashError(

          `Insufficient cash. Another ${settings.currency} ${shortageAmount.toFixed(2)} is required.`

        );



        return false;

      }

    }



    setCashError('');

    return true;

  };



  const handleConfirmPayment =

    async (): Promise<void> => {

      if (isProcessing) {

        return;

      }



      if (!validatePayment()) {

        return;

      }



      try {

        processingRef.current = true;
        setIsProcessing(true);



        await processPayment(

          paymentMethod,

          notes.trim() || undefined

        );



        setCashAmount(0);

        setNotes('');

        setCashError('');

      } catch (error) {

        const message =

          error instanceof Error

            ? error.message

            : 'Unable to complete payment.';



        alert(message);

      } finally {

        processingRef.current = false;
        setIsProcessing(false);

      }

    };



  return (

    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}

        <div className="p-5 bg-amber-50/50 border-b border-gray-100 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Receipt className="w-5 h-5 text-amber-600" />



            <h2 className="text-lg font-black text-gray-900 font-serif">

              Complete Billing & Payment

            </h2>

          </div>



          <button

            type="button"

            onClick={handleClose}

            disabled={isProcessing}

            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 disabled:opacity-50"

          >

            <X className="w-5 h-5" />

          </button>

        </div>



        <div className="p-6 space-y-5">

          {/* Amount Due */}

          <div className="bg-linear-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">

                Grand Total Due

              </p>



              <p className="text-3xl font-black font-mono">

                {settings.currency}{' '}

                {total.toFixed(2)}

              </p>

            </div>



            <div className="text-right text-xs text-amber-100">

              <p>

                Items:{' '}

                {cart.reduce(

                  (quantity, item) =>

                    quantity + item.quantity,

                  0

                )}

              </p>

            </div>

          </div>



          {/* Payment Method */}

          <div>

            <label className="block text-xs font-bold text-gray-700 mb-2">

              Select Payment Method

            </label>



            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

              {paymentMethods.map(method => (

                <button

                  key={method.id}

                  type="button"

                  onClick={() =>

                    handlePaymentMethodChange(

                      method.id

                    )

                  }

                  disabled={isProcessing}

                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all disabled:opacity-50 ${

                    paymentMethod === method.id

                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold shadow-2xs'

                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'

                  }`}

                >

                  <span

                    className={

                      paymentMethod === method.id

                        ? 'text-amber-600'

                        : 'text-gray-400'

                    }

                  >

                    {method.icon}

                  </span>



                  <span className="text-xs mt-1">

                    {method.label}

                  </span>

                </button>

              ))}

            </div>

          </div>



          {/* Cash Received */}

          {paymentMethod === 'Cash' && (

            <div

              className={`p-3 rounded-2xl border space-y-2 ${

                cashError

                  ? 'bg-red-50/50 border-red-200'

                  : 'bg-gray-50 border-gray-100'

              }`}

            >

              <div className="flex items-center justify-between gap-3">

                <label

                  htmlFor="cash-received"

                  className="text-xs font-bold text-gray-700"

                >

                  Cash Received

                </label>



                {cashAmount >= total &&

                total > 0 ? (

                  <span className="text-xs font-semibold text-emerald-600">

                    Change Due:{' '}



                    <span className="font-mono">

                      {settings.currency}{' '}

                      {changeDue.toFixed(2)}

                    </span>

                  </span>

                ) : cashAmount > 0 ? (

                  <span className="text-xs font-semibold text-red-600">

                    Shortage:{' '}



                    <span className="font-mono">

                      {settings.currency}{' '}

                      {shortageAmount.toFixed(2)}

                    </span>

                  </span>



                ) : null}

              </div>



              <div className="flex items-center gap-2">

                <input

                  id="cash-received"

                  type="number"

                  min="0"

                  step="0.01"

                  value={cashAmount || ''}

                  onChange={event =>

                    handleCashAmountChange(

                      event.target.value

                    )

                  }

                  disabled={isProcessing}

                  autoFocus

                  className={`flex-1 p-2 bg-white border rounded-xl text-sm font-bold text-gray-900 focus:outline-none ${

                    cashError

                      ? 'border-red-400 focus:ring-1 focus:ring-red-400'

                      : 'border-gray-200 focus:ring-1 focus:ring-amber-400'

                  }`}

                />



                <button

                  type="button"

                  onClick={() => {

                    setCashAmount(total);

                    setCashError('');

                  }}

                  disabled={isProcessing}

                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold disabled:opacity-50"

                >

                  Exact{' '}



                  <span className="font-mono">

                    {settings.currency}{' '}

                    {total.toFixed(2)}

                  </span>

                </button>

              </div>



              {cashError && (

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">

                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />



                  <span>{cashError}</span>

                </div>

              )}

            </div>

          )}



          {/* Notes */}

          <div>

            <label

              htmlFor="payment-notes"

              className="block text-xs font-bold text-gray-700 mb-1"

            >

              Order Notes

            </label>



            <input

              id="payment-notes"

              type="text"

              value={notes}

              onChange={event =>

                setNotes(event.target.value)

              }

              disabled={isProcessing}

              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-400"

            />

          </div>

        </div>



        {/* Action Buttons */}

        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">

          <button

            type="button"

            onClick={handleClose}

            disabled={isProcessing}

            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-all"

          >

            Cancel

          </button>



          <button

            id="confirm-payment-button"
            type="button"

            onClick={() =>

              void handleConfirmPayment()

            }

            disabled={

              isProcessing ||

              cart.length === 0 ||

              total <= 0 ||

              isCashInsufficient

            }

            className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-amber-950 font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"

          >

            {isProcessing ? (

              <>

                <Loader2 className="w-4 h-4 animate-spin" />

                Processing...

              </>

            ) : (

              <>

                <Check className="w-4 h-4" />

                Confirm & Print Receipt

              </>

            )}

          </button>

        </div>

      </div>

    </div>

  );

};