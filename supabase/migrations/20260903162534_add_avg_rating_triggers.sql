/*
# Add avg_rating recalculation triggers

## What
- After a review is inserted, recalculate avg_rating on the reviewed profile
- After a review is inserted, recalculate avg_rating on the equipment
- Both functions use SECURITY DEFINER with fixed search_path

## Why
Previously avg_rating was never updated after reviews were submitted.
Now it auto-updates so profile and equipment cards show correct ratings.
*/

-- Recalculate profile avg_rating after review insert
CREATE OR REPLACE FUNCTION update_profile_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION update_profile_avg_rating() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_review_inserted ON reviews;
CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_avg_rating();

-- Recalculate equipment avg_rating after review insert
CREATE OR REPLACE FUNCTION update_equipment_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE equipment
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE equipment_id = NEW.equipment_id
  )
  WHERE id = NEW.equipment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION update_equipment_avg_rating() FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_review_eq_inserted ON reviews;
CREATE TRIGGER on_review_eq_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_equipment_avg_rating();
