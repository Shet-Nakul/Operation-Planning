import { PrismaClient } from '@prisma/client';

// Rostering snapshot
export async function seedRosteringSnapshot(prisma: PrismaClient): Promise<void> {
  await prisma.rostering.upsert({
    where: { organization_id_year_month: { organization_id: 1, year: 2026, month: 9 } },
    update: {},
    create: {
      "id": 7,
      "organization_id": 1,
      "year": 2026,
      "month": 9,
      "employee_centric": {
        "STAFF-0001": {
          "2026-09-01": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-02": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-19": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-23": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0002": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-04": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-07": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-11": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-17": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-18": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-22": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0003": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-14": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": null,
            "shift": "O"
          }
        },
        "STAFF-0004": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-25": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          }
        },
        "STAFF-0005": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-29": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          }
        },
        "STAFF-0006": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-17": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-23": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0007": {
          "2026-09-01": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-02": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-03": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-08": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-18": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-28": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          }
        },
        "STAFF-0008": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-04": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-14": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-15": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          }
        },
        "STAFF-0009": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-03": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-05": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-06": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-07": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-16": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-27": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-30": {
            "pool": null,
            "shift": "O"
          }
        },
        "STAFF-0010": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-03": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-08": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-09": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-10": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-11": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-12": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-13": {
            "pool": "CHR-NUR-0001",
            "shift": "N"
          },
          "2026-09-14": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-16": {
            "pool": "SEN-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-20": {
            "pool": "CHR-NUR-0001",
            "shift": "L"
          },
          "2026-09-21": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-22": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "CHR-NUR-0001",
            "shift": "D"
          },
          "2026-09-30": {
            "pool": "CHR-NUR-0001",
            "shift": "E"
          }
        },
        "STAFF-NA-0001": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-03": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-04": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-05": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-06": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-07": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-08": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-09": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-10": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-11": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-12": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-13": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-14": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-15": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-16": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-17": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-18": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-19": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-20": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-21": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-22": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-23": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-24": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-25": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-26": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-27": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-28": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-29": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-30": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          }
        },
        "STAFF-NB-0002": {
          "2026-09-01": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-02": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-03": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-04": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-05": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-06": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-07": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-08": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-09": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-10": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-11": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-12": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-13": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-14": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-15": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-16": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-17": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-18": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-19": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-20": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-21": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-22": {
            "pool": "OR-NUR-0001",
            "shift": "N"
          },
          "2026-09-23": {
            "pool": "OR-NUR-0001",
            "shift": "L"
          },
          "2026-09-24": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-25": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-26": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-27": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          },
          "2026-09-28": {
            "pool": null,
            "shift": "O"
          },
          "2026-09-29": {
            "pool": "OR-NUR-0001",
            "shift": "E"
          },
          "2026-09-30": {
            "pool": "OR-NUR-0001",
            "shift": "D"
          }
        }
      },
      "pool_centric": {
        "OR-NUR-0001": {
          "2026-09-02": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-05": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-06": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-07": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-08": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-12": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-13": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-14": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-15": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-21": {
            "E": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-22": {
            "E": [
              "STAFF-NA-0001"
            ],
            "N": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-26": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-27": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "2026-09-28": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-29": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          }
        },
        "CHR-NUR-0001": {
          "2026-09-01": {
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-02": {
            "D": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-05": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-06": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-07": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-08": {
            "D": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-0004",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0005"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-12": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-13": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "2026-09-14": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0005"
            ]
          },
          "2026-09-15": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0005"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-0008",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-0004",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "2026-09-21": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-22": {
            "D": [
              "STAFF-0005",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0004"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-0008",
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-26": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-27": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "2026-09-28": {
            "D": [
              "STAFF-0002",
              "STAFF-0003"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-29": {
            "D": [
              "STAFF-0003",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-0002",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0008"
            ]
          }
        },
        "SEN-NUR-0001": {
          "2026-09-01": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-02": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-03": {
            "D": [
              "STAFF-0001",
              "STAFF-0006",
              "STAFF-0010"
            ]
          },
          "2026-09-04": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-07": {
            "D": [
              "STAFF-0001",
              "STAFF-0002"
            ]
          },
          "2026-09-08": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          },
          "2026-09-09": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          },
          "2026-09-10": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          },
          "2026-09-11": {
            "D": [
              "STAFF-0002",
              "STAFF-0009"
            ]
          },
          "2026-09-14": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-15": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-16": {
            "D": [
              "STAFF-0001",
              "STAFF-0010"
            ]
          },
          "2026-09-17": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-18": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-19": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-20": {
            "D": [
              "STAFF-0001"
            ]
          },
          "2026-09-21": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-22": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ]
          },
          "2026-09-23": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-24": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-25": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          },
          "2026-09-28": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          },
          "2026-09-29": {
            "D": [
              "STAFF-0001",
              "STAFF-0002",
              "STAFF-0005"
            ]
          },
          "2026-09-30": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        }
      },
      "date_centric": {
        "2026-09-01": {
          "CHR-NUR-0001": {
            "N": [
              "STAFF-0007"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-02": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-03": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006",
              "STAFF-0010"
            ]
          }
        },
        "2026-09-04": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0003"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-05": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          }
        },
        "2026-09-06": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0002"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          }
        },
        "2026-09-07": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0005"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0002"
            ]
          }
        },
        "2026-09-08": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-09": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0003"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-10": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0005"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        },
        "2026-09-11": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0006",
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0009"
            ]
          }
        },
        "2026-09-12": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          }
        },
        "2026-09-13": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0008"
            ],
            "N": [
              "STAFF-0010"
            ]
          }
        },
        "2026-09-14": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0002",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0009",
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0005"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-15": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0006"
            ],
            "L": [
              "STAFF-0005"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-16": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0010"
            ]
          }
        },
        "2026-09-17": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "L": [
              "STAFF-0007"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-18": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0004",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0003",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-19": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-20": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002"
            ],
            "E": [
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0010"
            ],
            "N": [
              "STAFF-0006"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001"
            ]
          }
        },
        "2026-09-21": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002",
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-22": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ],
            "N": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0005",
              "STAFF-0008"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0006"
            ],
            "N": [
              "STAFF-0009"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0004"
            ]
          }
        },
        "2026-09-23": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ],
            "L": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0004",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0002"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-24": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0007",
              "STAFF-0008"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0004"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-25": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "L": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0008",
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0002"
            ],
            "N": [
              "STAFF-0007"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0003"
            ]
          }
        },
        "2026-09-26": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          }
        },
        "2026-09-27": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0009"
            ],
            "E": [
              "STAFF-0003"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0007"
            ]
          }
        },
        "2026-09-28": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0003"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-29": {
          "OR-NUR-0001": {
            "E": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0003",
              "STAFF-0010"
            ],
            "E": [
              "STAFF-0006",
              "STAFF-0007"
            ],
            "L": [
              "STAFF-0004",
              "STAFF-0009"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0002",
              "STAFF-0005"
            ]
          }
        },
        "2026-09-30": {
          "OR-NUR-0001": {
            "D": [
              "STAFF-NB-0002"
            ],
            "N": [
              "STAFF-NA-0001"
            ]
          },
          "CHR-NUR-0001": {
            "D": [
              "STAFF-0002",
              "STAFF-0007"
            ],
            "E": [
              "STAFF-0005",
              "STAFF-0010"
            ],
            "L": [
              "STAFF-0004"
            ],
            "N": [
              "STAFF-0008"
            ]
          },
          "SEN-NUR-0001": {
            "D": [
              "STAFF-0001",
              "STAFF-0006"
            ]
          }
        }
      },
      "stats": {
        "iterations": 100000,
        "best_penalty": 660038.4751308004,
        "improvements": 2161,
        "mode_switches": 94,
        "elapsed_seconds": 18.28263902664185
      }
    },
  });
}
