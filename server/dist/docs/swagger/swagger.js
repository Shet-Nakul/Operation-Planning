"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocs = void 0;
const auth_1 = require("./auth");
const organizations_1 = require("./organizations");
const users_1 = require("./users");
const roles_1 = require("./roles");
const activityLogs_1 = require("./activityLogs");
const catalogs_1 = require("./catalogs");
const globalSettings_1 = require("./globalSettings");
const forbiddenPatterns_1 = require("./forbiddenPatterns");
const contracts_1 = require("./contracts");
const staff_1 = require("./staff");
const pools_1 = require("./pools");
const renewableResources_1 = require("./renewableResources");
const nonRenewableResources_1 = require("./nonRenewableResources");
exports.swaggerDocs = {
    openapi: '3.0.0',
    info: {
        title: 'Hospital Management API',
        version: '1.0.0',
        description: 'API documentation for Organizations, Users, Catalogs, Contracts, Staff, Resource Pools, and Renewable Resources',
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local server' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        ...auth_1.authDocs,
        ...organizations_1.organizationsDocs,
        ...users_1.usersDocs,
        ...roles_1.rolesDocs,
        ...activityLogs_1.activityLogsDocs,
        ...catalogs_1.catalogsDocs,
        ...globalSettings_1.globalSettingsDocs,
        ...forbiddenPatterns_1.forbiddenPatternsDocs,
        ...contracts_1.contractsDocs,
        ...staff_1.staffDocs,
        ...pools_1.poolsDocs,
        ...renewableResources_1.renewableResourcesDocs,
        ...nonRenewableResources_1.nonRenewableResourcesDocs,
    },
};
