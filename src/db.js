// Firebase Database Connector (Cloud Firestore)
// Optimized with single-document collections to minimize read/write count (completely free-tier safe)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCFPxEX5OvBTog0Qy00Y7Vup11p9fmURS8",
  authDomain: "kss-teaching-supervision.firebaseapp.com",
  projectId: "kss-teaching-supervision",
  storageBucket: "kss-teaching-supervision.firebasestorage.app",
  messagingSenderId: "94865568066",
  appId: "1:94865568066:web:200ca94ef554bbed8f18db",
  measurementId: "G-L8MVMQ610L"
};

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: '123', name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: '123', name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: '123', name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: '123', name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: '123', name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: '123', name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: '123', name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

// Helper to safely parse JSON strings
const safeJsonParse = (str, fallback) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
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

const saveCollection = async (datatype, dataArray) => {
  localStorage.setItem(`ks_${datatype}`, JSON.stringify(dataArray));
  
  if (!isFirebaseInitialized) {
    return true;
  }
  
  try {
    await setDoc(doc(db, "system_db", datatype), { list: dataArray });
    return true;
  } catch (e) {
    console.error(`Failed to save ${datatype} to Firestore:`, e);
    return false;
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
  const dbData = await ensureDBLoaded();
  const newTeacher = {
    id: `teacher-${Date.now()}`,
    ...teacherData
  };
  dbData.teachers.push(newTeacher);
  const success = await saveCollection('teachers', dbData.teachers);
  return success ? newTeacher : null;
};

export const deleteTeacher = async (teacherId) => {
  const dbData = await ensureDBLoaded();
  dbData.teachers = dbData.teachers.filter(t => t.id !== teacherId);
  const success = await saveCollection('teachers', dbData.teachers);
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
  const dbData = await ensureDBLoaded();
  const newSupervision = {
    id: `sup-${Date.now()}`,
    status: 'pending',
    supervisors: [],
    volunteerId: '',
    volunteerName: '',
    postTeachingRecord: null,
    ...supervision
  };
  
  dbData.supervisions.push(newSupervision);
  const success = await saveCollection('supervisions', dbData.supervisions);
  return success ? newSupervision : null;
};

export const updateSupervision = async (supervisionId, updatedFields) => {
  const dbData = await ensureDBLoaded();
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      return { ...s, ...updatedFields };
    }
    return s;
  });
  const success = await saveCollection('supervisions', dbData.supervisions);
  return success;
};

export const deleteSupervision = async (supervisionId) => {
  const dbData = await ensureDBLoaded();
  dbData.supervisions = dbData.supervisions.filter(s => s.id !== supervisionId);
  const success = await saveCollection('supervisions', dbData.supervisions);
  return success;
};

export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  const dbData = await ensureDBLoaded();
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      return {
        ...s,
        status: 'pending_approval',
        volunteerId: teacherId,
        volunteerName: teacherName
      };
    }
    return s;
  });
  const success = await saveCollection('supervisions', dbData.supervisions);
  return success;
};

export const approveVolunteer = async (supervisionId) => {
  const dbData = await ensureDBLoaded();
  let success = false;
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId && s.volunteerId) {
      const supervisors = [...(s.supervisors || [])];
      if (!supervisors.some(sup => sup.id === s.volunteerId)) {
        supervisors.push({ id: s.volunteerId, name: s.volunteerName });
      }
      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      success = true;
      return {
        ...s,
        status: status,
        supervisors: supervisors,
        volunteerId: '',
        volunteerName: ''
      };
    }
    return s;
  });
  if (success) {
    await saveCollection('supervisions', dbData.supervisions);
    return true;
  }
  return false;
};

export const rejectVolunteer = async (supervisionId) => {
  const dbData = await ensureDBLoaded();
  let success = false;
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      const supervisorsCount = s.supervisors ? s.supervisors.length : 0;
      const status = supervisorsCount >= 2 ? 'approved' : 'pending';
      success = true;
      return {
        ...s,
        status: status,
        volunteerId: '',
        volunteerName: ''
      };
    }
    return s;
  });
  if (success) {
    await saveCollection('supervisions', dbData.supervisions);
    return true;
  }
  return false;
};

