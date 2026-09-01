import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  ShieldCheck,
  Phone,
  Building2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { RatingStars } from '@/components/RatingStars';
import { DetailSkeleton } from '@/components/Skeletons';
import { formatCurrency, formatDate, daysBetween, classNames } from '@/utils/helpers';
import { CATEGORY_LABELS, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';
import type { Equipment, Profile, Review, Booking } from '@/types';
import toast from 'react-hot-toast';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, Profile>>({});
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingModal, setBookingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: eq } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!eq) {
        setLoading(false);
        return;
      }
      setEquipment(eq as Equipment);

      const { data: ownerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (eq as Equipment).owner_id)
        .maybeSingle();
      if (ownerData) setOwner(ownerData as Profile);

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('equipment_id', id)
        .order('created_at', { ascending: false });
      if (reviewData) {
        setReviews(reviewData as Review[]);
        const reviewerIds = [...new Set((reviewData as Review[]).map((r) => r.reviewer_id))];
        if (reviewerIds.length > 0) {
          const { data: reviewerProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', reviewerIds);
          if (reviewerProfiles) {
            const map: Record<string, Profile> = {};
            (reviewerProfiles as Profile[]).forEach((p) => (map[p.id] = p));
            setReviewers(map);
          }
        }
      }

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('equipment_id', id)
        .in('status', ['approved', 'ongoing']);
      if (bookingData) setExistingBookings(bookingData as Booking[]);

      setLoading(false);
    })();
  }, [id]);

  const isOwner = user?.id === equipment?.owner_id;

  const bookedDates = new Set<string>();
  existingBookings.forEach((b) => {
    const start = new Date(b.start_date);
    const end = new Date(b.end_date);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      bookedDates.add(d.toISOString().split('T')[0]);
    }
  });
  (equipment?.blocked_dates || []).forEach((d) => bookedDates.add(d));

  const rentalDays = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const totalAmount = equipment ? rentalDays * equipment.rental_rate_per_day : 0;

  const isDateAvailable = (start: string, end: string) => {
    if (!start || !end) return true;
    const s = new Date(start);
    const e = new Date(end);
    for (let d = s; d <= e; d.setDate(d.getDate() + 1)) {
      if (bookedDates.has(d.toISOString().split('T')[0])) return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/equipment/${id}` } });
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Please select booking dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }
    if (!isDateAvailable(startDate, endDate)) {
      toast.error('Selected dates are not available');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        equipment_id: id,
        borrower_id: user.id,
        lender_id: equipment!.owner_id,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        deposit_amount: equipment!.deposit_amount,
        status: 'requested',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create booking: ' + error.message);
    } else {
      // Create notification for lender
      await supabase.from('notifications').insert({
        user_id: equipment!.owner_id,
        type: 'booking_request',
        message: `New booking request for "${equipment!.name}" from ${formatDate(startDate)} to ${formatDate(endDate)}`,
        booking_id: (data as Booking).id,
      });
      toast.success('Booking request sent! The owner will review it shortly.');
      setBookingModal(false);
      navigate('/my-bookings');
    }
    setSubmitting(false);
  };

  if (loading) return <DetailSkeleton />;
  if (!equipment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Equipment not found.</p>
        <Link to="/browse" className="btn-primary mt-4">Browse Equipment</Link>
      </div>
    );
  }

  const photos = equipment.photos?.length > 0 ? equipment.photos : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Photo gallery */}
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3]">
            {photos.length > 0 ? (
              <img src={photos[activePhoto]} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <span className="text-6xl">🔧</span>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhoto((p) => (p === 0 ? photos.length - 1 : p - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivePhoto((p) => (p === photos.length - 1 ? 0 : p + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={classNames(
                    'w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all',
                    i === activePhoto ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {CATEGORY_LABELS[equipment.category]}
            </span>
            {equipment.is_active ? (
              <span className="badge bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Available
              </span>
            ) : (
              <span className="badge bg-gray-100 text-gray-500">Paused</span>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
            {equipment.name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            {equipment.avg_rating > 0 && (
              <div className="flex items-center gap-1.5">
                <RatingStars rating={equipment.avg_rating} size="sm" />
                <span className="text-sm text-gray-500">
                  {equipment.avg_rating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            )}
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              {equipment.city || 'Location not set'}
            </div>
          </div>

          <p className="mt-5 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
            {equipment.description || 'No description provided.'}
          </p>

          {/* Pricing */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-1">Rental Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(equipment.rental_rate_per_day)}
                <span className="text-sm font-normal text-gray-400">/day</span>
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-1">Security Deposit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(equipment.deposit_amount)}
              </p>
            </div>
          </div>

          {/* Booking widget */}
          {!isOwner && (
            <div className="card p-5 mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Book this equipment
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              {rentalDays > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{formatCurrency(equipment.rental_rate_per_day)} x {rentalDays} days</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Security deposit (refundable)</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(equipment.deposit_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                    <span className="font-bold text-brand-600">{formatCurrency(totalAmount + equipment.deposit_amount)}</span>
                  </div>
                </div>
              )}
              <button
                onClick={handleBook}
                disabled={submitting || !startDate || !endDate}
                className="btn-primary w-full py-3"
              >
                {submitting ? 'Sending request...' : user ? 'Send Booking Request' : 'Sign in to Book'}
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                You won't be charged until the owner approves
              </p>
            </div>
          )}

          {isOwner && (
            <div className="card p-5 mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                This is your listing. Manage it from your dashboard.
              </p>
              <Link to={`/equipment/${id}/edit`} className="btn-secondary w-full">
                Edit Listing
              </Link>
            </div>
          )}

          {/* Owner info */}
          {owner && (
            <div className="card p-5 mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Listed by
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {owner.profile_photo ? (
                    <img src={owner.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (owner.name || '?')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {owner.name || 'Unknown'}
                    </p>
                    {owner.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    )}
                  </div>
                  {owner.workshop_name && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {owner.workshop_name}
                    </p>
                  )}
                  {owner.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-400">
                        {owner.avg_rating.toFixed(1)} rating
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Availability calendar */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Availability
        </h2>
        <div className="card p-5">
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" /> Available
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30" /> Booked/Blocked
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="font-medium text-gray-400 py-1">{d}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const date = new Date(today);
              date.setDate(today.getDate() - today.getDay() + i);
              const dateStr = date.toISOString().split('T')[0];
              const isPast = date < today;
              const isBooked = bookedDates.has(dateStr);
              return (
                <div
                  key={i}
                  className={classNames(
                    'aspect-square rounded-lg flex items-center justify-center text-sm',
                    isPast
                      ? 'text-gray-300 dark:text-gray-700'
                      : isBooked
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-400'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium',
                  )}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewer = reviewers[review.reviewer_id];
              return (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium overflow-hidden shrink-0">
                      {reviewer?.profile_photo ? (
                        <img src={reviewer.profile_photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (reviewer?.name || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {reviewer?.name || 'Anonymous'}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <RatingStars rating={review.rating} size="sm" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
