import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  CalendarRange, 
  School, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ClipboardList, 
  AlertCircle, 
  Eye, 
  BookOpen, 
  Sparkles,
  Info,
  FileText
} from 'lucide-react';
import Calendar from './components/Calendar';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import TermPlanArchive from './components/TermPlanArchive';
import logo from './assets/logo.png';
import EvaluationModal from './components/EvaluationModal';
import EvaluationSummaryModal from './components/EvaluationSummaryModal';
import {
  getUsers,
  addTeacher,
  deleteTeacher,
  getSupervisions,
  addSupervision,
  updateSupervision,
  deleteSupervision,
  volunteerToSupervise,
  approveVolunteer,
  rejectVolunteer,
  assignSupervisor,
  removeSupervisor,
  submitPostTeachingRecord,
  getTermPlans,
  addTermPlan,
  updateTermPlan,
  deleteTermPlan,
  getSystemSettings,
  updateSystemSettings,
  getPlcLogs,
  addPlcLog,
  updatePlcLog,
  deletePlcLog,
  updateTeacherPlcGroup
} from './db';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Core App State
  const [supervisions, setSupervisions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [termPlans, setTermPlans] = useState([]);
  const [settings, setSettings] = useState({ positions: [], departments: [] });
  const [activeMainTab, setActiveMainTab] = useState('calendar');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEvalSupervision, setSelectedEvalSupervision] = useState(null);
  const [selectedSummarySupervision, setSelectedSummarySupervision] = useState(null);
  const [plcLogs, setPlcLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and load session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ks_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [usersData, supervisionsData, termPlansData, settingsData, plcLogsData] = await Promise.all([
          getUsers(),
          getSupervisions(),
          getTermPlans(),
          getSystemSettings(),
          getPlcLogs()
        ]);
        setTeachers(usersData);
        setSupervisions(supervisionsData);
        setTermPlans(termPlansData);
        setSettings(settingsData);
        setPlcLogs(plcLogsData || []);
      } catch (e) {
        console.error("Error loading initial data from database:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Sync state changes back to Google Sheets
  const refreshSupervisionData = async () => {
    setIsLoading(true);
    try {
      const data = await getSupervisions();
      setSupervisions(data);
      return data;
    } catch (e) {
      console.error("Error refreshing supervisions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTeachersData = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setTeachers(data);
      return data;
    } catch (e) {
      console.error("Error refreshing teachers:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTermPlansData = async () => {
    setIsLoading(true);
    try {
      const data = await getTermPlans();
      setTermPlans(data);
      return data;
    } catch (e) {
      console.error("Error refreshing term plans:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPlcLogsData = async () => {
    setIsLoading(true);
    try {
      const data = await getPlcLogs();
      setPlcLogs(data || []);
      return data;
    } catch (e) {
      console.error("Error refreshing plc logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Login Handler (Fetches latest user list first)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError('กรุณากรอกทั้งชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      const latestTeachers = await getUsers();
      setTeachers(latestTeachers);
      
      const foundUser = latestTeachers.find(
        u => u.username === username.toLowerCase().trim() && u.password === password
      );

      if (foundUser) {
        setCurrentUser(foundUser);
        localStorage.setItem('ks_current_user', JSON.stringify(foundUser));
        setLoginError('');
        setUsername('');
        setPassword('');
        setActiveMainTab('calendar');
      } else {
        setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error("Error during login verification:", err);
      setLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ks_current_user');
    setSelectedEvent(null);
  };

  // Teacher/Personnel Management Handlers
  const handleAddTeacher = async (teacherData) => {
    setIsLoading(true);
    try {
      const success = await addTeacher(teacherData);
      if (success) {
        await refreshTeachersData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    setIsLoading(true);
    try {
      const success = await deleteTeacher(teacherId);
      if (success) {
        await refreshTeachersData();
        // If deleted user is logged in (should not be admin itself, but just in case), logout
        if (currentUser && currentUser.id === teacherId) {
          handleLogout();
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    setIsLoading(true);
    try {
      const success = await updateSystemSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Supervision Booking Handlers
  const handleAddSupervision = async (data) => {
    setIsLoading(true);
    try {
      await addSupervision(data);
      await refreshSupervisionData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSupervision = async (supervisionId, updatedFields) => {
    setIsLoading(true);
    try {
      const success = await updateSupervision(supervisionId, updatedFields);
      if (success) {
        const freshData = await refreshSupervisionData();
        if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
          const updated = freshData.find(s => s.id === supervisionId);
          setSelectedEvent(updated);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupervision = async (supervisionId) => {
    setIsLoading(true);
    try {
      const success = await deleteSupervision(supervisionId);
      if (success) {
        await refreshSupervisionData();
        if (selectedEvent && selectedEvent.id === supervisionId) {
          setSelectedEvent(null);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolunteer = async (supervisionId) => {
    setIsLoading(true);
    try {
      const success = await volunteerToSupervise(supervisionId, currentUser.id, currentUser.name);
      if (success) {
        await refreshSupervisionData();
        alert('ส่งคำขอเสนอความจำนงเป็นผู้นิเทศการสอนเรียบร้อยแล้ว อยู่ระหว่างฝ่ายวิชาการพิจารณาแต่งตั้งอย่างเป็นทางการ');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveVolunteer = async (supervisionId) => {
    setIsLoading(true);
    try {
      await approveVolunteer(supervisionId);
      const freshData = await refreshSupervisionData();
      if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
        const updated = freshData.find(s => s.id === supervisionId);
        setSelectedEvent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectVolunteer = async (supervisionId) => {
    setIsLoading(true);
    try {
      await rejectVolunteer(supervisionId);
      const freshData = await refreshSupervisionData();
      if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
        const updated = freshData.find(s => s.id === supervisionId);
        setSelectedEvent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSupervisor = async (supervisionId, supervisorId, supervisorName) => {
    setIsLoading(true);
    try {
      await assignSupervisor(supervisionId, supervisorId, supervisorName);
      const freshData = await refreshSupervisionData();
      if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
        const updated = freshData.find(s => s.id === supervisionId);
        setSelectedEvent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSupervisor = async (supervisionId, supervisorId) => {
    setIsLoading(true);
    try {
      await removeSupervisor(supervisionId, supervisorId);
      const freshData = await refreshSupervisionData();
      if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
        const updated = freshData.find(s => s.id === supervisionId);
        setSelectedEvent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPostRecord = async (supervisionId, record) => {
    setIsLoading(true);
    try {
      await submitPostTeachingRecord(supervisionId, record);
      const freshData = await refreshSupervisionData();
      if (selectedEvent && selectedEvent.id === supervisionId && freshData) {
        const updated = freshData.find(s => s.id === supervisionId);
        setSelectedEvent(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Term Lesson Plans Handlers
  const handleRegisterTermPlan = async (planData) => {
    setIsLoading(true);
    try {
      const success = await addTermPlan(planData);
      if (success) {
        await refreshTermPlansData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTermPlan = async (planId, updatedFields) => {
    setIsLoading(true);
    try {
      const success = await updateTermPlan(planId, updatedFields);
      if (success) {
        await refreshTermPlansData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTermPlan = async (planId) => {
    setIsLoading(true);
    try {
      const success = await deleteTermPlan(planId);
      if (success) {
        await refreshTermPlansData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeacherPlc = async (teacherId, plcGroup) => {
    setIsLoading(true);
    try {
      const success = await updateTeacherPlcGroup(teacherId, plcGroup);
      if (success) {
        await refreshTeachersData();
        if (currentUser && currentUser.id === teacherId) {
          const updatedUser = { ...currentUser, plcGroup };
          setCurrentUser(updatedUser);
          localStorage.setItem('ks_current_user', JSON.stringify(updatedUser));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlcLog = async (logData) => {
    setIsLoading(true);
    try {
      const success = await addPlcLog(logData);
      if (success) {
        await refreshPlcLogsData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlcLog = async (logId, updatedFields) => {
    setIsLoading(true);
    try {
      const success = await updatePlcLog(logId, updatedFields);
      if (success) {
        await refreshPlcLogsData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlcLog = async (logId) => {
    setIsLoading(true);
    try {
      const success = await deletePlcLog(logId);
      if (success) {
        await refreshPlcLogsData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Format Date to Thai style (e.g. 17 มิถุนายน 2569)
  const formatThaiDateFull = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const yearTh = parseInt(parts[0]) + 543;
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const monthsFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `วันที่ ${day} ${monthsFull[monthIndex]} พ.ศ. ${yearTh}`;
  };

  // Login View
  if (!currentUser) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <img src={logo} alt="ตราโรงเรียนโคกสีวิทยาสรรค์" className="login-logo-img" />
            <h2>ระบบสารสนเทศเพื่อการนิเทศการเรียนการสอนออนไลน์</h2>
            <p>โรงเรียนโคกสีวิทยาสรรค์ สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>ชื่อผู้ใช้งาน (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="กรอกชื่อผู้ใช้งาน"
                required
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="demo-account-info">
            <strong>💡 บัญชีทดลองสำหรับเข้าใช้งานระบบ:</strong>
            <ul style={{ marginTop: '0.25rem' }}>
              <li><strong>ฝ่ายวิชาการ (แอดมิน):</strong> ใช้ <code>academic</code> (รหัสผ่าน <code>123</code>)</li>
              <li><strong>ผู้อำนวยการโรงเรียน:</strong> ใช้ <code>admin</code> (รหัสผ่าน <code>123</code>)</li>
              <li><strong>คุณครูสมชาย:</strong> ใช้ <code>somchai</code> (รหัสผ่าน <code>123</code>)</li>
              <li><strong>คุณครูสมศรี:</strong> ใช้ <code>somsri</code> (รหัสผ่าน <code>123</code>)</li>
              <li><strong>คุณครูวิไล:</strong> ใช้ <code>wilai</code> (รหัสผ่าน <code>123</code>)</li>
              <li><strong>คุณครูวิทยา:</strong> ใช้ <code>wittaya</code> (รหัสผ่าน <code>123</code>)</li>
            </ul>
          </div>
        </div>
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <div className="loading-text">กำลังดาวน์โหลดข้อมูลระบบนิเทศ...</div>
          </div>
        )}
      </div>
    );
  }

  // Logged-in View
  return (
    <div className="app-container">
      {/* Navbar Header */}
      <header className="navbar">
        <div className="nav-brand">
          <img src={logo} alt="ตราโรงเรียนโคกสีวิทยาสรรค์" className="school-logo-img" />
          <div className="school-title">
            <h1>ระบบสารสนเทศเพื่อการนิเทศการเรียนการสอนออนไลน์</h1>
            <p>โรงเรียนโคกสีวิทยาสรรค์ | Khok Si Witthayasan School</p>
          </div>
        </div>
        
        <div className="nav-user">
          <div className={`user-badge ${currentUser.role === 'admin' ? 'role-admin' : ''}`}>
            {currentUser.role === 'admin' ? <ShieldAlert size={14} /> : <Users size={14} />}
            <span>{currentUser.name} ({currentUser.position})</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={14} />
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeMainTab === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMainTab('calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CalendarRange size={18} />
              ปฏิทินการนิเทศการสอน
            </button>
            <button 
              className={`btn ${activeMainTab === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMainTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ClipboardList size={18} />
              {currentUser.role === 'admin' ? 'ระบบบริหารจัดการงานนิเทศการสอน' : 'ระบบบริการครูผู้สอน'}
            </button>
            <button 
              className={`btn ${activeMainTab === 'archive' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveMainTab('archive')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <BookOpen size={18} />
              คลังแผนการสอนประจำเทอม
            </button>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-medium)', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '30px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} color="var(--primary-color)" />
            ยินดีต้อนรับเข้าสู่ระบบสารสนเทศเพื่อการนิเทศการเรียนการสอนออนไลน์
          </div>
        </div>

        {/* Tab Views */}
        {activeMainTab === 'calendar' && (
          <Calendar 
            supervisions={supervisions} 
            onEventClick={(event) => setSelectedEvent(event)} 
          />
        )}

        {activeMainTab === 'archive' && (
          <TermPlanArchive 
            termPlans={termPlans} 
          />
        )}

        {activeMainTab === 'dashboard' && (
          currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              supervisions={supervisions}
              teachers={teachers}
              onAssignSupervisor={handleAssignSupervisor}
              onRemoveSupervisor={handleRemoveSupervisor}
              onApproveVolunteer={handleApproveVolunteer}
              onRejectVolunteer={handleRejectVolunteer}
              onAddTeacher={handleAddTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onUpdateSupervision={handleUpdateSupervision}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onUpdateTeacherPlc={handleUpdateTeacherPlc}
              plcLogs={plcLogs}
              onDeletePlcLog={handleDeletePlcLog}
            />
          ) : (
            <TeacherDashboard
              currentUser={currentUser}
              supervisions={supervisions}
              onAddSupervision={handleAddSupervision}
              onVolunteer={handleVolunteer}
              onSubmitPostRecord={handleSubmitPostRecord}
              onDeleteSupervision={handleDeleteSupervision}
              onUpdateSupervision={handleUpdateSupervision}
              termPlans={termPlans}
              onRegisterTermPlan={handleRegisterTermPlan}
              onUpdateTermPlan={handleUpdateTermPlan}
              onDeleteTermPlan={handleDeleteTermPlan}
              teachers={teachers}
              plcLogs={plcLogs}
              onAddPlcLog={handleAddPlcLog}
              onUpdatePlcLog={handleUpdatePlcLog}
              onDeletePlcLog={handleDeletePlcLog}
            />
          )
        )}
      </main>

      {/* Shared Calendar Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>รายละเอียดการจองเวลาการนิเทศการสอน</h3>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>รายวิชาที่จัดการเรียนรู้</span>
                  <h4 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 700 }}>{selectedEvent.subject}</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>ครูผู้รับการนิเทศ</span>
                    <p style={{ fontWeight: 600 }}>{selectedEvent.teacherName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>ระดับชั้น / ห้องเรียน</span>
                    <p style={{ fontWeight: 600 }}>ชั้นมัธยมศึกษาปีที่ {selectedEvent.grade.replace('ม.', '')} ห้อง {selectedEvent.room}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>วันที่กำหนดนิเทศ</span>
                    <p style={{ fontWeight: 600 }}>{formatThaiDateFull(selectedEvent.date)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>คาบเวลาปฏิบัติการสอน</span>
                    <p style={{ fontWeight: 600 }}>เวลา {selectedEvent.time} น.</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>แผนการจัดการเรียนรู้</span>
                    <div>
                      <a href={selectedEvent.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline', fontWeight: 600 }}>
                        เปิดดูแผนการจัดการเรียนรู้ (Google Drive)
                      </a>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>สถานะการนิเทศ</span>
                    <div>
                      <span className={`badge badge-${selectedEvent.status}`}>
                        {selectedEvent.status === 'pending' && 'อยู่ระหว่างจัดสรรคณะกรรมการนิเทศ'}
                        {selectedEvent.status === 'pending_approval' && 'อยู่ระหว่างการพิจารณาอนุมัติคำขอเสนอความจำนง'}
                        {selectedEvent.status === 'approved' && 'แต่งตั้งคณะกรรมการนิเทศเรียบร้อยแล้ว'}
                        {selectedEvent.status === 'completed' && 'บันทึกรายงานผลเสร็จสิ้น'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-medium)', fontWeight: 600 }}>คณะกรรมการนิเทศการสอน (อย่างน้อย 2 ท่าน)</span>
                  {selectedEvent.supervisors && selectedEvent.supervisors.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {selectedEvent.supervisors.map((s, idx) => (
                        <div key={s.id} style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px' }}>
                          {idx + 1}. {s.name}
                        </div>
                      ))}
                      {selectedEvent.supervisors.length < 2 && (
                        <span style={{ color: '#e74c3c', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <AlertCircle size={12} /> ข้อมูลไม่ครบเกณฑ์ (ต้องมีผู้นิเทศอย่างน้อย 2 ท่าน)
                        </span>
                      )}
                    </div>
                  ) : selectedEvent.status === 'pending_approval' ? (
                    <div>
                      <p style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', marginTop: '0.1rem' }}>ยังไม่ได้แต่งตั้งคณะกรรมการนิเทศ</p>
                      <p style={{ color: 'var(--secondary-hover)', fontWeight: 600, fontSize: '13px', marginTop: '0.25rem' }}>
                        * อยู่ระหว่างรออนุมัติคำขอเสนอความจำนงของ: {selectedEvent.volunteerName}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', marginTop: '0.1rem' }}>ยังไม่มีการแต่งตั้งคณะกรรมการนิเทศ</p>
                  )}
                </div>

                {/* Post-Teaching Record View (if completed) */}
                {selectedEvent.status === 'completed' && selectedEvent.postTeachingRecord && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <h5 style={{ fontWeight: 700, color: 'var(--status-completed)', fontSize: '14px', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={16} /> ผลบันทึกหลังการจัดกิจกรรมการเรียนรู้
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #d0e8f8' }}>
                      <div><strong>1. ผลการจัดการเรียนรู้:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem' }}>{selectedEvent.postTeachingRecord.studentOutcome}</div></div>
                      <div><strong>2. ปัญหาและอุปสรรค:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem' }}>{selectedEvent.postTeachingRecord.problems}</div></div>
                      <div><strong>3. แนวทางแก้ไขและข้อเสนอแนะ:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem' }}>{selectedEvent.postTeachingRecord.solutions}</div></div>
                    </div>
                  </div>
                )}

                {/* Evaluation Form & Report Summary Actions */}
                {((selectedEvent.supervisors && selectedEvent.supervisors.some(s => s.id === currentUser.id)) || currentUser.role === 'admin') && 
                 (selectedEvent.status === 'approved' || selectedEvent.status === 'completed') && 
                 (!selectedEvent.date || selectedEvent.date <= new Date().toISOString().split('T')[0]) && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => {
                        setSelectedEvalSupervision(selectedEvent);
                        setSelectedEvent(null);
                      }}
                    >
                      <FileText size={18} />
                      {selectedEvent.evaluations && selectedEvent.evaluations[currentUser.id]
                        ? 'แก้ไขแบบประเมินนิเทศชั้นเรียน (PLC)'
                        : 'กรอกแบบประเมินนิเทศชั้นเรียน (PLC)'}
                    </button>
                  </div>
                )}

                {selectedEvent.evaluations && Object.keys(selectedEvent.evaluations).length > 0 && (
                  <div style={{ marginTop: ((selectedEvent.supervisors && selectedEvent.supervisors.some(s => s.id === currentUser.id)) || currentUser.role === 'admin') ? '0.5rem' : '1rem', borderTop: ((selectedEvent.supervisors && selectedEvent.supervisors.some(s => s.id === currentUser.id)) || currentUser.role === 'admin') ? 'none' : '1px solid var(--border-color)', paddingTop: ((selectedEvent.supervisors && selectedEvent.supervisors.some(s => s.id === currentUser.id)) || currentUser.role === 'admin') ? '0' : '1rem' }}>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => {
                        setSelectedSummarySupervision(selectedEvent);
                        setSelectedEvent(null);
                      }}
                    >
                      <ClipboardList size={18} />
                      ดูรายงานผลการประเมิน ({Object.keys(selectedEvent.evaluations).length} ฉบับ)
                    </button>
                  </div>
                )}

                {/* Context-aware Actions inside Modal */}
                {/* A. If Teacher logs in & viewing other's pending supervision -> Can volunteer */}
                {currentUser.role === 'teacher' && 
                 selectedEvent.teacherId !== currentUser.id && 
                 (selectedEvent.status === 'pending' || (selectedEvent.supervisors && selectedEvent.supervisors.length < 2)) && 
                 (!selectedEvent.supervisors || !selectedEvent.supervisors.some(s => s.id === currentUser.id)) && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%' }}
                      onClick={() => {
                        handleVolunteer(selectedEvent.id);
                        setSelectedEvent(null);
                      }}
                    >
                      เสนอความจำนงเป็นผู้นิเทศการสอนสำหรับรายวิชานี้
                    </button>
                  </div>
                )}

                {/* B. If Admin logs in & viewing pending/volunteer supervision -> Admin actions */}
                {currentUser.role === 'admin' && (selectedEvent.status === 'pending' || selectedEvent.status === 'pending_approval' || (selectedEvent.supervisors && selectedEvent.supervisors.length < 2)) && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-medium)' }}>การดำเนินการด้านบุคลากร (สำหรับฝ่ายวิชาการ):</h5>
                    
                    {selectedEvent.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-medium)' }}>พิจารณาอนุมัติคำขอเสนอความจำนงจากคุณครู {selectedEvent.volunteerName}:</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            onClick={() => {
                              handleApproveVolunteer(selectedEvent.id);
                              setSelectedEvent(null);
                              alert('อนุมัติการแต่งตั้งผู้เสนอความจำนงเรียบร้อยแล้ว');
                            }}
                          >
                            อนุมัติแต่งตั้ง
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              handleRejectVolunteer(selectedEvent.id);
                              setSelectedEvent(null);
                              alert('ปฏิเสธคำเสนอความจำนงเรียบร้อยแล้ว');
                            }}
                          >
                            ปฏิเสธคำขอ
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Direct supervisor selection (only show if supervisors length < 2 or status not complete) */}
                    {selectedEvent.status !== 'completed' && (!selectedEvent.supervisors || selectedEvent.supervisors.length < 2) && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-medium)' }}>
                          แต่งตั้งคณะกรรมการนิเทศเพิ่ม (ปัจจุบันมี {selectedEvent.supervisors ? selectedEvent.supervisors.length : 0}/2 ท่าน):
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <select 
                            id="modal-assign-select"
                            style={{ flex: 1, padding: '0.5rem' }}
                            defaultValue=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const supervisor = teachers.find(t => t.id === val);
                                if (supervisor) {
                                  handleAssignSupervisor(selectedEvent.id, supervisor.id, supervisor.name);
                                  setSelectedEvent(null);
                                  alert('บันทึกข้อมูลการแต่งตั้งผู้นิเทศการสอนเรียบร้อยแล้ว');
                                }
                              }
                            }}
                          >
                            <option value="">-- โปรดเลือกรายนามผู้นิเทศการสอน --</option>
                            {teachers
                              .filter(t => t.id !== selectedEvent.teacherId && (!selectedEvent.supervisors || !selectedEvent.supervisors.some(s => s.id === t.id)))
                              .map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedEvent(null)}>ปิดหน้าจอ</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="school-footer">
        <p>© 2026 ระบบสารสนเทศเพื่อการนิเทศการเรียนการสอนออนไลน์ โรงเรียนโคกสีวิทยาสรรค์ จังหวัดสกลนคร</p>
        <p style={{ marginTop: '0.25rem', opacity: 0.7 }}>กลุ่มงานบริหารวิชาการ โรงเรียนโคกสีวิทยาสรรค์ สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร</p>
      </footer>

      {selectedEvalSupervision && (
        <EvaluationModal
          supervision={selectedEvalSupervision}
          currentUser={currentUser}
          onClose={() => setSelectedEvalSupervision(null)}
          onSubmit={async (newEvaluations) => {
            const success = await handleUpdateSupervision(selectedEvalSupervision.id, {
              evaluations: newEvaluations
            });
            if (success) {
              alert('บันทึกผลการประเมินนิเทศเรียบร้อยแล้ว!');
              setSelectedEvalSupervision(null);
            } else {
              alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
          }}
        />
      )}

      {selectedSummarySupervision && (
        <EvaluationSummaryModal
          supervision={selectedSummarySupervision}
          onClose={() => setSelectedSummarySupervision(null)}
        />
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">กำลังเชื่อมต่อและดึงข้อมูลจาก Google Sheets...</div>
        </div>
      )}
    </div>
  );
}