export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
  const dbData = await ensureDBLoaded();
  let success = false;
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      const supervisors = [...(s.supervisors || [])];
      if (!supervisors.some(sup => sup.id === supervisorId)) {
        supervisors.push({ id: supervisorId, name: supervisorName });
      }
      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      success = true;
      
      const res = {
        ...s,
        status: status,
        supervisors: supervisors
      };
      if (s.volunteerId === supervisorId) {
        res.volunteerId = '';
        res.volunteerName = '';
      }
      return res;
    }
    return s;
  });
  if (success) {
    await saveCollection('supervisions', dbData.supervisions);
    return true;
  }
  return false;
};

export const removeSupervisor = async (supervisionId, supervisorId) => {
  const dbData = await ensureDBLoaded();
  let success = false;
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      const supervisors = (s.supervisors || []).filter(sup => sup.id !== supervisorId);
      let status = s.status;
      if (supervisors.length >= 2) {
        status = 'approved';
      } else {
        if (s.status !== 'completed') {
          status = 'pending';
        }
      }
      success = true;
      return {
        ...s,
        status: status,
        supervisors: supervisors
      };
    }
    return s;
  });
  if (success) {
    await saveCollection('supervisions', dbData.supervisions);
    return true;
  }
  return false;
};

export const submitPostTeachingRecord = async (supervisionId, record) => {
  const dbData = await ensureDBLoaded();
  const fullRecord = {
    ...record,
    submittedAt: new Date().toISOString()
  };
  dbData.supervisions = dbData.supervisions.map(s => {
    if (s.id === supervisionId) {
      return {
        ...s,
        status: 'completed',
        postTeachingRecord: fullRecord
      };
    }
    return s;
  });
  const success = await saveCollection('supervisions', dbData.supervisions);
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
  const dbData = await ensureDBLoaded();
  const newPlan = {
    id: `plan-${Date.now()}`,
    postLessonRecord: null,
    submittedAt: new Date().toISOString(),
    ...planData
  };
  dbData.termPlans.push(newPlan);
  const success = await saveCollection('term_plans', dbData.termPlans);
  return success ? newPlan : null;
};

export const updateTermPlan = async (planId, updatedFields) => {
  const dbData = await ensureDBLoaded();
  dbData.termPlans = dbData.termPlans.map(p => {
    if (p.id === planId) {
      return { ...p, ...updatedFields };
    }
    return p;
  });
  const success = await saveCollection('term_plans', dbData.termPlans);
  return success;
};

export const deleteTermPlan = async (planId) => {
  const dbData = await ensureDBLoaded();
  dbData.termPlans = dbData.termPlans.filter(p => p.id !== planId);
  const success = await saveCollection('term_plans', dbData.termPlans);
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
  ]
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
  const dbData = await ensureDBLoaded();
  const newLog = {
    id: `plc-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    ...logData
  };
  dbData.plcLogs.push(newLog);
  const success = await saveCollection('plc_logs', dbData.plcLogs);
  return success ? newLog : null;
};

export const updatePlcLog = async (logId, updatedFields) => {
  const dbData = await ensureDBLoaded();
  dbData.plcLogs = dbData.plcLogs.map(log => {
    if (log.id === logId) {
      return { ...log, ...updatedFields, updatedAt: new Date().toISOString() };
    }
    return log;
  });
  const success = await saveCollection('plc_logs', dbData.plcLogs);
  return success;
};

export const deletePlcLog = async (logId) => {
  const dbData = await ensureDBLoaded();
  dbData.plcLogs = dbData.plcLogs.filter(log => log.id !== logId);
  const success = await saveCollection('plc_logs', dbData.plcLogs);
  return success;
};

export const updateTeacherPlcGroup = async (teacherId, plcGroup) => {
  const dbData = await ensureDBLoaded();
  dbData.teachers = dbData.teachers.map(t => {
    if (t.id === teacherId) {
      return { ...t, plcGroup };
    }
    return t;
  });
  const success = await saveCollection('teachers', dbData.teachers);
  return success;
};
