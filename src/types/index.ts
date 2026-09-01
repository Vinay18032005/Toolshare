export type EquipmentCategory = 'welding' | 'power_tools' | 'measuring' | 'other';

export type BookingStatus =
  | 'requested'
  | 'approved'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface Profile {
  id: string;
  name: string;
  phone: string;
  workshop_name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  profile_photo: string | null;
  avg_rating: number;
  is_verified: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  owner_id: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  photos: string[];
  rental_rate_per_day: number;
  deposit_amount: number;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  avg_rating: number;
  blocked_dates: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  equipment_id: string;
  borrower_id: string;
  lender_id: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  deposit_paid: boolean;
  rental_paid: boolean;
  total_amount: number;
  deposit_amount: number;
  condition_photos_before: string[];
  condition_notes_before: string;
  condition_photos_after: string[];
  condition_notes_after: string;
  dispute_flag: boolean;
  dispute_notes: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  equipment_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  is_read: boolean;
  booking_id: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  welding: 'Welding',
  power_tools: 'Power Tools',
  measuring: 'Measuring',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<EquipmentCategory, string> = {
  welding: '🔥',
  power_tools: '⚡',
  measuring: '📐',
  other: '🔧',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Requested',
  approved: 'Approved',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
