import React, { useState } from 'react';
import { Search, FolderOpen, Eye, FileText, ClipboardList } from 'lucide-react';

export default function TermPlanArchive({ termPlans }) {
  const [selectedYear, setSelectedYear] = useState('2569');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Available filters
  const years = ['2569', '2568', '2567'];
  const terms = ['1', '2'];

  // Filtered term plans
  const filteredPlans = termPlans.filter(plan => {
    const matchesYear = plan.academicYear === selectedYear;
    const matchesTerm = plan.term === selectedTerm;
    
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      plan.teacherName.toLowerCase().includes(query) ||
      plan.subjectName.toLowerCase().includes(query) ||
      plan.subjectCode.toLowerCase().includes(query);
      
    return matchesYear && matchesTerm && matchesSearch;
  });

  return (
    <div className="card">
      <h2 className="card-title">
        <FolderOpen />
        คลังแผนการจัดการเรียนรู้และบันทึกข้อเสนอแนะหลังแผนประจำภาคเรียน
      </h2>
      
      {/* Search and Filters bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: '0.25rem' }}>ปีการศึกษา</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: '0.5rem' }}
            >
              {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ marginBottom: '0.25rem' }}>ภาคเรียน</label>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={{ padding: '0.5rem' }}
            >
              {terms.map(t => <option key={t} value={t}>ภาคเรียนที่ {t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ flex: 2, minWidth: '280px' }}>
          <label style={{ marginBottom: '0.25rem' }}>ค้นหาคุณครู หรือรายวิชา</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อคุณครู, รหัสวิชา, หรือชื่อรายวิชา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.25rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          </div>
        </div>
      </div>

      {/* Plans List Table */}
      {filteredPlans.length === 0 ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          ไม่พบข้อมูลแผนการจัดการเรียนรู้ประจำภาคเรียนตามเงื่อนไขที่ระบุ
        </p>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ครูผู้จัดการเรียนรู้</th>
                <th>รหัสวิชา - รายวิชา</th>
                <th>ระดับชั้นเรียน</th>
                <th>ลิงก์แผนการสอน</th>
                <th>วันเวลาที่ส่ง</th>
                <th>บันทึกหลังแผนการสอน</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td style={{ fontWeight: 600 }}>{plan.teacherName}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{plan.subjectCode}</span> - {plan.subjectName}
                  </td>
                  <td>ชั้น ม.{plan.grade.replace('ม.', '')}</td>
                  <td>
                    <a 
                      href={plan.lessonPlanUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '12px', display: 'inline-flex', gap: '0.25rem' }}
                    >
                      <FileText size={12} /> เปิดดูแผน
                    </a>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                    {new Date(plan.submittedAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} น.
                  </td>
                  <td>
                    {plan.postLessonRecord ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '12px', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <Eye size={12} /> เปิดอ่านบันทึกหลังแผน
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>ยังไม่มีบันทึก</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Post-Lesson Feedback Record Modal */}
      {selectedPlan && selectedPlan.postLessonRecord && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>รายงานบันทึกหลังแผนการจัดการเรียนรู้</h3>
              <button className="modal-close-btn" onClick={() => setSelectedPlan(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
                <div><strong>ครูผู้จัดการเรียนรู้:</strong> {selectedPlan.teacherName}</div>
                <div><strong>รหัสวิชา - วิชา:</strong> {selectedPlan.subjectCode} {selectedPlan.subjectName}</div>
                <div><strong>ระดับชั้นเรียน:</strong> ม. {selectedPlan.grade.replace('ม.', '')}</div>
                <div><strong>ภาคเรียน/ปีการศึกษา:</strong> {selectedPlan.term}/{selectedPlan.academicYear}</div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ClipboardList size={16} /> สรุปบันทึกหลังแผนการสอน
                </h5>
                <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#fafafa', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eee', color: 'var(--text-dark)' }}>
                  {selectedPlan.postLessonRecord.outcome}
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'right' }}>
                วันที่บันทึก: {new Date(selectedPlan.postLessonRecord.submittedAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} น.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedPlan(null)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
