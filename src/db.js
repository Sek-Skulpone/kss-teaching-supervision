// Firebase Database Connector (Cloud Firestore)
// Optimized with single-document collections to minimize read/write count (completely free-tier safe)
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  documentId,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { hashPassword } from './utils/auth';

// NOTE: this config is not a secret — Firebase's own docs confirm the client
// config is safe to expose (https://firebase.google.com/docs/projects/api-keys).
// The actual access boundary must come from Firestore Security Rules, which
// require access to the Firebase Console to deploy and are NOT yet configured
// for this project. See README "Security" section for details/next steps.
const firebaseConfig = {
  apiKey: "AIzaSyCFPxEX5OvBTog0Qy00Y7Vup11p9fmURS8",
  authDomain: "kss-teaching-supervision.firebaseapp.com",
  projectId: "kss-teaching-supervision",
  storageBucket: "kss-teaching-supervision.firebasestorage.app",
  messagingSenderId: "94865568066",
  appId: "1:94865568066:web:200ca94ef554bbed8f18db",
  measurementId: "G-L8MVMQ610L"
};

// Firestore has a 1 MiB per-document limit; these collections are stored as a
// single document each, so guard writes instead of failing/losing data silently.
const MAX_DOC_BYTES = 900 * 1024;

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: hashPassword('123'), name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: hashPassword('123'), name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: hashPassword('123'), name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: hashPassword('123'), name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: hashPassword('123'), name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: hashPassword('123'), name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: hashPassword('123'), name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

// Helper to safely parse JSON strings
const safeJsonParse = (str, fallback) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// Initialize Firebase
let app;
let db;
let isFirebaseInitialized = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase Cloud Firestore successfully connected.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.warn("Using offline LocalStorage mode. Paste your firebaseConfig in src/db.js to sync online.");
}

// Memory cache
let dbCache = {
  teachers: null,
  supervisions: null,
  termPlans: null,
  plcLogs: null,
  lastLoaded: 0
};

const cacheTimeout = 1000; // 1 second cache window

// NOTE: plcLogs are deliberately NOT part of this bulk load. They carry
// embedded base64 photos (hundreds of KB) and are only needed on the PLC
// tabs, so they're fetched separately/on demand by getPlcLogs() instead of
// being downloaded on every page load just to render the calendar.
const ensureDBLoaded = async (force = false) => {
  const now = Date.now();
  if (!force && dbCache.teachers && dbCache.supervisions && dbCache.termPlans && (now - dbCache.lastLoaded < cacheTimeout)) {
    return dbCache;
  }

  if (!isFirebaseInitialized) {
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };
    return dbCache;
  }

  try {
    // Parallel fetch from Firestore
    const [teachersSnap, supervisionsSnap, termPlansSnap] = await Promise.all([
      getDoc(doc(db, "system_db", "teachers")),
      getDoc(doc(db, "system_db", "supervisions")),
      getDoc(doc(db, "system_db", "term_plans"))
    ]);

    let teachers = SEED_USERS;
    let supervisions = [];
    let termPlans = [];

    // Process Teachers
    if (teachersSnap.exists()) {
      teachers = teachersSnap.data().list || SEED_USERS;
    } else {
      await setDoc(doc(db, "system_db", "teachers"), { list: SEED_USERS });
    }

    // Process Supervisions
    if (supervisionsSnap.exists()) {
      supervisions = supervisionsSnap.data().list || [];
    } else {
      await setDoc(doc(db, "system_db", "supervisions"), { list: [] });
    }

    // Process Term Plans
    if (termPlansSnap.exists()) {
      termPlans = termPlansSnap.data().list || [];
    } else {
      await setDoc(doc(db, "system_db", "term_plans"), { list: [] });
    }

    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };

    // Cache locally
    localStorage.setItem('ks_teachers', JSON.stringify(teachers));
    localStorage.setItem('ks_supervisions', JSON.stringify(supervisions));
    localStorage.setItem('ks_term_plans', JSON.stringify(termPlans));

    return dbCache;
  } catch (e) {
    console.warn("Firestore fetch failed, using local storage cache:", e);
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };
    return dbCache;
  }
};

