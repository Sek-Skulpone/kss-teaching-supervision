import React, { useState, useEffect } from 'react';

export default function EvaluationModal({ supervision, currentUser, onClose, onSubmit }) {
  const [prep, setPrep] = useState(5);
  const [act, setAct] = useState(5);
  const [part, setPart] = useState(5);
  const [media, setMedia] = useState(5);
  const [assess, setAssess] = useState(5);
  const [char1, setChar1] = useState(5);
  const [char2, setChar2] = useState(5);
  const [char3, setChar3] = useState(5);
  const [char4, setChar4] = useState(5);
  const [char5, setChar5] = useState(5);
  const [char6, setChar6] = useState(5);
  const [char7, setChar7] = useState(5);
  const [char8, setChar8] = useState(5);
  const [qualitative, setQualitative] = useState('');
  const [suggestions, setSuggestions] = useState('');

  // Load existing evaluation data if it exists for this supervisor
  useEffect(() => {
    if (supervision && supervision.evaluations && supervision.evaluations[currentUser.id]) {
      const myEval = supervision.evaluations[currentUser.id];
      setPrep(myEval.ratings?.prep ?? 5);
      setAct(myEval.ratings?.act ?? 5);
      setPart(myEval.ratings?.part ?? 5);
      setMedia(myEval.ratings?.media ?? 5);
      setAssess(myEval.ratings?.assess ?? 5);
      setChar1(myEval.ratings?.char1 ?? 5);
      setChar2(myEval.ratings?.char2 ?? 5);
      setChar3(myEval.ratings?.char3 ?? 5);
      setChar4(myEval.ratings?.char4 ?? 5);
      setChar5(myEval.ratings?.char5 ?? 5);
      setChar6(myEval.ratings?.char6 ?? 5);
      setChar7(myEval.ratings?.char7 ?? 5);
      setChar8(myEval.ratings?.char8 ?? 5);
      setQualitative(myEval.qualitative ?? '');
      setSuggestions(myEval.suggestions ?? '');
    }
  }, [supervision, currentUser]);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const newEvaluations = {
      ...(supervision.evaluations || {}),
      [currentUser.id]: {
        supervisorId: currentUser.id,
        supervisorName: currentUser.name,
        submittedAt: new Date().toISOString(),
        ratings: {
          prep: Number(prep),
          act: Number(act),
          part: Number(part),
          media: Number(media),
          assess: Number(assess),
          char1: Number(char1),
          char2: Number(char2),
          char3: Number(char3),
          char4: Number(char4),
          char5: Number(char5),
          char6: Number(char6),
          char7: Number(char7),
          char8: Number(char8)
        },
        qualitative: qualitative.trim(),
        suggestions: suggestions.trim()
      }
    };

    onSubmit(newEvaluations);
  };

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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3>แบบบันทึกการประเมินการสังเกตชั้นเรียน (PLC)</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
              <div><strong>ครูผู้สอน:</strong> {supervision.teacherName}</div>
              <div><strong>รายวิชา:</strong> {supervision.subject} (ชั้น ม.{supervision.grade.replace('ม.', '')}/{supervision.room})</div>
              <div><strong>วัน-เวลาคาบนิเทศ:</strong> {formatThaiDate(supervision.date)} เวลา {supervision.time}</div>
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
                {renderRatingRow('3.1 การเตรียมการสอน (การวางแผนและจัดเตรียมความพร้อม)', prep, setPrep)}
                {renderRatingRow('3.2 กิจกรรมการเรียนรู้ (กระบวนการจัดการเรียนรู้เชิงรุก)', act, setAct)}
                {renderRatingRow('3.3 การมีส่วนร่วมของนักเรียน (ความสนใจและการมีปฏิสัมพันธ์)', part, setPart)}
                {renderRatingRow('3.4 การใช้สื่อและเทคโนโลยี (ความเหมาะสมและช่วยการเรียนรู้)', media, setMedia)}
                {renderRatingRow('3.5 การวัดและประเมินผล (สอดคล้องกับวัตถุประสงค์และมีความหลากหลาย)', assess, setAssess)}
              </div>
            </div>

            <div>
              <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                3. คุณลักษณะของผู้เรียนตามที่สังเกต (คะแนน 1 - 5)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {renderRatingRow('(1) ผู้เรียนสามารถเข้าถึงสิ่งที่เรียนและเข้าใจบทเรียน', char1, setChar1)}
                {renderRatingRow('(2) ผู้เรียนสามารถเชื่อมโยงความรู้หรือประสบการณ์เดิมกับการเรียนรู้ใหม่', char2, setChar2)}
                {renderRatingRow('(3) ผู้เรียนได้สร้างความรู้เองหรือได้สร้างประสบการณ์ใหม่จากการเรียนรู้', char3, setChar3)}
                {renderRatingRow('(4) ผู้เรียนได้รับการกระตุ้นและเกิดแรงจูงใจในการเรียนรู้', char4, setChar4)}
                {renderRatingRow('(5) ผู้เรียนได้รับการพัฒนาทักษะความเชี่ยวชาญจากการเรียนรู้', char5, setChar5)}
                {renderRatingRow('(6) ผู้เรียนได้รับข้อมูลสะท้อนกลับเพื่อปรับปรุงการเรียนรู้', char6, setChar6)}
                {renderRatingRow('(7) ผู้เรียนได้รับการพัฒนาการเรียนรู้ in บรรยากาศชั้นเรียนที่เหมาะสม', char7, setChar7)}
                {renderRatingRow('(8) ผู้เรียนสามารถกำกับการเรียนรู้และมีการเรียนรู้แบบนำตนเอง', char8, setChar8)}
              </div>
            </div>

            <div className="form-group">
              <label>4. ข้อสังเกตเชิงคุณภาพ (จุดเด่น หรือสิ่งสังเกตที่พบในกระบวนการจัดกิจกรรม)</label>
              <textarea
                rows="3"
                value={qualitative}
                onChange={(e) => setQualitative(e.target.value)}
                placeholder="ระบุพฤติกรรมผู้เรียน การจัดการเรียนรู้ของครู จุดเด่นการสอนที่เห็นเด่นชัด..."
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>5. สรุปและข้อเสนอแนะ (แนวทางการพัฒนาปรับปรุงเพิ่มเติม)</label>
              <textarea
                rows="3"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="เสนอแนะแนวทางในการพัฒนาต่อยอด ปรับปรุงแผนการสอน หรือการจัดการเรียนรู้..."
                required
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึกผลการประเมิน</button>
          </div>
        </form>
      </div>
    </div>
  );
}
