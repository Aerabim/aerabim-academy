import type {
  CourseWithMeta,
  ModuleWithLessons,
  EnrolledCourse,
  CertificateDisplay,
  CourseMaterial,
} from '@/types';

// ── Featured Course ─────────────────────────────────

export const FEATURED_COURSE_SLUG = 'esportare-ifc-da-revit';

// ── Courses ─────────────────────────────────────────

export const PLACEHOLDER_COURSES: CourseWithMeta[] = [
  // ── SW ──
  {
    id: 'c-001',
    slug: 'esportare-ifc-da-revit',
    title: 'Esportare correttamente un IFC da Revit',
    description:
      'Impara a configurare le classi IFC, i mapping set e le impostazioni di export per produrre file IFC conformi alla ISO 16739 e allo standard italiano.',
    area: 'SW',
    level: 'L1',
    priceSingle: 8900,
    isFree: false,
    durationMin: 180,
    rating: 4.9,
    enrolledCount: 342,
    moduleCount: 3,
    lessonCount: 12,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Marco Bianchi', role: 'BIM Specialist', initials: 'MB' },
    emoji: '🏗️',
  },
  {
    id: 'c-002',
    slug: 'georiferire-modelli-revit',
    title: 'Georiferire i modelli federati su Revit',
    description:
      'Coordinate condivise, survey point, project base point: tutto quello che serve per georiferire correttamente i modelli BIM federati.',
    area: 'SW',
    level: 'L2',
    priceSingle: 8900,
    isFree: false,
    durationMin: 180,
    rating: 4.6,
    enrolledCount: 218,
    moduleCount: 3,
    lessonCount: 10,
    updatedAt: 'Febbraio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Marco Bianchi', role: 'BIM Specialist', initials: 'MB' },
    emoji: '🌍',
  },
  {
    id: 'c-003',
    slug: 'parametri-condivisi-revit',
    title: 'Le potenzialità dei parametri condivisi su Revit',
    description:
      'Shared Parameters, parametri di progetto e parametri globali: come organizzarli, condividerli e utilizzarli per abachi e computi.',
    area: 'SW',
    level: 'L2',
    priceSingle: 9900,
    isFree: false,
    durationMin: 240,
    rating: 4.5,
    enrolledCount: 167,
    moduleCount: 4,
    lessonCount: 14,
    updatedAt: 'Gennaio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Laura Rossi', role: 'BIM Coordinator', initials: 'LR' },
    emoji: '⚙️',
  },
  {
    id: 'c-004',
    slug: 'abaco-armature-revit',
    title: 'Creare un abaco delle armature su Revit',
    description:
      'Dal modello strutturale all\'abaco delle armature: filtri, raggruppamenti, formule e formattazione condizionale per un output professionale.',
    area: 'SW',
    level: 'L2',
    priceSingle: 8900,
    isFree: false,
    durationMin: 180,
    rating: 4.7,
    enrolledCount: 134,
    moduleCount: 3,
    lessonCount: 9,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Andrea Verdi', role: 'Structural BIM Lead', initials: 'AV' },
    emoji: '🔩',
  },
  {
    id: 'c-005',
    slug: 'plugin-diroots-revit',
    title: 'Utilizziamo i plugin di DiRoots',
    description:
      'SheetLink, FamilyReviser, ParaManager e gli altri strumenti DiRoots per velocizzare i workflow BIM su Revit.',
    area: 'SW',
    level: 'L2',
    priceSingle: 9900,
    isFree: false,
    durationMin: 240,
    rating: 4.5,
    enrolledCount: 98,
    moduleCount: 4,
    lessonCount: 16,
    updatedAt: 'Febbraio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Marco Bianchi', role: 'BIM Specialist', initials: 'MB' },
    emoji: '🔌',
  },
  {
    id: 'c-006',
    slug: 'esportare-dwg-da-revit',
    title: 'Esportare correttamente un DWG da Revit',
    description:
      'Export Setup, mapping layer, filtri di visibilità e best practice per produrre DWG puliti e conformi dagli elaborati Revit.',
    area: 'SW',
    level: 'L1',
    priceSingle: 6900,
    isFree: false,
    durationMin: 120,
    rating: 4.4,
    enrolledCount: 276,
    moduleCount: 2,
    lessonCount: 8,
    updatedAt: 'Gennaio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Laura Rossi', role: 'BIM Coordinator', initials: 'LR' },
    emoji: '📄',
  },

  // ── NL ──
  {
    id: 'c-007',
    slug: 'allegato-i9-spiegato',
    title: "L'Allegato I.9 spiegato ai tecnici",
    description:
      'Analisi articolo per articolo dell\'Allegato I.9 al D.Lgs. 36/2023: obblighi, soglie, contenuti informativi e implicazioni per stazioni appaltanti e operatori economici.',
    area: 'NL',
    level: 'L1',
    priceSingle: 7900,
    isFree: false,
    durationMin: 120,
    rating: 4.8,
    enrolledCount: 421,
    moduleCount: 3,
    lessonCount: 10,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Giulia Neri', role: 'Legal BIM Advisor', initials: 'GN' },
    emoji: '📜',
  },
  {
    id: 'c-008',
    slug: 'linee-guida-mit-bim',
    title: 'Le nuove Linee Guida MIT sul BIM',
    description:
      'Le Linee Guida del Ministero delle Infrastrutture sulla digitalizzazione delle costruzioni: cosa cambia e come adeguarsi.',
    area: 'NL',
    level: 'L1',
    priceSingle: 0,
    isFree: true,
    durationMin: 120,
    rating: 4.8,
    enrolledCount: 1053,
    moduleCount: 2,
    lessonCount: 8,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Giulia Neri', role: 'Legal BIM Advisor', initials: 'GN' },
    emoji: '🏛️',
  },
  {
    id: 'c-009',
    slug: 'uni-11337-parte-12',
    title: 'La nuova UNI 11337 parte 12',
    description:
      'La parte 12 della UNI 11337 sulla gestione informativa digitale: struttura, requisiti e applicazione pratica nei processi BIM.',
    area: 'NL',
    level: 'L2',
    priceSingle: 9900,
    isFree: false,
    durationMin: 180,
    rating: 4.6,
    enrolledCount: 189,
    moduleCount: 3,
    lessonCount: 11,
    updatedAt: 'Febbraio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Giulia Neri', role: 'Legal BIM Advisor', initials: 'GN' },
    emoji: '📘',
  },

  // ── OB ──
  {
    id: 'c-010',
    slug: 'quale-versione-ifc',
    title: 'Quale versione di IFC scegliere?',
    description:
      'IFC2x3, IFC4, IFC4.3: differenze, compatibilità software e criteri di scelta per ogni fase del progetto BIM.',
    area: 'OB',
    level: 'L1',
    priceSingle: 0,
    isFree: true,
    durationMin: 120,
    rating: 4.7,
    enrolledCount: 687,
    moduleCount: 2,
    lessonCount: 7,
    updatedAt: 'Gennaio 2026',
    languages: ['Italiano'],
    instructor: { name: 'Marco Bianchi', role: 'BIM Specialist', initials: 'MB' },
    emoji: '📐',
  },

  // ── AI ──
  {
    id: 'c-011',
    slug: 'dynamo-con-claude-code',
    title: 'Sviluppare uno script Dynamo mediante Claude Code',
    description:
      'Usa l\'AI come copilot per creare script Dynamo complessi: dalla definizione del prompt alla validazione del nodo Python Script.',
    area: 'AI',
    level: 'L2',
    priceSingle: 14900,
    isFree: false,
    durationMin: 360,
    rating: 4.9,
    enrolledCount: 156,
    moduleCount: 5,
    lessonCount: 22,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Andrea Verdi', role: 'Computational Design Lead', initials: 'AV' },
    emoji: '🤖',
  },

  // ── PG ──
  {
    id: 'c-012',
    slug: 'preparazione-certificazione-bim',
    title: 'Preparazione all\'esame di certificazione BIM',
    description:
      'Percorso completo di preparazione agli esami di certificazione delle competenze BIM secondo la UNI/PdR 78: BIM Specialist, Coordinator e Manager.',
    area: 'PG',
    level: 'L2',
    priceSingle: 29900,
    isFree: false,
    durationMin: 600,
    rating: 4.9,
    enrolledCount: 312,
    moduleCount: 6,
    lessonCount: 28,
    updatedAt: 'Marzo 2026',
    languages: ['Italiano'],
    instructor: { name: 'Laura Rossi', role: 'BIM Coordinator', initials: 'LR' },
    emoji: '🎓',
  },
];

