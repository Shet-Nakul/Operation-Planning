import { OpenAPIV3 } from 'openapi-types';
import { authDocs } from './auth';
import { organizationsDocs } from './organizations';
import { usersDocs } from './users';
import { rolesDocs } from './roles';
import { activityLogsDocs } from './activityLogs';
import { catalogsDocs } from './catalogs';
import { globalSettingsDocs } from './globalSettings';
import { forbiddenPatternsDocs } from './forbiddenPatterns';
import { contractsDocs } from './contracts';
import { staffDocs } from './staff';
import { poolsDocs } from './pools';
import { renewableResourcesDocs } from './renewableResources';
import { nonRenewableResourcesDocs } from './nonRenewableResources';
import { rosteringDocs } from './rostering';

export const swaggerDocs: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Hospital Management API',
    version: '1.0.0',
    description: 'API documentation for Organizations, Users, Catalogs, Contracts, Staff, Resource Pools, and Renewable Resources',
  },
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
    ...authDocs,
    ...organizationsDocs,
    ...usersDocs,
    ...rolesDocs,
    ...activityLogsDocs,
    ...catalogsDocs,
    ...globalSettingsDocs,
    ...forbiddenPatternsDocs,
    ...contractsDocs,
    ...staffDocs,
    ...poolsDocs,
    ...renewableResourcesDocs,
    ...nonRenewableResourcesDocs,
    ...rosteringDocs,
  } as any,
};
