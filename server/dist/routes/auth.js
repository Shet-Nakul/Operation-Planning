"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/api/auth/login', authController_1.login);
router.post('/api/auth/register', authController_1.register);
router.post('/api/auth/logout', authController_1.logout);
exports.default = router;
