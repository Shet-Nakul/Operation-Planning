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
const usersRepository_1 = require("../repositories/usersRepository");
const usersRepo = new usersRepository_1.UsersRepository();
class AuthService {
    async login(email, password, ip, userAgent) {
        const user = await usersRepo.findByEmail(email);
        if (!user || !user.is_active)
            throw new Error('Invalid credentials');
        const valid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!valid)
            throw new Error('Invalid credentials');
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role_id, org: user.organization_id }, env_1.ENV.JWT_SECRET, { expiresIn: '1h' });
        // Audit log
        await prisma_1.default.user_activity_logs.create({
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
    async register(data, actor, ip, userAgent) {
        // Only SUPER_ADMIN or ADMIN can register
        if (!['SUPER_ADMIN', 'ADMIN'].includes(actor.role))
            throw new Error('Forbidden');
        const hashed = await bcrypt_1.default.hash(data.password, 10);
        const user = await prisma_1.default.users.create({
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
        await prisma_1.default.user_activity_logs.create({
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
    async logout(userId, orgId, ip, userAgent) {
        await prisma_1.default.user_activity_logs.create({
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
exports.AuthService = AuthService;
