import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, AlertTriangle, BookOpen } from 'lucide-react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export default function Calendar({ supervisions, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysArray = [];

  // Previous month days to fill empty spots
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthTotalDays - i,
      monthOffset: -1,
      dateString: new Date(year, month - 1, prevMonthTotalDays - i).toISOString().split('T')[0]
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    const dateObj = new Date(year, month, i);
    // Adjusting for local timezone string representation (YYYY-MM-DD)
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
    daysArray.push({
      day: i,
      monthOffset: 0,
      dateString: localDate.toISOString().split('T')[0]
    });
  }

  // Next month days to fill remaining grid
  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      day: i,
      monthOffset: 1,
      dateString: new Date(year, month + 1, i).toISOString().split('T')[0]
    });
  }

  // Helper to check if it's today
  const isToday = (dateString) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateString === todayStr;
  };

  // Filter supervisions for a specific date
  const getSupervisionsForDate = (dateString) => {
    return supervisions.filter(s => s.date === dateString);
  };

  return (
    <div className="card">
      <div className="calendar-container">
        {/* Calendar Navigation */}
        <div className="calendar-header">
          <div className="calendar-month-title">
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{MONTHS_TH[month]}</span>{' '}
            <span style={{ color: 'var(--text-medium)', fontWeight: 500 }}>พ.ศ. {year + 543}</span>
          </div>
          <div className="calendar-nav-buttons">
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '14px' }} onClick={handleToday}>
              วันนี้
            </button>
            <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#7f8c8d', display: 'inline-block' }}></span>
            <span>อยู่ระหว่างจัดสรรคณะกรรมการนิเทศ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--secondary-hover)', display: 'inline-block' }}></span>
            <span>มีผู้เสนอความจำนงเป็นผู้นิเทศ (รออนุมัติ)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-approved)', display: 'inline-block' }}></span>
            <span>แต่งตั้งคณะกรรมการนิเทศเสร็จสิ้น (อย่างน้อย 2 ท่าน)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-completed)', display: 'inline-block' }}></span>
            <span>บันทึกรายงานผลหลังการสอนเสร็จสมบูรณ์</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Day Names Header */}
          {DAYS_TH.map(d => (
            <div key={d} className="calendar-day-header">
              {d}
            </div>
          ))}

          {/* Grid Cells */}
          {daysArray.map((cell, idx) => {
            const dayEvents = getSupervisionsForDate(cell.dateString);
            const isCurrMonth = cell.monthOffset === 0;
            const classes = `calendar-day-cell ${isCurrMonth ? '' : 'other-month'} ${isToday(cell.dateString) ? 'today' : ''}`;

            return (
              <div key={idx} className={classes}>
                <div className="calendar-day-number">{cell.day}</div>
                <div className="calendar-events-container">
                  {dayEvents.map(event => {
                    let eventClass = 'calendar-event ';
                    if (event.status === 'pending') eventClass += 'status-pending';
                    else if (event.status === 'pending_approval') eventClass += 'status-pending_approval';
                    else if (event.status === 'approved') eventClass += 'status-approved';
                    else if (event.status === 'completed') eventClass += 'status-completed';

                    return (
                      <div
                        key={event.id}
                        className={eventClass}
                        onClick={() => onEventClick(event)}
                        title={`${event.time} น. - ${event.subject} (${event.teacherName})`}
                      >
                        {event.time} {event.subject}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
