"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.logout = logout;
const authService_1 = require("../services/authService");
const authService = new authService_1.AuthService();
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'] || '';
        const result = await authService.login(email, password, ip, userAgent);
        res.json({ accessToken: result.accessToken, user: result.user });
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
async function register(req, res) {
    try {
        const actor = req.user;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'] || '';
        const user = await authService.register(req.body, actor, ip, userAgent);
        res.status(201).json({ user });
    }
    catch (err) {
        res.status(403).json({ error: err.message });
    }
}
async function logout(req, res) {
    try {
        const userId = req.user.id;
        const orgId = req.user.organization_id;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'] || '';
        await authService.logout(userId, orgId, ip, userAgent);
        res.json({ message: 'Logged out' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
