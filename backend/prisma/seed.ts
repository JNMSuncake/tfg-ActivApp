import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos semilla (Seed)...');

  // Limpiar base de datos previa en orden para evitar violación de FK
  await prisma.internalMessage.deleteMany();
  await prisma.pushSubscriptionDevice.deleteMany();
  await prisma.syncConflictAudit.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.authorizationDocument.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.activityMonitorAssignment.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.tutorChildRelation.deleteMany();
  await prisma.child.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ========================================================
  // 1. TENANT 1: Club Esportiu Gràcia
  // ========================================================
  const tenantClub = await prisma.tenant.create({
    data: {
      name: 'Club Esportiu Gràcia',
      slug: 'ce-gracia',
      logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=200&h=200&fit=crop'
    }
  });

  // Roles base CE Gràcia
  const roleAdminClub = await prisma.role.create({
    data: {
      tenantId: tenantClub.id,
      name: 'ADMINISTRADOR',
      description: 'Gestor y directiva del club con acceso total',
      isSystemDefault: true,
      permissions: [
        'tenants:read', 'tenants:update',
        'roles:read', 'roles:manage',
        'users:read', 'users:invite', 'users:manage',
        'activities:create', 'activities:read', 'activities:update', 'activities:delete',
        'attendance:read', 'attendance:take', 'attendance:override',
        'medical:read_always',
        'enrollments:read', 'enrollments:manage',
        'payments:read', 'payments:validate',
        'authorizations:create', 'authorizations:sign', 'authorizations:verify', 'authorizations:download',
        'messages:broadcast', 'messages:direct', 'messages:read'
      ]
    }
  });

  const roleMonitorClub = await prisma.role.create({
    data: {
      tenantId: tenantClub.id,
      name: 'ENTRENADOR',
      description: 'Entrenador deportivo con gestión de asistencias y actividades asignadas',
      isSystemDefault: true,
      permissions: [
        'activities:read', 'activities:update',
        'attendance:read', 'attendance:take',
        'medical:read_contextual',
        'messages:broadcast', 'messages:read', 'messages:direct'
      ]
    }
  });

  const roleTutorClub = await prisma.role.create({
    data: {
      tenantId: tenantClub.id,
      name: 'TUTOR_LEGAL',
      description: 'Familia o tutor legal del deportista',
      isSystemDefault: true,
      permissions: [
        'activities:read',
        'enrollments:read', 'enrollments:manage',
        'authorizations:sign', 'authorizations:download',
        'messages:read', 'messages:direct'
      ]
    }
  });

  // Usuarios CE Gràcia
  const userAdminClub = await prisma.user.create({
    data: {
      tenantId: tenantClub.id,
      roleId: roleAdminClub.id,
      email: 'admin@cegracia.cat',
      fullName: 'Laia Puig (Coordinadora)',
      passwordHash,
      phone: '611000001'
    }
  });

  const userMonitorClub = await prisma.user.create({
    data: {
      tenantId: tenantClub.id,
      roleId: roleMonitorClub.id,
      email: 'entrenador@cegracia.cat',
      fullName: 'Pol Soler (Entrenador Cadet)',
      passwordHash,
      phone: '611000002'
    }
  });

  const userTutorClub = await prisma.user.create({
    data: {
      tenantId: tenantClub.id,
      roleId: roleTutorClub.id,
      email: 'familia.puig@gmail.com',
      fullName: 'Marta Puig (Tutora Legal)',
      passwordHash,
      phone: '611000003'
    }
  });

  // Menores CE Gràcia
  const childClub1 = await prisma.child.create({
    data: {
      tenantId: tenantClub.id,
      fullName: 'Pau Puig',
      birthDate: new Date('2012-05-14'),
      allergies: 'Alergia al polen y frutos secos',
      medicalNotesEncrypted: 'Lleva inhalador Ventolin en la mochila para esfuerzos intensos.',
      emergencyContact: 'Marta Puig (Madre) - 611000003'
    }
  });

  await prisma.tutorChildRelation.create({
    data: {
      tutorUserId: userTutorClub.id,
      childId: childClub1.id,
      relationshipType: 'MADRE'
    }
  });

  // Actividad Deportiva
  const activityClub = await prisma.activity.create({
    data: {
      tenantId: tenantClub.id,
      title: 'Entrenament i Torneig Cadet de Bàsquet',
      description: 'Sessió preparatòria per a la lliga escolar amb partit amistós final.',
      type: 'ENTRENAMIENTO',
      maxCapacity: 15,
      minAge: 12,
      maxAge: 15,
      requiresAuthorization: false,
      priceCents: 1500, // 15.00 €
      requiredMaterial: [
        { id: 'mat-1', name: 'Equipació oficial de joc', isMandatory: true },
        { id: 'mat-2', name: 'Ampolla daigua personal', isMandatory: true },
        { id: 'mat-3', name: 'Peces de recanvi i tovallola', isMandatory: false }
      ]
    }
  });

  const sessionClub = await prisma.activitySession.create({
    data: {
      tenantId: tenantClub.id,
      activityId: activityClub.id,
      startTime: new Date(Date.now() + 86400000), // Mañana
      endTime: new Date(Date.now() + 86400000 + 7200000),
      location: 'Pavelló Esportiu Municipal Josep Comellas (Gràcia)',
      sharedNotes: 'Portar les pilotes inflades de la gàbia 2.'
    }
  });

  await prisma.activityMonitorAssignment.create({
    data: {
      sessionId: sessionClub.id,
      monitorUserId: userMonitorClub.id
    }
  });

  const enrollmentClub = await prisma.enrollment.create({
    data: {
      tenantId: tenantClub.id,
      activityId: activityClub.id,
      childId: childClub1.id,
      status: 'CONFIRMED'
    }
  });

  await prisma.paymentTransaction.create({
    data: {
      tenantId: tenantClub.id,
      enrollmentId: enrollmentClub.id,
      amountCents: 1500,
      status: 'VALIDATED_MANUAL',
      method: 'MANUAL_TRANSFER',
      provider: 'MANUAL',
      validatedByUserId: userAdminClub.id
    }
  });

  // ========================================================
  // 2. TENANT 2: Esplai El Pi
  // ========================================================
  const tenantEsplai = await prisma.tenant.create({
    data: {
      name: 'Esplai El Pi de Sarrià',
      slug: 'esplai-el-pi',
      logoUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop'
    }
  });

  const roleAdminEsplai = await prisma.role.create({
    data: {
      tenantId: tenantEsplai.id,
      name: 'ADMINISTRADOR',
      description: 'Equip de coordinació de lesplai',
      isSystemDefault: true,
      permissions: [
        'tenants:read', 'tenants:update',
        'roles:read', 'roles:manage',
        'users:read', 'users:invite', 'users:manage',
        'activities:create', 'activities:read', 'activities:update', 'activities:delete',
        'attendance:read', 'attendance:take', 'attendance:override',
        'medical:read_always',
        'enrollments:read', 'enrollments:manage',
        'payments:read', 'payments:validate',
        'authorizations:create', 'authorizations:sign', 'authorizations:verify', 'authorizations:download',
        'messages:broadcast', 'messages:direct', 'messages:read'
      ]
    }
  });

  const roleMonitorEsplai = await prisma.role.create({
    data: {
      tenantId: tenantEsplai.id,
      name: 'MONITOR',
      description: 'Monitor titulat responsable de grup',
      isSystemDefault: true,
      permissions: [
        'activities:read', 'activities:update',
        'attendance:read', 'attendance:take',
        'medical:read_contextual',
        'authorizations:verify',
        'messages:broadcast', 'messages:read', 'messages:direct'
      ]
    }
  });

  // Rol DINÁMICO personalizado para demostrar RBAC dinámico en el TFG
  const rolePracticasEsplai = await prisma.role.create({
    data: {
      tenantId: tenantEsplai.id,
      name: 'MONITOR_PRACTICAS',
      description: 'Monitor en període de pràctiques (sense accés a fitxes mèdiques)',
      isSystemDefault: false,
      permissions: [
        'activities:read',
        'attendance:read', 'attendance:take',
        'messages:read'
      ]
    }
  });

  const roleTutorEsplai = await prisma.role.create({
    data: {
      tenantId: tenantEsplai.id,
      name: 'TUTOR_LEGAL',
      description: 'Pares, mares o tutors dels infants de lesplai',
      isSystemDefault: true,
      permissions: [
        'activities:read',
        'enrollments:read', 'enrollments:manage',
        'authorizations:sign', 'authorizations:download',
        'messages:read', 'messages:direct'
      ]
    }
  });

  const userAdminEsplai = await prisma.user.create({
    data: {
      tenantId: tenantEsplai.id,
      roleId: roleAdminEsplai.id,
      email: 'admin@esplaielpi.cat',
      fullName: 'Marc Rovira (Coordinador)',
      passwordHash,
      phone: '622000001'
    }
  });

  const userMonitorEsplai = await prisma.user.create({
    data: {
      tenantId: tenantEsplai.id,
      roleId: roleMonitorEsplai.id,
      email: 'monitor@esplaielpi.cat',
      fullName: 'Júlia Font (Monitora)',
      passwordHash,
      phone: '622000002'
    }
  });

  const userPracticasEsplai = await prisma.user.create({
    data: {
      tenantId: tenantEsplai.id,
      roleId: rolePracticasEsplai.id,
      email: 'practicas@esplaielpi.cat',
      fullName: 'Nil Bover (En Pràctiques)',
      passwordHash,
      phone: '622000003'
    }
  });

  const userTutorEsplai = await prisma.user.create({
    data: {
      tenantId: tenantEsplai.id,
      roleId: roleTutorEsplai.id,
      email: 'tutor@esplaielpi.cat',
      fullName: 'Joan Vila (Pare)',
      passwordHash,
      phone: '622000004'
    }
  });

  const childEsplai1 = await prisma.child.create({
    data: {
      tenantId: tenantEsplai.id,
      fullName: 'Biel Vila',
      birthDate: new Date('2014-09-20'),
      allergies: 'Intolerancia severa a la lactosa',
      medicalNotesEncrypted: 'Requiere dieta 100% libre de lácteos y derivados en comidas de acampada.',
      emergencyContact: 'Joan Vila - 622000004'
    }
  });

  await prisma.tutorChildRelation.create({
    data: {
      tutorUserId: userTutorEsplai.id,
      childId: childEsplai1.id,
      relationshipType: 'PADRE'
    }
  });

  // Actividad con AUTORIZACIÓN OBLIGATORIA (LegalTech demo)
  const activityEsplai = await prisma.activity.create({
    data: {
      tenantId: tenantEsplai.id,
      title: 'Excursió de Muntanya al Matagalls (Montseny)',
      description: 'Ruta a peu de 12km pel Parc Natural del Montseny. Cal portar calçat adequat i autorització signada.',
      type: 'EXCURSION',
      maxCapacity: 20,
      minAge: 8,
      maxAge: 16,
      requiresAuthorization: true,
      priceCents: 2500, // 25.00 €
      requiredMaterial: [
        { id: 'esp-1', name: 'Botes de muntanya amb canya mitjana', isMandatory: true },
        { id: 'esp-2', name: 'Cantimplora d1.5 litres daigua', isMandatory: true },
        { id: 'esp-3', name: 'Targeta sanitària original (TSI)', isMandatory: true },
        { id: 'esp-4', name: 'Chubasquero o anorac impermeable', isMandatory: true },
        { id: 'esp-5', name: 'Dinar de carmanyola no perible', isMandatory: false }
      ]
    }
  });

  const sessionEsplai = await prisma.activitySession.create({
    data: {
      tenantId: tenantEsplai.id,
      activityId: activityEsplai.id,
      startTime: new Date(Date.now() + 172800000), // En 2 días
      endTime: new Date(Date.now() + 172800000 + 28800000), // 8 horas de excursión
      location: 'Coll de Formic (Punt de sortida a les 08:30h)',
      sharedNotes: 'Recordar farmaciola de muntanya amb sèrum i benes.'
    }
  });

  await prisma.activityMonitorAssignment.create({
    data: {
      sessionId: sessionEsplai.id,
      monitorUserId: userMonitorEsplai.id
    }
  });

  await prisma.activityMonitorAssignment.create({
    data: {
      sessionId: sessionEsplai.id,
      monitorUserId: userPracticasEsplai.id
    }
  });

  const enrollmentEsplai = await prisma.enrollment.create({
    data: {
      tenantId: tenantEsplai.id,
      activityId: activityEsplai.id,
      childId: childEsplai1.id,
      status: 'CONFIRMED'
    }
  });

  // Orden de autorización pendiente (para probar el flujo de LegalTech)
  await prisma.authorizationDocument.create({
    data: {
      tenantId: tenantEsplai.id,
      activityId: activityEsplai.id,
      childId: childEsplai1.id,
      status: 'PENDING'
    }
  });

  console.log('✅ Seed completado con éxito:');
  console.log(`- Tenant 1: "${tenantClub.name}" (${tenantClub.slug})`);
  console.log(`- Tenant 2: "${tenantEsplai.name}" (${tenantEsplai.slug})`);
  console.log('Usuarios de prueba con contraseña "Password123!":');
  console.log('  * admin@cegracia.cat / entrenador@cegracia.cat / familia.puig@gmail.com');
  console.log('  * admin@esplaielpi.cat / monitor@esplaielpi.cat / practicas@esplaielpi.cat / tutor@esplaielpi.cat');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
