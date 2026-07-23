import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { DEMO_SCHOOL_NAME } from "./demoConstants.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_SCHOOL_NAME_AR = "مدرسة تجريبية للعرض";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@2026!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existing = await prisma.school.findFirst({ where: { name: DEMO_SCHOOL_NAME } });
  if (existing) {
    console.log(`"${DEMO_SCHOOL_NAME}" already exists (id: ${existing.id}). Run cleanupDemoSchool.ts first if you want a fresh copy.`);
    return;
  }

  const school = await prisma.school.create({
    data: { name: DEMO_SCHOOL_NAME, nameAr: DEMO_SCHOOL_NAME_AR, address: "Riyadh, KSA" },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      isActive: true,
    },
  });

  // Grades and Subjects are global/shared across schools -- upsert so this
  // script is self-sufficient even on a brand new database.
  const gradeLevels = [
    { level: 5, name: "Grade 5", nameAr: "الصف الخامس" },
    { level: 6, name: "Grade 6", nameAr: "الصف السادس" },
    { level: 7, name: "Grade 7", nameAr: "الصف السابع" },
    { level: 8, name: "Grade 8", nameAr: "الصف الثامن" },
    { level: 9, name: "Grade 9", nameAr: "الصف التاسع" },
    { level: 10, name: "Grade 10", nameAr: "الصف العاشر" },
    { level: 11, name: "Grade 11", nameAr: "الصف الحادي عشر" },
    { level: 12, name: "Grade 12", nameAr: "الصف الثاني عشر" },
  ];
  const grades = new Map<number, { id: string; level: number }>();
  for (const g of gradeLevels) {
    const grade = await prisma.grade.upsert({ where: { level: g.level }, create: g, update: {} });
    grades.set(g.level, grade);
  }

  const mathSubject = await prisma.subject.upsert({
    where: { code: "MATH" },
    create: { name: "Mathematics", nameAr: "الرياضيات", code: "MATH" },
    update: {},
  });
  const physicsSubject = await prisma.subject.upsert({
    where: { code: "PHYS" },
    create: { name: "Physics", nameAr: "الفيزياء", code: "PHYS" },
    update: {},
  });

  const grade8 = grades.get(8)!;
  const grade10 = grades.get(10)!;

  const grade8Class = await prisma.classSection.create({
    data: { schoolId: school.id, academicYearId: academicYear.id, gradeId: grade8.id, name: "8A" },
  });
  const grade10Class = await prisma.classSection.create({
    data: { schoolId: school.id, academicYearId: academicYear.id, gradeId: grade10.id, track: "GENERAL", name: "10A" },
  });

  const mathUnit = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: mathSubject.id,
      gradeId: grade8.id,
      unit: "الوحدة 3",
      unitTitle: "المعادلات الخطية",
      lessonTitle: "حل المعادلات الخطية بمتغير واحد",
      orderIndex: 1,
    },
  });
  const mathOutcome = await prisma.learningOutcome.create({
    data: {
      curriculumContentId: mathUnit.id,
      textAr: "يحل الطالب المعادلات الخطية ذات المتغير الواحد باستخدام طرق مختلفة",
      textEn: "Solve linear equations in one variable using multiple methods",
      skill: "التفكير الجبري",
    },
  });

  const physicsUnit = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: physicsSubject.id,
      gradeId: grade10.id,
      track: "GENERAL",
      unit: "الوحدة 1",
      unitTitle: "الحركة والقوى",
      lessonTitle: "قوانين نيوتن للحركة",
      orderIndex: 1,
    },
  });
  await prisma.learningOutcome.create({
    data: {
      curriculumContentId: physicsUnit.id,
      textAr: "يشرح الطالب قوانين نيوتن للحركة ويطبقها على مواقف واقعية",
      textEn: "Explain Newton's laws of motion and apply them to real-world scenarios",
      skill: "التفكير الفيزيائي التطبيقي",
    },
  });

  // Users
  const principal = await prisma.user.create({
    data: {
      email: "principal@demo.school.edu",
      passwordHash,
      name: "School Principal",
      nameAr: "مدير المدرسة",
      role: "PRINCIPAL",
      schoolId: school.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "viceprincipal@demo.school.edu",
      passwordHash,
      name: "Vice Principal",
      nameAr: "نائب المدير",
      role: "VICE_PRINCIPAL",
      schoolId: school.id,
    },
  });
  const teamLeader = await prisma.user.create({
    data: {
      email: "teamleader@demo.school.edu",
      passwordHash,
      name: "Team Leader",
      nameAr: "قائد فريق",
      role: "TEAM_LEADER",
      schoolId: school.id,
    },
  });
  const teacher1 = await prisma.user.create({
    data: {
      email: "teacher1@demo.school.edu",
      passwordHash,
      name: "Teacher 1",
      nameAr: "مدرس 1",
      role: "TEACHER",
      schoolId: school.id,
    },
  });
  const teacher2 = await prisma.user.create({
    data: {
      email: "teacher2@demo.school.edu",
      passwordHash,
      name: "Teacher 2",
      nameAr: "مدرس 2",
      role: "TEACHER",
      schoolId: school.id,
    },
  });

  await prisma.teacherAssignment.create({
    data: { teacherId: teacher1.id, classSectionId: grade8Class.id, subjectId: mathSubject.id, academicYearId: academicYear.id },
  });
  await prisma.teacherAssignment.create({
    data: { teacherId: teacher2.id, classSectionId: grade10Class.id, subjectId: physicsSubject.id, academicYearId: academicYear.id },
  });

  const timetableMath = await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade8Class.id,
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      dayOfWeek: "SUNDAY",
      periodNumber: 2,
      startTime: "08:50",
      endTime: "09:35",
    },
  });
  await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade8Class.id,
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      dayOfWeek: "TUESDAY",
      periodNumber: 3,
      startTime: "09:40",
      endTime: "10:25",
    },
  });
  const timetablePhysics = await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade10Class.id,
      subjectId: physicsSubject.id,
      teacherId: teacher2.id,
      dayOfWeek: "MONDAY",
      periodNumber: 1,
      startTime: "08:00",
      endTime: "08:45",
    },
  });

  // --- Lesson plan #1: fully generated + printed (shows the whole flow, incl. print/version) ---
  const printedContent = {
    objectives: ["يحل الطالب معادلات خطية بمتغير واحد بدقة.", "يفسر الطالب خطوات الحل ويبررها رياضياً."],
    lessonFlow: {
      intro: "نشاط تمهيدي: عرض مسألة يومية (تقسيم مبلغ مالي) تُترجم إلى معادلة خطية، ومناقشة قصيرة حول كيفية إيجاد المجهول.",
      development: "شرح خطوات حل المعادلة الخطية (عزل المتغير، إجراء نفس العملية على الطرفين) مع أمثلة تدريجية الصعوبة على السبورة.",
      application: "عمل جماعي في مجموعات ثنائية على ورقة عمل تحتوي 6 معادلات متدرجة الصعوبة، مع تجوال المعلمة للمتابعة.",
      closure: "تذكرة خروج: يحل كل طالب معادلة واحدة بشكل فردي ويسلمها قبل مغادرة الحصة.",
    },
    activities: ["ورقة عمل جماعية (ثنائيات)", "مسابقة سريعة على السبورة", "تذكرة خروج فردية"],
    assessment: "تُقيَّم تذكرة الخروج فورياً لتحديد الطلاب الذين يحتاجون دعماً إضافياً في الحصة القادمة.",
    differentiation: {
      support: "بطاقة خطوات مرقمة ومعادلات مبسطة بأعداد صحيحة صغيرة للطلاب الذين يحتاجون دعماً.",
      enrichment: "مسائل كلامية (word problems) تتطلب صياغة المعادلة أولاً ثم حلها للطلاب المتقدمين.",
    },
    reflection: "هل تمكن معظم الطلاب من عزل المتغير دون مساعدة؟ ما المفاهيم التي تحتاج إعادة شرح في الحصة القادمة؟",
  };

  const lessonPlan1 = await prisma.lessonPlan.create({
    data: {
      teacherId: teacher1.id,
      timetableId: timetableMath.id,
      classSectionId: grade8Class.id,
      curriculumContentId: mathUnit.id,
      learningOutcomeId: mathOutcome.id,
      lessonDate: new Date(),
      durationMinutes: 45,
      teacherPrompt: "ركزي على الأمثلة الواقعية وامنحي وقتاً كافياً للتطبيق الجماعي قبل التقييم الفردي.",
      strategies: ["التعلم التعاوني", "التعلم القائم على حل المشكلات"],
      tools: ["السبورة الذكية", "ورقة عمل مطبوعة"],
      contentJson: printedContent,
      status: "PRINTED",
    },
  });

  const genLog1 = await prisma.aIGenerationLog.create({
    data: {
      lessonPlanId: lessonPlan1.id,
      userId: teacher1.id,
      model: "gpt-4o-mini",
      promptInput: { teacherPrompt: lessonPlan1.teacherPrompt, strategies: lessonPlan1.strategies, tools: lessonPlan1.tools },
      responseJson: printedContent,
      status: "SUCCESS",
      qualityScore: 95,
      qualityIssues: [],
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.aIFeedback.create({
    data: { generationLogId: genLog1.id, userId: teacher1.id, rating: "UP", comment: "خطة ممتازة وجاهزة للتطبيق مباشرة." },
  });

  await prisma.lessonPlanVersion.create({
    data: {
      lessonPlanId: lessonPlan1.id,
      versionNumber: 1,
      contentJson: printedContent,
      printedById: teacher1.id,
      printedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Lesson plan #2: draft with a lower quality score (shows the AI evaluation UI) ---
  const draftContent = {
    ...printedContent,
    reflection: "جيد",
  };
  const lessonPlan2 = await prisma.lessonPlan.create({
    data: {
      teacherId: teacher1.id,
      timetableId: null,
      classSectionId: grade8Class.id,
      curriculumContentId: mathUnit.id,
      learningOutcomeId: mathOutcome.id,
      lessonDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      teacherPrompt: "درس تمهيدي لمراجعة سريعة قبل الاختبار القصير.",
      strategies: ["التعلم التعاوني"],
      tools: ["السبورة الذكية"],
      contentJson: draftContent,
      status: "DRAFT",
    },
  });
  await prisma.aIGenerationLog.create({
    data: {
      lessonPlanId: lessonPlan2.id,
      userId: teacher1.id,
      model: "gpt-4o-mini",
      promptInput: { teacherPrompt: lessonPlan2.teacherPrompt },
      responseJson: draftContent,
      status: "SUCCESS",
      qualityScore: 78,
      qualityIssues: [{ code: "TOO_SHORT", field: "reflection" }],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Lesson plan #3: not generated yet (shows the empty/generate state) ---
  await prisma.lessonPlan.create({
    data: {
      teacherId: teacher2.id,
      timetableId: timetablePhysics.id,
      classSectionId: grade10Class.id,
      curriculumContentId: physicsUnit.id,
      learningOutcomeId: (await prisma.learningOutcome.findFirstOrThrow({ where: { curriculumContentId: physicsUnit.id } })).id,
      lessonDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      teacherPrompt: "درس تفاعلي يبدأ بتجربة بسيطة توضح قانون نيوتن الأول.",
      strategies: ["التعلم بالاستقصاء"],
      tools: ["عربة تجارب", "كرات بأوزان مختلفة"],
      contentJson: undefined,
      status: "DRAFT",
    },
  });

  // --- Initiative ---
  const initiative = await prisma.initiative.create({
    data: {
      ownerId: teacher1.id,
      schoolId: school.id,
      title: "رياضيات بلا خوف",
      category: "EDUCATIONAL",
      initialIdea: "برنامج أسبوعي لدعم الطلاب الذين يعانون من قلق الرياضيات عبر جلسات تقوية قصيرة وألعاب رياضية.",
      goal: "رفع متوسط درجات اختبارات الرياضيات القصيرة لدى الطلاب المستهدفين بنسبة 20% خلال فصل دراسي واحد.",
      targetGroup: "20 طالباً من الصف الثامن ممن حصلوا على أقل من 60% في التقييم التشخيصي الأولي.",
      baseline: "متوسط درجات المجموعة المستهدفة في التقييم التشخيصي: 52%.",
      status: "ACTIVE",
    },
  });
  await prisma.initiativePhase.createMany({
    data: [
      { initiativeId: initiative.id, orderIndex: 0, name: "التشخيص والتجميع", description: "تحديد الطلاب المستهدفين عبر تقييم تشخيصي قصير وتقسيمهم إلى مجموعات صغيرة.", timeline: "الأسبوع 1" },
      { initiativeId: initiative.id, orderIndex: 1, name: "جلسات التقوية", description: "جلسات أسبوعية مدتها 30 دقيقة تركز على المهارات الأساسية الناقصة لكل مجموعة.", timeline: "الأسبوع 2-8" },
      { initiativeId: initiative.id, orderIndex: 2, name: "القياس الختامي", description: "إعادة تطبيق التقييم التشخيصي ومقارنة النتائج بخط الأساس.", timeline: "الأسبوع 9" },
    ],
  });
  await prisma.initiativeIndicator.createMany({
    data: [
      { initiativeId: initiative.id, name: "متوسط درجة التقييم التشخيصي", measurementMethod: "اختبار تشخيصي موحد قبل وبعد", baselineValue: "52%", targetValue: "72%", actualValue: "65%" },
      { initiativeId: initiative.id, name: "نسبة الحضور لجلسات التقوية", measurementMethod: "سجل حضور أسبوعي", baselineValue: "0%", targetValue: "90%", actualValue: "83%" },
    ],
  });
  await prisma.initiativeEvidence.create({
    data: {
      initiativeId: initiative.id,
      description: "نتائج التقييم التشخيصي الأولي والنهائي لمجموعة الطلاب المستهدفين.",
      link: "https://example.com/diagnostic-results",
      createdById: teacher1.id,
    },
  });
  const initGenLog = await prisma.aIGenerationLog.create({
    data: {
      initiativeId: initiative.id,
      userId: teacher1.id,
      model: "gpt-4o-mini",
      promptInput: { initialIdea: initiative.initialIdea },
      responseJson: { goal: initiative.goal, targetGroup: initiative.targetGroup },
      status: "SUCCESS",
      qualityScore: 90,
      qualityIssues: [],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });
  void initGenLog;

  // --- Team + operational plan + meeting ---
  const team = await prisma.team.create({
    data: { schoolId: school.id, name: "فريق تطوير الرياضيات", type: "ACADEMIC", goal: "رفع جودة تدريس الرياضيات عبر التخطيط المشترك وتحليل النتائج.", leaderId: teamLeader.id },
  });
  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, userId: teamLeader.id },
      { teamId: team.id, userId: teacher1.id },
      { teamId: team.id, userId: teacher2.id },
    ],
  });
  const opPlan = await prisma.operationalPlan.create({
    data: {
      teamId: team.id,
      level: "TEAM",
      title: "الخطة التشغيلية لفريق الرياضيات 2026-2027",
      initialIdea: "خطة تركز على توحيد أساليب التقييم التكويني ودعم الطلاب المتعثرين عبر مجتمع تعلم مهني أسبوعي.",
    },
  });
  await prisma.operationalPlanItem.createMany({
    data: [
      { operationalPlanId: opPlan.id, orderIndex: 0, domain: "التعليم والتعلم", objective: "توحيد معايير التقييم التكويني بين معلمي المادة", actions: "ورشة عمل شهرية لمراجعة نماذج التقييم وتبادل أفضل الممارسات", responsible: "قائد الفريق", timeline: "الفصل الأول", indicator: "عدد الورش المنفذة (4 كحد أدنى)", risk: "ضغط الجدول الدراسي — يُخفف بجدولة الورش خلال الحصص المكتبية" },
      { operationalPlanId: opPlan.id, orderIndex: 1, domain: "دعم الطلاب", objective: "خفض نسبة الطلاب المتعثرين في الرياضيات بنسبة 15%", actions: "برنامج تقوية أسبوعي مستهدف بناءً على نتائج التقييم التشخيصي", responsible: "معلمو الرياضيات", timeline: "طوال العام", indicator: "نسبة الطلاب دون 60% في الاختبارات القصيرة", risk: "غياب الطلاب عن الجلسات — يُتابع عبر التواصل مع أولياء الأمور" },
      { operationalPlanId: opPlan.id, orderIndex: 2, domain: "التطوير المهني", objective: "بناء مجتمع تعلم مهني فعّال داخل الفريق", actions: "اجتماع أسبوعي لمراجعة عينات من أعمال الطلاب وتحليلها", responsible: "جميع أعضاء الفريق", timeline: "أسبوعي", indicator: "معدل حضور الاجتماعات (90%+)", risk: "تعارض الأوقات — يُحل بجدول ثابت معتمد من الإدارة" },
    ],
  });

  const meeting = await prisma.meeting.create({
    data: {
      teamId: team.id,
      title: "اجتماع مراجعة نتائج الفصل الأول",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      agenda: "مراجعة نتائج التقييمات التشخيصية، ومناقشة خطة التقوية للطلاب المتعثرين.",
      minutes: "تم الاتفاق على تفعيل برنامج جلسات التقوية الأسبوعية ابتداءً من الأسبوع القادم، مع تكليف مريم العتيبي بمتابعة الحضور.",
      createdById: teamLeader.id,
    },
  });
  await prisma.actionItem.createMany({
    data: [
      { meetingId: meeting.id, task: "إعداد جدول جلسات التقوية الأسبوعية", ownerId: teacher1.id, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), status: "DONE" },
      { meetingId: meeting.id, task: "التواصل مع أولياء أمور الطلاب المستهدفين", ownerId: teamLeader.id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "IN_PROGRESS" },
    ],
  });

  // --- Question bank + assessment ---
  const q1 = await prisma.questionBankItem.create({
    data: { subjectId: mathSubject.id, gradeId: grade8.id, skill: "المعادلات الخطية", difficulty: "EASY", type: "MULTIPLE_CHOICE", questionText: "ما قيمة x في المعادلة: x + 5 = 12 ؟", choices: ["5", "7", "12", "17"], correctAnswer: "7", explanation: "بطرح 5 من الطرفين نحصل على x = 7.", createdById: teacher1.id },
  });
  const q2 = await prisma.questionBankItem.create({
    data: { subjectId: mathSubject.id, gradeId: grade8.id, skill: "المعادلات الخطية", difficulty: "MEDIUM", type: "MULTIPLE_CHOICE", questionText: "ما قيمة x في المعادلة: 3x - 4 = 11 ؟", choices: ["3", "5", "7", "9"], correctAnswer: "5", explanation: "بإضافة 4 ثم القسمة على 3 نحصل على x = 5.", createdById: teacher1.id },
  });
  const q3 = await prisma.questionBankItem.create({
    data: { subjectId: mathSubject.id, gradeId: grade8.id, skill: "المعادلات الخطية", difficulty: "ADVANCED", type: "OPEN", questionText: "اكتب معادلة خطية تمثل الموقف التالي ثم حلها: اشترى أحمد كتاباً بسعر ثابت وثلاثة أقلام بسعر 2 ريال للقلم الواحد، ودفع 20 ريالاً في المجموع.", correctAnswer: "سعر الكتاب + 3×2 = 20 → سعر الكتاب = 14 ريالاً", explanation: "تمثل المسألة معادلة خطية بمتغير واحد هو سعر الكتاب.", createdById: teacher1.id },
  });
  const q4 = await prisma.questionBankItem.create({
    data: { subjectId: mathSubject.id, gradeId: grade8.id, skill: "المعادلات الخطية", difficulty: "CHALLENGE", type: "OPEN", questionText: "أوجد قيمة x التي تحقق المعادلة في آنٍ واحد مع كونها عدداً صحيحاً موجباً: 2(x - 3) = x + 1", correctAnswer: "x = 7", explanation: "بفك القوس: 2x - 6 = x + 1 ← x = 7، وهو عدد صحيح موجب فيحقق الشرط.", createdById: teacher1.id },
  });

  const assessment = await prisma.assessment.create({
    data: { teacherId: teacher1.id, lessonPlanId: lessonPlan1.id, title: "اختبار قصير: المعادلات الخطية" },
  });
  await prisma.assessmentQuestion.createMany({
    data: [
      { assessmentId: assessment.id, questionId: q1.id, orderIndex: 0 },
      { assessmentId: assessment.id, questionId: q2.id, orderIndex: 1 },
      { assessmentId: assessment.id, questionId: q3.id, orderIndex: 2 },
      { assessmentId: assessment.id, questionId: q4.id, orderIndex: 3 },
    ],
  });
  await prisma.aIGenerationLog.create({
    data: {
      assessmentId: assessment.id,
      userId: teacher1.id,
      model: "gpt-4o-mini",
      promptInput: { lessonPlanId: lessonPlan1.id },
      responseJson: { questionCount: 4 },
      status: "SUCCESS",
      qualityScore: 88,
      qualityIssues: [],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Insight ---
  const insight = await prisma.insight.create({
    data: {
      scope: "SCHOOL",
      schoolId: school.id,
      requestedById: principal.id,
      summary: "أداء المدرسة في الرياضيات يتحسن تدريجياً بفضل مبادرة الدعم الأسبوعي، بينما لا تزال بعض الفصول بحاجة لمتابعة أقرب في الفيزياء.",
      strengths: ["ارتفاع معدل حضور جلسات التقوية في الرياضيات إلى 83%", "التزام فريق الرياضيات باجتماعات أسبوعية منتظمة لمراجعة النتائج"],
      concerns: ["لم تصل نتائج مبادرة الرياضيات بعد إلى الهدف المحدد (72%)", "غياب خطط دعم مماثلة في مادة الفيزياء"],
      recommendations: ["تمديد فترة مبادرة الدعم أسبوعين إضافيين قبل القياس الختامي", "دراسة تطبيق نموذج مشابه لجلسات التقوية في الفيزياء"],
    },
  });
  await prisma.aIGenerationLog.create({
    data: {
      insightId: insight.id,
      userId: principal.id,
      model: "gpt-4o-mini",
      promptInput: { scope: "SCHOOL", schoolId: school.id },
      responseJson: { summary: insight.summary },
      status: "SUCCESS",
      qualityScore: 92,
      qualityIssues: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Knowledge memory ---
  await prisma.knowledgeMemoryItem.create({
    data: {
      schoolId: school.id,
      module: "LESSON_PLAN",
      subjectId: mathSubject.id,
      gradeId: grade8.id,
      title: "إحماء فعّال لدروس المعادلات",
      content: "استخدام مسألة يومية بسيطة (تقسيم مبلغ، حساب أعمار) كنقطة انطلاق يرفع تفاعل الطلاب في الدقائق الأولى من الحصة بشكل ملحوظ.",
      createdById: teacher1.id,
    },
  });
  await prisma.knowledgeMemoryItem.create({
    data: {
      schoolId: school.id,
      module: "INITIATIVE",
      title: "أهمية القياس القبلي والبعدي",
      content: "المبادرات التي تحدد خط أساس رقمياً واضحاً قبل البدء يسهل تقييم أثرها الفعلي لاحقاً مقارنة بالمبادرات الوصفية فقط.",
      createdById: principal.id,
    },
  });

  // --- Messages + notifications ---
  const msg1 = await prisma.message.create({
    data: {
      senderId: principal.id,
      recipientId: teacher1.id,
      subject: "متابعة مبادرة رياضيات بلا خوف",
      body: "أشكرك على المتابعة الدقيقة لمبادرة الدعم. هل يمكن تزويدي بملخص سريع للنتائج قبل اجتماع مجلس الإدارة الأسبوع القادم؟",
      read: true,
    },
  });
  await prisma.notification.create({
    data: { userId: teacher1.id, type: "MESSAGE_RECEIVED", title: msg1.subject, body: msg1.body, link: "/messages", read: true },
  });

  const msg2 = await prisma.message.create({
    data: {
      senderId: teacher1.id,
      recipientId: teamLeader.id,
      subject: "طلب مراجعة ورقة عمل جديدة",
      body: "أرفقت ورقة عمل جديدة لدرس المعادلات في بنك الأسئلة، هل يمكنك مراجعتها قبل استخدامها مع الصف الآخر؟",
      read: false,
    },
  });
  await prisma.notification.create({
    data: { userId: teamLeader.id, type: "MESSAGE_RECEIVED", title: msg2.subject, body: msg2.body, link: "/messages", read: false },
  });

  console.log("Demo school seeded.");
  console.log(`School: ${DEMO_SCHOOL_NAME} (id: ${school.id})`);
  console.log(`Password for all demo accounts: ${DEMO_PASSWORD}`);
  console.log(`  Principal:       principal@demo.school.edu`);
  console.log(`  Vice Principal:  viceprincipal@demo.school.edu`);
  console.log(`  Team Leader:     teamleader@demo.school.edu`);
  console.log(`  Teacher (Math):  teacher1@demo.school.edu`);
  console.log(`  Teacher (Phys):  teacher2@demo.school.edu`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
