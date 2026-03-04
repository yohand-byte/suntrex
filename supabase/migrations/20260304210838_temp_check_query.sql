CREATE OR REPLACE FUNCTION public.get_check_constraints()
RETURNS TABLE(constraint_name text, constraint_def text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.conname::text, pg_get_constraintdef(c.oid)::text
  FROM pg_constraint c
  WHERE c.conrelid = 'public.consents'::regclass
  AND c.contype = 'c';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_check_constraints() TO authenticated, anon;
