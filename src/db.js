// Google Sheets database connector using Sheet Best API (with Tab Support and LocalStorage Fallback)

const BASE_API_URL = "https://api.sheetbest.com/sheets/6db73680-0b0d-4656-a6b0-b25c01ea5c1a";

const SUPERVISIONS_API_URL = `${BASE_API_URL}/tabs/supervisions`;
const TEACHERS_API_URL = `${BASE_API_URL}/tabs/teachers`;
const TERM_PLANS_API_URL = `${BASE_API_URL}/tabs/term_plans`;

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

/* ==========================================================================
   1. USER / PERSONNEL MANAGEMENT (Tab: teachers)
   ========================================================================== */

// Get all users
export const getUsers = async () => {
  try {
    const response = await fetch(TEACHERS_API_URL);
    if (!response.ok) throw new Error("Google Sheets teachers tab is not configured yet.");
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem('ks_fallback_teachers', JSON.stringify(data));
      return data;
    }
    // Seed if sheet is empty
    const seedResponse = await fetch(TEACHERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SEED_USERS)
    });
    if (seedResponse.ok) {
      localStorage.setItem('ks_fallback_teachers', JSON.stringify(SEED_USERS));
    }
    return SEED_USERS;
  } catch (e) {
    console.warn("Using LocalStorage fallback for teachers:", e.message);
    const local = localStorage.getItem('ks_fallback_teachers');
    if (local) return JSON.parse(local);
    // Seed locally if nothing is saved
    localStorage.setItem('ks_fallback_teachers', JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
};

// Add new personnel
export const addTeacher = async (teacherData) => {
  const newTeacher = {
    id: `teacher-${Date.now()}`,
    ...teacherData
  };
  try {
    const response = await fetch(TEACHERS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher)
    });
    if (!response.ok) throw new Error("API failed");
    
    // Sync to local fallback list
    const local = localStorage.getItem('ks_fallback_teachers');
    const list = local ? JSON.parse(local) : [...SEED_USERS];
    list.push(newTeacher);
    localStorage.setItem('ks_fallback_teachers', JSON.stringify(list));
    return newTeacher;
  } catch (e) {
    console.warn("Saving teacher locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_teachers');
    const list = local ? JSON.parse(local) : [...SEED_USERS];
    list.push(newTeacher);
    localStorage.setItem('ks_fallback_teachers', JSON.stringify(list));
    return newTeacher;
  }
};

