import prisma from '../models/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { UsersRepository } from '../repositories/usersRepository';

const usersRepo = new UsersRepository();

export class AuthService {
  async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await usersRepo.findByEmail(email);
    if (!user || !user.is_active) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid credentials');
    const accessToken = jwt.sign({ id: user.id, role: user.role_id, org: user.organization_id }, ENV.JWT_SECRET, { expiresIn: '1h' });
    // Audit log
    await prisma.user_activity_logs.create({
      data: {
        user_id: user.id,
        organization_id: user.organization_id,
        action_type: 'LOGIN',
        entity_type: 'AUTH',
        entity_id: String(user.id),
        description: 'User login',
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return { accessToken, user };
  }

  async register(data: { email: string; password: string; role_id: number; organization_id?: number; first_name: string; last_name?: string }, actor: { id: number; role: string }, ip: string, userAgent: string) {
    // Only SUPER_ADMIN or ADMIN can register
    if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role)) throw new Error('Forbidden');
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.users.create({
      data: {
        email: data.email,
        password_hash: hashed,
        role_id: data.role_id,
        organization_id: data.organization_id,
        first_name: data.first_name,
        last_name: data.last_name,
        is_active: true
      }
    });
    // Audit log
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: data.organization_id,
        action_type: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: String(user.id),
        description: 'User registered',
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return user;
  }

  async logout(userId: number, orgId: number, ip: string, userAgent: string) {
    await prisma.user_activity_logs.create({
      data: {
        user_id: userId,
        organization_id: orgId,
        action_type: 'LOGOUT',
        entity_type: 'AUTH',
        entity_id: String(userId),
        description: 'User logout',
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return { message: 'Logged out' };
  }
}
