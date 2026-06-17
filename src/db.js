// Google Sheets database connector using Sheet Best API (Single Sheet JSON Strategy)
// This enables zero-configuration online database syncing that works on any blank Google Sheet.

const BASE_API_URL = "https://api.sheetbest.com/sheets/6db73680-0b0d-4656-a6b0-b25c01ea5c1a";

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: '123', name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: '123', name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: '123', name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: '123', name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: '123', name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: '123', name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: '123', name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

// Helper to safely parse JSON strings from sheet cells
const safeJsonParse = (str, fallback) => {
  if (!str || str === 'null' || str === '[]' || str === '{}' || str === '""' || str === "''") return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

// Database Cache & Sync State
let dbCache = {
  teachers: null,
  supervisions: null,
  termPlans: null,
  lastLoaded: 0
};

const cacheTimeout = 1000; // 1 second cache window

const ensureDBLoaded = async (force = false) => {
  const now = Date.now();
  if (!force && dbCache.teachers && dbCache.supervisions && dbCache.termPlans && (now - dbCache.lastLoaded < cacheTimeout)) {
    return dbCache;
  }
  
  try {
    const response = await fetch(BASE_API_URL);
    if (!response.ok) throw new Error("API request failed");
    const rows = await response.json();
    
    let teachers = [];
    let supervisions = [];
    let termPlans = [];
    
    const teachersRow = Array.isArray(rows) ? rows.find(r => r.datatype === 'teachers') : null;
    const supervisionsRow = Array.isArray(rows) ? rows.find(r => r.datatype === 'supervisions') : null;
    const termPlansRow = Array.isArray(rows) ? rows.find(r => r.datatype === 'term_plans') : null;
    
    if (!teachersRow || !supervisionsRow || !termPlansRow) {
      // Initialize sheet with default empty arrays/seeds
      teachers = SEED_USERS;
      supervisions = [];
      termPlans = [];
      
      // Post initialization data to create headers (datatype, data) and rows automatically
      await fetch(BASE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { datatype: "teachers", data: JSON.stringify(SEED_USERS) },
          { datatype: "supervisions", data: JSON.stringify([]) },
          { datatype: "term_plans", data: JSON.stringify([]) }
        ])
      });
    } else {
      teachers = safeJsonParse(teachersRow.data, SEED_USERS);
      supervisions = safeJsonParse(supervisionsRow.data, []);
      termPlans = safeJsonParse(termPlansRow.data, []);
    }
    
    dbCache = { teachers, supervisions, termPlans, lastLoaded: now };
    
    // Save to local storage cache for instant offline fallback
    localStorage.setItem('ks_teachers', JSON.stringify(teachers));
    localStorage.setItem('ks_supervisions', JSON.stringify(supervisions));
    localStorage.setItem('ks_term_plans', JSON.stringify(termPlans));
    
    return dbCache;
  } catch (e) {
    console.warn("DB load failed, using local storage cache:", e);
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    
    dbCache = { teachers, supervisions, termPlans, lastLoaded: now };
    return dbCache;
  }
};

