"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = __importDefault(require("../config/logger"));
function errorHandler(err, req, res, next) {
    // Extend Request type to allow user property
    const user = req.user || null;
    logger_1.default.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user
    });
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
}
