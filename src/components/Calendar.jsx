import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const DAYS_FULL_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// Local-time YYYY-MM-DD. Using toISOString() directly would convert to UTC
// first, which in Thailand (UTC+7) reports the previous day until 07:00
// local -- so "today" has to be derived from the local calendar date.
const toLocalDateString = (dateObj) => {
  const offset = dateObj.getTimezoneOffset();
  return new Date(dateObj.getTime() - offset * 60 * 1000).toISOString().split('T')[0];
};

export default function Calendar({ supervisions, onEventClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Day shown in the mobile detail panel; starts on today.
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Moving to another month leaves the previously selected day off-screen, so
  // follow along: land on today when the month being opened contains it,
  // otherwise on the 1st.
  const selectDefaultDayOfMonth = (targetYear, targetMonth) => {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === targetYear && now.getMonth() === targetMonth;
    setSelectedDate(toLocalDateString(isCurrentMonth ? now : new Date(targetYear, targetMonth, 1)));
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    selectDefaultDayOfMonth(year, month - 1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    selectDefaultDayOfMonth(year, month + 1);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(toLocalDateString(now));
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
  const isToday = (dateString) => dateString === toLocalDateString(new Date());

  // Filter supervisions for a specific date
  const getSupervisionsForDate = (dateString) => {
    return supervisions.filter(s => s.date === dateString);
  };

  const statusClassFor = (status) => {
    if (status === 'pending') return 'status-pending';
    if (status === 'pending_approval') return 'status-pending_approval';
    if (status === 'approved') return 'status-approved';
    if (status === 'completed') return 'status-completed';
    return 'status-pending';
  };

  // Days of THIS month that actually have supervisions, used to drive the
  // full-width day-by-day list shown on narrow screens. In a 7-column grid on
  // a phone each cell is only ~50px wide, which is far too narrow to read a
  // period label like "คาบที่ 2 (09.20 - 10.10 น.)" -- so on mobile the grid
  // degrades to date + coloured dots for the month overview, and the real
  // detail is read from this list instead.
  const daysWithEvents = daysArray
    .filter(cell => cell.monthOffset === 0)
    .map(cell => ({ ...cell, events: getSupervisionsForDate(cell.dateString) }))
    .filter(cell => cell.events.length > 0);

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
            const isSelected = cell.dateString === selectedDate;
            const classes = [
              'calendar-day-cell',
              isCurrMonth ? '' : 'other-month',
              isToday(cell.dateString) ? 'today' : '',
              isSelected ? 'selected' : ''
            ].filter(Boolean).join(' ');

            return (
              <div
                key={idx}
                className={classes}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`เลือกวันที่ ${cell.day} (${dayEvents.length} รายการนิเทศ)`}
                onClick={() => setSelectedDate(cell.dateString)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDate(cell.dateString);
                  }
                }}
              >
                <div className="calendar-day-number">{cell.day}</div>

                {/* Compact indicator shown instead of the text chips on phones */}
                {dayEvents.length > 0 && (
                  <div className="calendar-event-dots" aria-hidden="true">
                    {dayEvents.map(event => (
                      <span key={event.id} className={`calendar-event-dot ${statusClassFor(event.status)}`} />
                    ))}
                  </div>
                )}

                <div className="calendar-events-container">
                  {dayEvents.map(event => {
                    const eventClass = `calendar-event ${statusClassFor(event.status)}`;

                    return (
                      <div
                        key={event.id}
                        className={eventClass}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onEventClick(event);
                          }
                        }}
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

        {/* Selected-day detail (phones only). Defaults to today; tapping any
            day in the grid above switches it. */}
        <div className="calendar-selected-day">
          {(() => {
            const selected = new Date(selectedDate + 'T00:00:00');
            const selectedEvents = getSupervisionsForDate(selectedDate);

            return (
              <>
                <div className="calendar-selected-day-header">
                  <span className="calendar-selected-day-label">
                    {isToday(selectedDate) ? 'วันนี้ · ' : ''}
                    วัน{DAYS_FULL_TH[selected.getDay()]}ที่ {selected.getDate()} {MONTHS_TH[selected.getMonth()]} พ.ศ. {selected.getFullYear() + 543}
                  </span>
                  <span className="calendar-selected-day-count">
                    {selectedEvents.length > 0 ? `${selectedEvents.length} รายการ` : ''}
                  </span>
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="calendar-selected-day-empty">
                    {isToday(selectedDate)
                      ? 'วันนี้ไม่มีการนิเทศการสอน'
                      : 'ไม่มีการนิเทศการสอนในวันที่เลือก'}
                  </div>
                ) : (
                  <div className="calendar-agenda-events">
                    {selectedEvents.map(event => (
                      <button
                        key={event.id}
                        type="button"
                        className={`calendar-agenda-event ${statusClassFor(event.status)}`}
                        onClick={() => onEventClick(event)}
                      >
                        <span className="calendar-agenda-event-time">{event.time}</span>
                        <span className="calendar-agenda-event-subject">{event.subject}</span>
                        <span className="calendar-agenda-event-teacher">
                          ครูผู้รับการนิเทศ: {event.teacherName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Day-by-day detail list (phones only -- see daysWithEvents above) */}
        <div className="calendar-agenda">
          <h4 className="calendar-agenda-title">
            รายละเอียดการนิเทศเดือน{MONTHS_TH[month]} พ.ศ. {year + 543}
          </h4>

          {daysWithEvents.length === 0 ? (
            <div className="calendar-agenda-empty">
              เดือนนี้ยังไม่มีตารางการนิเทศที่ระบุวันไว้ในระบบ
            </div>
          ) : (
            daysWithEvents.map(cell => (
              <div key={cell.dateString} className={`calendar-agenda-day ${isToday(cell.dateString) ? 'today' : ''}`}>
                <div className="calendar-agenda-date">
                  <span className="calendar-agenda-daynum">{cell.day}</span>
                  <span className="calendar-agenda-dayname">
                    {DAYS_TH[new Date(cell.dateString + 'T00:00:00').getDay()]}
                  </span>
                  {isToday(cell.dateString) && <span className="calendar-agenda-today-tag">วันนี้</span>}
                </div>

                <div className="calendar-agenda-events">
                  {cell.events.map(event => (
                    <button
                      key={event.id}
                      type="button"
                      className={`calendar-agenda-event ${statusClassFor(event.status)}`}
                      onClick={() => onEventClick(event)}
                    >
                      <span className="calendar-agenda-event-time">{event.time}</span>
                      <span className="calendar-agenda-event-subject">{event.subject}</span>
                      <span className="calendar-agenda-event-teacher">
                        ครูผู้รับการนิเทศ: {event.teacherName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
