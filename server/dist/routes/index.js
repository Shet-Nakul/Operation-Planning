"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const organizations_1 = __importDefault(require("./organizations"));
const users_1 = __importDefault(require("./users"));
const roles_1 = __importDefault(require("./roles"));
const activityLogs_1 = __importDefault(require("./activityLogs"));
const catalogs_1 = __importDefault(require("./catalogs"));
const globalSettings_1 = __importDefault(require("./globalSettings"));
const forbiddenPatterns_1 = __importDefault(require("./forbiddenPatterns"));
const contracts_1 = __importDefault(require("./contracts"));
const staff_1 = __importDefault(require("./staff"));
const router = (0, express_1.Router)();
router.use('/auth', auth_1.default);
router.use('/api/organizations', organizations_1.default);
router.use('/api/users', users_1.default);
router.use('/api/roles', roles_1.default);
router.use('/api/activity-logs', activityLogs_1.default);
router.use('/api/staff', staff_1.default);
// New catalog and configuration routes from req.md
router.use('/api/catalogs', catalogs_1.default);
router.use('/api/catalogs', globalSettings_1.default);
router.use('/api/catalogs', forbiddenPatterns_1.default);
router.use('/api/contracts', contracts_1.default);
exports.default = router;
