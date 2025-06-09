import { loadStripe } from '@stripe/stripe-js';

// Chave pública do Stripe
// Utiliza a variável de ambiente ou um fallback para garantir funcionamento
export const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_live_REDACTED_STRIPE_PUBLISHABLE';

// Validação da chave
if (!STRIPE_PUBLIC_KEY) {
  console.error('Stripe public key is not configured properly');
}

// Promise do Stripe
export const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;