// ── Modules & Lessons (per course) ──────────────────

export const PLACEHOLDER_MODULES: Record<string, ModuleWithLessons[]> = {
  'esportare-ifc-da-revit': [
    {
      id: 'm-001',
      courseId: 'c-001',
      title: 'Introduzione',
      orderNum: 0,
      lessons: [
        { id: 'l-001', moduleId: 'm-001', title: 'Benvenuto al corso', description: 'Panoramica del corso e obiettivi formativi', orderNum: 1, type: 'video', durationSec: 320, isPreview: true, status: 'completed' },
        { id: 'l-002', moduleId: 'm-001', title: 'IFC come standard di scambio dati', description: 'Cos\'è il formato IFC e perché è fondamentale nel BIM', orderNum: 2, type: 'video', durationSec: 840, isPreview: true, status: 'completed' },
      ],
    },
    {
      id: 'm-002',
      courseId: 'c-001',
      title: 'Modulo 1 — Fondamenti IFC',
      orderNum: 1,
      lessons: [
        { id: 'l-003', moduleId: 'm-002', title: 'La struttura di un file IFC', description: 'Header, schema, entità e relazioni', orderNum: 1, type: 'video', durationSec: 960, isPreview: false, status: 'completed' },
        { id: 'l-004', moduleId: 'm-002', title: 'Classi IFC e mapping in Revit', description: 'Come Revit mappa le categorie alle classi IFC', orderNum: 2, type: 'video', durationSec: 1080, isPreview: false, status: 'active' },
        { id: 'l-005', moduleId: 'm-002', title: 'Quiz — Fondamenti IFC', description: 'Verifica le tue conoscenze sui fondamenti', orderNum: 3, type: 'quiz', durationSec: null, isPreview: false, status: 'locked' },
        { id: 'l-006', moduleId: 'm-002', title: 'Template mapping IFC', description: 'Scarica il template di mapping preconfigurato', orderNum: 4, type: 'material', durationSec: null, isPreview: false, status: 'locked' },
      ],
    },
    {
      id: 'm-003',
      courseId: 'c-001',
      title: 'Modulo 2 — Configurazione Export',
      orderNum: 2,
      lessons: [
        { id: 'l-007', moduleId: 'm-003', title: 'Le impostazioni di Export IFC', description: 'Pannello Export IFC: ogni opzione spiegata', orderNum: 1, type: 'video', durationSec: 1200, isPreview: false, status: 'locked' },
        { id: 'l-008', moduleId: 'm-003', title: 'IFC Export Setup personalizzato', description: 'Creare e salvare setup di export riutilizzabili', orderNum: 2, type: 'video', durationSec: 900, isPreview: false, status: 'locked' },
        { id: 'l-009', moduleId: 'm-003', title: 'Esercitazione pratica', description: 'Configura l\'export IFC su un progetto reale', orderNum: 3, type: 'esercitazione', durationSec: 1800, isPreview: false, status: 'locked' },
      ],
    },
    {
      id: 'm-004',
      courseId: 'c-001',
      title: 'Modulo 3 — Verifica e Validazione',
      orderNum: 3,
      lessons: [
        { id: 'l-010', moduleId: 'm-004', title: 'Validare l\'IFC con BIM Vision', description: 'Controllo visivo e verifica classi nel viewer gratuito', orderNum: 1, type: 'video', durationSec: 720, isPreview: false, status: 'locked' },
        { id: 'l-011', moduleId: 'm-004', title: 'Checklist di qualità IFC', description: 'I 10 controlli da fare prima di consegnare un IFC', orderNum: 2, type: 'material', durationSec: null, isPreview: false, status: 'locked' },
        { id: 'l-012', moduleId: 'm-004', title: 'Quiz finale', description: 'Test finale per ottenere il certificato', orderNum: 3, type: 'quiz', durationSec: null, isPreview: false, status: 'locked' },
      ],
    },
  ],
};

