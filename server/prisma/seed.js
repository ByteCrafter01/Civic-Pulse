const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding CivicPulse database...');

    // ── Departments ──────────────────────────────────────────────────────────
    const departments = await Promise.all([
        prisma.department.upsert({
            where: { name: 'Public Works' },
            update: {},
            create: { name: 'Public Works', description: 'Roads, bridges, and public infrastructure' },
        }),
        prisma.department.upsert({
            where: { name: 'Water & Sanitation' },
            update: {},
            create: { name: 'Water & Sanitation', description: 'Water supply and sewage management' },
        }),
        prisma.department.upsert({
            where: { name: 'Electricity' },
            update: {},
            create: { name: 'Electricity', description: 'Power supply and street lighting' },
        }),
        prisma.department.upsert({
            where: { name: 'Health & Environment' },
            update: {},
            create: { name: 'Health & Environment', description: 'Public health and environmental issues' },
        }),
        prisma.department.upsert({
            where: { name: 'Parks & Recreation' },
            update: {},
            create: { name: 'Parks & Recreation', description: 'Public parks, playgrounds, and green spaces' },
        }),
    ]);

    console.log(`✅ Created ${departments.length} departments`);

    // ── SLA Configs ───────────────────────────────────────────────────────────
    const slaCritical = await prisma.sLAConfig.upsert({
        where: { id: 'sla-critical' },
        update: {},
        create: { id: 'sla-critical', name: 'Critical SLA', resolutionHours: 24, warningHours: 18, escalationHours: 22 },
    });

    const slaHigh = await prisma.sLAConfig.upsert({
        where: { id: 'sla-high' },
        update: {},
        create: { id: 'sla-high', name: 'High Priority SLA', resolutionHours: 48, warningHours: 36, escalationHours: 44 },
    });

    const slaNormal = await prisma.sLAConfig.upsert({
        where: { id: 'sla-normal' },
        update: {},
        create: { id: 'sla-normal', name: 'Normal SLA', resolutionHours: 120, warningHours: 96, escalationHours: 112 },
    });

    console.log('✅ Created SLA configs');

    // ── Categories ───────────────────────────────────────────────────────────
    const [pw, ws, el, he, pr] = departments;

    const categories = await Promise.all([
        // Public Works
        prisma.category.upsert({ where: { name: 'Pothole' }, update: {}, create: { name: 'Pothole', description: 'Potholes and road damage', weight: 1.4, departmentId: pw.id, slaConfigId: slaHigh.id } }),
        prisma.category.upsert({ where: { name: 'Road Damage' }, update: {}, create: { name: 'Road Damage', description: 'Cracked or broken roads', weight: 1.3, departmentId: pw.id, slaConfigId: slaNormal.id } }),
        prisma.category.upsert({ where: { name: 'Footpath Obstruction' }, update: {}, create: { name: 'Footpath Obstruction', description: 'Blocked footpaths or pavements', weight: 1.1, departmentId: pw.id, slaConfigId: slaNormal.id } }),
        // Water & Sanitation
        prisma.category.upsert({ where: { name: 'Water Leakage' }, update: {}, create: { name: 'Water Leakage', description: 'Burst pipes or water leaks', weight: 1.6, departmentId: ws.id, slaConfigId: slaCritical.id } }),
        prisma.category.upsert({ where: { name: 'Sewage Overflow' }, update: {}, create: { name: 'Sewage Overflow', description: 'Overflowing sewers', weight: 1.8, departmentId: ws.id, slaConfigId: slaCritical.id } }),
        prisma.category.upsert({ where: { name: 'Garbage Disposal' }, update: {}, create: { name: 'Garbage Disposal', description: 'Uncollected garbage or littering', weight: 1.2, departmentId: ws.id, slaConfigId: slaHigh.id } }),
        // Electricity
        prisma.category.upsert({ where: { name: 'Street Light Outage' }, update: {}, create: { name: 'Street Light Outage', description: 'Non-functional street lights', weight: 1.3, departmentId: el.id, slaConfigId: slaHigh.id } }),
        prisma.category.upsert({ where: { name: 'Power Outage' }, update: {}, create: { name: 'Power Outage', description: 'Power cuts in the area', weight: 1.7, departmentId: el.id, slaConfigId: slaCritical.id } }),
        // Health & Environment
        prisma.category.upsert({ where: { name: 'Mosquito Breeding' }, update: {}, create: { name: 'Mosquito Breeding', description: 'Stagnant water and mosquito breeding', weight: 1.4, departmentId: he.id, slaConfigId: slaHigh.id } }),
        prisma.category.upsert({ where: { name: 'Air Pollution' }, update: {}, create: { name: 'Air Pollution', description: 'Industrial or vehicular pollution', weight: 1.5, departmentId: he.id, slaConfigId: slaNormal.id } }),
        // Parks & Recreation
        prisma.category.upsert({ where: { name: 'Park Maintenance' }, update: {}, create: { name: 'Park Maintenance', description: 'Damaged park equipment or overgrown areas', weight: 0.9, departmentId: pr.id, slaConfigId: slaNormal.id } }),
        prisma.category.upsert({ where: { name: 'Playground Safety' }, update: {}, create: { name: 'Playground Safety', description: 'Unsafe playground equipment', weight: 1.5, departmentId: pr.id, slaConfigId: slaHigh.id } }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // ── Users ─────────────────────────────────────────────────────────────────
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const officerPass = await bcrypt.hash('Officer@123', 12);
    const citizenPass = await bcrypt.hash('Citizen@123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@civicpulse.com' },
        update: {},
        create: { name: 'System Admin', email: 'admin@civicpulse.com', password: adminPass, role: 'ADMIN' },
    });

    const officer = await prisma.user.upsert({
        where: { email: 'officer@civicpulse.com' },
        update: {},
        create: { name: 'Field Officer', email: 'officer@civicpulse.com', password: officerPass, role: 'OFFICER', departmentId: pw.id },
    });

    const citizen = await prisma.user.upsert({
        where: { email: 'citizen@civicpulse.com' },
        update: {},
        create: { name: 'Test Citizen', email: 'citizen@civicpulse.com', password: citizenPass, role: 'CITIZEN' },
    });

    console.log('✅ Created test users (admin, officer, citizen)');

    // ── Sample Complaints ─────────────────────────────────────────────────────
    const pothole = categories.find(c => c.name === 'Pothole');
    const waterLeakage = categories.find(c => c.name === 'Water Leakage');

    await prisma.complaint.createMany({
        skipDuplicates: true,
        data: [
            {
                id: 'sample-complaint-1',
                title: 'Large pothole on Main Street',
                description: 'There is a massive pothole on Main Street near the market. It is causing vehicle damage and is a safety hazard.',
                latitude: 19.0760,
                longitude: 72.8777,
                status: 'ASSIGNED',
                priorityScore: 78.4,
                priorityLevel: 'HIGH',
                sentimentLabel: 'NEGATIVE',
                sentimentScore: -0.82,
                urgencyKeywords: ['damage', 'safety hazard'],
                categoryId: pothole.id,
                citizenId: citizen.id,
                officerId: officer.id,
                slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
                slaWarningAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
            },
            {
                id: 'sample-complaint-2',
                title: 'Water pipe burst near school',
                description: 'A water pipe has burst near the primary school on Park Avenue. Water is flooding the road.',
                latitude: 19.0820,
                longitude: 72.8810,
                status: 'IN_PROGRESS',
                priorityScore: 92.1,
                priorityLevel: 'CRITICAL',
                sentimentLabel: 'NEGATIVE',
                sentimentScore: -0.95,
                urgencyKeywords: ['burst', 'flooding', 'school'],
                categoryId: waterLeakage.id,
                citizenId: citizen.id,
                officerId: officer.id,
                slaDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000),
                slaWarningAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
        ],
    });

    console.log('✅ Created sample complaints');
    console.log('\n🎉 Seeding complete!');
    console.log('\nTest credentials:');
    console.log('  Admin:   admin@civicpulse.com / Admin@123');
    console.log('  Officer: officer@civicpulse.com / Officer@123');
    console.log('  Citizen: citizen@civicpulse.com / Citizen@123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
