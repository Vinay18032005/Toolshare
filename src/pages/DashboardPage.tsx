import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Package,
  Calendar,
  TrendingUp,
  Star,
  Edit2,
  Trash2,
  ArrowRight,
  Wrench,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  Backpack,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EquipmentCard } from '@/components/EquipmentCard';
import { EmptyState } from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeletons';
import { formatCurrency, formatDate, classNames } from '@/utils/helpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/types';
import type { Equipment, Booking, Profile } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'listings' | 'requests' | 'mybookings' | 'analytics';

export function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<Equipment[]>([]);
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [outgoingBookings, setOutgoingBookings] = useState<Booking[]>([]);
  const [borrowers, setBorrowers] = useState<Record<string, Profile>>({});
  const [lenders, setLenders] = useState<Record<string, Profile>>({});
  const [equipmentMap, setEquipmentMap] = useState<Record<string, Equipment>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalEarnings: 0, totalRentals: 0, activeListings: 0, avgRating: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // Fetch user's listings
      const { data: eqData } = await supabase
        .from('equipment')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (eqData) setListings(eqData as Equipment[]);

      // Fetch incoming booking requests
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('lender_id', user.id)
        .order('created_at', { ascending: false });
      if (bookingData) {
        setIncomingBookings(bookingData as Booking[]);
        const borrowerIds = [...new Set((bookingData as Booking[]).map((b) => b.borrower_id))];
        if (borrowerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', borrowerIds);
          if (profiles) {
            const map: Record<string, Profile> = {};
            (profiles as Profile[]).forEach((p) => (map[p.id] = p));
            setBorrowers(map);
          }
        }
        const eqIds = [...new Set((bookingData as Booking[]).map((b) => b.equipment_id))];
        if (eqIds.length > 0) {
          const { data: eqs } = await supabase
            .from('equipment')
            .select('*')
            .in('id', eqIds);
          if (eqs) {
            const map: Record<string, Equipment> = {};
            (eqs as Equipment[]).forEach((e) => (map[e.id] = e));
            setEquipmentMap(map);
          }
        }
      }

      // Fetch outgoing bookings (as borrower)
      const { data: outgoingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false });
      if (outgoingData) {
        setOutgoingBookings(outgoingData as Booking[]);
        const lenderIds = [...new Set((outgoingData as Booking[]).map((b) => b.lender_id))];
        if (lenderIds.length > 0) {
          const { data: lenderProfiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', lenderIds);
          if (lenderProfiles) {
            const map: Record<string, Profile> = {};
            (lenderProfiles as Profile[]).forEach((p) => (map[p.id] = p));
            setLenders(map);
          }
        }
        const outgoingEqIds = [...new Set((outgoingData as Booking[]).map((b) => b.equipment_id))];
        if (outgoingEqIds.length > 0) {
          const { data: outgoingEqs } = await supabase
            .from('equipment')
            .select('*')
            .in('id', outgoingEqIds);
          if (outgoingEqs) {
            const map: Record<string, Equipment> = {};
            (outgoingEqs as Equipment[]).forEach((e) => (map[e.id] = e));
            setEquipmentMap((prev) => ({ ...prev, ...map }));
          }
        }
      }

      // Calculate stats
      const completed = (bookingData || []).filter((b) => b.status === 'completed');
      const earnings = completed.reduce((sum, b) => sum + (b as Booking).total_amount, 0);
      setStats({
        totalEarnings: earnings,
        totalRentals: completed.length,
        activeListings: (eqData || []).filter((e) => (e as Equipment).is_active).length,
        avgRating: profile?.avg_rating || 0,
      });

      setLoading(false);
    })();
  }, [user, profile]);

  const handleBookingAction = async (bookingId: string, action: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: action })
      .eq('id', bookingId);
    if (error) {
      toast.error('Failed to update booking');
    } else {
      // Update local state
      setIncomingBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: action } : b)),
      );
      // Create notification for borrower
      const booking = incomingBookings.find((b) => b.id === bookingId);
      if (booking) {
        await supabase.from('notifications').insert({
          user_id: booking.borrower_id,
          type: action,
          message: `Your booking request for "${equipmentMap[booking.equipment_id]?.name || 'equipment'}" has been ${action}`,
          booking_id: bookingId,
        });
      }
      toast.success(action === 'approved' ? 'Booking approved!' : 'Booking rejected');
    }
  };

  const handleDelete = async (equipmentId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    const { error } = await supabase.from('equipment').delete().eq('id', equipmentId);
    if (error) {
      toast.error('Failed to delete listing');
    } else {
      setListings((prev) => prev.filter((e) => e.id !== equipmentId));
      toast.success('Listing deleted');
    }
  };

  const pendingRequests = incomingBookings.filter((b) => b.status === 'requested');
  const activeBookings = incomingBookings.filter((b) =>
    ['approved', 'ongoing'].includes(b.status),
  );
  const pastBookings = incomingBookings.filter((b) =>
    ['completed', 'cancelled', 'rejected'].includes(b.status),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Welcome back, {profile?.name || 'there'}!
          </p>
        </div>
        <Link to="/equipment/new" className="btn-primary">
          <Plus className="w-4 h-4" /> List Equipment
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: IndianRupee, label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), color: 'text-green-600' },
          { icon: Package, label: 'Active Listings', value: String(stats.activeListings), color: 'text-brand-600' },
          { icon: Calendar, label: 'Rentals Completed', value: String(stats.totalRentals), color: 'text-accent-600' },
          { icon: Star, label: 'Your Rating', value: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ★` : '—', color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <stat.icon className={classNames('w-5 h-5', stat.color)} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending requests alert */}
      {pendingRequests.length > 0 && (
        <div className="card p-4 mb-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              You have {pendingRequests.length} pending booking {pendingRequests.length === 1 ? 'request' : 'requests'} to review
            </p>
            <button onClick={() => setTab('requests')} className="ml-auto text-sm text-amber-600 font-medium hover:underline">
              Review now
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {[
          { key: 'listings' as Tab, label: 'My Listings', count: listings.length },
          { key: 'requests' as Tab, label: 'Booking Requests', count: incomingBookings.length },
          { key: 'mybookings' as Tab, label: 'My Bookings', count: outgoingBookings.length },
          { key: 'analytics' as Tab, label: 'Analytics', count: 0 },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={classNames(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
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

      {/* Tab content */}
      {tab === 'listings' && (
        <>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <ListSkeleton count={3} />
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No equipment listed yet"
              description="List your first tool and start earning from nearby workshops."
              action={{ label: 'Add Your First Tool', onClick: () => window.location.href = '/equipment/new' }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((eq) => (
                <div key={eq.id} className="relative group">
                  <EquipmentCard equipment={eq} />
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Link
                      to={`/equipment/${eq.id}/edit`}
                      className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md text-gray-600 hover:text-brand-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md text-gray-600 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {incomingBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No booking requests yet"
              description="When someone books your equipment, their request will appear here for you to approve or reject."
            />
          ) : (
            <div className="space-y-4">
              {[...pendingRequests, ...activeBookings, ...pastBookings].map((booking) => {
                const eq = equipmentMap[booking.equipment_id];
                const borrower = borrowers[booking.borrower_id];
                return (
                  <div key={booking.id} className="card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                        {eq?.photos?.[0] ? (
                          <img src={eq.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {eq?.name || 'Equipment'}
                          </h3>
                          <span className={classNames('badge', BOOKING_STATUS_COLORS[booking.status])}>
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Requested by {borrower?.name || 'Unknown'} · {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                          {formatCurrency(booking.total_amount)} + {formatCurrency(booking.deposit_amount)} deposit
                        </p>
                      </div>
                      {booking.status === 'requested' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleBookingAction(booking.id, 'approved')}
                            className="btn-primary px-4 py-2 text-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, 'rejected')}
                            className="btn-secondary px-4 py-2 text-xs"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                      {booking.status === 'approved' && (
                        <button
                          onClick={async () => {
                            await supabase.from('bookings').update({ status: 'ongoing' }).eq('id', booking.id);
                            setIncomingBookings((prev) =>
                              prev.map((b) => (b.id === booking.id ? { ...b, status: 'ongoing' } : b)),
                            );
                            toast.success('Marked as ongoing');
                          }}
                          className="btn-secondary px-4 py-2 text-xs shrink-0"
                        >
                          Mark Ongoing
                        </button>
                      )}
                      {booking.status === 'ongoing' && (
                        <button
                          onClick={async () => {
                            await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
                            setIncomingBookings((prev) =>
                              prev.map((b) => (b.id === booking.id ? { ...b, status: 'completed' } : b)),
                            );
                            toast.success('Booking completed!');
                          }}
                          className="btn-primary px-4 py-2 text-xs shrink-0"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'mybookings' && (
        <>
          {outgoingBookings.length === 0 ? (
            <EmptyState
              icon={Backpack}
              title="No bookings yet"
              description="Browse equipment and send a booking request to get started."
              action={{ label: 'Browse Equipment', onClick: () => window.location.href = '/browse' }}
            />
          ) : (
            <div className="space-y-4">
              {outgoingBookings.map((booking) => {
                const eq = equipmentMap[booking.equipment_id];
                const lender = lenders[booking.lender_id];
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
                        <p className="text-sm text-gray-400">Owner: {lender?.name || 'Unknown'}</p>
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
                        {booking.status === 'requested' && (
                          <button
                            onClick={async () => {
                              if (!confirm('Cancel this booking request?')) return;
                              const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
                              if (error) { toast.error('Failed to cancel'); }
                              else {
                                setOutgoingBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'cancelled' } : b)));
                                toast.success('Booking cancelled');
                              }
                            }}
                            className="btn-secondary px-4 py-2 text-xs"
                          >
                            <XCircle className="w-4 h-4" /> Cancel
                          </button>
                        )}
                        {booking.status === 'approved' && !booking.deposit_paid && (
                          <button
                            onClick={async () => {
                              const { error } = await supabase.from('bookings').update({ deposit_paid: true, rental_paid: true }).eq('id', booking.id);
                              if (error) { toast.error('Payment failed'); }
                              else {
                                setOutgoingBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, deposit_paid: true, rental_paid: true } : b)));
                                toast.success('Payment successful! (Simulated)');
                              }
                            }}
                            className="btn-primary px-4 py-2 text-xs"
                          >
                            Pay Now
                          </button>
                        )}
                        <Link
                          to="/my-bookings"
                          className="btn-ghost px-4 py-2 text-xs text-brand-600"
                        >
                          View Details <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
        </>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Earnings Summary
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Total Earnings</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(stats.totalEarnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Completed Rentals</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.totalRentals}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Active Listings</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.activeListings}
                  </span>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-accent-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Most Active Listings
                </h3>
              </div>
              {listings.length === 0 ? (
                <p className="text-sm text-gray-400">No listings yet.</p>
              ) : (
                <div className="space-y-3">
                  {listings.slice(0, 5).map((eq) => {
                    const bookingCount = incomingBookings.filter(
                      (b) => b.equipment_id === eq.id && b.status === 'completed',
                    ).length;
                    return (
                      <Link
                        key={eq.id}
                        to={`/equipment/${eq.id}`}
                        className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-2 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {eq.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {bookingCount} {bookingCount === 1 ? 'rental' : 'rentals'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
