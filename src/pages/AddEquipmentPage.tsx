import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CATEGORY_LABELS } from '@/types';
import type { EquipmentCategory } from '@/types';
import toast from 'react-hot-toast';

const CATEGORIES: EquipmentCategory[] = ['welding', 'power_tools', 'measuring', 'other'];

// Stock photo URLs by category for placeholder images
const STOCK_PHOTOS: Record<EquipmentCategory, string[]> = {
  welding: [
    'https://images.pexels.com/photos/5480622/pexels-photo-5480622.jpeg',
    'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg',
  ],
  power_tools: [
    'https://images.pexels.com/photos/162539/architecture-building-amsterdam-blue-sky-162539.jpeg',
    'https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg',
  ],
  measuring: [
    'https://images.pexels.com/photos/8961342/pexels-photo-8961342.jpeg',
  ],
  other: [
    'https://images.pexels.com/photos/162539/architecture-building-amsterdam-blue-sky-162539.jpeg',
  ],
};

export function AddEquipmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('welding');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [rentalRate, setRentalRate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setName(data.name || '');
        setCategory(data.category || 'welding');
        setDescription(data.description || '');
        setPhotos(data.photos || []);
        setRentalRate(String(data.rental_rate_per_day || ''));
        setDepositAmount(String(data.deposit_amount || ''));
        setAddress(data.address || '');
        setCity(data.city || '');
        setIsActive(data.is_active ?? true);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleAddPhoto = (cat: EquipmentCategory) => {
    const stockPhotos = STOCK_PHOTOS[cat];
    const randomPhoto = stockPhotos[Math.floor(Math.random() * stockPhotos.length)];
    setPhotos((prev) => [...prev, randomPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!rentalRate || parseFloat(rentalRate) <= 0) {
      toast.error('Please enter a valid rental rate');
      return;
    }

    setSubmitting(true);
    const payload = {
      owner_id: user.id,
      name: name.trim(),
      category,
      description: description.trim(),
      photos,
      rental_rate_per_day: parseFloat(rentalRate),
      deposit_amount: parseFloat(depositAmount) || 0,
      address: address.trim(),
      city: city.trim(),
      is_active: isActive,
    };

    if (isEdit) {
      const { error } = await supabase
        .from('equipment')
        .update(payload)
        .eq('id', id);
      if (error) {
        toast.error('Failed to update: ' + error.message);
      } else {
        toast.success('Listing updated!');
        navigate(`/equipment/${id}`);
      }
    } else {
      const { data, error } = await supabase
        .from('equipment')
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast.error('Failed to create listing: ' + error.message);
      } else {
        toast.success('Equipment listed!');
        navigate(`/equipment/${data.id}`);
      }
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {isEdit ? 'Edit Equipment' : 'List New Equipment'}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {isEdit ? 'Update your equipment listing' : 'Share your idle tools with the community'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos */}
        <div className="card p-5">
          <label className="label">Photos</label>
          <p className="text-xs text-gray-400 mb-3">
            Add photos so borrowers can see what they're renting. We'll add a
            stock photo based on the category if you don't have one.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                <img src={photo} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                type="button"
                onClick={() => handleAddPhoto(category)}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Equipment Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arc Welding Machine 250A"
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the equipment, its condition, specs, and any usage notes..."
              rows={4}
              className="input resize-none"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rental Rate (₹/day) *</label>
              <input
                type="number"
                value={rentalRate}
                onChange={(e) => setRentalRate(e.target.value)}
                placeholder="500"
                className="input"
                required
                min="0"
              />
            </div>
            <div>
              <label className="label">Security Deposit (₹)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="2000"
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Workshop Street"
              className="input"
            />
          </div>
          <div>
            <label className="label">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
              className="input"
            />
          </div>
        </div>

        {/* Active toggle */}
        <div className="card p-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Listing Active</p>
              <p className="text-sm text-gray-400">Inactive listings won't appear in search results</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : ''}`}
              />
            </button>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 py-3"
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Listing' : 'List Equipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
