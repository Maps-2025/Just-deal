import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { success, error } from '../utils/response';

export async function listStatements(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { budget_type, period_type } = req.query;

    let query = supabase
      .from('operating_statements')
      .select('id, period_start, period_end, period_type, budget_type, uploaded_at')
      .eq('deal_pk', dealId)
      .order('period_end', { ascending: false });

    if (budget_type) query = query.eq('budget_type', budget_type as string);
    if (period_type) query = query.eq('period_type', period_type as string);

    const { data, error: dbErr } = await query;
    if (dbErr) return error(res, dbErr.message);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

export async function latestStatement(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { budget_type } = req.query;

    let query = supabase
      .from('operating_statements')
      .select('*, line_items:operating_statement_line_items(*)')
      .eq('deal_pk', dealId)
      .order('period_end', { ascending: false })
      .limit(1);

    if (budget_type) query = query.eq('budget_type', budget_type as string);

    const { data, error: dbErr } = await query.single();
    if (dbErr) return error(res, 'No operating statement found', 404);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

export async function getStatement(req: Request, res: Response) {
  try {
    const { osId } = req.params;
    const { data, error: dbErr } = await supabase
      .from('operating_statements')
      .select('*, line_items:operating_statement_line_items(*)')
      .eq('id', osId)
      .single();

    if (dbErr) return error(res, dbErr.message, 404);
    return success(res, data);
  } catch (err: any) { return error(res, err.message); }
}

export async function noiSummary(req: Request, res: Response) {
  try {
    const { dealId } = req.params;

    const { data: os } = await supabase
      .from('operating_statements')
      .select('id, period_start, period_end, budget_type')
      .eq('deal_pk', dealId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (!os) return success(res, null);

    const { data: items } = await supabase
      .from('operating_statement_line_items')
      .select('*')
      .eq('os_id', os.id);

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const item of items || []) {
      if (item.is_income) totalIncome += item.amount;
      else totalExpenses += item.amount;
    }

    const noi = totalIncome - totalExpenses;
    const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 1000) / 10 : 0;

    return success(res, {
      os_id: os.id,
      period: `${os.period_start} to ${os.period_end}`,
      budget_type: os.budget_type,
      effective_gross_income: totalIncome,
      total_expenses: totalExpenses,
      noi,
      expense_ratio: expenseRatio,
    });
  } catch (err: any) { return error(res, err.message); }
}
