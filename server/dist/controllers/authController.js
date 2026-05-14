"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.refresh = refresh;
const authService_1 = require("../services/authService");
const authService = new authService_1.AuthService();
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
async function register(req, res) {
    try {
        // In a real app, you might want to restrict registration to ADMINs
        const user = await authService.register(req.body);
        res.status(201).json({ user });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }
        const result = await authService.refresh(refreshToken);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
