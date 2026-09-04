import { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Lock,
  IndianRupee,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, classNames } from '@/utils/helpers';
import type { Booking, Equipment } from '@/types';
import toast from 'react-hot-toast';

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

interface PaymentModalProps {
  booking: Booking;
  equipment: Equipment | undefined;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export function PaymentModal({ booking, equipment, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bank, setBank] = useState('');
  const [wallet, setWallet] = useState('paytm');

  const total = booking.total_amount + booking.deposit_amount;

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validate = (): string | null => {
    if (method === 'upi') {
      if (!upiId.trim()) return 'Enter your UPI ID';
      if (!/^[\w.\-]+@[\w]+$/.test(upiId.trim())) return 'Enter a valid UPI ID (e.g. name@bank)';
    }
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return 'Enter a valid 16-digit card number';
      if (!cardName.trim()) return 'Enter the name on card';
      if (cardExpiry.length < 5) return 'Enter card expiry (MM/YY)';
      if (cardCvv.length < 3) return 'Enter CVV';
    }
    if (method === 'netbanking' && !bank) return 'Select your bank';
    return null;
  };

  const handlePay = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));

    const { error } = await supabase
      .from('bookings')
      .update({ deposit_paid: true, rental_paid: true })
      .eq('id', booking.id);

    setProcessing(false);

    if (error) {
      toast.error('Payment failed. Please try again.');
      return;
    }

    await supabase.from('notifications').insert({
      user_id: booking.lender_id,
      type: 'payment',
      message: `Payment received for "${equipment?.name || 'equipment'}"`,
      booking_id: booking.id,
    });

    setSuccess(true);
    setTimeout(() => {
      onSuccess({ ...booking, deposit_paid: true, rental_paid: true });
    }, 1500);
  };

  const methods: { key: PaymentMethod; label: string; icon: typeof CreditCard; desc: string }[] = [
    { key: 'upi', label: 'UPI', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
    { key: 'card', label: 'Card', icon: CreditCard, desc: 'Credit / Debit card' },
    { key: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
    { key: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Paytm, Amazon Pay' },
  ];

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
        <div className="card p-8 w-full max-w-md text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Payment Successful!
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {formatCurrency(total)} paid for "{equipment?.name || 'equipment'}"
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-left space-y-1.5 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Rental fee</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Security deposit</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(booking.deposit_amount)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total Paid</span>
              <span className="font-bold text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="card p-0 w-full max-w-md animate-scale-in overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100">
              Payment
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">{equipment?.name || 'Equipment'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount summary */}
        <div className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-gray-800 dark:to-gray-800 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {formatCurrency(booking.total_amount / Math.max(1, Math.round(booking.total_amount / (equipment?.rental_rate_per_day || 1))))} × {Math.max(1, Math.round(booking.total_amount / (equipment?.rental_rate_per_day || 1)))} days
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Security deposit (refundable)</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(booking.deposit_amount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-100 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
              <span className="font-bold text-xl text-brand-600 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {(total).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Payment method tabs */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={classNames(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                  method === m.key
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700',
                )}
              >
                <m.icon className={classNames('w-5 h-5', method === m.key ? 'text-brand-600' : 'text-gray-400')} />
                <span className={classNames('text-xs font-medium', method === m.key ? 'text-brand-600' : 'text-gray-500')}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Method-specific forms */}
          <div className="space-y-3 min-h-[120px]">
            {method === 'upi' && (
              <>
                <div>
                  <label className="label">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@bank"
                    className="input"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['@okhdfcbank', '@okaxis', '@okicici', '@oksbin'].map((suffix) => (
                    <button
                      key={suffix}
                      onClick={() => setUpiId((prev) => prev.split('@')[0] || 'user') || setUpiId(`user${suffix}`)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {suffix}
                    </button>
                  ))}
                </div>
              </>
            )}

            {method === 'card' && (
              <>
                <div>
                  <label className="label">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="input font-mono tracking-wider"
                    maxLength={19}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Name on Card</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Card holder name"
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="12/27"
                      className="input"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="label">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      className="input"
                      maxLength={4}
                    />
                  </div>
                </div>
              </>
            )}

            {method === 'netbanking' && (
              <div>
                <label className="label">Select Bank</label>
                <select value={bank} onChange={(e) => setBank(e.target.value)} className="input">
                  <option value="">Choose your bank...</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra Bank</option>
                  <option value="pnb">Punjab National Bank</option>
                  <option value="bob">Bank of Baroda</option>
                  <option value="canara">Canara Bank</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  You'll be redirected to your bank's secure login page.
                </p>
              </div>
            )}

            {method === 'wallet' && (
              <div>
                <label className="label">Select Wallet</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'paytm', label: 'Paytm Wallet' },
                    { key: 'amazonpay', label: 'Amazon Pay' },
                    { key: 'mobikwik', label: 'MobiKwik' },
                    { key: 'freecharge', label: 'Freecharge' },
                  ].map((w) => (
                    <button
                      key={w.key}
                      onClick={() => setWallet(w.key)}
                      className={classNames(
                        'p-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                        wallet === w.key
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600'
                          : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200',
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Secured with 256-bit encryption</span>
            <ShieldCheck className="w-3.5 h-3.5 text-green-500 ml-auto" />
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={processing}
            className={classNames(
              'btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2',
              processing && 'opacity-70 cursor-not-allowed',
            )}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay {formatCurrency(total)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
