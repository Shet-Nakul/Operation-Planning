"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfectionTypesController = void 0;
const infectionTypesService_1 = require("../services/infectionTypesService");
class InfectionTypesController {
    static async list(req, res, next) {
        try {
            const result = await infectionTypesService_1.InfectionTypesService.list();
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const result = await infectionTypesService_1.InfectionTypesService.getById(id);
            if (!result)
                return res.status(404).json({ error: 'Not found' });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async create(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await infectionTypesService_1.InfectionTypesService.create(req.body, userId);
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const userId = req.user.id;
            const result = await infectionTypesService_1.InfectionTypesService.update(id, req.body, userId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async delete(req, res, next) {
        try {
            const id = Number(req.params.id);
            const userId = req.user.id;
            const result = await infectionTypesService_1.InfectionTypesService.delete(id, userId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InfectionTypesController = InfectionTypesController;
