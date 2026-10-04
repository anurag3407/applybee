CREATE TABLE IF NOT EXISTS storage_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  byte_size INTEGER NOT NULL,
  content_type TEXT,
  sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT storage_objects_bucket_key_idx UNIQUE (bucket, object_key)
);