const byteSizeOf = (value) => new TextEncoder().encode(JSON.stringify(value)).length;

// Maps the Firestore document name to the dbCache property it's stored under.
// (plc_logs is absent on purpose -- it uses per-document storage, not the
// single-array-document pattern these helpers implement. See section 5.)
const CACHE_KEY_BY_DATATYPE = {
  teachers: 'teachers',
  supervisions: 'supervisions',
  term_plans: 'termPlans'
};

// Atomically read-modify-write a collection using a Firestore transaction, so
// two clients writing around the same time can't silently drop each other's
// change (the old code read a cached array, mutated it, then blindly
// overwrote the whole document). `mutateFn` receives the latest array
// straight from Firestore and must return the new array.
const mutateCollection = async (datatype, mutateFn) => {
  const cacheKey = CACHE_KEY_BY_DATATYPE[datatype];

  if (!isFirebaseInitialized) {
    const dbData = await ensureDBLoaded();
    const nextList = mutateFn(dbData[cacheKey] || []);
    dbData[cacheKey] = nextList;
    localStorage.setItem(`ks_${datatype}`, JSON.stringify(nextList));
    return { success: true, list: nextList };
  }

  try {
    const ref = doc(db, "system_db", datatype);
    const nextList = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const currentList = snap.exists() ? (snap.data().list || []) : [];
      const updatedList = mutateFn(currentList);
      const payload = { list: updatedList };

      const size = byteSizeOf(payload);
      if (size > MAX_DOC_BYTES) {
        throw new Error(
          `ข้อมูล "${datatype}" มีขนาดใหญ่เกินไป (${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
          `ไม่สามารถบันทึกได้ กรุณาลบรูปภาพหรือไฟล์แนบเก่าออกก่อนบันทึกรายการใหม่`
        );
      }

      transaction.set(ref, payload);
      return updatedList;
    });

    dbCache[cacheKey] = nextList;
    dbCache.lastLoaded = Date.now();
    localStorage.setItem(`ks_${datatype}`, JSON.stringify(nextList));
    return { success: true, list: nextList };
  } catch (e) {
    console.error(`Failed to save ${datatype} to Firestore:`, e);
    return { success: false, list: null, error: e };
  }
};

/* ==========================================================================
   1. USER / PERSONNEL MANAGEMENT
   ========================================================================== */

export const getUsers = async () => {
  const dbData = await ensureDBLoaded();
  return dbData.teachers;
};

export const addTeacher = async (teacherData) => {
  const newTeacher = {
    id: `teacher-${crypto.randomUUID()}`,
    ...teacherData,
    ...(teacherData.password ? { password: hashPassword(teacherData.password) } : {})
  };
  const { success } = await mutateCollection('teachers', (list) => [...list, newTeacher]);
  return success ? newTeacher : null;
};

export const deleteTeacher = async (teacherId) => {
  const { success } = await mutateCollection('teachers', (list) => list.filter(t => t.id !== teacherId));
  return success;
};

export const updateTeacher = async (teacherId, updatedFields) => {
  const fields = updatedFields.password
    ? { ...updatedFields, password: hashPassword(updatedFields.password) }
    : updatedFields;
  const { success } = await mutateCollection('teachers', (list) =>
    list.map(t => (t.id === teacherId ? { ...t, ...fields } : t))
  );
  return success;
};


/* ==========================================================================
   2. SUPERVISION BOOKINGS
   ========================================================================== */

// Moves photos that older evaluations stored inline out into the per-
// supervision photo documents, shrinking the shared supervisions document
// (see EVAL_IMG_PREFIX below for why). Runs at most once per page session,
// and only actually writes if inline photos are still present.
let inlineEvalImagesChecked = false;
const migrateInlineEvaluationImages = async (supervisions) => {
  if (inlineEvalImagesChecked || !isFirebaseInitialized) return false;
  inlineEvalImagesChecked = true;

  const needing = supervisions.filter(s =>
    Object.values(s.evaluations || {}).some(ev => Array.isArray(ev.images) && ev.images.length > 0)
  );
  if (needing.length === 0) return false;

  try {
    for (const sup of needing) {
      for (const [supervisorId, ev] of Object.entries(sup.evaluations || {})) {
        if (Array.isArray(ev.images) && ev.images.length > 0) {
          await writeEvaluationImages(sup.id, supervisorId, ev.images);
        }
      }
    }

    // Strip the now-duplicated inline photos from the supervisions document.
    await mutateCollection('supervisions', (list) =>
      list.map(s => {
        if (!needing.some(n => n.id === s.id)) return s;
        const evaluations = {};
        Object.entries(s.evaluations || {}).forEach(([id, ev]) => {
          const { images, ...rest } = ev;
          evaluations[id] = { ...rest, imageCount: Array.isArray(images) ? images.length : (ev.imageCount || 0) };
        });
        return { ...s, evaluations };
      })
    );
    console.log(`Moved inline evaluation photos out of ${needing.length} supervision(s).`);
    return true;
  } catch (e) {
    // Non-fatal: the app still works with photos inline, it just stays large.
    console.warn('Could not move inline evaluation images:', e);
    return false;
  }
};

export const getSupervisions = async () => {
  const dbData = await ensureDBLoaded();
  if (await migrateInlineEvaluationImages(dbData.supervisions)) {
    const refreshed = await ensureDBLoaded(true);
    return refreshed.supervisions;
  }
  return dbData.supervisions;
};

export const addSupervision = async (supervision) => {
  const newSupervision = {
    id: `sup-${crypto.randomUUID()}`,
    status: 'pending',
    supervisors: [],
    volunteerId: '',
    volunteerName: '',
    postTeachingRecord: null,
    ...supervision
  };
  const { success } = await mutateCollection('supervisions', (list) => [...list, newSupervision]);
  return success ? newSupervision : null;
};

export const updateSupervision = async (supervisionId, updatedFields) => {
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId ? { ...s, ...updatedFields } : s))
  );
  return success;
};

export const deleteSupervision = async (supervisionId) => {
  const { success } = await mutateCollection('supervisions', (list) => list.filter(s => s.id !== supervisionId));

  // Remove the companion photo document so deleted supervisions don't leave
  // their evaluation images behind (see EVAL_IMG_PREFIX below).
  if (success && isFirebaseInitialized) {
    try {
      await deleteDoc(doc(db, 'system_db', `evalimg_${supervisionId}`));
    } catch (e) {
      console.warn('Supervision deleted but its evaluation images could not be removed:', e);
    }
  }
  localStorage.removeItem(`ks_evalimg_${supervisionId}`);
  return success;
};

export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, status: 'pending_approval', volunteerId: teacherId, volunteerName: teacherName }
      : s))
  );
  return success;
};

export const approveVolunteer = async (supervisionId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId && s.volunteerId) {
        matched = true;
        const supervisors = [...(s.supervisors || [])];
        if (!supervisors.some(sup => sup.id === s.volunteerId)) {
          supervisors.push({ id: s.volunteerId, name: s.volunteerName });
        }
        const status = supervisors.length >= 2 ? 'approved' : 'pending';
        return { ...s, status, supervisors, volunteerId: '', volunteerName: '' };
      }
      return s;
    })
  );
  return matched && success;
};

export const rejectVolunteer = async (supervisionId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId) {
        matched = true;
        const supervisorsCount = s.supervisors ? s.supervisors.length : 0;
        const status = supervisorsCount >= 2 ? 'approved' : 'pending';
        return { ...s, status, volunteerId: '', volunteerName: '' };
      }
      return s;
    })
  );
  return matched && success;
};

export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId) {
        matched = true;
        const supervisors = [...(s.supervisors || [])];
        if (!supervisors.some(sup => sup.id === supervisorId)) {
          supervisors.push({ id: supervisorId, name: supervisorName });
        }
        const status = supervisors.length >= 2 ? 'approved' : 'pending';
        const res = { ...s, status, supervisors };
        if (s.volunteerId === supervisorId) {
          res.volunteerId = '';
          res.volunteerName = '';
        }
        return res;
      }
      return s;
    })
  );
  return matched && success;
};

export const removeSupervisor = async (supervisionId, supervisorId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId) {
        matched = true;
        const supervisors = (s.supervisors || []).filter(sup => sup.id !== supervisorId);
        let status = s.status;
        if (supervisors.length >= 2) {
          status = 'approved';
        } else if (s.status !== 'completed') {
          status = 'pending';
        }
        return { ...s, status, supervisors };
      }
      return s;
    })
  );
  return matched && success;
};

// Records ONE supervisor's evaluation, merging it into whatever evaluations
// already exist on the record.
//
// This must merge server-side, inside mutateCollection's Firestore
// transaction, rather than having the caller send a pre-merged
// `evaluations` object. Each committee member's browser holds a snapshot of
// the supervision taken when their page last loaded; if two members evaluate
// the same lesson, the second one to save would otherwise write back a
// snapshot that predates the first member's submission and silently erase
// it -- which is why supervisions with several committee members were only
// ever showing a single evaluation.
// Evaluation photos are stored OUTSIDE the supervisions document, one photo
// document per supervision at `system_db/evalimg_<supervisionId>`, shaped as
// { images: { [supervisorId]: [dataUrl, ...] } }.
//
// Two reasons, both measured against real data:
//   * Ceiling. A single evaluation with 4 photos measured ~187KB. The whole
//     supervisions collection lives in ONE Firestore document capped at
//     1 MiB, and every supervision has a 3-person committee, so a handful of
//     evaluated lessons would exceed it and block all further saves.
//   * Load cost. The supervisions document is fetched on EVERY page view to
//     draw the calendar. Keeping photos inline meant downloading every
//     evaluation photo in the school just to see the month grid.
// Keeping only the text and ratings inline leaves the supervisions document
// small and lets photos be fetched on demand by the report screens.
const EVAL_IMG_PREFIX = 'evalimg_';
const evalImgDocId = (supervisionId) => `${EVAL_IMG_PREFIX}${supervisionId}`;

/** Returns { [supervisorId]: [dataUrl, ...] } for one supervision. */
export const getEvaluationImages = async (supervisionId) => {
  if (!isFirebaseInitialized) {
    return safeJsonParse(localStorage.getItem(`ks_evalimg_${supervisionId}`), {});
  }
  try {
    const snap = await getDoc(doc(db, 'system_db', evalImgDocId(supervisionId)));
    const images = snap.exists() ? (snap.data().images || {}) : {};
    try {
      localStorage.setItem(`ks_evalimg_${supervisionId}`, JSON.stringify(images));
    } catch { /* quota - the local mirror is optional */ }
    return images;
  } catch (e) {
    console.warn('Failed to load evaluation images, using local cache:', e);
    return safeJsonParse(localStorage.getItem(`ks_evalimg_${supervisionId}`), {});
  }
};

// Writes one supervisor's photos into the supervision's photo document,
// leaving other supervisors' photos untouched.
const writeEvaluationImages = async (supervisionId, supervisorId, images) => {
  const ref = doc(db, 'system_db', evalImgDocId(supervisionId));
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists() ? (snap.data().images || {}) : {};
    const next = { ...current };
    if (images && images.length > 0) {
      next[supervisorId] = images;
    } else {
      delete next[supervisorId];
    }

    const payload = { images: next };
    const size = byteSizeOf(payload);
    if (size > MAX_DOC_BYTES) {
      throw new Error(
        `รูปภาพประกอบการนิเทศของรายการนี้มีขนาดรวมใหญ่เกินไป ` +
        `(${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
        `กรุณาลดจำนวนรูปภาพลงแล้วบันทึกใหม่อีกครั้ง`
      );
    }
    transaction.set(ref, payload);
  });
  localStorage.removeItem(`ks_evalimg_${supervisionId}`);
};

export const submitEvaluation = async (supervisionId, supervisorId, evaluation) => {
  const { images = [], ...evaluationText } = evaluation;

  if (isFirebaseInitialized) {
    try {
      await writeEvaluationImages(supervisionId, supervisorId, images);
    } catch (e) {
      console.error('Failed to save evaluation images:', e);
      return false;
    }
  }

  // Stored without the photo payload; imageCount lets the UI show how many
  // there are without having to fetch them.
  const stored = { ...evaluationText, imageCount: images.length };

  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, evaluations: { ...(s.evaluations || {}), [supervisorId]: stored } }
      : s))
  );
  return success;
};

