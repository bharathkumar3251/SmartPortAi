-- Migration: Super Admin RPC fixes and security defs
-- Date: 2026-08-17

-- 1. Helper function: Claim Super Admin (First User Bootstrap)
CREATE OR REPLACE FUNCTION public.claim_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid := auth.uid();
  admin_count integer;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated caller';
  END IF;

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'super_admin';
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'A Super Admin already exists in this workspace';
  END IF;

  -- Grant super_admin role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (caller_id, 'super_admin', caller_id)
  ON CONFLICT DO NOTHING;

  -- Set caller profile to active
  UPDATE public.profiles
  SET status = 'active', requested_role = NULL
  WHERE id = caller_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (caller_id, 'role_change', 'user', caller_id::text, jsonb_build_object('claimed_role', 'super_admin'));

  RETURN true;
END;
$$;

-- 2. Approve role request RPC
CREATE OR REPLACE FUNCTION public.approve_role_request(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Super Admin required';
  END IF;

  -- Grant role
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_user_id, _role, auth.uid())
  ON CONFLICT DO NOTHING;

  -- Update profile status to active & clear requested_role
  UPDATE public.profiles
  SET status = 'active', requested_role = NULL
  WHERE id = _user_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('granted_role', _role, 'status', 'active'));
END;
$$;

-- 3. Reject role request RPC
CREATE OR REPLACE FUNCTION public.reject_role_request(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Super Admin required';
  END IF;

  -- Clear requested_role while preserving pending account semantics
  UPDATE public.profiles
  SET requested_role = NULL
  WHERE id = _user_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'user_updated', 'user', _user_id::text, jsonb_build_object('action', 'role_request_rejected'));
END;
$$;

-- 4. Revoke role RPC with last super_admin guard
CREATE OR REPLACE FUNCTION public.revoke_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_count integer;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Super Admin required';
  END IF;

  IF _role = 'super_admin' THEN
    SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'super_admin';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke the final Super Admin role';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('revoked_role', _role));
END;
$$;

-- 5. Set account status RPC
CREATE OR REPLACE FUNCTION public.set_account_status(_user_id uuid, _status account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Super Admin required';
  END IF;

  IF _user_id = auth.uid() AND _status = 'disabled' THEN
    RAISE EXCEPTION 'Cannot disable your own Super Admin account';
  END IF;

  UPDATE public.profiles SET status = _status WHERE id = _user_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), CASE WHEN _status='disabled' THEN 'user_disabled' ELSE 'user_activated' END::public.audit_action,
          'user', _user_id::text, jsonb_build_object('status', _status));
END;
$$;

-- 6. Ensure System Admin RPC (Idempotent bootstrap for admin@smartport.ai)
CREATE OR REPLACE FUNCTION public.ensure_system_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Locate admin user in auth.users
  SELECT id INTO admin_id
  FROM auth.users
  WHERE lower(email) = 'admin@smartport.ai'
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Ensure active profile
    INSERT INTO public.profiles (id, email, first_name, last_name, organization, status, requested_role)
    VALUES (admin_id, 'admin@smartport.ai', 'System', 'Administrator', 'SmartPort AI', 'active', NULL)
    ON CONFLICT (id) DO UPDATE
    SET status = 'active', requested_role = NULL;

    -- Ensure super_admin role in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
    VALUES (admin_id, 'role_change', 'user', admin_id::text, jsonb_build_object('bootstrapped', true, 'role', 'super_admin'));

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 7. Grant Role RPC
CREATE OR REPLACE FUNCTION public.grant_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Super Admin required';
  END IF;

  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_user_id, _role, auth.uid())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'role_change', 'user', _user_id::text, jsonb_build_object('granted_role', _role));
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.claim_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_role_request(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_role_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_account_status(uuid, account_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_system_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.grant_role(uuid, app_role) TO authenticated;
