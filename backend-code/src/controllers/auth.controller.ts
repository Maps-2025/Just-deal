import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { success, error } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400);

    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (dbErr || !user) return error(res, 'Invalid credentials', 401);

    // For demo: if no password hash stored, accept any password
    // In production, you'd store hashed passwords
    const token = signToken({ id: user.id, email: user.email });
    return success(res, { access_token: token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, organization_name } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400);

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) return error(res, 'User already exists', 409);

    // Create organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name: organization_name || `${name}'s Organization` })
      .select()
      .single();

    if (orgErr) return error(res, orgErr.message);

    // Create user
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase(), name: name || null })
      .select()
      .single();

    if (userErr) return error(res, userErr.message);

    // Create org membership
    await supabase.from('org_memberships').insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    });

    const token = signToken({ id: user.id, email: user.email });
    return success(res, { access_token: token, user: { id: user.id, email: user.email, name: user.name } }, 'Registered', 201);
  } catch (err: any) {
    return error(res, err.message);
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', req.user!.id)
      .single();

    if (dbErr || !user) return error(res, 'User not found', 404);

    // Get user's organizations
    const { data: memberships } = await supabase
      .from('org_memberships')
      .select('organization_id, role, organizations(id, name)')
      .eq('user_id', user.id);

    return success(res, { ...user, organizations: memberships });
  } catch (err: any) {
    return error(res, err.message);
  }
}
