"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersController_1 = require("../controllers/usersController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticateJWT, (0, auth_1.authorizeRoles)('ADMIN'), usersController_1.createUser);
router.get('/', auth_1.authenticateJWT, usersController_1.getUsers);
exports.default = router;
