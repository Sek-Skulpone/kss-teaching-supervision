import React, { useState } from 'react';
import { BookOpen, Calendar as CalendarIcon, ClipboardList, CheckCircle2, AlertCircle, FileText, Send, User, ChevronRight, Clock } from 'lucide-react';

export default function TeacherDashboard({
  currentUser,
  supervisions,
  onAddSupervision,
  onVolunteer,
  onSubmitPostRecord
}) {
  const [activeTab, setActiveTab] = useState('request');

  // Request Form States
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [planUrl, setPlanUrl] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // Post Teaching Record Form States
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [studentOutcome, setStudentOutcome] = useState('');
  const [problems, setProblems] = useState('');
  const [solutions, setSolutions] = useState('');

  // Handle Supervision Request Submit
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!subject || !date || !time || !planUrl) {
      setRequestError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }
    
    onAddSupervision({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      subject,
      grade,
      room,
      date,
      time,
      lessonPlanUrl: planUrl
    });

    setSubject('');
    setPlanUrl('');
    setRequestError('');
    setRequestSuccess('ส่งคำขอและอัปโหลดแผนการสอนเรียบร้อยแล้ว!');
    setTimeout(() => setRequestSuccess(''), 4000);
  };

  // Handle Post Record Submit
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
    alert('บันทึกหลังการสอนเสร็จสิ้นและบันทึกข้อมูลเรียบร้อย!');
  };

  // Filter lists
  const myRequests = supervisions.filter(s => s.teacherId === currentUser.id);
  
  // Supervisions of other teachers that are open for volunteering (status: 'pending' or supervisors < 2, and not already joined or own)
  const openForVolunteering = supervisions.filter(
    s => s.teacherId !== currentUser.id && 
         (s.status === 'pending' || (s.supervisors && s.supervisors.length < 2)) &&
         (!s.supervisors || !s.supervisors.some(sup => sup.id === currentUser.id)) &&
         s.status !== 'completed' &&
         s.status !== 'pending_approval' // If someone is already volunteering and waiting, hide from others for now
  );

  // My volunteered items waiting for admin approval, or approved where I am one of the supervisors
  const myVolunteeredSupervisions = supervisions.filter(
    s => (s.supervisors && s.supervisors.some(sup => sup.id === currentUser.id)) || s.volunteerId === currentUser.id
  );

  return (
    <div>
      {/* Tabs */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          <BookOpen size={18} />
          ขอรับการนิเทศการสอน & อัปโหลดแผนการจัดการเรียนรู้
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-supervisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-supervisions')}
        >
          <ClipboardList size={18} />
          กำหนดการและการนิเทศการสอนของฉัน ({myRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'volunteer' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteer')}
        >
          <User size={18} />
          เสนอความจำนงเป็นผู้นิเทศการสอน ({openForVolunteering.length})
        </button>
      </div>

      {/* Tab Content 1: Request Supervision & Upload Plan */}
      {activeTab === 'request' && (
        <div className="card">
          <h2 className="card-title">
            <BookOpen />
            แบบคำขอรับการนิเทศการสอน & อัปโหลดแผนการจัดการเรียนรู้
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

            <div className="form-row">
              <div className="form-group">
                <label>วันที่ประสงค์ขอรับการนิเทศ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>คาบเวลาที่ประสงค์ขอรับการนิเทศ</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>ลิงก์เอกสารแผนการจัดการเรียนรู้ (Google Drive / ลิงก์สาธารณะ)</label>
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
              บันทึกคำขอรับการนิเทศการสอนและส่งแผนการจัดการเรียนรู้
            </button>
          </form>
        </div>
      )}

      {/* Tab Content 2: My Supervisions */}
      {activeTab === 'my-supervisions' && (
        <div className="card">
          <h2 className="card-title">
            <ClipboardList />
            รายการการนิเทศการสอนของคุณครู {currentUser.name}
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
                    <th>แผนการจัดการเรียนรู้</th>
                    <th>คณะกรรมการนิเทศ</th>
                    <th>สถานะ</th>
                    <th>การดำเนินงาน</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.subject}</td>
                      <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{req.date}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>เวลา {req.time} น.</div>
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
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px' }}
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
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px' }}
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
                            รอแต่งตั้งผู้นิเทศให้ครบ 2 ท่านก่อนรายงานผล
                          </span>
                        )}
                        {req.status === 'pending_approval' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>รอแต่งตั้งคณะกรรมการให้เสร็จสิ้น</span>
                        )}
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
                      <strong> วันที่จัดกิจกรรม:</strong> {selectedSupervision.date} เวลา {selectedSupervision.time} น. <br />
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
        </div>
      )}

      {/* Tab Content 3: Volunteer & Volunteer Status */}
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
                        <td>{req.date} (เวลา {req.time} น.)</td>
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
                          <td>{req.date} (เวลา {req.time} น.)</td>
                          <td>
                            <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                              แผนการจัดการเรียนรู้
                            </a>
                          </td>
                          <td>
                            {isApproved ? (
                              <span className="badge badge-approved" style={{ padding: '0.4rem 0.8rem' }}>
                                <CheckCircle2 size={12} /> ได้รับการแต่งตั้งเป็นผู้นิเทศแล้ว
                              </span>
                            ) : (
                              <span className="badge badge-volunteered" style={{ padding: '0.4rem 0.8rem' }}>
                                <Clock size={12} /> อยู่ระหว่างฝ่ายวิชาการพิจารณาแต่งตั้ง
                              </span>
                            )}
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
    </div>
  );
}
