import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { success, error } from '../utils/response';

export async function getProperty(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const { data, error: dbErr } = await supabase
      .from('properties')
      .select('*')
      .eq('deal_pk', dealId)
      .single();

    if (dbErr) return error(res, 'Property not found', 404);
    return success(res, data);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function upsertProperty(req: Request, res: Response) {
  try {
    const { dealId } = req.params;
    const body = req.body;

    const { data: existing } = await supabase.from('properties').select('id').eq('deal_pk', dealId).single();

    let data;
    if (existing) {
      const { data: updated, error: updErr } = await supabase
        .from('properties')
        .update(body)
        .eq('deal_pk', dealId)
        .select()
        .single();
      if (updErr) return error(res, updErr.message);
      data = updated;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('properties')
        .insert({ deal_pk: dealId, ...body })
        .select()
        .single();
      if (insErr) return error(res, insErr.message);
      data = inserted;
    }

    return success(res, data);
  } catch (err: any) {
    return error(res, err.message);
  }
}
