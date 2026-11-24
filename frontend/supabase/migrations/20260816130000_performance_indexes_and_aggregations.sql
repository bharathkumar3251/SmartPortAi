-- =========================================================
-- PERFORMANCE INDEXES & SERVER-SIDE AGGREGATIONS
-- =========================================================

-- 1. Targeted Composite Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_stage_created ON public.shipment_submissions (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_created_stage ON public.shipment_submissions (created_by, stage);
CREATE INDEX IF NOT EXISTS idx_submissions_berth ON public.shipment_submissions (berth_code) WHERE berth_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_containers_sub_stage ON public.containers (submission_id, stage);
CREATE INDEX IF NOT EXISTS idx_containers_stage_updated ON public.containers (stage, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON public.audit_logs (created_at DESC);

-- 2. Optimized Server-Side Dashboard Summary Function
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_submissions', (SELECT count(*) FROM public.shipment_submissions),
    'authority_review', (SELECT count(*) FROM public.shipment_submissions WHERE stage = 'authority_review'),
    'customs_review', (SELECT count(*) FROM public.shipment_submissions WHERE stage IN ('customs_review', 'customs_hold')),
    'active_operations', (SELECT count(*) FROM public.shipment_submissions WHERE stage IN ('berth_assigned', 'terminal_scheduled', 'unloading')),
    'warehouse_received', (SELECT count(*) FROM public.shipment_submissions WHERE stage = 'warehouse_received'),
    'dispatch_ready', (SELECT count(*) FROM public.shipment_submissions WHERE stage = 'dispatch_ready'),
    'in_transit', (SELECT count(*) FROM public.shipment_submissions WHERE stage = 'in_transit'),
    'delivered', (SELECT count(*) FROM public.shipment_submissions WHERE stage = 'delivered'),
    'total_containers', (SELECT count(*) FROM public.containers),
    'active_containers', (SELECT count(*) FROM public.containers WHERE stage NOT IN ('delivered')),
    'active_berths', (SELECT count(DISTINCT berth_code) FROM public.shipment_submissions WHERE berth_code IS NOT NULL AND stage NOT IN ('delivered', 'authority_rejected', 'customs_rejected'))
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_summary() TO authenticated;
