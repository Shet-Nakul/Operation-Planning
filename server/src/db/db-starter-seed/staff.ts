import { PrismaClient } from '@prisma/client';

// Staff
export async function seedStaff(prisma: PrismaClient): Promise<void> {
  await prisma.staff.upsert({
    where: { staff_id: "STAFF-NA-0001" },
    update: {},
    create: {
      "id": 1,
      "organization_id": 1,
      "staff_id": "STAFF-NA-0001",
      "name": "Nurse Ava Chen",
      "address": null,
      "phone": null,
      "email": "ava.chen@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Charge Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "OR Nurse"
      ],
      "certifications": [],
      "roles": [
        "OR Nurse"
      ],
      "role_distribution": {
        "OR Nurse": 1
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "OR-NUR-0001",
          "pool_name": "OR Nursing Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-NB-0002" },
    update: {},
    create: {
      "id": 2,
      "organization_id": 1,
      "staff_id": "STAFF-NB-0002",
      "name": "Nurse Ben Ortiz",
      "address": null,
      "phone": null,
      "email": "ben.ortiz@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Charge Nurse",
      "contract_id": "DYN-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "OR Nurse"
      ],
      "certifications": [],
      "roles": [
        "OR Nurse"
      ],
      "role_distribution": {
        "OR Nurse": 1
      },
      "weekly_template": {},
      "pool_assignments": [
        {
          "pool_id": "OR-NUR-0001",
          "pool_name": "OR Nursing Pool"
        }
      ]
    },
  });

  await prisma.staff.upsert({
    where: { staff_id: "STAFF-DS-0003" },
    update: {},
    create: {
      "id": 3,
      "organization_id": 1,
      "staff_id": "STAFF-DS-0003",
      "name": "Dr. Sam Rivera",
      "address": null,
      "phone": null,
      "email": "sam.rivera@hospital.test",
      "profile_picture": null,
      "department_id": 1,
      "department": "Surgery",
      "designation": "Chief Surgeon",
      "contract_id": "STA-0001",
      "supervisor": "Hospital Admin",
      "skills": [
        "Surgeon"
      ],
      "certifications": [],
      "roles": [
        "Surgeon"
      ],
      "role_distribution": {
        "Surgeon": 1
      },
      "weekly_template": {
        "friday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "monday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "tuesday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "thursday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ],
        "wednesday": [
          {
            "end": "12:00",
            "role": "Surgeon",
            "start": "08:00"
          }
        ]
      },
      "pool_assignments": []
    },
  });

  await prisma.$transaction([

    // STAFF-0001
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0001" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0001",
        name: "Sarah Johnson",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "sarah.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHA-NUR-0005",
          },
        ],
      },
    }),

    // STAFF-0002
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0002" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0002",
        name: "John Doe",
        address: "5678 Oak Street, Vancouver, BC V6B 3L4",
        phone: "+1-604-555-0199",
        email: "john.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0003
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0003" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0003",
        name: "Taylor Smith",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "taylor.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0004
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0004" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0004",
        name: "Jordan Lee",
        address: "1250 Oak Street, Vancouver, BC V6B 3K4",
        phone: "+1-604-555-0130",
        email: "jordan.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0005
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0005" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0005",
        name: "Alex Kim",
        address: "1260 Pine Street, Vancouver, BC V6B 4L5",
        phone: "+1-604-555-0131",
        email: "alex.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.75,
          "Charge Nurse": 0.25,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0006
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0006" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0006",
        name: "Chris Lee",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "chris.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.5,
          "Charge Nurse": 0.5,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0007
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0007" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0007",
        name: "Morgan Brown",
        address: "5678 Oak Street, Vancouver, BC V6B 3L4",
        phone: "+1-604-555-0199",
        email: "morgan.dynamic@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.5,
          "Charge Nurse": 0.5,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0008
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0008" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0008",
        name: "Kim Taylor",
        address: "1247 Maple Avenue, Vancouver, BC V6B 2K3",
        phone: "+1-604-555-0128",
        email: "kim.taylor@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0009
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0009" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0009",
        name: "Leonard White",
        address: "1250 Oak Street, Vancouver, BC V6B 3K4",
        phone: "+1-604-555-0130",
        email: "leonard.white@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),

    // STAFF-0010
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0010" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0010",
        name: "Samantha Green",
        address: "1260 Pine Street, Vancouver, BC V6B 4L5",
        phone: "+1-604-555-0131",
        email: "samantha.green@hospital.ca",
        profile_picture: "https://example.com/profiles/sarah_johnson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Senior Staff Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Emily Thompson",
        skills: [
          "ACLS",
          "Critical Care Nursing",
          "Ventilator Management",
          "Patient Assessment",
        ],
        certifications: [
          "Registered Nurse (RN) - BC",
          "ACLS Certified",
          "CCRN",
        ],
        roles: ["Senior Staff Nurse", "Charge Nurse"],
        role_distribution: {
          "Senior Staff Nurse": 0.25,
          "Charge Nurse": 0.75,
        },
        weekly_template: {},
        pool_assignments: [
          {
            pool_name: "Senior Staff Nurse Pool",
            pool_id: "SEN-NUR-0001",
          },
          {
            pool_name: "Charge Nurse Pool",
            pool_id: "CHR-NUR-0001",
          },
        ],
      },
    }),
    // STAFF-0100
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0100" },
      update: {},
      create: {
        organization_id: 1,
        staff_id: "STAFF-0100",
        name: "Dr. Michael Anderson",
        address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
        phone: "+1-604-555-0184",
        email: "michael.anderson@hospital.ca",
        profile_picture: "https://example.com/profiles/michael_anderson.jpg",

        department_id: 3,
        department: "Critical Care",
        designation: "Consultant Anesthesiologist",

        contract_id: "DYN-0001",
        supervisor: "Dr. Robert Williams",

        skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
        ],

        certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
        ],

        roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
        ],

        role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
        },

        weekly_template: {},

        pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
        ],
      },
    }),
    // STAFF-0101
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0101" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0101",
      name: "Dr. Lisa Chen",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "lisa.chen@hospital.ca",
      profile_picture: "https://example.com/profiles/lisa_chen.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0102
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0102" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0102",
      name: "Dr. Michael Brown",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "michael.brown@hospital.ca",
      profile_picture: "https://example.com/profiles/michael_brown.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0103
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0103" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0103",
      name: "Dr. Emily Davis",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "emily.davis@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_davis.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0104
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0104" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0104",
      name: "Dr. John Smith",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0105
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0105" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0105",
      name: "Dr. Sophia Patel",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "sophia.patel@hospital.ca",
      profile_picture: "https://example.com/profiles/sophia_patel.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0106
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0106" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0106",
      name: "Dr. Sophia Patel",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "sophia.patel@hospital.ca",
      profile_picture: "https://example.com/profiles/sophia_patel.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0107
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0107" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0107",
      name: "Dr. James Wilson",
      address: "825 West 12th Avenue, Vancouver, BC V5Z 1M9",
      phone: "+1-604-555-0184",
      email: "james.wilson@hospital.ca",
      profile_picture: "https://example.com/profiles/james_wilson.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0108
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0108" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0108",
      name: "Dr. Emily Clark",
      address: "123 East 8th Street, Vancouver, BC V5K 2L3",
      phone: "+1-604-555-0199",
      email: "emily.clark@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_clark.jpg",

      department_id: 3,
      department: "Critical Care",
      designation: "Consultant Anesthesiologist",

      contract_id: "DYN-0001",
      supervisor: "Dr. Robert Williams",

      skills: [
          "General Anesthesia",
          "Regional Anesthesia",
          "Airway Management",
          "Critical Care",
          "Pain Management",
          "Preoperative Assessment",
          "Intraoperative Monitoring",
          "Emergency Anesthesia",
      ],

      certifications: [
          "Medical License - BC",
          "Royal College Certified - Anesthesiology",
          "Advanced Cardiac Life Support (ACLS)",
          "Advanced Trauma Life Support (ATLS)",
      ],

      roles: [
          "Senior Anesthesiologist",
          "Anesthesiologist",
      ],

      role_distribution: {
          "Senior Anesthesiologist": 0.8,
          "Anesthesiologist": 0.2,
      },

      weekly_template: {},

      pool_assignments: [
          {
          pool_name: "Senior Anesthesiologist Pool",
          pool_id: "ANES-POOL-0001",
          },
          {
          pool_name: "Anesthesiologist Pool",
          pool_id: "ANES-POOL-0002",
          },
      ],
      },
    }),
    // STAFF-0200
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0200" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0200",
      name: "Maria Rodriguez",
      address: "1450 Oak Street, Vancouver, BC V6H 2N2",
      phone: "+1-604-555-0142",
      email: "maria.rodriguez@hospital.ca",
      profile_picture: "https://example.com/profiles/maria_rodriguez.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
    },
    }),
    // STAFF-0201
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0201" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0201",
      name: "James Wilson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "james.wilson@hospital.ca",
      profile_picture: "https://example.com/profiles/james_wilson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0202
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0202" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0202",
      name: "Linda Thompson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "linda.thompson@hospital.ca",
      profile_picture: "https://example.com/profiles/linda_thompson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0203
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0203" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0203",
      name: "Robert Martinez",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
        "Hospital Cleaning",
        "Infection Control",
        "Waste Management",
        "Disinfection",
      ],
      certifications: [
        "WHMIS Certified",
        "Infection Prevention and Control",
      ],
      roles: [
        "Environmental Services Worker",
      ],
      role_distribution: {
        "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0204
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0204" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0204",
      name: "Angela Davis",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "jane.doe@hospital.ca",
      profile_picture: "https://example.com/profiles/jane_doe.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0205
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0205" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0205",
      name: "Michael Brown",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0206
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0206" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0206",
      name: "Jennifer Garcia",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0207
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0207" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0207",
      name: "David Anderson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0208
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0208" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0208",
      name: "Patricia Miller",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "john.smith@hospital.ca",
      profile_picture: "https://example.com/profiles/john_smith.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0209
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0209" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0209",
      name: "Daniel Taylor",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "daniel.taylor@hospital.ca",
      profile_picture: "https://example.com/profiles/daniel_taylor.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0210
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0210" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0210",
      name: "Susan Johnson",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "susan.johnson@hospital.ca",
      profile_picture: "https://example.com/profiles/susan_johnson.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),
    // STAFF-0212
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0212" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0212",
      name: "Carlos Hernandez",
      address: "1234 Elm Street, Vancouver, BC V6H 1A1",
      phone: "+1-604-555-0123",
      email: "carlos.hernandez@hospital.ca",
      profile_picture: "https://example.com/profiles/carlos_hernandez.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Environmental Services Worker",
      contract_id: "ENV-CON-0001",
      supervisor: "Jennifer Brown",
      skills: [
          "Hospital Cleaning",
          "Infection Control",
          "Waste Management",
          "Disinfection",
      ],
      certifications: [
          "WHMIS Certified",
          "Infection Prevention and Control",
      ],
      roles: [
          "Environmental Services Worker",
      ],
      role_distribution: {
          "Environmental Services Worker": 1.0,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "Environmental Services Pool",
          pool_id: "ENV-POOL-0001",
          },
      ],
      },
    }),

    // STAFF-0300
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0300" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0300",
      name: "Jessica Williams",
      address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
      phone: "+1-604-555-0163",
      email: "jessica.williams@hospital.ca",
      profile_picture: "https://example.com/profiles/jessica_williams.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Operating Room Nurse",
      contract_id: "DYN-0001",
      supervisor: "Dr. Michael Anderson",
      skills: [
          "Operating Room Nursing",
          "Surgical Assistance",
          "Sterile Technique",
          "Patient Monitoring",
          "Preoperative Preparation",
          "Postoperative Care",
          "Instrument Handling",
      ],
      certifications: [
          "Registered Nurse (RN) - BC",
          "Basic Life Support (BLS)",
          "Advanced Cardiac Life Support (ACLS)",
          "Perioperative Nursing Certification",
      ],
      roles: [
          "Operating Room Nurse",
          "Scrub Nurse",
      ],
      role_distribution: {
          "Operating Room Nurse": 0.7,
          "Scrub Nurse": 0.3,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "OR Nurse Pool",
          pool_id: "OR-NUR-0001",
          },
          {
          pool_name: "Scrub Nurse Pool",
          pool_id: "SCRUB-NUR-0001",
          },
      ],
      },
    }),
    // STAFF-0301
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0301" },
      update: {},
      create: {
      organization_id: 1,
      staff_id: "STAFF-0301",
      name: "Emily Carter",
      address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
      phone: "+1-604-555-0163",
      email: "emily.carter@hospital.ca",
      profile_picture: "https://example.com/profiles/emily_carter.jpg",
      department_id: 3,
      department: "Critical Care",
      designation: "Operating Room Nurse",
      contract_id: "DYN-0001",
      supervisor: "Dr. Michael Anderson",
      skills: [
          "Operating Room Nursing",
          "Surgical Assistance",
          "Sterile Technique",
          "Patient Monitoring",
          "Preoperative Preparation",
          "Postoperative Care",
          "Instrument Handling",
      ],
      certifications: [
          "Registered Nurse (RN) - BC",
          "Basic Life Support (BLS)",
          "Advanced Cardiac Life Support (ACLS)",
          "Perioperative Nursing Certification",
      ],
      roles: [
          "Operating Room Nurse",
          "Scrub Nurse",
      ],
      role_distribution: {
          "Operating Room Nurse": 0.7,
          "Scrub Nurse": 0.3,
      },
      weekly_template: {},
      pool_assignments: [
          {
          pool_name: "OR Nurse Pool",
          pool_id: "OR-NUR-0001",
          },
          {
          pool_name: "Scrub Nurse Pool",
          pool_id: "SCRUB-NUR-0001",
          },
      ],
      },
    }),

    // STAFF-0302
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0302" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0302",
        name: "Olivia Bennett",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "olivia.bennett@hospital.ca",
        profile_picture: "https://example.com/profiles/olivia_bennett.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0303
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0303" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0303",
        name: "Sophia Mitchell",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "sophia.mitchell@hospital.ca",
        profile_picture: "https://example.com/profiles/sophia_mitchell.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0304
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0304" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0304",
        name: "Hannah Anderson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "hannah.anderson@hospital.ca",
        profile_picture: "https://example.com/profiles/hannah_anderson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0305
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0305" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0305",
        name: "Rachel Thompson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "rachel.thompson@hospital.ca",
        profile_picture: "https://example.com/profiles/rachel_thompson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0306
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0306" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0306",
        name: "Lauren Parker",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "lauren.parker@hospital.ca",
        profile_picture: "https://example.com/profiles/lauren_parker.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0307
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0307" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0307",
        name: "Rachel Thompson",
        address: "782 West 10th Avenue, Vancouver, BC V5Z 1L7",
        phone: "+1-604-555-0163",
        email: "rachel.thompson@hospital.ca",
        profile_picture: "https://example.com/profiles/rachel_thompson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0308
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0308" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0308",
        name: "Lauren Parker",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "lauren.parker@hospital.ca",
        profile_picture: "https://example.com/profiles/lauren_parker.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0309
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0309" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0309",
        name: "Amanda Collins",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "amanda.collins@hospital.ca",
        profile_picture: "https://example.com/profiles/amanda_collins.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0310
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0310" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0310",
        name: "Megan Roberts",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "megan.roberts@hospital.ca",
        profile_picture: "https://example.com/profiles/megan_roberts.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0311
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0311" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0311",
        name: "Natalie Wilson",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "natalie.wilson@hospital.ca",
        profile_picture: "https://example.com/profiles/natalie_wilson.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    }),

    // STAFF-0312
    prisma.staff.upsert({
      where: { staff_id: "STAFF-0312" },
        update: {},
        create: {
        organization_id: 1,
        staff_id: "STAFF-0312",
        name: "Ashley Martinez",
        address: "123 East 5th Street, Vancouver, BC V5Z 2K8",
        phone: "+1-604-555-0199",
        email: "ashley.martinez@hospital.ca",
        profile_picture: "https://example.com/profiles/ashley_martinez.jpg",
        department_id: 3,
        department: "Critical Care",
        designation: "Operating Room Nurse",
        contract_id: "DYN-0001",
        supervisor: "Dr. Michael Anderson",
        skills: [
            "Operating Room Nursing",
            "Surgical Assistance",
            "Sterile Technique",
            "Patient Monitoring",
            "Preoperative Preparation",
            "Postoperative Care",
            "Instrument Handling",
        ],
        certifications: [
            "Registered Nurse (RN) - BC",
            "Basic Life Support (BLS)",
            "Advanced Cardiac Life Support (ACLS)",
            "Perioperative Nursing Certification",
        ],
        roles: [
            "Operating Room Nurse",
            "Scrub Nurse",
        ],
        role_distribution: {
            "Operating Room Nurse": 0.7,
            "Scrub Nurse": 0.3,
        },
        weekly_template: {},
        pool_assignments: [
            {
            pool_name: "OR Nurse Pool",
            pool_id: "OR-NUR-0001",
            },
            {
            pool_name: "Scrub Nurse Pool",
            pool_id: "SCRUB-NUR-0001",
            },
        ],
        },
    })
  ]);
}
