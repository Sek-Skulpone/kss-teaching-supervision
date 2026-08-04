// Firebase Database Connector (Cloud Firestore)
// Optimized with single-document collections to minimize read/write count (completely free-tier safe)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
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

const ensureDBLoaded = async (force = false) => {
  const now = Date.now();
  if (!force && dbCache.teachers && dbCache.supervisions && dbCache.termPlans && dbCache.plcLogs && (now - dbCache.lastLoaded < cacheTimeout)) {
    return dbCache;
  }
  
  if (!isFirebaseInitialized) {
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    const plcLogs = safeJsonParse(localStorage.getItem('ks_plc_logs'), []);
    dbCache = { teachers, supervisions, termPlans, plcLogs, lastLoaded: now };
    return dbCache;
  }
  
  try {
    // Parallel fetch from Firestore
    const [teachersSnap, supervisionsSnap, termPlansSnap, plcLogsSnap] = await Promise.all([
      getDoc(doc(db, "system_db", "teachers")),
      getDoc(doc(db, "system_db", "supervisions")),
      getDoc(doc(db, "system_db", "term_plans")),
      getDoc(doc(db, "system_db", "plc_logs"))
    ]);
    
    let teachers = SEED_USERS;
    let supervisions = [];
    let termPlans = [];
    let plcLogs = [];
    
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

    // Process PLC Logs
    if (plcLogsSnap.exists()) {
      plcLogs = plcLogsSnap.data().list || [];
    } else {
      await setDoc(doc(db, "system_db", "plc_logs"), { list: [] });
    }
    
    dbCache = { teachers, supervisions, termPlans, plcLogs, lastLoaded: now };
    
    // Cache locally
    localStorage.setItem('ks_teachers', JSON.stringify(teachers));
    localStorage.setItem('ks_supervisions', JSON.stringify(supervisions));
    localStorage.setItem('ks_term_plans', JSON.stringify(termPlans));
    localStorage.setItem('ks_plc_logs', JSON.stringify(plcLogs));
    
    return dbCache;
  } catch (e) {
    console.warn("Firestore fetch failed, using local storage cache:", e);
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    const plcLogs = safeJsonParse(localStorage.getItem('ks_plc_logs'), []);
    dbCache = { teachers, supervisions, termPlans, plcLogs, lastLoaded: now };
    return dbCache;
  }
};

const byteSizeOf = (value) => new TextEncoder().encode(JSON.stringify(value)).length;

// Maps the Firestore document name to the dbCache property it's stored under.
const CACHE_KEY_BY_DATATYPE = {
  teachers: 'teachers',
  supervisions: 'supervisions',
  term_plans: 'termPlans',
  plc_logs: 'plcLogs'
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

export const getSupervisions = async () => {
  const dbData = await ensureDBLoaded();
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

export const getPlcLogs = async () => {
  const dbData = await ensureDBLoaded();
  return dbData.plcLogs;
};

export const addPlcLog = async (logData) => {
  const newLog = {
    id: `plc-${crypto.randomUUID()}`,
    submittedAt: new Date().toISOString(),
    ...logData
  };
  const { success } = await mutateCollection('plc_logs', (list) => [...list, newLog]);
  return success ? newLog : null;
};

export const updatePlcLog = async (logId, updatedFields) => {
  const { success } = await mutateCollection('plc_logs', (list) =>
    list.map(log => (log.id === logId ? { ...log, ...updatedFields, updatedAt: new Date().toISOString() } : log))
  );
  return success;
};

export const deletePlcLog = async (logId) => {
  const { success } = await mutateCollection('plc_logs', (list) => list.filter(log => log.id !== logId));
  return success;
};

export const updateTeacherPlcGroup = async (teacherId, plcGroup) => {
  const { success } = await mutateCollection('teachers', (list) =>
    list.map(t => (t.id === teacherId ? { ...t, plcGroup } : t))
  );
  return success;
};
