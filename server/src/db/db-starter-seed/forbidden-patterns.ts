import { PrismaClient } from '@prisma/client';

// Forbidden patterns
export async function seedForbiddenPatterns(prisma: PrismaClient): Promise<void> {
  await prisma.forbiddenPattern.upsert({
    where: { id: 9 },
    update: {},
    create: {
      "id": 9,
      "organization_id": 1,
      "scope": "GLOBAL",
      "applies_to": "ALL_CONTRACT_TYPES",
      "forbidden_patterns": [
        {
          "id": "late-day",
          "hard": false,
          "name": "late_followed_day",
          "label": "Late → Day",
          "active": true,
          "reason": "Avoid back-to-back late then day shift",
          "weight": 14,
          "enabled": true,
          "pattern": [
            "L",
            "D"
          ],
          "description": "Avoid back-to-back late then day shift"
        },
        {
          "id": "day-early-day",
          "hard": false,
          "name": "day_followed_early_followed_day",
          "label": "Day → Early → Day",
          "active": true,
          "reason": "Avoid irregular day-early-day sequence",
          "weight": 12,
          "enabled": true,
          "pattern": [
            "D",
            "E",
            "D"
          ],
          "description": "Avoid irregular day-early-day sequence"
        },
        {
          "id": "fri-off-weekend",
          "hard": false,
          "name": "friday_off_before_weekend",
          "label": "Friday Off Before Weekend",
          "active": true,
          "reason": "Prefer no shift on Friday before weekend work",
          "weight": 10,
          "enabled": true,
          "description": "Prefer no shift on Friday before weekend work"
        },
        {
          "id": "late-early",
          "hard": false,
          "name": "late_followed_early",
          "label": "Late → Early",
          "active": true,
          "reason": "Avoid short turnaround between late and early shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "E"
          ],
          "description": "Avoid short turnaround between late and early shift"
        },
        {
          "id": "late-night",
          "hard": false,
          "name": "late_followed_night",
          "label": "Late → Night",
          "active": true,
          "reason": "Avoid a night shift immediately after a late shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "N"
          ],
          "description": "Avoid a night shift immediately after a late shift"
        },
        {
          "id": "day-night",
          "hard": false,
          "name": "day_followed_night",
          "label": "Day → Night",
          "active": true,
          "reason": "Avoid switching from day to night shift",
          "weight": 22,
          "enabled": true,
          "pattern": [
            "D",
            "N"
          ],
          "description": "Avoid switching from day to night shift"
        },
        {
          "id": "night-day",
          "hard": false,
          "name": "night_followed_day",
          "label": "Night → Day",
          "active": true,
          "reason": "Avoid switching from night to day shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "D"
          ],
          "description": "Avoid switching from night to day shift"
        },
        {
          "id": "night-early",
          "hard": false,
          "name": "night_followed_early",
          "label": "Night → Early",
          "active": true,
          "reason": "Avoid switching from night to early shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "E"
          ],
          "description": "Avoid switching from night to early shift"
        }
      ],
      "metadata": {}
    },
  });

  await prisma.forbiddenPattern.upsert({
    where: { id: 10 },
    update: {},
    create: {
      "id": 10,
      "organization_id": 1,
      "scope": "GLOBAL",
      "applies_to": "ALL_CONTRACT_TYPES",
      "forbidden_patterns": [
        {
          "id": "late-day",
          "hard": false,
          "name": "late_followed_day",
          "label": "Late → Day",
          "active": true,
          "reason": "Avoid back-to-back late then day shift",
          "weight": 14,
          "enabled": true,
          "pattern": [
            "L",
            "D"
          ],
          "description": "Avoid back-to-back late then day shift"
        },
        {
          "id": "day-early-day",
          "hard": false,
          "name": "day_followed_early_followed_day",
          "label": "Day → Early → Day",
          "active": true,
          "reason": "Avoid irregular day-early-day sequence",
          "weight": 12,
          "enabled": true,
          "pattern": [
            "D",
            "E",
            "D"
          ],
          "description": "Avoid irregular day-early-day sequence"
        },
        {
          "id": "fri-off-weekend",
          "hard": false,
          "name": "friday_off_before_weekend",
          "label": "Friday Off Before Weekend",
          "active": true,
          "reason": "Prefer no shift on Friday before weekend work",
          "weight": 10,
          "enabled": true,
          "description": "Prefer no shift on Friday before weekend work"
        },
        {
          "id": "late-early",
          "hard": false,
          "name": "late_followed_early",
          "label": "Late → Early",
          "active": true,
          "reason": "Avoid short turnaround between late and early shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "E"
          ],
          "description": "Avoid short turnaround between late and early shift"
        },
        {
          "id": "late-night",
          "hard": false,
          "name": "late_followed_night",
          "label": "Late → Night",
          "active": true,
          "reason": "Avoid a night shift immediately after a late shift",
          "weight": 28,
          "enabled": true,
          "pattern": [
            "L",
            "N"
          ],
          "description": "Avoid a night shift immediately after a late shift"
        },
        {
          "id": "day-night",
          "hard": false,
          "name": "day_followed_night",
          "label": "Day → Night",
          "active": true,
          "reason": "Avoid switching from day to night shift",
          "weight": 22,
          "enabled": true,
          "pattern": [
            "D",
            "N"
          ],
          "description": "Avoid switching from day to night shift"
        },
        {
          "id": "night-day",
          "hard": false,
          "name": "night_followed_day",
          "label": "Night → Day",
          "active": true,
          "reason": "Avoid switching from night to day shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "D"
          ],
          "description": "Avoid switching from night to day shift"
        },
        {
          "id": "night-early",
          "hard": false,
          "name": "night_followed_early",
          "label": "Night → Early",
          "active": true,
          "reason": "Avoid switching from night to early shift",
          "weight": 35,
          "enabled": true,
          "pattern": [
            "N",
            "E"
          ],
          "description": "Avoid switching from night to early shift"
        }
      ],
      "metadata": {}
    },
  });
}
