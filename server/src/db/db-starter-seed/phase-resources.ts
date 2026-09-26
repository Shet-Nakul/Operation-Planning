import { PrismaClient } from '@prisma/client';

// Phase resources
export async function seedPhaseResources(prisma: PrismaClient): Promise<void> {
  await prisma.phaseResource.upsert({
    where: { id: 1 },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "type": "preOp",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 2 },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "type": "preOp",
      "name": "Vitals Nurse",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 3 },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "type": "preOp",
      "name": "Pre-Op Technician",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 4 },
    update: {},
    create: {
      "id": 4,
      "organization_id": 1,
      "type": "preOp",
      "name": "IV Pump",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 5 },
    update: {},
    create: {
      "id": 5,
      "organization_id": 1,
      "type": "operative",
      "name": "Operating Room",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 6 },
    update: {},
    create: {
      "id": 6,
      "organization_id": 1,
      "type": "operative",
      "name": "Lead Surgeon",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 7 },
    update: {},
    create: {
      "id": 7,
      "organization_id": 1,
      "type": "operative",
      "name": "Surgeon",
      "default_count": 1,
      "roles": [
        "Surgeon"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 8 },
    update: {},
    create: {
      "id": 8,
      "organization_id": 1,
      "type": "operative",
      "name": "OR Nurse",
      "default_count": 1,
      "roles": [
        "OR Nurse"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 9 },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "type": "operative",
      "name": "Circulating Nurse",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 10 },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "type": "operative",
      "name": "Anesthesia Technician",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 11 },
    update: {},
    create: {
      "id": 11,
      "organization_id": 1,
      "type": "operative",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 12 },
    update: {},
    create: {
      "id": 12,
      "organization_id": 1,
      "type": "operative",
      "name": "Surgical Kit",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 13 },
    update: {},
    create: {
      "id": 13,
      "organization_id": 1,
      "type": "operative",
      "name": "Operating Room",
      "default_count": 1,
      "roles": [
        "Operation Room"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 14 },
    update: {},
    create: {
      "id": 14,
      "organization_id": 1,
      "type": "postOp",
      "name": "PACU Bed",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 15 },
    update: {},
    create: {
      "id": 15,
      "organization_id": 1,
      "type": "postOp",
      "name": "Anesthesiologist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 16 },
    update: {},
    create: {
      "id": 16,
      "organization_id": 1,
      "type": "postOp",
      "name": "Recovery Nurse",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 17 },
    update: {},
    create: {
      "id": 17,
      "organization_id": 1,
      "type": "postOp",
      "name": "Monitor Station",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 18 },
    update: {},
    create: {
      "id": 18,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Cleaning Crew",
      "default_count": 2,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 19 },
    update: {},
    create: {
      "id": 19,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Sterilization Tech",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 20 },
    update: {},
    create: {
      "id": 20,
      "organization_id": 1,
      "type": "sterilization",
      "name": "Sterilizer Machine",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 21 },
    update: {},
    create: {
      "id": 21,
      "organization_id": 1,
      "type": "recovery",
      "name": "ICU Bed",
      "default_count": 1,
      "roles": [
        "ICU Bed"
      ],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 22 },
    update: {},
    create: {
      "id": 22,
      "organization_id": 1,
      "type": "recovery",
      "name": "ICU Nurse",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 23 },
    update: {},
    create: {
      "id": 23,
      "organization_id": 1,
      "type": "recovery",
      "name": "Respiratory Therapist",
      "default_count": 1,
      "roles": [],
      "status": "ACTIVE"
    },
  });

  await prisma.phaseResource.upsert({
    where: { id: 24 },
    update: {},
    create: {
      "id": 24,
      "organization_id": 1,
      "type": "recovery",
      "name": "Monitoring Equipment",
      "default_count": 1,
      "roles": [
        "Monitoring Equipment"
      ],
      "status": "ACTIVE"
    },
  });
}
