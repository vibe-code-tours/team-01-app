-- Add "coupon-delivery" to order_type enum
ALTER TYPE order_type ADD VALUE 'coupon-delivery';

-- Add bottle_count to orders (nullable, only used for coupon-delivery type)
ALTER TABLE orders ADD COLUMN bottle_count integer;