// Removes ONE supervisor's evaluation. Merged server-side inside the
// transaction for the same reason submitEvaluation is (see above): deleting
// via a client-held snapshot would resurrect or erase other members' entries.
export const deleteEvaluation = async (supervisionId, supervisorId) => {
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id !== supervisionId) return s;
      const remaining = { ...(s.evaluations || {}) };
      delete remaining[supervisorId];
      return { ...s, evaluations: remaining };
    })
  );

  // Drop the photos too, so removing an evaluation doesn't leave its images
  // orphaned in the photo document forever.
  if (success && isFirebaseInitialized) {
    try {
      await writeEvaluationImages(supervisionId, supervisorId, []);
    } catch (e) {
      console.warn('Evaluation removed but its images could not be cleaned up:', e);
    }
  }
  return success;
};

export const submitPostTeachingRecord = async (supervisionId, record) => {
  const fullRecord = {
    ...record,
    submittedAt: new Date().toISOString()
  };
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, status: 'completed', postTeachingRecord: fullRecord }
      : s))
  );
  return success;
};

/* ==========================================================================
   3. TERM LESSON PLANS ARCHIVE
   ========================================================================== */

export const getTermPlans = async () => {
  const dbData = await ensureDBLoaded();
  return dbData.termPlans;
};

export const addTermPlan = async (planData) => {
  const newPlan = {
    id: `plan-${crypto.randomUUID()}`,
    postLessonRecord: null,
    submittedAt: new Date().toISOString(),
    ...planData
  };
  const { success } = await mutateCollection('term_plans', (list) => [...list, newPlan]);
  return success ? newPlan : null;
};

