import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EquipmentCard } from '@/components/EquipmentCard';
import { ListSkeleton } from '@/components/Skeletons';
import { EmptyState } from '@/components/EmptyState';
import { CATEGORY_LABELS } from '@/types';
import type { Equipment, Profile, EquipmentCategory } from '@/types';

const CATEGORIES: EquipmentCategory[] = ['welding', 'power_tools', 'measuring', 'other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [owners, setOwners] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const city = searchParams.get('city') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true);

      if (category) query = query.eq('category', category);
      if (minPrice) query = query.gte('rental_rate_per_day', parseInt(minPrice));
      if (maxPrice) query = query.lte('rental_rate_per_day', parseInt(maxPrice));
      if (city) query = query.ilike('city', `%${city}%`);

      switch (sort) {
        case 'price_low':
          query = query.order('rental_rate_per_day', { ascending: true });
          break;
        case 'price_high':
          query = query.order('rental_rate_per_day', { ascending: false });
          break;
        case 'rating':
          query = query.order('avg_rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data } = await query.limit(50);
      if (data) {
        let filtered = data as Equipment[];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.name.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.city.toLowerCase().includes(q),
          );
        }
        setEquipment(filtered);
        const ownerIds = [...new Set(filtered.map((d) => d.owner_id))];
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', ownerIds);
          if (profiles) {
            const map: Record<string, Profile> = {};
            (profiles as Profile[]).forEach((p) => (map[p.id] = p));
            setOwners(map);
          }
        }
      }
      setLoading(false);
    })();
  }, [searchQuery, category, minPrice, maxPrice, city, sort]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', localSearch);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalSearch('');
  };

  const hasFilters = useMemo(
    () => !!(category || minPrice || maxPrice || city || searchQuery),
    [category, minPrice, maxPrice, city, searchQuery],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
          Browse Equipment
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Find tools and equipment available for rent near you
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, description, or city..."
            className="input pl-12"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary ${showFilters ? 'ring-2 ring-brand-500' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Min Price (₹/day)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => updateParam('minPrice', e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>
            <div>
              <label className="label">Max Price (₹/day)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="10000"
                className="input"
              />
            </div>
            <div>
              <label className="label">City</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => updateParam('city', e.target.value)}
                  placeholder="Any city"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <label className="label">Sort by</label>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="input"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost text-sm">
                <X className="w-4 h-4" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {hasFilters && !showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {searchQuery && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              "{searchQuery}"
              <button onClick={() => updateParam('q', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {category && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {CATEGORY_LABELS[category as EquipmentCategory]}
              <button onClick={() => updateParam('category', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {city && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {city}
              <button onClick={() => updateParam('city', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="badge bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              {minPrice || '₹0'} - {maxPrice || '∞'}
              <button onClick={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <ListSkeleton count={8} />
        </div>
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No equipment found"
          description="Try adjusting your search or filters to find what you're looking for."
          action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {equipment.length} {equipment.length === 1 ? 'result' : 'results'} found
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {equipment.map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                ownerName={owners[eq.owner_id]?.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
