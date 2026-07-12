import prisma from '../models/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, organization: true }
    });

    if (!user || !user.is_active) {
      throw new Error('Invalid credentials or inactive account');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id, user.role.name, user.organization_id);
    const refreshToken = this.generateRefreshToken(user.id, user.role.name, user.organization_id);

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken }
    });

    // Audit log
    await prisma.userActivityLog.create({
      data: {
        action: 'LOGIN',
        entity: 'User',
        entity_id: String(user.id),
        user_id: user.id,
        organization_id: user.organization_id,
        metadata: { role: user.role.name }
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role.name,
        organization_id: user.organization_id
      }
    };
  }

  async register(data: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    role_id: number;
    organization_id?: number;
  }) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash: hashed,
        role_id: data.role_id,
        organization_id: data.organization_id,
      }
    });

    return user;
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true }
      });

      if (!user || user.refresh_token !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = this.generateAccessToken(user.id, user.role.name, user.organization_id);
      const newRefreshToken = this.generateRefreshToken(user.id, user.role.name, user.organization_id);

      await prisma.user.update({
        where: { id: user.id },
        data: { refresh_token: newRefreshToken }
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private generateAccessToken(id: number, role: string, organization_id?: number | null) {
    return jwt.sign({ id, role, organization_id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_ACCESS_EXPIRATION as any });
  }

  private generateRefreshToken(id: number, role: string, organization_id?: number | null) {
    return jwt.sign({ id, role, organization_id }, ENV.JWT_REFRESH_SECRET, { expiresIn: ENV.JWT_REFRESH_EXPIRATION as any });
  }
}
