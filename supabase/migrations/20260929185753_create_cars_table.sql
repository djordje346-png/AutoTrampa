/*
# Create cars table for AutoTrampa garage

1. Purpose
   - Stores garage cars (MyGarageCar) for the AutoTrampa car-swapping app.
   - Each row represents one car in a user's garage, including all specs,
     owner info, equipment/features, modifications, and images.

2. New Tables
   - `cars`
     - `id` (text, primary key) — client-generated unique id (e.g. "garage-169...")
     - `brand` (text, not null) — car brand (e.g. "BMW")
     - `model` (text, not null) — car model (e.g. "525d")
     - `generation` (text) — generation/chassis code (e.g. "E60")
     - `year` (integer) — model year
     - `body_type` (text) — BodyType enum: Sedan, Caravan, Hatchback, SUV, Coupe, Convertible
     - `color` (text) — exterior color
     - `mileage` (integer) — kilometers driven
     - `price` (integer) — asking price in EUR
     - `city` (text) — location city
     - `country` (text) — location country
     - `image` (text) — main/cover image URL
     - `images` (text[]) — array of all photo URLs
     - `specs` (jsonb) — full CarSpec object (engine, displacement, cylinders, power, torque, fuelType, transmission, drivetrain, topSpeed, acceleration)
     - `owner` (jsonb) — Owner object (name, phone, city, rating)
     - `description` (text) — free-text listing description
     - `modifications` (text[]) — list of modifications
     - `equipment` (text[]) — equipment/features list (e.g. ["abs","esp","airbags"])
     - `security_features` (text[]) — security features list
     - `build_notes` (text[]) — service history notes
     - `estimated_value` (integer) — estimated market value in EUR
     - `created_at` (timestamptz, default now()) — row creation timestamp

3. Security
   - Enable RLS on `cars`.
   - This app has no real sign-in screen (auth is a local-only flag), so the
     anon-key client must be able to read and write. Policies use
     `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
     the data is intentionally shared in this single-tenant demo.

4. Notes
   - The `equipment` column (text[]) stores the features list directly — no
     separate features table is needed since equipment is a simple array of
     string identifiers referenced by the frontend.
   - `specs` and `owner` are stored as jsonb to preserve the nested structure
     the frontend expects without requiring a join.
*/

CREATE TABLE IF NOT EXISTS cars (
  id text PRIMARY KEY,
  brand text NOT NULL,
  model text NOT NULL,
  generation text DEFAULT '-',
  year integer DEFAULT 0,
  body_type text DEFAULT 'Sedan',
  color text DEFAULT '-',
  mileage integer DEFAULT 0,
  price integer DEFAULT 0,
  city text DEFAULT '-',
  country text DEFAULT 'Serbia',
  image text,
  images text[] DEFAULT '{}',
  specs jsonb DEFAULT '{}',
  owner jsonb DEFAULT '{}',
  description text DEFAULT '',
  modifications text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  security_features text[] DEFAULT '{}',
  build_notes text[] DEFAULT '{}',
  estimated_value integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cars" ON cars;
CREATE POLICY "anon_select_cars" ON cars FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cars" ON cars;
CREATE POLICY "anon_insert_cars" ON cars FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cars" ON cars;
CREATE POLICY "anon_update_cars" ON cars FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cars" ON cars;
CREATE POLICY "anon_delete_cars" ON cars FOR DELETE
  TO anon, authenticated USING (true);
