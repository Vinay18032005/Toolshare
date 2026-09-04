import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Star,
  ArrowRight,
  Wrench,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Play,
  Flag,
  History,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { RatingStars } from '@/components/RatingStars';
import { PaymentModal } from '@/components/PaymentModal';
import { formatCurrency, formatDate, classNames } from '@/utils/helpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';
import type { Booking, Equipment, Profile, Review } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'upcoming' | 'past' | 'timeline';

export function MyBookingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentMap, setEquipmentMap] = useState<Record<string, Equipment>>({});
  const [lenders, setLenders] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());
  const [conditionModal, setConditionModal] = useState<Booking | null>(null);
  const [conditionNotes, setConditionNotes] = useState('');
  const [conditionType, setConditionType] = useState<'before' | 'after'>('before');
  const [disputeModal, setDisputeModal] = useState<Booking | null>(null);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [paymentModal, setPaymentModal] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false });
      if (bookingData) {
        setBookings(bookingData as Booking[]);
        const eqIds = [...new Set((bookingData as Booking[]).map((b) => b.equipment_id))];
        const lenderIds = [...new Set((bookingData as Booking[]).map((b) => b.lender_id))];
        if (eqIds.length > 0) {
          const { data: eqs } = await supabase.from('equipment').select('*').in('id', eqIds);
          if (eqs) {
            const map: Record<string, Equipment> = {};
            (eqs as Equipment[]).forEach((e) => (map[e.id] = e));
            setEquipmentMap(map);
          }
        }
        if (lenderIds.length > 0) {
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', lenderIds);
          if (profiles) {
            const map: Record<string, Profile> = {};
            (profiles as Profile[]).forEach((p) => (map[p.id] = p));
            setLenders(map);
          }
        }
        // Check existing reviews
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('booking_id')
          .eq('reviewer_id', user.id);
        if (reviewData) {
          setExistingReviews(new Set((reviewData as Review[]).map((r) => r.booking_id)));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking?')) return;
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    if (error) {
      toast.error('Failed to cancel booking');
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)),
      );
      toast.success('Booking cancelled');
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewModal) return;
    const { error } = await supabase.from('reviews').insert({
      booking_id: reviewModal.id,
      equipment_id: reviewModal.equipment_id,
      reviewer_id: user.id,
      reviewee_id: reviewModal.lender_id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    if (error) {
      toast.error('Failed to submit review');
    } else {
      setExistingReviews((prev) => new Set(prev).add(reviewModal.id));
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment('');
      toast.success('Review submitted!');
    }
  };

  const handleSaveCondition = async () => {
    if (!conditionModal || !user) return;
    const update = conditionType === 'before'
      ? { condition_notes_before: conditionNotes }
      : { condition_notes_after: conditionNotes };
    const { error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', conditionModal.id);
    if (error) {
      toast.error('Failed to save condition notes');
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === conditionModal.id ? { ...b, ...update } : b)),
      );
      setConditionModal(null);
      setConditionNotes('');
      toast.success('Condition notes saved');
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeModal) return;
    const { error } = await supabase
      .from('bookings')
      .update({ dispute_flag: true, dispute_notes: disputeNotes })
      .eq('id', disputeModal.id);
    if (error) {
      toast.error('Failed to raise dispute');
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === disputeModal.id ? { ...b, dispute_flag: true, dispute_notes: disputeNotes } : b)),
      );
      setDisputeModal(null);
      setDisputeNotes('');
      toast.success('Dispute raised. The team will review it.');
    }
  };

  const upcoming = bookings.filter((b) =>
    ['requested', 'approved', 'ongoing'].includes(b.status),
  );
  const past = bookings.filter((b) =>
    ['completed', 'cancelled', 'rejected'].includes(b.status),
  );

  const displayBookings = tab === 'upcoming' ? upcoming : tab === 'past' ? past : bookings;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        My Bookings
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Track your rental requests and history
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800">
        {[
          { key: 'upcoming' as Tab, label: 'Upcoming', count: upcoming.length },
          { key: 'past' as Tab, label: 'Past', count: past.length },
          { key: 'timeline' as Tab, label: 'Timeline', count: bookings.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={classNames(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : displayBookings.length === 0 ? (
        <EmptyState
          icon={tab === 'timeline' ? History : Calendar}
          title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past bookings' : 'No booking history yet'}
          description={tab === 'upcoming' ? 'Browse equipment and send a booking request to get started.' : tab === 'past' ? 'Your completed and cancelled bookings will appear here.' : 'When you request a tool, its full journey will appear here as a timeline.'}
          action={(tab === 'upcoming' || tab === 'timeline') ? { label: 'Browse Equipment', onClick: () => window.location.href = '/browse' } : undefined}
        />
      ) : tab === 'timeline' ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const eq = equipmentMap[booking.equipment_id];
            const lender = lenders[booking.lender_id];
            const hasReview = existingReviews.has(booking.id);
            return (
              <div key={booking.id} className="card p-5">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50 dark:border-gray-800">
                  <Link to={`/equipment/${booking.equipment_id}`} className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {eq?.photos?.[0] ? (
                      <img src={eq.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/equipment/${booking.equipment_id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 truncate">
                        {eq?.name || 'Equipment'}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400">Owner: {lender?.name || 'Unknown'}</p>
                  </div>
                  <span className={classNames('badge', BOOKING_STATUS_COLORS[booking.status])}>
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </div>
                <TimelineView booking={booking} hasReview={hasReview} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {displayBookings.map((booking) => {
            const eq = equipmentMap[booking.equipment_id];
            const lender = lenders[booking.lender_id];
            const hasReview = existingReviews.has(booking.id);
            return (
              <div key={booking.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link to={`/equipment/${booking.equipment_id}`} className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {eq?.photos?.[0] ? (
                      <img src={eq.photos[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/equipment/${booking.equipment_id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 truncate">
                          {eq?.name || 'Equipment'}
                        </h3>
                      </Link>
                      <span className={classNames('badge', BOOKING_STATUS_COLORS[booking.status])}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </span>
                      {booking.dispute_flag && (
                        <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3" /> Disputed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Owner: {lender?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(booking.total_amount)}
                      </span>
                      {booking.deposit_paid ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      ) : booking.status === 'approved' && (
                        <span className="text-amber-600">Payment pending</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {booking.status === 'approved' && !booking.deposit_paid && (
                      <button
                        onClick={() => setPaymentModal(booking)}
                        className="btn-primary px-4 py-2 text-xs"
                      >
                        Pay Now
                      </button>
                    )}
                    {booking.status === 'requested' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="btn-secondary px-4 py-2 text-xs"
                      >
                        Cancel Request
                      </button>
                    )}
                    {booking.status === 'ongoing' && (
                      <>
                        <button
                          onClick={() => {
                            setConditionModal(booking);
                            setConditionType('after');
                            setConditionNotes(booking.condition_notes_after || '');
                          }}
                          className="btn-secondary px-4 py-2 text-xs"
                        >
                          <Upload className="w-3.5 h-3.5" /> Return Photos
                        </button>
                        <button
                          onClick={() => setDisputeModal(booking)}
                          className="btn-ghost px-4 py-2 text-xs text-red-500"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Raise Dispute
                        </button>
                      </>
                    )}
                    {booking.status === 'completed' && !hasReview && (
                      <button
                        onClick={() => {
                          setReviewModal(booking);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                        className="btn-secondary px-4 py-2 text-xs"
                      >
                        <Star className="w-3.5 h-3.5" /> Leave Review
                      </button>
                    )}
                    {booking.status === 'completed' && hasReview && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Reviewed
                      </span>
                    )}
                  </div>
                </div>
                {(booking.condition_notes_before || booking.condition_notes_after) && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 grid sm:grid-cols-2 gap-3">
                    {booking.condition_notes_before && (
                      <div className="text-sm">
                        <p className="text-xs font-medium text-gray-400 mb-1">Before handoff notes</p>
                        <p className="text-gray-600 dark:text-gray-400">{booking.condition_notes_before}</p>
                      </div>
                    )}
                    {booking.condition_notes_after && (
                      <div className="text-sm">
                        <p className="text-xs font-medium text-gray-400 mb-1">After return notes</p>
                        <p className="text-gray-600 dark:text-gray-400">{booking.condition_notes_after}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setReviewModal(null)}>
          <div className="card p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Rate your experience
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              How was your rental of "{equipmentMap[reviewModal.equipment_id]?.name}"?
            </p>
            <div className="mb-4">
              <RatingStars rating={reviewRating} interactive size="lg" onChange={setReviewRating} />
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="input resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmitReview} className="btn-primary flex-1">Submit Review</button>
            </div>
          </div>
        </div>
      )}

      {/* Condition notes modal */}
      {conditionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setConditionModal(null)}>
          <div className="card p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {conditionType === 'before' ? 'Before handoff' : 'After return'} — Condition Notes
            </h3>
            <textarea
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Describe the condition of the equipment..."
              rows={4}
              className="input resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setConditionModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveCondition} className="btn-primary flex-1">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {paymentModal && (
        <PaymentModal
          booking={paymentModal}
          equipment={equipmentMap[paymentModal.equipment_id]}
          onClose={() => setPaymentModal(null)}
          onSuccess={(updated) => {
            setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setPaymentModal(null);
          }}
        />
      )}

      {/* Dispute modal */}
      {disputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setDisputeModal(null)}>
          <div className="card p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Raise a Dispute
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Describe the issue with this rental. Our team will review it.
            </p>
            <textarea
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              placeholder="Describe the problem..."
              rows={4}
              className="input resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setDisputeModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRaiseDispute} className="btn-danger flex-1">Raise Dispute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineView({ booking, hasReview }: { booking: Booking; hasReview: boolean }) {
  const steps: { icon: typeof Send; label: string; date: string; done: boolean; color: string }[] = [
    {
      icon: Send,
      label: 'Booking Request Sent',
      date: formatDate(booking.created_at),
      done: true,
      color: 'bg-brand-500',
    },
  ];

  if (booking.status === 'rejected' || booking.status === 'cancelled') {
    steps.push({
      icon: ThumbsDown,
      label: booking.status === 'rejected' ? 'Request Rejected by Owner' : 'Booking Cancelled',
      date: '',
      done: true,
      color: 'bg-red-500',
    });
  } else {
    if (['approved', 'ongoing', 'completed'].includes(booking.status)) {
      steps.push({
        icon: ThumbsUp,
        label: 'Request Approved by Owner',
        date: '',
        done: true,
        color: 'bg-green-500',
      });
    }
    if (booking.deposit_paid) {
      steps.push({
        icon: CheckCircle2,
        label: 'Payment Completed',
        date: formatCurrency(booking.total_amount + booking.deposit_amount),
        done: true,
        color: 'bg-teal-500',
      });
    } else if (booking.status === 'approved') {
      steps.push({
        icon: Clock,
        label: 'Payment Pending',
        date: '',
        done: false,
        color: 'bg-amber-400',
      });
    }
    if (['ongoing', 'completed'].includes(booking.status)) {
      steps.push({
        icon: Play,
        label: 'Rental Started',
        date: formatDate(booking.start_date),
        done: true,
        color: 'bg-blue-500',
      });
    }
    if (booking.status === 'completed') {
      steps.push({
        icon: CheckCircle2,
        label: 'Rental Completed',
        date: formatDate(booking.end_date),
        done: true,
        color: 'bg-green-600',
      });
      if (booking.dispute_flag) {
        steps.push({
          icon: Flag,
          label: 'Dispute Raised',
          date: booking.dispute_notes || '',
          done: true,
          color: 'bg-red-500',
        });
      }
      steps.push({
        icon: Star,
        label: hasReview ? 'Review Submitted' : 'Review Pending',
        date: '',
        done: hasReview,
        color: hasReview ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700',
      });
    }
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-5">
        {steps.map((step, i) => (
          <div key={i} className="relative">
            <div
              className={classNames(
                'absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-900',
                step.color,
              )}
            >
              <step.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="ml-2">
              <p
                className={classNames(
                  'text-sm font-medium',
                  step.done
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400',
                )}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
