import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ 
  amount, 
  onSuccess, 
  onError, 
  isProcessing, 
  setIsProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "An error occurred");
          onError(error.message || "An error occurred");
        } else {
          setMessage("An unexpected error occurred.");
          onError("An unexpected error occurred.");
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Stripe confirmation error:", err);
      setMessage(err.message || "An unexpected error occurred.");
      onError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4 min-h-[150px] flex flex-col">
      {!isReady && (
        <div className="flex flex-col items-center justify-center py-8 space-y-2 flex-grow">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-900 dark:border-white opacity-40"></div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Secure Input Loading...</p>
        </div>
      )}
      <div className={isReady ? 'block' : 'hidden'}>
        <PaymentElement 
          id="payment-element" 
          options={{ layout: 'tabs' }} 
          onReady={() => {
            console.log('[Stripe] PaymentElement ready');
            setIsReady(true);
          }}
        />
      </div>
      {message && (
        <div id="payment-message" className="text-red-500 text-xs font-bold uppercase tracking-widest text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
          {message}
        </div>
      )}
    </form>
  );
};

export default StripePaymentForm;