// Delete personnel
export const deleteTeacher = async (teacherId) => {
  try {
    const response = await fetch(`${TEACHERS_API_URL}/id/${teacherId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("API failed");
    
    // Sync local fallback list
    const local = localStorage.getItem('ks_fallback_teachers');
    if (local) {
      const list = JSON.parse(local).filter(t => t.id !== teacherId);
      localStorage.setItem('ks_fallback_teachers', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Deleting teacher locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_teachers');
    if (local) {
      const list = JSON.parse(local).filter(t => t.id !== teacherId);
      localStorage.setItem('ks_fallback_teachers', JSON.stringify(list));
      return true;
    }
    return false;
  }
};


/* ==========================================================================
   2. SUPERVISION BOOKINGS (Tab: supervisions)
   ========================================================================== */

// Get all supervisions
export const getSupervisions = async () => {
  try {
    const response = await fetch(SUPERVISIONS_API_URL);
    if (!response.ok) throw new Error("Google Sheets supervisions tab is not configured yet.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid response schema");
    
    const parsed = data.map(item => ({
      ...item,
      supervisors: typeof item.supervisors === 'string' ? safeJsonParse(item.supervisors, []) : (item.supervisors || []),
      postTeachingRecord: typeof item.postTeachingRecord === 'string' ? safeJsonParse(item.postTeachingRecord, null) : (item.postTeachingRecord || null)
    }));
    
    localStorage.setItem('ks_fallback_supervisions', JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    console.warn("Using LocalStorage fallback for supervisions:", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    return local ? JSON.parse(local) : [];
  }
};

// Add new booking request
export const addSupervision = async (supervision) => {
  const newSupervision = {
    id: `sup-${Date.now()}`,
    status: 'pending',
    supervisors: JSON.stringify([]),
    volunteerId: '',
    volunteerName: '',
    postTeachingRecord: '',
    ...supervision
  };
  const parsedNewSupervision = {
    ...newSupervision,
    supervisors: [],
    postTeachingRecord: null
  };
  
  try {
    const response = await fetch(SUPERVISIONS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupervision)
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_supervisions');
    const list = local ? JSON.parse(local) : [];
    list.push(parsedNewSupervision);
    localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    return parsedNewSupervision;
  } catch (e) {
    console.warn("Saving supervision request locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    const list = local ? JSON.parse(local) : [];
    list.push(parsedNewSupervision);
    localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    return parsedNewSupervision;
  }
};

// Update booking request details (Edit request)
export const updateSupervision = async (supervisionId, updatedFields) => {
  try {
    const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) {
          const res = { ...s, ...updatedFields };
          if (typeof res.supervisors === 'string') {
            res.supervisors = safeJsonParse(res.supervisors, []);
          }
          if (typeof res.postTeachingRecord === 'string') {
            res.postTeachingRecord = safeJsonParse(res.postTeachingRecord, null);
          }
          return res;
        }
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Updating supervision request locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) {
          const res = { ...s, ...updatedFields };
          if (typeof res.supervisors === 'string') {
            res.supervisors = safeJsonParse(res.supervisors, []);
          }
          if (typeof res.postTeachingRecord === 'string') {
            res.postTeachingRecord = safeJsonParse(res.postTeachingRecord, null);
          }
          return res;
        }
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      return true;
    }
    return false;
  }
};

// Delete booking request (Cancel request)
export const deleteSupervision = async (supervisionId) => {
  try {
    const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).filter(s => s.id !== supervisionId);
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Deleting supervision request locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).filter(s => s.id !== supervisionId);
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      return true;
    }
    return false;
  }
};

// Volunteer to supervise
export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  const payload = {
    status: 'pending_approval',
    volunteerId: teacherId,
    volunteerName: teacherName
  };
  try {
    const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) return { ...s, ...payload };
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Volunteering locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) return { ...s, ...payload };
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      return true;
    }
    return false;
  }
};

// Approve volunteer
export const approveVolunteer = async (supervisionId) => {
  try {
    let item;
    let local = localStorage.getItem('ks_fallback_supervisions');
    let all = [];
    
    try {
      all = await getSupervisions();
    } catch (err) {
      if (local) all = JSON.parse(local);
    }
    
    item = all.find(s => s.id === supervisionId);
    if (item && item.volunteerId) {
      const supervisors = [...(item.supervisors || [])];
      if (!supervisors.some(s => s.id === item.volunteerId)) {
        supervisors.push({ id: item.volunteerId, name: item.volunteerName });
      }
      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      
      const payload = {
        status: status,
        supervisors: JSON.stringify(supervisors),
        volunteerId: '',
        volunteerName: ''
      };
      
      try {
        const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("API failed");
      } catch (err) {
        console.warn("API unavailable on approveVolunteer, applying locally.");
      }
      
      if (local) {
        const list = JSON.parse(local).map(s => {
          if (s.id === supervisionId) {
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
        localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error approving volunteer:", e);
    return false;
  }
};

// Reject volunteer
export const rejectVolunteer = async (supervisionId) => {
  try {
    let item;
    let local = localStorage.getItem('ks_fallback_supervisions');
    let all = [];
    
    try {
      all = await getSupervisions();
    } catch (err) {
      if (local) all = JSON.parse(local);
    }
    
    item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisorsCount = item.supervisors ? item.supervisors.length : 0;
      const status = supervisorsCount >= 2 ? 'approved' : 'pending';
      
      const payload = {
        status: status,
        volunteerId: '',
        volunteerName: ''
      };
      
      try {
        const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("API failed");
      } catch (err) {
        console.warn("API unavailable on rejectVolunteer, applying locally.");
      }
      
      if (local) {
        const list = JSON.parse(local).map(s => {
          if (s.id === supervisionId) {
            return {
              ...s,
              status: status,
              volunteerId: '',
              volunteerName: ''
            };
          }
          return s;
        });
        localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error rejecting volunteer:", e);
    return false;
  }
};

// Direct assign supervisor
export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
  try {
    let item;
    let local = localStorage.getItem('ks_fallback_supervisions');
    let all = [];
    
    try {
      all = await getSupervisions();
    } catch (err) {
      if (local) all = JSON.parse(local);
    }
    
    item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisors = [...(item.supervisors || [])];
      if (!supervisors.some(s => s.id === supervisorId)) {
        supervisors.push({ id: supervisorId, name: supervisorName });
      }
      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      
      const updatePayload = {
        status: status,
        supervisors: JSON.stringify(supervisors)
      };
      
      if (item.volunteerId === supervisorId) {
        updatePayload.volunteerId = '';
        updatePayload.volunteerName = '';
      }
      
      try {
        const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        if (!response.ok) throw new Error("API failed");
      } catch (err) {
        console.warn("API unavailable on assignSupervisor, applying locally.");
      }
      
      if (local) {
        const list = JSON.parse(local).map(s => {
          if (s.id === supervisionId) {
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
        localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error assigning supervisor:", e);
    return false;
  }
};

// Remove supervisor
export const removeSupervisor = async (supervisionId, supervisorId) => {
  try {
    let item;
    let local = localStorage.getItem('ks_fallback_supervisions');
    let all = [];
    
    try {
      all = await getSupervisions();
    } catch (err) {
      if (local) all = JSON.parse(local);
    }
    
    item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisors = (item.supervisors || []).filter(s => s.id !== supervisorId);
      
      let status = item.status;
      if (supervisors.length >= 2) {
        status = 'approved';
      } else {
        if (item.status !== 'completed') {
          status = 'pending';
        }
      }
      
      const payload = {
        status: status,
        supervisors: JSON.stringify(supervisors)
      };
      
      try {
        const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("API failed");
      } catch (err) {
        console.warn("API unavailable on removeSupervisor, applying locally.");
      }
      
      if (local) {
        const list = JSON.parse(local).map(s => {
          if (s.id === supervisionId) {
            return {
              ...s,
              status: status,
              supervisors: supervisors
            };
          }
          return s;
        });
        localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error removing supervisor:", e);
    return false;
  }
};

// Submit post-teaching report record
export const submitPostTeachingRecord = async (supervisionId, record) => {
  const fullRecord = {
    ...record,
    submittedAt: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${SUPERVISIONS_API_URL}/id/${supervisionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        postTeachingRecord: JSON.stringify(fullRecord)
      })
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) return { ...s, status: 'completed', postTeachingRecord: fullRecord };
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Saving post teaching report locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_supervisions');
    if (local) {
      const list = JSON.parse(local).map(s => {
        if (s.id === supervisionId) return { ...s, status: 'completed', postTeachingRecord: fullRecord };
        return s;
      });
      localStorage.setItem('ks_fallback_supervisions', JSON.stringify(list));
      return true;
    }
    return false;
  }
};


/* ==========================================================================
   3. TERM LESSON PLANS ARCHIVE (Tab: term_plans)
   ========================================================================== */

// Get all term lesson plans
export const getTermPlans = async () => {
  try {
    const response = await fetch(TERM_PLANS_API_URL);
    if (!response.ok) throw new Error("Google Sheets term_plans tab is not configured yet.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid response schema");
    
    const parsed = data.map(item => ({
      ...item,
      postLessonRecord: typeof item.postLessonRecord === 'string' ? safeJsonParse(item.postLessonRecord, null) : (item.postLessonRecord || null)
    }));
    
    localStorage.setItem('ks_fallback_term_plans', JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    console.warn("Using LocalStorage fallback for term plans:", e.message);
    const local = localStorage.getItem('ks_fallback_term_plans');
    return local ? JSON.parse(local) : [];
  }
};

// Add new term lesson plan
export const addTermPlan = async (planData) => {
  const newPlan = {
    id: `plan-${Date.now()}`,
    postLessonRecord: '',
    submittedAt: new Date().toISOString(),
    ...planData
  };
  const parsedNewPlan = {
    ...newPlan,
    postLessonRecord: null
  };
  
  try {
    const response = await fetch(TERM_PLANS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlan)
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_term_plans');
    const list = local ? JSON.parse(local) : [];
    list.push(parsedNewPlan);
    localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
    return parsedNewPlan;
  } catch (e) {
    console.warn("Saving term plan locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_term_plans');
    const list = local ? JSON.parse(local) : [];
    list.push(parsedNewPlan);
    localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
    return parsedNewPlan;
  }
};

// Update term plan or post-lesson record
export const updateTermPlan = async (planId, updatedFields) => {
  try {
    const payload = { ...updatedFields };
    if (updatedFields.postLessonRecord) {
      payload.postLessonRecord = JSON.stringify(updatedFields.postLessonRecord);
    }
    
    const response = await fetch(`${SUPERVISIONS_API_URL.replace('/supervisions', '/term_plans')}/id/${planId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_term_plans');
    if (local) {
      const list = JSON.parse(local).map(p => {
        if (p.id === planId) {
          const res = { ...p, ...updatedFields };
          if (typeof res.postLessonRecord === 'string') {
            res.postLessonRecord = safeJsonParse(res.postLessonRecord, null);
          }
          return res;
        }
        return p;
      });
      localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Updating term plan locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_term_plans');
    if (local) {
      const list = JSON.parse(local).map(p => {
        if (p.id === planId) {
          const res = { ...p, ...updatedFields };
          if (typeof res.postLessonRecord === 'string') {
            res.postLessonRecord = safeJsonParse(res.postLessonRecord, null);
          }
          return res;
        }
        return p;
      });
      localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
      return true;
    }
    return false;
  }
};

// Delete term plan
export const deleteTermPlan = async (planId) => {
  try {
    const response = await fetch(`${SUPERVISIONS_API_URL.replace('/supervisions', '/term_plans')}/id/${planId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("API failed");
    
    const local = localStorage.getItem('ks_fallback_term_plans');
    if (local) {
      const list = JSON.parse(local).filter(p => p.id !== planId);
      localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.warn("Deleting term plan locally only (API unavailable):", e.message);
    const local = localStorage.getItem('ks_fallback_term_plans');
    if (local) {
      const list = JSON.parse(local).filter(p => p.id !== planId);
      localStorage.setItem('ks_fallback_term_plans', JSON.stringify(list));
      return true;
    }
    return false;
  }
};
