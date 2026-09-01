/*
# ToolShare — Community Equipment & Tool Sharing Platform

## Overview
Creates the core database schema for ToolShare, a platform where workshop owners
can list idle equipment for short-term rent and others can search, book, and pay
for equipment locally with trust mechanisms (ratings, condition photos, deposits).

## New Tables

1. **profiles** — extends auth.users with public profile data (name, phone, workshop, address, location, photo, rating, verified badge)
2. **equipment** — equipment listings (name, category, description, photos, rental rate, deposit, location, active status, blocked dates)
3. **bookings** — rental bookings (equipment, borrower, lender, dates, status, payment flags, condition photos before/after, dispute flag)
4. **reviews** — ratings and reviews between users after completed bookings
5. **notifications** — in-app notifications for booking events

## Security (RLS)
- profiles: all authenticated can read; users update only their own
- equipment: anon+authenticated can read; owners insert/update/delete their own
- bookings: borrower and lender can read; borrower creates; both can update
- reviews: anyone can read; reviewer creates their own
- notifications: users read/update only their own

## Notes
- Owner columns default to auth.uid() so client inserts work without passing user_id
- Equipment SELECT is open to anon so browse page works without login
- Trigger auto-creates a profile row on signup
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  workshop_name text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  latitude numeric DEFAULT NULL,
  longitude numeric DEFAULT NULL,
  profile_photo text DEFAULT NULL,
  avg_rating numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  photos text[] DEFAULT '{}',
  rental_rate_per_day numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  address text DEFAULT '',
  city text DEFAULT '',
  latitude numeric DEFAULT NULL,
  longitude numeric DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  avg_rating numeric DEFAULT 0,
  blocked_dates date[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipment_select_all" ON equipment;
CREATE POLICY "equipment_select_all" ON equipment FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "equipment_insert_own" ON equipment;
CREATE POLICY "equipment_insert_own" ON equipment FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "equipment_update_own" ON equipment;
CREATE POLICY "equipment_update_own" ON equipment FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "equipment_delete_own" ON equipment;
CREATE POLICY "equipment_delete_own" ON equipment FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  deposit_paid boolean NOT NULL DEFAULT false,
  rental_paid boolean NOT NULL DEFAULT false,
  total_amount numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  condition_photos_before text[] DEFAULT '{}',
  condition_notes_before text DEFAULT '',
  condition_photos_after text[] DEFAULT '{}',
  condition_notes_after text DEFAULT '',
  dispute_flag boolean NOT NULL DEFAULT false,
  dispute_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_parties" ON bookings;
CREATE POLICY "bookings_select_parties" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = borrower_id OR auth.uid() = lender_id);

DROP POLICY IF EXISTS "bookings_insert_borrower" ON bookings;
CREATE POLICY "bookings_insert_borrower" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = borrower_id);

DROP POLICY IF EXISTS "bookings_update_parties" ON bookings;
CREATE POLICY "bookings_update_parties" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = borrower_id OR auth.uid() = lender_id)
  WITH CHECK (auth.uid() = borrower_id OR auth.uid() = lender_id);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'booking_request',
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_city ON equipment(city);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_borrower ON bookings(borrower_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lender ON bookings(lender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_equipment ON reviews(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- TRIGGER: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
