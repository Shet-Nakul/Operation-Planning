"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const globalSettingsController_1 = require("../controllers/globalSettingsController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/global_settings', auth_1.authenticateJWT, globalSettingsController_1.upsertGlobalSettings);
router.get('/global_settings/:orgId', auth_1.authenticateJWT, globalSettingsController_1.getGlobalSettings);
exports.default = router;
