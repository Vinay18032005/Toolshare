import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { CATEGORY_LABELS } from '@/types';
import { RatingStars } from '@/components/RatingStars';
import type { Equipment } from '@/types';

interface EquipmentCardProps {
  equipment: Equipment;
  ownerName?: string;
  distanceKm?: number | null;
}

export function EquipmentCard({ equipment, ownerName, distanceKm }: EquipmentCardProps) {
  const photo = equipment.photos?.[0];

  return (
    <Link
      to={`/equipment/${equipment.id}`}
      className="card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={equipment.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <span className="text-4xl">🔧</span>
          </div>
        )}
        <span className="absolute top-3 left-3 badge bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
          {CATEGORY_LABELS[equipment.category]}
        </span>
        {equipment.avg_rating > 0 && (
          <span className="absolute top-3 right-3 badge bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {equipment.avg_rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 transition-colors">
          {equipment.name}
        </h3>
        {ownerName && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">by {ownerName}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
          <MapPin className="w-3 h-3" />
          {equipment.city || 'Location not set'}
          {distanceKm != null && (
            <span className="ml-1 text-brand-500 font-medium">
              · {distanceKm} km away
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(equipment.rental_rate_per_day)}
            </span>
            <span className="text-xs text-gray-400 ml-1">/day</span>
          </div>
          <span className="text-xs text-gray-400">
            Deposit: {formatCurrency(equipment.deposit_amount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
