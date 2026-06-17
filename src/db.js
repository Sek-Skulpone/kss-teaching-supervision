// Database logic using Sheet Best API for Google Sheets (Teaching Supervision System)

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: '123', name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: '123', name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: '123', name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: '123', name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: '123', name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: '123', name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: '123', name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

const SHEET_API_URL = "https://api.sheetbest.com/sheets/6db73680-0b0d-4656-a6b0-b25c01ea5c1a";

export const initializeDB = () => {
  // Static seed users local config initialization
  if (!localStorage.getItem('ks_users')) {
    localStorage.setItem('ks_users', JSON.stringify(SEED_USERS));
  }
};

export const getUsers = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem('ks_users'));
};

// Safe JSON parser to avoid crash
const safeJsonParse = (str, fallback) => {
  if (!str || str === 'null' || str === '[]' || str === '{}' || str === '""' || str === "''") return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
};

// 1. Get all supervisions
export const getSupervisions = async () => {
  try {
    const response = await fetch(SHEET_API_URL);
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      ...item,
      supervisors: typeof item.supervisors === 'string' ? safeJsonParse(item.supervisors, []) : (item.supervisors || []),
      postTeachingRecord: typeof item.postTeachingRecord === 'string' ? safeJsonParse(item.postTeachingRecord, null) : (item.postTeachingRecord || null)
    }));
  } catch (e) {
    console.error("Error fetching supervisions from Google Sheets:", e);
    return [];
  }
};

// 2. Add new supervision record
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
  try {
    await fetch(SHEET_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupervision)
    });
    return {
      ...newSupervision,
      supervisors: [],
      postTeachingRecord: null
    };
  } catch (e) {
    console.error("Error adding row to Google Sheets:", e);
  }
};

// 3. Volunteer for supervision
export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  try {
    const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'pending_approval',
        volunteerId: teacherId,
        volunteerName: teacherName
      })
    });
    return response.ok;
  } catch (e) {
    console.error("Error volunteering in Google Sheets:", e);
    return false;
  }
};

// 4. Approve volunteer
export const approveVolunteer = async (supervisionId) => {
  try {
    const all = await getSupervisions();
    const item = all.find(s => s.id === supervisionId);
    if (item && item.volunteerId) {
      const supervisors = [...item.supervisors];
      if (!supervisors.some(s => s.id === item.volunteerId)) {
        supervisors.push({ id: item.volunteerId, name: item.volunteerName });
      }
      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      
      const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          supervisors: JSON.stringify(supervisors),
          volunteerId: '',
          volunteerName: ''
        })
      });
      return response.ok;
    }
    return false;
  } catch (e) {
    console.error("Error approving volunteer in Google Sheets:", e);
    return false;
  }
};

// 5. Reject volunteer
export const rejectVolunteer = async (supervisionId) => {
  try {
    const all = await getSupervisions();
    const item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisorsCount = item.supervisors ? item.supervisors.length : 0;
      const status = supervisorsCount >= 2 ? 'approved' : 'pending';
      
      const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          volunteerId: '',
          volunteerName: ''
        })
      });
      return response.ok;
    }
    return false;
  } catch (e) {
    console.error("Error rejecting volunteer in Google Sheets:", e);
    return false;
  }
};

// 6. Direct assign supervisor
export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
  try {
    const all = await getSupervisions();
    const item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisors = [...item.supervisors];
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
      
      const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      return response.ok;
    }
    return false;
  } catch (e) {
    console.error("Error assigning supervisor in Google Sheets:", e);
    return false;
  }
};

// 7. Remove supervisor
export const removeSupervisor = async (supervisionId, supervisorId) => {
  try {
    const all = await getSupervisions();
    const item = all.find(s => s.id === supervisionId);
    if (item) {
      const supervisors = item.supervisors.filter(s => s.id !== supervisorId);
      
      let status = item.status;
      if (supervisors.length >= 2) {
        status = 'approved';
      } else {
        if (item.status !== 'completed') {
          status = 'pending';
        }
      }
      
      const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          supervisors: JSON.stringify(supervisors)
        })
      });
      return response.ok;
    }
    return false;
  } catch (e) {
    console.error("Error removing supervisor in Google Sheets:", e);
    return false;
  }
};

// 8. Submit post teaching record report
export const submitPostTeachingRecord = async (supervisionId, record) => {
  try {
    const fullRecord = {
      ...record,
      submittedAt: new Date().toISOString()
    };
    
    const response = await fetch(`${SHEET_API_URL}/id/${supervisionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        postTeachingRecord: JSON.stringify(fullRecord)
      })
    });
    return response.ok;
  } catch (e) {
    console.error("Error submitting report to Google Sheets:", e);
    return false;
  }
};
