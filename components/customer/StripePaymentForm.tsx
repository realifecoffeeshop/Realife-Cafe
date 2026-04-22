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
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        id="payment-element" 
        options={{ layout: 'tabs' }} 
        onReady={() => setIsReady(true)}
      />
      {message && (
        <div id="payment-message" className="text-red-500 text-xs font-bold uppercase tracking-widest text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
          {message}
        </div>
      )}
    </form>
  );
};

export default StripePaymentForm;
