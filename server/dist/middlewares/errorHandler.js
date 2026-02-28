"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = __importDefault(require("../config/logger"));
function errorHandler(err, req, res, next) {
    logger_1.default.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user || null
    });
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
}
