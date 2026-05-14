"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./config/logger"));
const env_1 = require("./config/env");
const BINDING_ADDRESS = process.env.BINDING_ADDRESS || '0.0.0.0';
const PORT = env_1.ENV.PORT;
app_1.default.listen(PORT, BINDING_ADDRESS, () => {
    logger_1.default.info(`Server running on http://${BINDING_ADDRESS}:${PORT}`);
    logger_1.default.info(`Swagger docs available at http://${BINDING_ADDRESS}:${PORT}/api-docs`);
});