export const updateTermPlan = async (planId, updatedFields) => {
  const { success } = await mutateCollection('term_plans', (list) =>
    list.map(p => (p.id === planId ? { ...p, ...updatedFields } : p))
  );
  return success;
};

export const deleteTermPlan = async (planId) => {
  const { success } = await mutateCollection('term_plans', (list) => list.filter(p => p.id !== planId));
  return success;
};

/* ==========================================================================
   4. SYSTEM SETTINGS (POSITIONS & DEPARTMENTS)
   ========================================================================== */

const defaultSettings = {
  positions: ['ครูผู้ช่วย', 'ครู', 'ครูชำนาญการ', 'ครูชำนาญการพิเศษ', 'ครูเชี่ยวชาญ', 'หัวหน้างานวิชาการ', 'ผู้อำนวยการโรงเรียน', 'รองผู้อำนวยการโรงเรียน'],
  departments: [
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ'
  ],
  plcGroups: [
    'กลุ่ม PLC คณิตศาสตร์',
    'กลุ่ม PLC ภาษาต่างประเทศ',
    'กลุ่ม PLC วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่ม PLC ภาษาไทย',
    'กลุ่ม PLC สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่ม PLC ศิลปะ',
    'กลุ่ม PLC สุขศึกษาและพลศึกษา',
    'กลุ่ม PLC การงานอาชีพ'
  ],
  academicYears: ['2567', '2568', '2569'],
  currentAcademicYear: '2569'
};

