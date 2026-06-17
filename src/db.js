// Mock Database using LocalStorage for Khok Si Witthayasan School Teaching Supervision System

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: '123', name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: '123', name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: '123', name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: '123', name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: '123', name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: '123', name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: '123', name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

// Seed initial supervisions to show something beautiful on the calendar immediately
const getInitialSupervisions = () => {
  const today = new Date();
  
  // Helper to format date offset from today
  const getDateString = (offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'sup-1',
      teacherId: 'wilai',
      teacherName: 'ครูวิไล รักเรียน',
      subject: 'วิทยาศาสตร์กายภาพ',
      grade: 'ม.5',
      room: '1',
      date: getDateString(0), // Today
      time: '09:00',
      lessonPlanUrl: 'https://docs.google.com/document/d/1mock-plan-science-5-1/edit',
      status: 'approved',
      supervisors: [
        { id: 'somchai', name: 'ครูสมชาย ดีงาม' },
        { id: 'somsri', name: 'ครูสมศรี แสนดี' }
      ],
      volunteerId: null,
      volunteerName: null,
      postTeachingRecord: null
    },
    {
      id: 'sup-2',
      teacherId: 'somsri',
      teacherName: 'ครูสมศรี แสนดี',
      subject: 'ภาษาไทยพื้นฐาน',
      grade: 'ม.3',
      room: '2',
      date: getDateString(0), // Today
      time: '13:00',
      lessonPlanUrl: 'https://docs.google.com/document/d/1mock-plan-thai-3-2/edit',
      status: 'approved',
      supervisors: [
        { id: 'academic', name: 'ครูวิชาการ (หัวหน้างานวิชาการ)' },
        { id: 'somchai', name: 'ครูสมชาย ดีงาม' }
      ],
      volunteerId: null,
      volunteerName: null,
      postTeachingRecord: {
        studentOutcome: 'นักเรียน 90% สามารถแต่งคำประพันธ์ประเภทกลอนสุภาพได้ถูกต้อง อีก 10% ยังสับสนเรื่องสัมผัสสระ',
        problems: 'นักเรียนบางส่วนลืมทำการบ้านล่วงหน้า ทำให้การจัดกิจกรรมกลุ่มล่าช้ากว่าเวลาที่กำหนดเล็กน้อย',
        solutions: 'จัดกลุ่มแบบคละความสามารถเพื่อให้เพื่อนช่วยเพื่อน และปรับเวลาใบงานย่อยให้กระชับขึ้น',
        submittedAt: new Date().toISOString()
      }
    },
    {
      id: 'sup-3',
      teacherId: 'wittaya',
      teacherName: 'ครูวิทยา เก่งกล้า',
      subject: 'ภาษาอังกฤษเพื่อการสื่อสาร',
      grade: 'ม.6',
      room: '1',
      date: getDateString(1), // Tomorrow
      time: '10:30',
      lessonPlanUrl: 'https://docs.google.com/document/d/1mock-plan-eng-6-1/edit',
      status: 'pending',
      supervisors: [],
      volunteerId: null,
      volunteerName: null,
      postTeachingRecord: null
    },
    {
      id: 'sup-4',
      teacherId: 'somchai',
      teacherName: 'ครูสมชาย ดีงาม',
      subject: 'คณิตศาสตร์เพิ่มเติม',
      grade: 'ม.4',
      room: '3',
      date: getDateString(2), // 2 days from now
      time: '14:00',
      lessonPlanUrl: 'https://docs.google.com/document/d/1mock-plan-math-4-3/edit',
      status: 'pending_approval',
      supervisors: [],
      volunteerId: 'nonglak',
      volunteerName: 'ครูนงลักษณ์ ไพเราะ',
      postTeachingRecord: null
    }
  ];
};

