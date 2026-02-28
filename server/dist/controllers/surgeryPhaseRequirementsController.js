"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgeryPhaseRequirementsController = void 0;
const surgeryPhaseRequirementsService_1 = require("../services/surgeryPhaseRequirementsService");
class SurgeryPhaseRequirementsController {
    static async list(req, res, next) {
        try {
            const result = await surgeryPhaseRequirementsService_1.SurgeryPhaseRequirementsService.list();
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const result = await surgeryPhaseRequirementsService_1.SurgeryPhaseRequirementsService.getById(id);
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
            const result = await surgeryPhaseRequirementsService_1.SurgeryPhaseRequirementsService.create(req.body, userId);
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
            const result = await surgeryPhaseRequirementsService_1.SurgeryPhaseRequirementsService.update(id, req.body, userId);
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
            const result = await surgeryPhaseRequirementsService_1.SurgeryPhaseRequirementsService.delete(id, userId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SurgeryPhaseRequirementsController = SurgeryPhaseRequirementsController;
