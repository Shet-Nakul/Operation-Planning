"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class AuthService {
    async login(email, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { role: true, organization: true }
        });
        if (!user || !user.is_active) {
            throw new Error('Invalid credentials or inactive account');
        }
        const valid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }
        const accessToken = this.generateAccessToken(user.id, user.role.name);
        const refreshToken = this.generateRefreshToken(user.id, user.role.name);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { refresh_token: refreshToken }
        });
        // Audit log
        await prisma_1.default.userActivityLog.create({
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
    async register(data) {
        const hashed = await bcrypt_1.default.hash(data.password, 10);
        const user = await prisma_1.default.user.create({
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
    async refresh(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.ENV.JWT_REFRESH_SECRET);
            const user = await prisma_1.default.user.findUnique({
                where: { id: decoded.id },
                include: { role: true }
            });
            if (!user || user.refresh_token !== refreshToken) {
                throw new Error('Invalid refresh token');
            }
            const accessToken = this.generateAccessToken(user.id, user.role.name);
            const newRefreshToken = this.generateRefreshToken(user.id, user.role.name);
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { refresh_token: newRefreshToken }
            });
            return { accessToken, refreshToken: newRefreshToken };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    generateAccessToken(id, role) {
        return jsonwebtoken_1.default.sign({ id, role }, env_1.ENV.JWT_SECRET, { expiresIn: env_1.ENV.JWT_ACCESS_EXPIRATION });
    }
    generateRefreshToken(id, role) {
        return jsonwebtoken_1.default.sign({ id, role }, env_1.ENV.JWT_REFRESH_SECRET, { expiresIn: env_1.ENV.JWT_REFRESH_EXPIRATION });
    }
}
exports.AuthService = AuthService;