export const initializeDB = () => {
  if (!localStorage.getItem('ks_users')) {
    localStorage.setItem('ks_users', JSON.stringify(SEED_USERS));
  } else {
    // Proactively update SEED_USERS in localStorage to match the new names
    localStorage.setItem('ks_users', JSON.stringify(SEED_USERS));
  }
  
  const existingSupervisions = localStorage.getItem('ks_supervisions');
  if (!existingSupervisions) {
    localStorage.setItem('ks_supervisions', JSON.stringify(getInitialSupervisions()));
  } else {
    try {
      const parsed = JSON.parse(existingSupervisions);
      // Migrate if legacy single supervisor schema is found
      const needsMigration = parsed.some(s => ('supervisorId' in s) || !s.supervisors);
      if (needsMigration) {
        localStorage.setItem('ks_supervisions', JSON.stringify(getInitialSupervisions()));
      }
    } catch (e) {
      localStorage.setItem('ks_supervisions', JSON.stringify(getInitialSupervisions()));
    }
  }
};

export const getUsers = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem('ks_users'));
};

export const getSupervisions = () => {
  initializeDB();
  return JSON.parse(localStorage.getItem('ks_supervisions'));
};

export const saveSupervisions = (supervisions) => {
  localStorage.setItem('ks_supervisions', JSON.stringify(supervisions));
};

export const addSupervision = (supervision) => {
  const supervisions = getSupervisions();
  const newSupervision = {
    id: `sup-${Date.now()}`,
    status: 'pending',
    supervisors: [],
    volunteerId: null,
    volunteerName: null,
    postTeachingRecord: null,
    ...supervision
  };
  supervisions.push(newSupervision);
  saveSupervisions(supervisions);
  return newSupervision;
};

export const volunteerToSupervise = (supervisionId, teacherId, teacherName) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1) {
    supervisions[index].status = 'pending_approval';
    supervisions[index].volunteerId = teacherId;
    supervisions[index].volunteerName = teacherName;
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};

export const approveVolunteer = (supervisionId) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1 && supervisions[index].volunteerId) {
    const volId = supervisions[index].volunteerId;
    const volName = supervisions[index].volunteerName;
    
    if (!supervisions[index].supervisors) {
      supervisions[index].supervisors = [];
    }
    
    if (!supervisions[index].supervisors.some(s => s.id === volId)) {
      supervisions[index].supervisors.push({ id: volId, name: volName });
    }
    
    supervisions[index].volunteerId = null;
    supervisions[index].volunteerName = null;
    
    // Status becomes 'approved' ONLY if there are at least 2 supervisors
    if (supervisions[index].supervisors.length >= 2) {
      supervisions[index].status = 'approved';
    } else {
      supervisions[index].status = 'pending';
    }
    
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};

export const rejectVolunteer = (supervisionId) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1) {
    supervisions[index].volunteerId = null;
    supervisions[index].volunteerName = null;
    
    if (supervisions[index].supervisors && supervisions[index].supervisors.length >= 2) {
      supervisions[index].status = 'approved';
    } else {
      supervisions[index].status = 'pending';
    }
    
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};

export const assignSupervisor = (supervisionId, supervisorId, supervisorName) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1) {
    if (!supervisions[index].supervisors) {
      supervisions[index].supervisors = [];
    }
    
    if (!supervisions[index].supervisors.some(s => s.id === supervisorId)) {
      supervisions[index].supervisors.push({ id: supervisorId, name: supervisorName });
    }
    
    if (supervisions[index].volunteerId === supervisorId) {
      supervisions[index].volunteerId = null;
      supervisions[index].volunteerName = null;
    }
    
    // Status becomes 'approved' ONLY if there are at least 2 supervisors
    if (supervisions[index].supervisors.length >= 2) {
      supervisions[index].status = 'approved';
    } else {
      supervisions[index].status = 'pending';
    }
    
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};

export const removeSupervisor = (supervisionId, supervisorId) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1 && supervisions[index].supervisors) {
    supervisions[index].supervisors = supervisions[index].supervisors.filter(s => s.id !== supervisorId);
    
    if (supervisions[index].supervisors.length >= 2) {
      supervisions[index].status = 'approved';
    } else {
      if (supervisions[index].status !== 'completed') {
        supervisions[index].status = 'pending';
      }
    }
    
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};

export const submitPostTeachingRecord = (supervisionId, record) => {
  const supervisions = getSupervisions();
  const index = supervisions.findIndex(s => s.id === supervisionId);
  if (index !== -1) {
    supervisions[index].status = 'completed';
    supervisions[index].postTeachingRecord = {
      ...record,
      submittedAt: new Date().toISOString()
    };
    saveSupervisions(supervisions);
    return true;
  }
  return false;
};
