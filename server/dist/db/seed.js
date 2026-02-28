"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Seed roles
    await prisma.role.createMany({
        data: [
            { name: 'SUPER_ADMIN' },
            { name: 'ADMIN' },
            { name: 'USER' }
        ],
        skipDuplicates: true
    });
    // Seed sample users
    const password = await bcrypt_1.default.hash('password123', 10);
    await prisma.user.createMany({
        data: [
            { email: 'superadmin@example.com', password, roleId: 1 },
            { email: 'admin@example.com', password, roleId: 2 },
            { email: 'user@example.com', password, roleId: 3 }
        ],
        skipDuplicates: true
    });
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
