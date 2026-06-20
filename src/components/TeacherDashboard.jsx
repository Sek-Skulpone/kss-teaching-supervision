import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  User, 
  ChevronRight, 
  Clock,
  Trash2,
  Edit,
  FolderOpen,
  Plus
} from 'lucide-react';

const PERIODS_LIST = [
  'คาบที่ 1 (08.30 - 09.20 น.)',
  'คาบที่ 2 (09.20 - 10.10 น.)',
  'คาบที่ 3 (10.20 - 11.10 น.)',
  'คาบที่ 4 (11.10 - 12.00 น.)',
  'คาบที่ 5 (13.00 - 13.50 น.)',
  'คาบที่ 6 (13.50 - 14.40 น.)',
  'คาบที่ 7 (14.40 - 15.30 น.)'
];

export default function TeacherDashboard({
  currentUser,
  supervisions,
  onAddSupervision,
  onVolunteer,
  onSubmitPostRecord,
  onDeleteSupervision,
  onUpdateSupervision,
  termPlans = [],
  onRegisterTermPlan,
  onUpdateTermPlan,
  onDeleteTermPlan
}) {
  const [activeTab, setActiveTab] = useState('request');

  // 1. Request Supervision Form States
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [planUrl, setPlanUrl] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // 2. Term Lesson Plan Form States
  const [termYear, setTermYear] = useState('2569');
  const [termSemester, setTermSemester] = useState('1');
  const [termSubjectCode, setTermSubjectCode] = useState('');
  const [termSubjectName, setTermSubjectName] = useState('');
  const [termGrade, setTermGrade] = useState('ม.1');
  const [termPlanUrl, setTermPlanUrl] = useState('');
  const [termError, setTermError] = useState('');
  const [termSuccess, setTermSuccess] = useState('');

  // 3. Modals and Editors States
  // A. Post Teaching Record Form States
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [studentOutcome, setStudentOutcome] = useState('');
  const [problems, setProblems] = useState('');
  const [solutions, setSolutions] = useState('');

  // B. Edit Supervision Request Form States
  const [editingSupervision, setEditingSupervision] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editGrade, setEditGrade] = useState('ม.1');
  const [editRoom, setEditRoom] = useState('1');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPlanUrl, setEditPlanUrl] = useState('');

  // C. Post Lesson Record for Term Plan States
  const [selectedTermPlan, setSelectedTermPlan] = useState(null);
  const [postLessonOutcome, setPostLessonOutcome] = useState('');

  // D. Classroom Evaluation Form States
  const [selectedEvalSupervision, setSelectedEvalSupervision] = useState(null);
  const [evalPrep, setEvalPrep] = useState(5);
  const [evalAct, setEvalAct] = useState(5);
  const [evalPart, setEvalPart] = useState(5);
  const [evalMedia, setEvalMedia] = useState(5);
  const [evalAssess, setEvalAssess] = useState(5);
  const [evalChar1, setEvalChar1] = useState(5);
  const [evalChar2, setEvalChar2] = useState(5);
  const [evalChar3, setEvalChar3] = useState(5);
  const [evalChar4, setEvalChar4] = useState(5);
  const [evalChar5, setEvalChar5] = useState(5);
  const [evalChar6, setEvalChar6] = useState(5);
  const [evalChar7, setEvalChar7] = useState(5);
  const [evalChar8, setEvalChar8] = useState(5);
  const [evalQualitative, setEvalQualitative] = useState('');
  const [evalSuggestions, setEvalSuggestions] = useState('');

  // E. Summary Report State
  const [selectedReportSummary, setSelectedReportSummary] = useState(null);

  // Handle Supervision Request Submit
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!subject || !planUrl) {
      setRequestError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }
    
    onAddSupervision({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      subject,
      grade,
      room,
      date: '', // Academic Department will schedule this
      time: '', // Academic Department will schedule this
      lessonPlanUrl: planUrl
    });

    setSubject('');
    setPlanUrl('');
    setRequestError('');
    setRequestSuccess('ส่งคำขอและอัปโหลดแผนการสอนเรียบร้อยแล้ว! ฝ่ายวิชาการจะเป็นผู้กำหนดวันและเวลานิเทศการสอน');
    setTimeout(() => setRequestSuccess(''), 5000);
  };

  // Handle Edit Supervision Submit
  const handleEditSupervisionSubmit = async (e) => {
    e.preventDefault();
    if (!editSubject || !editPlanUrl) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const success = await onUpdateSupervision(editingSupervision.id, {
      subject: editSubject,
      grade: editGrade,
      room: editRoom,
      lessonPlanUrl: editPlanUrl
    });

    if (success) {
      alert('แก้ไขข้อมูลการจองเวลาเรียบร้อยแล้ว');
      setEditingSupervision(null);
    } else {
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Delete Supervision
  const handleDeleteSupervisionClick = async (supervisionId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอรับการนิเทศการสอนนี้? รายการจองคาบและข้อมูลทั้งหมดจะถูกลบออกจากระบบออนไลน์')) {
      const success = await onDeleteSupervision(supervisionId);
      if (success) {
        alert('ลบคำขอเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Handle Post Teaching Record Submit
  const handlePostRecordSubmit = (e) => {
    e.preventDefault();
    if (!studentOutcome || !problems || !solutions) {
      alert('กรุณากรอกข้อมูลให้ครบทุกหัวข้อ');
      return;
    }

    onSubmitPostRecord(selectedSupervision.id, {
      studentOutcome,
      problems,
      solutions
    });

    setSelectedSupervision(null);
    setStudentOutcome('');
    setProblems('');
    setSolutions('');
    alert('บันทึกหลังการสอนเสร็จสิ้นและปรับปรุงข้อมูลเรียบร้อย!');
  };

  // Handle Classroom Evaluation Submit
  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvalSupervision) return;

    const newEvaluations = {
      ...(selectedEvalSupervision.evaluations || {}),
      [currentUser.id]: {
        supervisorId: currentUser.id,
        supervisorName: currentUser.name,
        submittedAt: new Date().toISOString(),
        ratings: {
          prep: Number(evalPrep),
          act: Number(evalAct),
          part: Number(evalPart),
          media: Number(evalMedia),
          assess: Number(evalAssess),
          char1: Number(evalChar1),
          char2: Number(evalChar2),
          char3: Number(evalChar3),
          char4: Number(evalChar4),
          char5: Number(evalChar5),
          char6: Number(evalChar6),
          char7: Number(evalChar7),
          char8: Number(evalChar8)
        },
        qualitative: evalQualitative.trim(),
        suggestions: evalSuggestions.trim()
      }
    };

    const success = await onUpdateSupervision(selectedEvalSupervision.id, {
      evaluations: newEvaluations
    });

    if (success) {
      alert('บันทึกผลการประเมินนิเทศเรียบร้อยแล้ว!');
      setSelectedEvalSupervision(null);
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Term Plan Submit
  const handleTermPlanSubmit = async (e) => {
    e.preventDefault();
    setTermError('');
    setTermSuccess('');

    if (!termSubjectCode || !termSubjectName || !termPlanUrl) {
      setTermError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    const success = await onRegisterTermPlan({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      academicYear: termYear,
      term: termSemester,
      subjectCode: termSubjectCode.trim().toUpperCase(),
      subjectName: termSubjectName.trim(),
      grade: termGrade,
      lessonPlanUrl: termPlanUrl.trim()
    });

    if (success) {
      setTermSubjectCode('');
      setTermSubjectName('');
      setTermPlanUrl('');
      setTermSuccess('อัปโหลดและบันทึกแผนการจัดการเรียนรู้ประจำภาคเรียนเรียบร้อยแล้ว!');
      setTimeout(() => setTermSuccess(''), 4000);
    } else {
      setTermError('เกิดข้อผิดพลาดในการส่งแผนการสอน กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Post Lesson Feedback Submit
  const handlePostLessonSubmit = async (e) => {
    e.preventDefault();
    if (!postLessonOutcome) {
      alert('กรุณากรอกข้อเสนอแนะ/บันทึกหลังสอน');
      return;
    }

    const success = await onUpdateTermPlan(selectedTermPlan.id, {
      postLessonRecord: {
        outcome: postLessonOutcome,
        submittedAt: new Date().toISOString()
      }
    });

    if (success) {
      alert('บันทึกหลังแผนการจัดการเรียนรู้สำเร็จเรียบร้อยแล้ว');
      setSelectedTermPlan(null);
      setPostLessonOutcome('');
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Delete Term Plan Click
  const handleDeleteTermPlanClick = async (planId, subjectName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบแผนการสอนรายวิชา: ${subjectName}? ข้อมูลไฟล์และบันทึกหลังแผนจะถูกนำออกจากคลัง`)) {
      const success = await onDeleteTermPlan(planId);
      if (success) {
        alert('ลบแผนการสอนประจำเทอมเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบแผนการสอน กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Filtering data subsets
  const myRequests = supervisions.filter(s => s.teacherId === currentUser.id);
  const myTermPlans = termPlans.filter(tp => tp.teacherId === currentUser.id);
  
  // Supervisions of other teachers open for volunteering
  const openForVolunteering = supervisions.filter(
    s => s.teacherId !== currentUser.id && 
         (s.status === 'pending' || (s.supervisors && s.supervisors.length < 2)) &&
         (!s.supervisors || !s.supervisors.some(sup => sup.id === currentUser.id)) &&
         s.status !== 'completed' &&
         s.status !== 'pending_approval'
  );

  // My volunteered items waiting or approved
  const myVolunteeredSupervisions = supervisions.filter(
    s => (s.supervisors && s.supervisors.some(sup => sup.id === currentUser.id)) || s.volunteerId === currentUser.id
  );

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const yearTh = parseInt(parts[0]) + 543;
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const monthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${monthsShort[monthIndex]} ${yearTh}`;
  };

  const renderRatingRow = (label, value, onChange) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f1f1f1', flexWrap: 'wrap', gap: '0.5rem' }}>
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-dark)', maxWidth: '60%' }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              backgroundColor: value === num ? 'var(--primary-color)' : 'white',
              color: value === num ? 'white' : 'var(--text-dark)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              transition: 'all 0.15s'
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  const getAverageEvalData = (supervision) => {
    if (!supervision || !supervision.evaluations || Object.keys(supervision.evaluations).length === 0) {
      return null;
    }
    const evals = Object.values(supervision.evaluations);
    const count = evals.length;

    let sumPrep = 0, sumAct = 0, sumPart = 0, sumMedia = 0, sumAssess = 0;
    let sumChars = Array(8).fill(0);

    evals.forEach(ev => {
      sumPrep += ev.ratings?.prep || 0;
      sumAct += ev.ratings?.act || 0;
      sumPart += ev.ratings?.part || 0;
      sumMedia += ev.ratings?.media || 0;
      sumAssess += ev.ratings?.assess || 0;
      for (let i = 0; i < 8; i++) {
        sumChars[i] += ev.ratings?.[`char${i + 1}`] || 0;
      }
    });

    const avgPrep = (sumPrep / count).toFixed(2);
    const avgAct = (sumAct / count).toFixed(2);
    const avgPart = (sumPart / count).toFixed(2);
    const avgMedia = (sumMedia / count).toFixed(2);
    const avgAssess = (sumAssess / count).toFixed(2);
    const avgSection3 = ((Number(avgPrep) + Number(avgAct) + Number(avgPart) + Number(avgMedia) + Number(avgAssess)) / 5).toFixed(2);

    const avgChars = sumChars.map(sum => (sum / count).toFixed(2));
    const sumAllChars = avgChars.reduce((acc, val) => acc + Number(val), 0);
    const avgSection4 = (sumAllChars / 8).toFixed(2);

    const overallAvg = ((Number(avgSection3) + Number(avgSection4)) / 2).toFixed(2);

    return {
      count,
      prep: avgPrep,
      act: avgAct,
      part: avgPart,
      media: avgMedia,
      assess: avgAssess,
      section3: avgSection3,
      chars: avgChars,
      section4: avgSection4,
      overall: overallAvg,
      evalsList: evals
    };
  };

  return (
    <div>
      {/* Tabs Menu */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          <BookOpen size={18} />
          ขอรับการนิเทศการสอน & อัปโหลดแผนการเรียนรู้
        </button>
        <button
          className={`tab-btn ${activeTab === 'term-plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('term-plans')}
        >
          <FolderOpen size={18} />
          ส่งแผนการจัดการเรียนรู้ประจำภาคเรียน
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-supervisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-supervisions')}
        >
          <ClipboardList size={18} />
          กำหนดการและการนิเทศของฉัน ({myRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'volunteer' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteer')}
        >
          <User size={18} />
          เสนอความจำนงเป็นผู้นิเทศการสอน ({openForVolunteering.length})
        </button>
      </div>

      {/* Tab 1: Request Supervision & Upload Plan */}
      {activeTab === 'request' && (
        <div className="card">
          <h2 className="card-title">
            <BookOpen />
            แบบจองเวลานิเทศการเรียนการสอนรายบุคคล
          </h2>
          
          {requestError && (
            <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <AlertCircle size={18} />
              {requestError}
            </div>
          )}

          {requestSuccess && (
            <div style={{ backgroundColor: '#eafaf1', color: '#27ae60', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <CheckCircle2 size={18} />
              {requestSuccess}
            </div>
          )}

          <form onSubmit={handleRequestSubmit}>
            <div className="form-group">
              <label>ชื่อวิชา / รหัสวิชา (ตามหลักสูตรสถานศึกษา)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น คณิตศาสตร์เพิ่มเติม (ค31201) หรือ ภาษาอังกฤษพื้นฐาน"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ระดับชั้นเรียน</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                  <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                  <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                  <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                  <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                  <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                </select>
              </div>

              <div className="form-group">
                <label>ห้องเรียนปฏิบัติการ</label>
                <select value={room} onChange={(e) => setRoom(e.target.value)}>
                  <option value="1">ห้อง 1</option>
                  <option value="2">ห้อง 2</option>
                  <option value="3">ห้อง 3</option>
                  <option value="4">ห้อง 4</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>ลิงก์เอกสารแผนการจัดการเรียนรู้คาบที่นิเทศ (Google Drive / PDF / ลิงก์สาธารณะ)</label>
              <input
                type="text"
                value={planUrl}
                onChange={(e) => setPlanUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Send size={18} />
              บันทึกการจองเวลาและส่งแผนจัดการเรียนรู้รายบุคคล
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Register Term-long Lesson Plans */}
      {activeTab === 'term-plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Submit Form Card */}
          <div className="card">
            <h2 className="card-title">
              <Plus />
              ส่งแผนการจัดการเรียนรู้ประจำภาคเรียน
            </h2>

            {termError && (
              <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                <AlertCircle size={14} />
                {termError}
              </div>
            )}

            {termSuccess && (
              <div style={{ backgroundColor: '#eafaf1', color: '#27ae60', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                <CheckCircle2 size={14} />
                {termSuccess}
              </div>
            )}

            <form onSubmit={handleTermPlanSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>ปีการศึกษา</label>
                  <select value={termYear} onChange={(e) => setTermYear(e.target.value)}>
                    <option value="2569">2569</option>
                    <option value="2568">2568</option>
                    <option value="2567">2567</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ภาคเรียนที่</label>
                  <select value={termSemester} onChange={(e) => setTermSemester(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>รหัสวิชา</label>
                  <input 
                    type="text" 
                    value={termSubjectCode} 
                    onChange={(e) => setTermSubjectCode(e.target.value)} 
                    placeholder="เช่น ค21101" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>ระดับชั้นเรียน</label>
                  <select value={termGrade} onChange={(e) => setTermGrade(e.target.value)}>
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>ชื่อรายวิชา</label>
                <input 
                  type="text" 
                  value={termSubjectName} 
                  onChange={(e) => setTermSubjectName(e.target.value)} 
                  placeholder="เช่น ภาษาอังกฤษพื้นฐาน" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>ลิงก์แผนการจัดการเรียนรู้ประจำเทอม (Google Drive)</label>
                <input 
                  type="text" 
                  value={termPlanUrl} 
                  onChange={(e) => setTermPlanUrl(e.target.value)} 
                  placeholder="https://drive.google.com/drive/folders/..." 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                <Send size={16} /> ส่งแผนประจำเทอม
              </button>
            </form>
          </div>

          {/* Submitted Term Plans Directory Card */}
          <div className="card">
            <h2 className="card-title">
              <FolderOpen />
              คลังแผนการจัดเรียนรู้ประจำภาคเรียนของคุณ ({myTermPlans.length} รายการ)
            </h2>

            {myTermPlans.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                คุณยังไม่ได้ส่งแผนการเรียนรู้ประจำภาคเรียนในระบบ
              </p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ปีการศึกษา/ภาคเรียน</th>
                      <th>รายวิชา</th>
                      <th>ลิงก์แผน</th>
                      <th>บันทึกหลังสอน</th>
                      <th style={{ textAlign: 'center' }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTermPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>ภาคเรียน {plan.term}/{plan.academicYear}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{plan.subjectCode}</span> <br />
                          <span style={{ fontSize: '13px' }}>{plan.subjectName} (ชั้น ม.{plan.grade.replace('ม.', '')})</span>
                        </td>
                        <td>
                          <a href={plan.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '11px' }}>
                            เปิดแผน
                          </a>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedTermPlan(plan);
                              setPostLessonOutcome(plan.postLessonRecord?.outcome || '');
                            }}
                          >
                            {plan.postLessonRecord ? 'ดู/แก้ไขหลังแผน' : 'เขียนหลังแผน'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-outline btn-danger"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '11px', color: '#e74c3c', borderColor: '#e74c3c' }}
                            onClick={() => handleDeleteTermPlanClick(plan.id, plan.subjectName)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Write Post-Lesson Feedback */}
          {selectedTermPlan && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h3>บันทึกข้อเสนอแนะ/รายงานหลังแผนการจัดการเรียนรู้</h3>
                  <button className="modal-close-btn" onClick={() => setSelectedTermPlan(null)}>×</button>
                </div>
                <form onSubmit={handlePostLessonSubmit}>
                  <div className="modal-body">
                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '13px' }}>
                      <strong>รายวิชา:</strong> {selectedTermPlan.subjectCode} {selectedTermPlan.subjectName} (ชั้น ม.{selectedTermPlan.grade.replace('ม.', '')}) <br />
                      <strong>ปีการศึกษา/ภาคเรียน:</strong> {selectedTermPlan.term}/{selectedTermPlan.academicYear}
                    </div>

                    <div className="form-group">
                      <label>บันทึกรายงาน/ข้อเสนอแนะหลังการจัดกิจกรรมการเรียนรู้ (Outcome)</label>
                      <textarea
                        rows="6"
                        value={postLessonOutcome}
                        onChange={(e) => setPostLessonOutcome(e.target.value)}
                        placeholder="ระบุสรุปผลการจัดกิจกรรม ปัญหาที่พบบ่อย และข้อค้นพบ/รายงานหลังแผน..."
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedTermPlan(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Supervisions */}
      {activeTab === 'my-supervisions' && (
        <div className="card">
          <h2 className="card-title">
            <ClipboardList />
            รายการคำขอและการจองวันเวลานิเทศการสอนของคุณ
          </h2>

          {myRequests.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูลกำหนดการนิเทศการสอน</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>รายวิชา</th>
                    <th>ระดับชั้น/ห้องเรียน</th>
                    <th>วัน-เวลาที่นิเทศ</th>
                    <th>แผนการสอน</th>
                    <th>คณะกรรมการนิเทศ</th>
                    <th>สถานะ</th>
                    <th>รายงานผล</th>
                    <th style={{ textAlign: 'center' }}>การจัดการการจอง</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.subject}</td>
                      <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                      <td>
                        {req.date ? (
                          <>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{formatThaiDate(req.date)}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>เวลา {req.time}</div>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#e67e22', fontWeight: 600, fontStyle: 'italic' }}>
                            ⚠️ รอกำหนดวัน-เวลาจากฝ่ายวิชาการ
                          </span>
                        )}
                      </td>
                      <td>
                        <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '12px', display: 'inline-flex', gap: '0.25rem' }}>
                          <FileText size={12} /> เปิดแผนการสอน
                        </a>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {req.supervisors && req.supervisors.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            {req.supervisors.map(s => <span key={s.id}>• {s.name}</span>)}
                            {req.supervisors.length < 2 && (
                              <span style={{ color: '#e74c3c', fontSize: '11px', fontWeight: 600 }}>
                                (ต้องการผู้นิเทศอีก {2 - req.supervisors.length} ท่าน)
                              </span>
                            )}
                          </div>
                        ) : req.status === 'pending_approval' ? (
                          <span style={{ color: 'var(--secondary-hover)', fontSize: '12px', fontWeight: 600 }}>
                            รอพิจารณาคำขอเสนอตัว ({req.volunteerName})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic' }}>อยู่ระหว่างจัดสรร</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status === 'pending' && 'อยู่ระหว่างจัดสรรคณะกรรมการ'}
                          {req.status === 'pending_approval' && 'อยู่ระหว่างพิจารณาผู้เสนอความจำนง'}
                          {req.status === 'approved' && 'แต่งตั้งคณะกรรมการเสร็จสิ้น'}
                          {req.status === 'completed' && 'รายงานผลเสร็จสิ้น'}
                        </span>
                      </td>
                      <td>
                        {req.status === 'approved' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedSupervision(req);
                              setStudentOutcome(req.postTeachingRecord?.studentOutcome || '');
                              setProblems(req.postTeachingRecord?.problems || '');
                              setSolutions(req.postTeachingRecord?.solutions || '');
                            }}
                          >
                            รายงานบันทึกหลังสอน
                          </button>
                        )}
                        {req.status === 'completed' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedSupervision(req);
                              setStudentOutcome(req.postTeachingRecord.studentOutcome);
                              setProblems(req.postTeachingRecord.problems);
                              setSolutions(req.postTeachingRecord.solutions);
                            }}
                          >
                            ดู/แก้ไขรายงานผล
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            รอแต่งตั้งผู้นิเทศครบก่อนรายงาน
                          </span>
                        )}
                        {req.status === 'pending_approval' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>รอแต่งตั้งเสร็จสิ้น</span>
                        )}
                        {req.evaluations && Object.keys(req.evaluations).length > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap', marginTop: '0.35rem', display: 'block', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            onClick={() => {
                              setSelectedReportSummary(req);
                            }}
                          >
                            📊 ดูผลประเมิน ({Object.keys(req.evaluations).length} ท่าน)
                          </button>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '12px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center' }}
                            onClick={() => {
                              setEditingSupervision(req);
                              setEditSubject(req.subject);
                              setEditGrade(req.grade);
                              setEditRoom(req.room);
                              setEditDate(req.date);
                              setEditTime(req.time);
                              setEditPlanUrl(req.lessonPlanUrl);
                            }}
                          >
                            <Edit size={12} /> แก้ไข
                          </button>
                          <button
                            className="btn btn-outline btn-danger"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '12px', color: '#e74c3c', borderColor: '#e74c3c', display: 'inline-flex', alignItems: 'center' }}
                            onClick={() => handleDeleteSupervisionClick(req.id)}
                          >
                            <Trash2 size={12} /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Write Post-Teaching Record */}
          {selectedSupervision && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>
                    บันทึกรายงานผลหลังการจัดการเรียนรู้: รายวิชา {selectedSupervision.subject}
                  </h3>
                  <button className="modal-close-btn" onClick={() => setSelectedSupervision(null)}>×</button>
                </div>
                <form onSubmit={handlePostRecordSubmit}>
                  <div className="modal-body">
                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '13px' }}>
                      <strong>ระดับชั้นเรียน:</strong> ชั้นมัธยมศึกษาปีที่ {selectedSupervision.grade.replace('ม.', '')}/{selectedSupervision.room} | 
                      <strong> วันที่จัดกิจกรรม:</strong> {formatThaiDate(selectedSupervision.date)} เวลา {selectedSupervision.time} <br />
                      <strong>คณะกรรมการนิเทศ:</strong> {selectedSupervision.supervisors ? selectedSupervision.supervisors.map(s => s.name).join(', ') : 'ยังไม่ระบุ'}
                    </div>

                    <div className="form-group">
                      <label>1. ผลการจัดการเรียนรู้ (การบรรลุจุดประสงค์การเรียนรู้และสมรรถนะผู้เรียน)</label>
                      <textarea
                        rows="3"
                        value={studentOutcome}
                        onChange={(e) => setStudentOutcome(e.target.value)}
                        placeholder="กรอกผลสำเร็จและคุณภาพของผู้เรียนจากการจัดกิจกรรมการเรียนรู้..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>2. ปัญหาและอุปสรรค (ด้านการจัดกิจกรรม สื่อ/อุปกรณ์ หรือพฤติกรรมผู้เรียน)</label>
                      <textarea
                        rows="3"
                        value={problems}
                        onChange={(e) => setProblems(e.target.value)}
                        placeholder="กรอกข้อขัดข้อง ปัญหา และอุปสรรคในการจัดการเรียนรู้..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>3. ข้อเสนอแนะและแนวทางแก้ไข (การปรับปรุงสำหรับการจัดกิจกรรมครั้งถัดไป)</label>
                      <textarea
                        rows="3"
                        value={solutions}
                        onChange={(e) => setSolutions(e.target.value)}
                        placeholder="กรอกแนวทางการแก้ไข ปรับปรุง หรือวิธีการพัฒนาการเรียนรู้..."
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedSupervision(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกรายงานผล</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit Supervision Request */}
          {editingSupervision && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                  <h3>แก้ไขข้อมูลคำขอรับการนิเทศการสอน</h3>
                  <button className="modal-close-btn" onClick={() => setEditingSupervision(null)}>×</button>
                </div>
                <form onSubmit={handleEditSupervisionSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>ชื่อวิชา / รหัสวิชา (ตามหลักสูตรสถานศึกษา)</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label>ระดับชั้นเรียน</label>
                        <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}>
                          <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                          <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                          <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                          <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                          <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                          <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>ห้องเรียนปฏิบัติการ</label>
                        <select value={editRoom} onChange={(e) => setEditRoom(e.target.value)}>
                          <option value="1">ห้อง 1</option>
                          <option value="2">ห้อง 2</option>
                          <option value="3">ห้อง 3</option>
                          <option value="4">ห้อง 4</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ลิงก์แผนการจัดการเรียนรู้ (Google Drive / ลิงก์สาธารณะ)</label>
                      <input
                        type="text"
                        value={editPlanUrl}
                        onChange={(e) => setEditPlanUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setEditingSupervision(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Volunteer & Volunteer Status */}
      {activeTab === 'volunteer' && (
        <div>
          {/* Section A: Open list */}
          <div className="card">
            <h2 className="card-title">
              <User />
              กำหนดการนิเทศการสอนที่เปิดรับการเสนอความจำนงเป็นผู้นิเทศ
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              ครูผู้สอนสามารถเสนอความจำนงเป็นผู้นิเทศการสอนสำหรับวิชาของเพื่อนครูที่ยังแต่งตั้งผู้นิเทศไม่ครบถ้วนได้ โดยการแต่งตั้งจะมีผลสมบูรณ์เมื่อได้รับการอนุมัติจากฝ่ายวิชาการ
            </p>

            {openForVolunteering.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                ไม่พบกำหนดการนิเทศที่เปิดรับเสนอความจำนงในขณะนี้
              </p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ครูผู้รับการนิเทศ</th>
                      <th>รายวิชา</th>
                      <th>ระดับชั้น/ห้องเรียน</th>
                      <th>วัน-เวลาที่นิเทศ</th>
                      <th>แผนการจัดการเรียนรู้</th>
                      <th>การดำเนินงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openForVolunteering.map((req) => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                        <td>{req.subject}</td>
                        <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                        <td>{formatThaiDate(req.date)} (เวลา {req.time})</td>
                        <td>
                          <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                            เปิดแผนการจัดการเรียนรู้
                          </a>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '13px' }}
                            onClick={() => onVolunteer(req.id)}
                          >
                            เสนอความจำนงเป็นผู้นิเทศ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: My Volunteered Tasks */}
          <div className="card">
            <h2 className="card-title">
              <CalendarIcon />
              กำหนดการปฏิบัติหน้าที่ผู้นิเทศของคุณ (ได้รับการแต่งตั้ง / อยู่ระหว่างรออนุมัติ)
            </h2>

            {myVolunteeredSupervisions.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem' }}>ไม่พบประวัติการเสนอความจำนงหรือภาระงานนิเทศการสอนของท่านในขณะนี้</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ครูผู้สอน</th>
                      <th>รายวิชา</th>
                      <th>ระดับชั้น/ห้องเรียน</th>
                      <th>วัน-เวลาที่นิเทศ</th>
                      <th>แผนการจัดการเรียนรู้</th>
                      <th>สถานะการพิจารณา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myVolunteeredSupervisions.map((req) => {
                      const isApproved = req.supervisors && req.supervisors.some(sup => sup.id === currentUser.id);
                      return (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                          <td>{req.subject}</td>
                          <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                          <td>{formatThaiDate(req.date)} (เวลา {req.time})</td>
                          <td>
                            <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                              แผนการจัดการเรียนรู้
                            </a>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                              {isApproved ? (
                                <>
                                  <span className="badge badge-approved" style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                    <CheckCircle2 size={12} /> ได้รับการแต่งตั้งเป็นผู้นิเทศแล้ว
                                  </span>
                                  {req.date && (
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap', marginTop: '0.25rem' }}
                                      onClick={() => {
                                        setSelectedEvalSupervision(req);
                                        const myEval = req.evaluations?.[currentUser.id] || {};
                                        setEvalPrep(myEval.ratings?.prep || 5);
                                        setEvalAct(myEval.ratings?.act || 5);
                                        setEvalPart(myEval.ratings?.part || 5);
                                        setEvalMedia(myEval.ratings?.media || 5);
                                        setEvalAssess(myEval.ratings?.assess || 5);
                                        setEvalChar1(myEval.ratings?.char1 || 5);
                                        setEvalChar2(myEval.ratings?.char2 || 5);
                                        setEvalChar3(myEval.ratings?.char3 || 5);
                                        setEvalChar4(myEval.ratings?.char4 || 5);
                                        setEvalChar5(myEval.ratings?.char5 || 5);
                                        setEvalChar6(myEval.ratings?.char6 || 5);
                                        setEvalChar7(myEval.ratings?.char7 || 5);
                                        setEvalChar8(myEval.ratings?.char8 || 5);
                                        setEvalQualitative(myEval.qualitative || '');
                                        setEvalSuggestions(myEval.suggestions || '');
                                      }}
                                    >
                                      📝 {req.evaluations?.[currentUser.id] ? 'แก้ไขการประเมิน' : 'กรอกการประเมินนิเทศ'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="badge badge-volunteered" style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <Clock size={12} /> อยู่ระหว่างฝ่ายวิชาการพิจารณาแต่งตั้ง
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Classroom Observation Evaluation Form */}
      {selectedEvalSupervision && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>แบบบันทึกการประเมินการสังเกตชั้นเรียน (PLC)</h3>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedEvalSupervision(null)}>×</button>
            </div>
            <form onSubmit={handleEvalSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
                  <div><strong>ครูผู้สอน:</strong> {selectedEvalSupervision.teacherName}</div>
                  <div><strong>รายวิชา:</strong> {selectedEvalSupervision.subject} (ชั้น ม.{selectedEvalSupervision.grade.replace('ม.', '')}/{selectedEvalSupervision.room})</div>
                  <div><strong>วัน-เวลาคาบนิเทศ:</strong> {formatThaiDate(selectedEvalSupervision.date)} เวลา {selectedEvalSupervision.time}</div>
                  <div><strong>ผู้นิเทศ (คุณ):</strong> {currentUser.name}</div>
                </div>

                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>1. จุดประสงค์การสังเกตชั้นเรียน</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-medium)', backgroundColor: '#f0f9ff', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #d0e8f8' }}>
                    เพื่อเก็บข้อมูลการจัดการเรียนรู้ที่เน้นผู้เรียนเป็นสำคัญ โดยเน้นการจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) เพื่อส่งเสริมการเรียนรู้ของผู้เรียนให้เกิดประสิทธิภาพสูงสุด
                  </p>
                </div>

                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    2. รายการประเด็นสังเกต (คะแนน 1 - 5)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {renderRatingRow('3.1 การเตรียมการสอน (การวางแผนและจัดเตรียมความพร้อม)', evalPrep, setEvalPrep)}
                    {renderRatingRow('3.2 กิจกรรมการเรียนรู้ (กระบวนการจัดการเรียนรู้เชิงรุก)', evalAct, setEvalAct)}
                    {renderRatingRow('3.3 การมีส่วนร่วมของนักเรียน (ความสนใจและการมีปฏิสัมพันธ์)', evalPart, setEvalPart)}
                    {renderRatingRow('3.4 การใช้สื่อและเทคโนโลยี (ความเหมาะสมและช่วยการเรียนรู้)', evalMedia, setEvalMedia)}
                    {renderRatingRow('3.5 การวัดและประเมินผล (สอดคล้องกับวัตถุประสงค์และมีความหลากหลาย)', evalAssess, setEvalAssess)}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    3. คุณลักษณะของผู้เรียนตามที่สังเกต (คะแนน 1 - 5)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {renderRatingRow('(1) ผู้เรียนสามารถเข้าถึงสิ่งที่เรียนและเข้าใจบทเรียน', evalChar1, setEvalChar1)}
                    {renderRatingRow('(2) ผู้เรียนสามารถเชื่อมโยงความรู้หรือประสบการณ์เดิมกับการเรียนรู้ใหม่', evalChar2, setEvalChar2)}
                    {renderRatingRow('(3) ผู้เรียนได้สร้างความรู้เองหรือได้สร้างประสบการณ์ใหม่จากการเรียนรู้', evalChar3, setEvalChar3)}
                    {renderRatingRow('(4) ผู้เรียนได้รับการกระตุ้นและเกิดแรงจูงใจในการเรียนรู้', evalChar4, setEvalChar4)}
                    {renderRatingRow('(5) ผู้เรียนได้รับการพัฒนาทักษะความเชี่ยวชาญจากการเรียนรู้', evalChar5, setEvalChar5)}
                    {renderRatingRow('(6) ผู้เรียนได้รับข้อมูลสะท้อนกลับเพื่อปรับปรุงการเรียนรู้', evalChar6, setEvalChar6)}
                    {renderRatingRow('(7) ผู้เรียนได้รับการพัฒนาการเรียนรู้ในบรรยากาศชั้นเรียนที่เหมาะสม', evalChar7, setEvalChar7)}
                    {renderRatingRow('(8) ผู้เรียนสามารถกำกับการเรียนรู้และมีการเรียนรู้แบบนำตนเอง', evalChar8, setEvalChar8)}
                  </div>
                </div>

                <div className="form-group">
                  <label>4. ข้อสังเกตเชิงคุณภาพ (จุดเด่น หรือสิ่งสังเกตที่พบในกระบวนการจัดกิจกรรม)</label>
                  <textarea
                    rows="3"
                    value={evalQualitative}
                    onChange={(e) => setEvalQualitative(e.target.value)}
                    placeholder="ระบุพฤติกรรมผู้เรียน การจัดการเรียนรู้ของครู จุดเด่นการสอนที่เห็นเด่นชัด..."
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>5. สรุปและข้อเสนอแนะ (แนวทางการพัฒนาปรับปรุงเพิ่มเติม)</label>
                  <textarea
                    rows="3"
                    value={evalSuggestions}
                    onChange={(e) => setEvalSuggestions(e.target.value)}
                    placeholder="เสนอแนะแนวทางในการพัฒนาต่อยอด ปรับปรุงแผนการสอน หรือการจัดการเรียนรู้..."
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedEvalSupervision(null)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกผลการประเมิน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Detailed Evaluation Summary Report */}
      {selectedReportSummary && (() => {
        const avgData = getAverageEvalData(selectedReportSummary);
        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h3>รายงานสรุปผลการนิเทศการจัดการเรียนรู้รายบุคคล</h3>
                <button type="button" className="modal-close-btn" onClick={() => setSelectedReportSummary(null)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* General Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
                  <div><strong>ครูผู้สอน:</strong> {selectedReportSummary.teacherName}</div>
                  <div><strong>รายวิชา:</strong> {selectedReportSummary.subject} (ชั้น ม.{selectedReportSummary.grade.replace('ม.', '')}/{selectedReportSummary.room})</div>
                  <div><strong>วัน-เวลาที่นิเทศ:</strong> {formatThaiDate(selectedReportSummary.date)} เวลา {selectedReportSummary.time}</div>
                  <div><strong>คณะกรรมการนิเทศ:</strong> {selectedReportSummary.supervisors ? selectedReportSummary.supervisors.map(s => s.name).join(', ') : 'ยังไม่แต่งตั้ง'}</div>
                </div>

                {!avgData ? (
                  <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '4px', color: 'var(--text-light)' }}>
                    ยังไม่มีผู้นิเทศกรอกข้อมูลการประเมินในระบบ
                  </div>
                ) : (
                  <>
                    {/* Overall Summary Score Card */}
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #b2f5ea' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-approved)' }}>คะแนนเฉลี่ยรวม</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.1 }}>{avgData.overall}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-medium)' }}>เต็ม 5.00 คะแนน</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>1. ด้านการจัดกระบวนการเรียนรู้ (3.1-3.5):</strong></span>
                          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{avgData.section3} / 5.00</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>2. ด้านคุณลักษณะของผู้เรียน (1-8):</strong></span>
                          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{avgData.section4} / 5.00</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-medium)', borderTop: '1px solid #d4f2e6', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          * คำนวณเฉลี่ยรวมจากแบบประเมินจำนวน {avgData.count} ฉบับ
                        </div>
                      </div>
                    </div>

                    {/* Detailed Scores Breakdown */}
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>คะแนนเฉลี่ยรายประเด็น</h4>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <table style={{ margin: 0, width: '100%' }}>
                          <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                              <th style={{ padding: '0.5rem', fontSize: '12px' }}>ประเด็นประเมินการสังเกตชั้นเรียน</th>
                              <th style={{ padding: '0.5rem', fontSize: '12px', textAlign: 'center', width: '90px' }}>คะแนนเฉลี่ย</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: '0.5rem', fontSize: '13px', fontWeight: 600 }} colSpan={2}>ส่วนที่ 1: การสังเกตกิจกรรมกระบวนการเรียนรู้</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.1 การเตรียมการสอน (การวางแผนและจัดเตรียมความพร้อม)</td>
                              <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.prep}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.2 กิจกรรมการเรียนรู้ (กระบวนการจัดการเรียนรู้เชิงรุก)</td>
                              <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.act}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.3 การมีส่วนร่วมของนักเรียน (ความสนใจและการมีปฏิสัมพันธ์)</td>
                              <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.part}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.4 การใช้สื่อและเทคโนโลยี (ความเหมาะสมและช่วยการเรียนรู้)</td>
                              <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.media}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.5 การวัดและประเมินผล (สอดคล้องกับวัตถุประสงค์และมีความหลากหลาย)</td>
                              <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.assess}</td>
                            </tr>

                            <tr>
                              <td style={{ padding: '0.5rem', fontSize: '13px', fontWeight: 600 }} colSpan={2}>ส่วนที่ 2: คุณลักษณะของผู้เรียนที่เกิดขึ้นจริง</td>
                            </tr>
                            {[
                              '(1) ผู้เรียนสามารถเข้าถึงสิ่งที่เรียนและเข้าใจบทเรียน',
                              '(2) ผู้เรียนสามารถเชื่อมโยงความรู้หรือประสบการณ์เดิมกับการเรียนรู้ใหม่',
                              '(3) ผู้เรียนได้สร้างความรู้เองหรือได้สร้างประสบการณ์ใหม่จากการเรียนรู้',
                              '(4) ผู้เรียนได้รับการกระตุ้นและเกิดแรงจูงใจในการเรียนรู้',
                              '(5) ผู้เรียนได้รับการพัฒนาทักษะความเชี่ยวชาญจากการเรียนรู้',
                              '(6) ผู้เรียนได้รับข้อมูลสะท้อนกลับเพื่อปรับปรุงการเรียนรู้',
                              '(7) ผู้เรียนได้รับการพัฒนาการเรียนรู้ในบรรยากาศชั้นเรียนที่เหมาะสม',
                              '(8) ผู้เรียนสามารถกำกับการเรียนรู้และมีการเรียนรู้แบบนำตนเอง'
                            ].map((label, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>{label}</td>
                                <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.chars[idx]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Qualitative Comments & Suggestions */}
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>ข้อเสนอแนะและข้อสังเกตจากคณะกรรมการนิเทศ</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {avgData.evalsList.map((ev) => (
                          <div key={ev.supervisorId} style={{ backgroundColor: '#fafafa', border: '1px solid #eee', padding: '0.75rem', borderRadius: '4px', fontSize: '13px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary-color)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                              ✍️ ผู้นิเทศ: {ev.supervisorName}
                            </div>
                            <div style={{ marginBottom: '0.4rem' }}>
                              <strong>ข้อสังเกตเชิงคุณภาพ:</strong>
                              <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{ev.qualitative || '- ไม่มีระบุ -'}</div>
                            </div>
                            <div>
                              <strong>ข้อเสนอแนะและสรุป:</strong>
                              <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{ev.suggestions || '- ไม่มีระบุ -'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Self Reflection Section */}
                {selectedReportSummary.status === 'completed' && selectedReportSummary.postTeachingRecord && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--status-completed)', fontSize: '14px', marginBottom: '0.5rem' }}>
                      บันทึกหลังสอนตนเองของคุณครู (Self-Reflection)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', backgroundColor: '#f0f9ff', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #d0e8f8' }}>
                      <div><strong>1. ผลการจัดการเรียนรู้:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{selectedReportSummary.postTeachingRecord.studentOutcome}</div></div>
                      <div><strong>2. ปัญหาและอุปสรรค:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{selectedReportSummary.postTeachingRecord.problems}</div></div>
                      <div><strong>3. แนวทางแก้ไขและพัฒนา:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{selectedReportSummary.postTeachingRecord.solutions}</div></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setSelectedReportSummary(null)}>ปิดหน้าต่าง</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
