"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forbiddenPatternsController_1 = require("../controllers/forbiddenPatternsController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/pattern', auth_1.authenticateJWT, forbiddenPatternsController_1.createForbiddenPattern);
router.get('/pattern', auth_1.authenticateJWT, forbiddenPatternsController_1.getForbiddenPatterns);
exports.default = router;
