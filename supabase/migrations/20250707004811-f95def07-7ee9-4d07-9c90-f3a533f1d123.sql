
-- إنشاء view للخدمات العلاجية التفصيلية للمرضى
CREATE OR REPLACE VIEW patient_detailed_services AS
SELECT 
    p.id as patient_id,
    p.full_name,
    a.id as appointment_id,
    a.scheduled_date,
    a.scheduled_time,
    a.status as appointment_status,
    ts.name as service_name,
    ts.description as service_description,
    ts.category as service_category,
    aserv.quantity,
    aserv.unit_price,
    aserv.total_price,
    aserv.service_notes,
    aserv.notes as appointment_service_notes
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN appointment_services aserv ON a.id = aserv.appointment_id
LEFT JOIN treatment_services ts ON aserv.service_id = ts.id
WHERE a.id IS NOT NULL AND aserv.id IS NOT NULL
ORDER BY p.id, a.scheduled_date DESC, ts.name;

-- إنشاء view للأقساط التفصيلية للمرضى
CREATE OR REPLACE VIEW patient_detailed_installments AS
SELECT 
    p.id as patient_id,
    p.full_name,
    a.id as appointment_id,
    a.scheduled_date as appointment_date,
    pay.id as payment_id,
    pay.amount as total_payment_amount,
    inst.id as installment_id,
    inst.installment_number,
    inst.amount as installment_amount,
    inst.due_date,
    inst.paid_date,
    inst.is_paid,
    CASE 
        WHEN inst.is_paid THEN 'paid'
        WHEN inst.due_date < CURRENT_DATE AND NOT inst.is_paid THEN 'overdue'
        WHEN inst.due_date >= CURRENT_DATE AND NOT inst.is_paid THEN 'pending'
        ELSE 'unknown'
    END as installment_status,
    CASE 
        WHEN inst.due_date < CURRENT_DATE AND NOT inst.is_paid 
        THEN CURRENT_DATE - inst.due_date 
        ELSE 0 
    END as days_overdue
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN payments pay ON a.id = pay.appointment_id
LEFT JOIN installment_plans inst ON pay.id = inst.payment_id
WHERE pay.id IS NOT NULL AND inst.id IS NOT NULL
ORDER BY p.id, inst.due_date;

-- إنشاء دالة لحساب ملخص الأقساط للمريض
CREATE OR REPLACE FUNCTION get_patient_installments_summary(patient_id_param uuid)
RETURNS TABLE (
    total_installments bigint,
    paid_installments bigint,
    pending_installments bigint,
    overdue_installments bigint,
    total_amount numeric,
    paid_amount numeric,
    pending_amount numeric,
    overdue_amount numeric,
    next_due_date date,
    next_due_amount numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH installment_stats AS (
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE is_paid) as paid_count,
            COUNT(*) FILTER (WHERE NOT is_paid AND due_date >= CURRENT_DATE) as pending_count,
            COUNT(*) FILTER (WHERE NOT is_paid AND due_date < CURRENT_DATE) as overdue_count,
            SUM(installment_amount) as total_amt,
            SUM(installment_amount) FILTER (WHERE is_paid) as paid_amt,
            SUM(installment_amount) FILTER (WHERE NOT is_paid AND due_date >= CURRENT_DATE) as pending_amt,
            SUM(installment_amount) FILTER (WHERE NOT is_paid AND due_date < CURRENT_DATE) as overdue_amt
        FROM patient_detailed_installments 
        WHERE patient_detailed_installments.patient_id = patient_id_param
    ),
    next_installment AS (
        SELECT due_date, installment_amount
        FROM patient_detailed_installments 
        WHERE patient_detailed_installments.patient_id = patient_id_param 
        AND NOT is_paid 
        ORDER BY due_date ASC 
        LIMIT 1
    )
    SELECT 
        COALESCE(s.total_count, 0),
        COALESCE(s.paid_count, 0),
        COALESCE(s.pending_count, 0),
        COALESCE(s.overdue_count, 0),
        COALESCE(s.total_amt, 0),
        COALESCE(s.paid_amt, 0),
        COALESCE(s.pending_amt, 0),
        COALESCE(s.overdue_amt, 0),
        n.due_date,
        n.installment_amount
    FROM installment_stats s
    FULL OUTER JOIN next_installment n ON true;
END;
$$;