const saveCollection = async (datatype, dataArray) => {
  // Update local storage cache
  localStorage.setItem(`ks_${datatype}`, JSON.stringify(dataArray));
  
  try {
    const response = await fetch(`${BASE_API_URL}/datatype/${datatype}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.stringify(dataArray) })
    });
    return response.ok;
  } catch (e) {
    console.error(`Failed to save ${datatype} online:`, e);
    return false;
  }
};

/* ==========================================================================
   1. USER / PERSONNEL MANAGEMENT
   ========================================================================== */

export const getUsers = async () => {
  const db = await ensureDBLoaded();
  return db.teachers;
};

export const addTeacher = async (teacherData) => {
  const db = await ensureDBLoaded();
  const newTeacher = {
    id: `teacher-${Date.now()}`,
    ...teacherData
  };
  db.teachers.push(newTeacher);
  const success = await saveCollection('teachers', db.teachers);
  return success ? newTeacher : null;
};

export const deleteTeacher = async (teacherId) => {
  const db = await ensureDBLoaded();
  db.teachers = db.teachers.filter(t => t.id !== teacherId);
  const success = await saveCollection('teachers', db.teachers);
  return success;
};

/* ==========================================================================
   2. SUPERVISION BOOKINGS
   ========================================================================== */

export const getSupervisions = async () => {
  const db = await ensureDBLoaded();
  return db.supervisions;
};

export const addSupervision = async (supervision) => {
  const db = await ensureDBLoaded();
  const newSupervision = {
    id: `sup-${Date.now()}`,
    status: 'pending',
    supervisors: [],
    volunteerId: '',
    volunteerName: '',
    postTeachingRecord: null,
    ...supervision
  };
  
  db.supervisions.push(newSupervision);
  const success = await saveCollection('supervisions', db.supervisions);
  return success ? newSupervision : null;
};

export const updateSupervision = async (supervisionId, updatedFields) => {
  const db = await ensureDBLoaded();
  db.supervisions = db.supervisions.map(s => {
    if (s.id === supervisionId) {
      return { ...s, ...updatedFields };
    }
    return s;
  });
  const success = await saveCollection('supervisions', db.supervisions);
  return success;
};

export const deleteSupervision = async (supervisionId) => {
  const db = await ensureDBLoaded();
  db.supervisions = db.supervisions.filter(s => s.id !== supervisionId);
  const success = await saveCollection('supervisions', db.supervisions);
  return success;
};

export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  const db = await ensureDBLoaded();
  db.supervisions = db.supervisions.map(s => {
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
  const success = await saveCollection('supervisions', db.supervisions);
  return success;
};

export const approveVolunteer = async (supervisionId) => {
  const db = await ensureDBLoaded();
  let success = false;
  db.supervisions = db.supervisions.map(s => {
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
    await saveCollection('supervisions', db.supervisions);
    return true;
  }
  return false;
};

export const rejectVolunteer = async (supervisionId) => {
  const db = await ensureDBLoaded();
  let success = false;
  db.supervisions = db.supervisions.map(s => {
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
    await saveCollection('supervisions', db.supervisions);
    return true;
  }
  return false;
};

export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
  const db = await ensureDBLoaded();
  let success = false;
  db.supervisions = db.supervisions.map(s => {
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
    await saveCollection('supervisions', db.supervisions);
    return true;
  }
  return false;
};

export const removeSupervisor = async (supervisionId, supervisorId) => {
  const db = await ensureDBLoaded();
  let success = false;
  db.supervisions = db.supervisions.map(s => {
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
    await saveCollection('supervisions', db.supervisions);
    return true;
  }
  return false;
};

export const submitPostTeachingRecord = async (supervisionId, record) => {
  const db = await ensureDBLoaded();
  const fullRecord = {
    ...record,
    submittedAt: new Date().toISOString()
  };
  db.supervisions = db.supervisions.map(s => {
    if (s.id === supervisionId) {
      return {
        ...s,
        status: 'completed',
        postTeachingRecord: fullRecord
      };
    }
    return s;
  });
  const success = await saveCollection('supervisions', db.supervisions);
  return success;
};

/* ==========================================================================
   3. TERM LESSON PLANS ARCHIVE
   ========================================================================== */

export const getTermPlans = async () => {
  const db = await ensureDBLoaded();
  return db.termPlans;
};

export const addTermPlan = async (planData) => {
  const db = await ensureDBLoaded();
  const newPlan = {
    id: `plan-${Date.now()}`,
    postLessonRecord: null,
    submittedAt: new Date().toISOString(),
    ...planData
  };
  db.termPlans.push(newPlan);
  const success = await saveCollection('term_plans', db.termPlans);
  return success ? newPlan : null;
};

export const updateTermPlan = async (planId, updatedFields) => {
  const db = await ensureDBLoaded();
  db.termPlans = db.termPlans.map(p => {
    if (p.id === planId) {
      return { ...p, ...updatedFields };
    }
    return p;
  });
  const success = await saveCollection('term_plans', db.termPlans);
  return success;
};

export const deleteTermPlan = async (planId) => {
  const db = await ensureDBLoaded();
  db.termPlans = db.termPlans.filter(p => p.id !== planId);
  const success = await saveCollection('term_plans', db.termPlans);
  return success;
};