const mergeSettingsWithDefaults = (settingsObj) => {
  return {
    ...defaultSettings,
    ...settingsObj
  };
};

export const getSystemSettings = async () => {
  if (!isFirebaseInitialized) {
    const local = localStorage.getItem('ks_settings');
    return local ? mergeSettingsWithDefaults(safeJsonParse(local, {})) : defaultSettings;
  }
  
  try {
    const docRef = doc(db, "system_db", "settings");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() || defaultSettings;
      const merged = mergeSettingsWithDefaults(data);
      localStorage.setItem('ks_settings', JSON.stringify(merged));
      return merged;
    } else {
      await setDoc(docRef, defaultSettings);
      localStorage.setItem('ks_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
  } catch (err) {
    console.warn("Failed to load settings from Firebase, using cache:", err);
    const local = localStorage.getItem('ks_settings');
    return local ? mergeSettingsWithDefaults(safeJsonParse(local, {})) : defaultSettings;
  }
};

export const updateSystemSettings = async (newSettings) => {
  localStorage.setItem('ks_settings', JSON.stringify(newSettings));
  
  if (!isFirebaseInitialized) {
    return true;
  }
  
  try {
    await setDoc(doc(db, "system_db", "settings"), newSettings);
    return true;
  } catch (e) {
    console.error("Failed to update settings in Firebase:", e);
    return false;
  }
};

/* ==========================================================================
   5. PLC LOGS MANAGEMENT
   ========================================================================== */

// PLC logs are stored as ONE FIRESTORE DOCUMENT PER LOG, unlike the other
// collections which pack everything into a single `system_db/<name>` document.
//
// Why: each log embeds up to 4 base64 photos (~50-100KB each). Firestore caps
// a single document at 1 MiB, so packing every teacher's logs into one array
// document hits a hard ceiling fast -- with 33 teachers x 4 PLC cycles the
// collection would need ~50 MB. Per-document storage means the 1 MiB limit
// applies to a single log (comfortably under it) instead of to all of them
// combined, which removes the ceiling entirely.
// Each log lives at `system_db/plclog_<id>` -- deliberately a document inside
// the existing system_db collection rather than a new top-level collection,
// so it keeps working under Firestore rules scoped to `match /system_db/{docId}`
// without needing a rules change deployed first.
const PLC_DOC_PREFIX = 'plclog_';
const plcDocId = (logId) => `${PLC_DOC_PREFIX}${logId}`;
const LEGACY_PLC_DOC = ['system_db', 'plc_logs'];
const PLC_MIGRATION_DOC = ['system_db', 'plc_logs_migration'];

const readLocalPlcLogs = () => safeJsonParse(localStorage.getItem('ks_plc_logs'), []);

const cachePlcLogsLocally = (logs) => {
  try {
    localStorage.setItem('ks_plc_logs', JSON.stringify(logs));
  } catch (e) {
    // Photos can push this past the ~5MB localStorage quota. The offline
    // mirror is a nice-to-have, so degrade rather than break the save.
    console.warn('Could not cache PLC logs locally (quota?):', e);
  }
};

// One-time move of any logs still living in the legacy single-document array
// into the per-document collection. Non-destructive: the legacy document is
// left untouched as a backup, and a marker document prevents re-running (so
// legitimately deleted logs don't get resurrected on the next load).
const migrateLegacyPlcLogs = async () => {
  const markerRef = doc(db, ...PLC_MIGRATION_DOC);
  const markerSnap = await getDoc(markerRef);
  if (markerSnap.exists() && markerSnap.data().done) return;

  const legacySnap = await getDoc(doc(db, ...LEGACY_PLC_DOC));
  const legacyLogs = legacySnap.exists() ? (legacySnap.data().list || []) : [];

  if (legacyLogs.length > 0) {
    // Firestore batches cap at 500 writes; PLC logs will never approach that,
    // but chunk anyway so this stays correct as data grows.
    for (let i = 0; i < legacyLogs.length; i += 400) {
      const batch = writeBatch(db);
      legacyLogs.slice(i, i + 400).forEach(log => {
        batch.set(doc(db, 'system_db', plcDocId(log.id)), log);
      });
      await batch.commit();
    }
    console.log(`Migrated ${legacyLogs.length} PLC log(s) to per-document storage.`);
  }

  await setDoc(markerRef, { done: true, migratedAt: new Date().toISOString(), count: legacyLogs.length });
};

export const getPlcLogs = async () => {
  if (!isFirebaseInitialized) return readLocalPlcLogs();

  try {
    await migrateLegacyPlcLogs();
    // Document-ID range query bounded by the shared prefix, so this reads only
    // the PLC log documents and not the large packed array documents that
    // share the system_db collection.  is the conventional high sentinel
    // for Firestore prefix queries -- it sorts after any realistic id suffix.
    const snap = await getDocs(query(
      collection(db, 'system_db'),
      where(documentId(), '>=', PLC_DOC_PREFIX),
      where(documentId(), '<=', `${PLC_DOC_PREFIX}`)
    ));
    const logs = snap.docs.map(d => d.data());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return logs;
  } catch (e) {
    console.warn('Failed to load PLC logs from Firestore, using local cache:', e);
    return readLocalPlcLogs();
  }
};

// Guards a single log document against Firestore's 1 MiB per-document limit.
const assertPlcLogFits = (log) => {
  const size = byteSizeOf(log);
  if (size > MAX_DOC_BYTES) {
    throw new Error(
      `บันทึก PLC นี้มีขนาดใหญ่เกินไป (${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
      `กรุณาลดจำนวนรูปภาพลงแล้วบันทึกใหม่อีกครั้ง`
    );
  }
};

export const addPlcLog = async (logData) => {
  const newLog = {
    id: `plc-${crypto.randomUUID()}`,
    submittedAt: new Date().toISOString(),
    ...logData
  };

  if (!isFirebaseInitialized) {
    const logs = [...readLocalPlcLogs(), newLog];
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return newLog;
  }

  try {
    assertPlcLogFits(newLog);
    await setDoc(doc(db, 'system_db', plcDocId(newLog.id)), newLog);
    const logs = [...(dbCache.plcLogs || readLocalPlcLogs()), newLog];
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return newLog;
  } catch (e) {
    console.error('Failed to add PLC log:', e);
    return null;
  }
};

export const updatePlcLog = async (logId, updatedFields) => {
  const applyLocally = (logs) =>
    logs.map(log => (log.id === logId ? { ...log, ...updatedFields, updatedAt: new Date().toISOString() } : log));

  if (!isFirebaseInitialized) {
    const logs = applyLocally(readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  }

  try {
    const ref = doc(db, 'system_db', plcDocId(logId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const updated = { ...snap.data(), ...updatedFields, updatedAt: new Date().toISOString() };
    assertPlcLogFits(updated);
    await setDoc(ref, updated);

    const logs = applyLocally(dbCache.plcLogs || readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  } catch (e) {
    console.error('Failed to update PLC log:', e);
    return false;
  }
};

export const deletePlcLog = async (logId) => {
  const removeLocally = (logs) => logs.filter(log => log.id !== logId);

  if (!isFirebaseInitialized) {
    const logs = removeLocally(readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  }

  try {
    await deleteDoc(doc(db, 'system_db', plcDocId(logId)));
    const logs = removeLocally(dbCache.plcLogs || readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  } catch (e) {
    console.error('Failed to delete PLC log:', e);
    return false;
  }
};

export const updateTeacherPlcGroup = async (teacherId, plcGroup) => {
  const { success } = await mutateCollection('teachers', (list) =>
    list.map(t => (t.id === teacherId ? { ...t, plcGroup } : t))
  );
  return success;
};
