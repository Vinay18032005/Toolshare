import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Wrench,
  ShieldCheck,
  Calendar,
  Star,
  Users,
  Package,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EquipmentCard } from '@/components/EquipmentCard';
import { EquipmentCardSkeleton } from '@/components/Skeletons';
import type { Equipment, Profile } from '@/types';

export function HomePage() {
  const [featured, setFeatured] = useState<Equipment[]>([]);
  const [owners, setOwners] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) {
        setFeatured(data as Equipment[]);
        const ownerIds = [...new Set(data.map((d) => d.owner_id))];
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
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    window.location.href = `/browse?${params.toString()}`;
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 dark:from-brand-800 dark:via-brand-900 dark:to-gray-950">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="badge bg-white/10 text-white border border-white/20 backdrop-blur-sm mb-5">
              <Zap className="w-3.5 h-3.5" />
              Built for workshops, fabricators & electricians
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight">
              Rent idle tools from{' '}
              <span className="text-accent-400">nearby workshops</span>
            </h1>
            <p className="mt-5 text-lg text-brand-100 max-w-xl">
              Don't buy expensive equipment you'll only use once. Find and book
              tools from trusted local workshops — with condition photos,
              security deposits, and verified ratings.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search welding machines, power tools..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
              <button type="submit" className="btn-accent px-6 shadow-lg">
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-400" />
                <span className="text-sm">Secure deposits</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-400" />
                <span className="text-sm">Verified ratings</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-400" />
                <span className="text-sm">Real-time availability</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" className="fill-gray-50 dark:fill-gray-950" />
        </svg>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: 'Tools Listed', value: '500+' },
            { icon: Users, label: 'Active Members', value: '1,200+' },
            { icon: TrendingUp, label: 'Rentals Completed', value: '3,800+' },
            { icon: Star, label: 'Avg. Rating', value: '4.7/5' },
          ].map((stat, i) => (
            <div key={i} className="card p-5 text-center">
              <stat.icon className="w-6 h-6 text-brand-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stat.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            How ToolShare Works
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Three simple steps to start renting or lending equipment
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              step: '01',
              title: 'Find Equipment',
              desc: 'Search for tools by category, price, or distance. Browse verified listings from nearby workshops with photos and ratings.',
            },
            {
              icon: Calendar,
              step: '02',
              title: 'Book & Pay',
              desc: 'Pick your dates, send a booking request, and pay the rental fee plus a refundable security deposit once the owner approves.',
            },
            {
              icon: ShieldCheck,
              step: '03',
              title: 'Use & Return',
              desc: 'Upload condition photos at handoff and return. Get your deposit back automatically. Rate the owner and build trust.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="card p-8 hover:shadow-lg transition-shadow group"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <item.icon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <span className="text-sm font-bold text-brand-200 dark:text-brand-800">
                {item.step}
              </span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured equipment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">
              Featured Equipment
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Recently listed tools available for rent
            </p>
          </div>
          <Link
            to="/browse"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <EquipmentCardSkeleton count={4} />
          </div>
        ) : featured.length === 0 ? (
          <div className="card p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No equipment listed yet. Be the first to share a tool!
            </p>
            <Link to="/signup" className="btn-primary mt-4 inline-flex">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((eq) => (
              <EquipmentCard
                key={eq.id}
                equipment={eq}
                ownerName={owners[eq.owner_id]?.name}
              />
            ))}
          </div>
        )}
        <div className="text-center mt-8 sm:hidden">
          <Link to="/browse" className="btn-secondary">
            View all equipment
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 md:p-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Got idle equipment?
            </h2>
            <p className="mt-4 text-brand-100 max-w-xl mx-auto">
              Turn your unused tools into income. List your equipment in minutes
              and start earning from nearby workshops.
            </p>
            <Link
              to="/signup"
              className="btn-accent mt-6 px-8 py-3 text-base shadow-lg"
            >
              Start Lending <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