// ── Learning Objectives (per course) ────────────────

export const PLACEHOLDER_OBJECTIVES: Record<string, string[]> = {
  'esportare-ifc-da-revit': [
    'Configurare correttamente le classi IFC in Revit',
    'Creare mapping set personalizzati per ogni disciplina',
    'Impostare export IFC conformi alla ISO 16739',
    'Validare i file IFC con strumenti gratuiti',
    'Produrre IFC compatibili con i requisiti delle stazioni appaltanti',
    'Risolvere i problemi più comuni nell\'export IFC',
  ],
};

// ── Materials (per course) ──────────────────────────

export const PLACEHOLDER_MATERIALS: Record<string, CourseMaterial[]> = {
  'esportare-ifc-da-revit': [
    { title: 'Template Mapping IFC v2', format: 'XLSX', sizeLabel: '145 KB' },
    { title: 'Progetto Revit di esempio', format: 'RVT', sizeLabel: '32 MB' },
    { title: 'Checklist Qualità IFC', format: 'PDF', sizeLabel: '820 KB' },
    { title: 'Slide del corso', format: 'PDF', sizeLabel: '4.2 MB' },
  ],
};

// ── Enrolled Courses (I Miei Corsi) ─────────────────

export const PLACEHOLDER_ENROLLED: EnrolledCourse[] = [
  {
    courseId: 'c-001',
    slug: 'esportare-ifc-da-revit',
    title: 'Esportare correttamente un IFC da Revit',
    area: 'SW',
    emoji: '🏗️',
    currentModule: 'Modulo 1 · Lez. 1.2',
    progress: 68,
    isCompleted: false,
  },
  {
    courseId: 'c-007',
    slug: 'allegato-i9-spiegato',
    title: "L'Allegato I.9 spiegato ai tecnici",
    area: 'NL',
    emoji: '📜',
    currentModule: 'Modulo 1 · Lez. 1.1',
    progress: 35,
    isCompleted: false,
  },
  {
    courseId: 'c-011',
    slug: 'dynamo-con-claude-code',
    title: 'Sviluppare uno script Dynamo mediante Claude Code',
    area: 'AI',
    emoji: '🤖',
    currentModule: 'Modulo 4 · Lez. 4.2',
    progress: 82,
    isCompleted: false,
  },
  {
    courseId: 'c-012',
    slug: 'preparazione-certificazione-bim',
    title: "Preparazione all'esame di certificazione BIM",
    area: 'PG',
    emoji: '🎓',
    currentModule: 'Modulo 2 · Lez. 2.1',
    progress: 22,
    isCompleted: false,
  },
  {
    courseId: 'c-008',
    slug: 'linee-guida-mit-bim',
    title: 'Le nuove Linee Guida MIT sul BIM',
    area: 'NL',
    emoji: '🏛️',
    currentModule: 'Completato',
    progress: 100,
    isCompleted: true,
  },
  {
    courseId: 'c-010',
    slug: 'quale-versione-ifc',
    title: 'Quale versione di IFC scegliere?',
    area: 'OB',
    emoji: '📐',
    currentModule: 'Completato',
    progress: 100,
    isCompleted: true,
  },
];

// ── Certificates ────────────────────────────────────

export const PLACEHOLDER_CERTIFICATES: CertificateDisplay[] = [
  {
    id: 'cert-001',
    courseName: 'Le nuove Linee Guida MIT sul BIM',
    issuedAt: '12 Febbraio 2026',
    verifyCode: 'ACA-MIT2026-7F3K',
    emoji: '🏛️',
  },
  {
    id: 'cert-002',
    courseName: 'Quale versione di IFC scegliere?',
    issuedAt: '28 Gennaio 2026',
    verifyCode: 'ACA-IFC2026-2P9X',
    emoji: '📐',
  },
];
