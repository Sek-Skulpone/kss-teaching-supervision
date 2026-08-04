// Supervision status badge labels.
//
// The same `status` value ('pending' | 'pending_approval' | 'approved' |
// 'completed') is rendered with different wording depending on where the
// badge appears (the shared calendar-event modal, a teacher's own request
// list, or the admin's compact portfolio history table). The wording is
// intentionally different per context, so this keeps each variant as its
// own named set rather than forcing one generic label onto every screen.
export const STATUS_LABEL_SETS = {
  // Shared supervision-details modal (App.jsx)
  modal: {
    pending: 'อยู่ระหว่างจัดสรรคณะกรรมการนิเทศ',
    pending_approval: 'อยู่ระหว่างการพิจารณาอนุมัติคำขอเสนอความจำนง',
    approved: 'แต่งตั้งคณะกรรมการนิเทศเรียบร้อยแล้ว',
    completed: 'บันทึกรายงานผลเสร็จสิ้น'
  },
  // Teacher's "my requests" list (TeacherDashboard.jsx)
  list: {
    pending: 'อยู่ระหว่างจัดสรรคณะกรรมการ',
    pending_approval: 'อยู่ระหว่างพิจารณาผู้เสนอความจำนง',
    approved: 'แต่งตั้งคณะกรรมการเสร็จสิ้น',
    completed: 'รายงานผลเสร็จสิ้น'
  },
  // Admin's compact portfolio/history table (AdminDashboard.jsx)
  compact: {
    pending: 'อยู่ระหว่างจัดสรร',
    pending_approval: 'รอกรรมการอาสา',
    approved: 'แต่งตั้งเสร็จสิ้น',
    completed: 'บันทึกหลังสอนแล้ว'
  }
};

export function getStatusLabel(status, setName = 'modal') {
  const set = STATUS_LABEL_SETS[setName] || STATUS_LABEL_SETS.modal;
  return set[status] || '';
}
