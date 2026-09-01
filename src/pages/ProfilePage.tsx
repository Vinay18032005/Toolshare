import { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Phone,
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  Save,
  Camera,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { RatingStars } from '@/components/RatingStars';
import { formatCurrency } from '@/utils/helpers';
import type { Equipment, Review, Profile } from '@/types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PROFILE_PHOTOS = [
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
];

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userListings, setUserListings] = useState<Equipment[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setWorkshopName(profile.workshop_name || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setProfilePhoto(profile.profile_photo);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: listings } = await supabase
        .from('equipment')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (listings) setUserListings(listings as Equipment[]);

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false });
      if (reviews) {
        setUserReviews(reviews as Review[]);
        const reviewerIds = [...new Set((reviews as Review[]).map((r) => r.reviewer_id))];
        if (reviewerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', reviewerIds);
          if (profiles) {
            const map: Record<string, Profile> = {};
            (profiles as Profile[]).forEach((p) => (map[p.id] = p));
            setReviewers(map);
          }
        }
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        workshop_name: workshopName,
        address,
        city,
        profile_photo: profilePhoto,
      })
      .eq('id', user.id);
    if (error) {
      toast.error('Failed to save profile');
    } else {
      await refreshProfile();
      toast.success('Profile updated!');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        My Profile
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-3xl font-bold mx-auto overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                (name || user?.email || '?')[0].toUpperCase()
              )}
            </div>
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100 mt-4">
              {name || 'Your Name'}
            </h2>
            {workshopName && (
              <p className="text-sm text-gray-400 flex items-center justify-center gap-1 mt-1">
                <Building2 className="w-3.5 h-3.5" /> {workshopName}
              </p>
            )}
            {profile?.is_verified && (
              <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 mt-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            {profile && profile.avg_rating > 0 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <RatingStars rating={profile.avg_rating} size="sm" showValue />
              </div>
            )}
            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 space-y-2 text-sm text-left">
              {phone && (
                <p className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-4 h-4 text-gray-400" /> {phone}
                </p>
              )}
              {city && (
                <p className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" /> {city}
                </p>
              )}
              <p className="flex items-center gap-2 text-gray-500">
                <UserIcon className="w-4 h-4 text-gray-400" /> {user?.email}
              </p>
            </div>
          </div>

          {/* Profile photo picker */}
          <div className="card p-4 mt-4">
            <label className="label flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Choose a profile photo
            </label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {PROFILE_PHOTOS.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setProfilePhoto(photo)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    profilePhoto === photo ? 'border-brand-500' : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Edit Profile
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+91..." />
              </div>
              <div>
                <label className="label">Workshop Name</label>
                <input value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} className="input" placeholder="Doe Fab" />
              </div>
              <div>
                <label className="label">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="Mumbai" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="123 Workshop Street" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary mt-5">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* My listings */}
          {userListings.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Active Listings
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {userListings.map((eq) => (
                  <Link
                    key={eq.id}
                    to={`/equipment/${eq.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {eq.photos?.[0] ? (
                        <img src={eq.photos[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🔧</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {eq.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(eq.rental_rate_per_day)}/day
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews about me */}
          {userReviews.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Reviews About You ({userReviews.length})
              </h3>
              <div className="space-y-4">
                {userReviews.map((review) => {
                  const reviewer = reviewers[review.reviewer_id];
                  return (
                    <div key={review.id} className="flex items-start gap-3 pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden shrink-0">
                        {reviewer?.profile_photo ? (
                          <img src={reviewer.profile_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (reviewer?.name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {reviewer?.name || 'Anonymous'}
                        </p>
                        <RatingStars rating={review.rating} size="sm" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
