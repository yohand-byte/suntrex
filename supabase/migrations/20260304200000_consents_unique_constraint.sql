-- Drop old unique on user_id only (if exists) and add composite unique
ALTER TABLE public.consents DROP CONSTRAINT IF EXISTS consents_user_id_key;
ALTER TABLE public.consents ADD CONSTRAINT consents_user_consent_unique UNIQUE (user_id, consent_type);
