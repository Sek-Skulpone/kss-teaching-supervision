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
  Plus,
  UserCheck,
  Users,
  RotateCw
} from 'lucide-react';
import EvaluationModal from './EvaluationModal';
import EvaluationSummaryModal from './EvaluationSummaryModal';

const resizeImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};


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
  onDeleteTermPlan,
  teachers = [],
  plcLogs = [],
  onAddPlcLog,
  onUpdatePlcLog,
  onDeletePlcLog,
  settings = { positions: [], departments: [], plcGroups: [], academicYears: ['2567', '2568', '2569'], currentAcademicYear: '2569' }
}) {
  const [activeTab, setActiveTab] = useState('plc');

  // 1. Request Supervision Form States (Now used in the Integrated Booking Modal)
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [planUrl, setPlanUrl] = useState('');
  const [bookingLocation, setBookingLocation] = useState('');
  const [selectedPlcYear, setSelectedPlcYear] = useState(settings.currentAcademicYear || '2569');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  React.useEffect(() => {
    if (settings.currentAcademicYear) {
      setSelectedPlcYear(settings.currentAcademicYear);
    }
  }, [settings.currentAcademicYear]);
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
  const [postLessonType, setPostLessonType] = useState('pdf'); // 'pdf' | 'link'
  const [postLessonFile, setPostLessonFile] = useState(''); // base64
  const [postLessonLink, setPostLessonLink] = useState('');
  const [postLessonFileName, setPostLessonFileName] = useState('');
  const [postLessonFileError, setPostLessonFileError] = useState('');
  const [isProcessingPostLessonFile, setIsProcessingPostLessonFile] = useState(false);

  // D. Classroom Evaluation Form States
  const [selectedEvalSupervision, setSelectedEvalSupervision] = useState(null);

  // E. Summary Report State
  const [selectedReportSummary, setSelectedReportSummary] = useState(null);

  // F. PLC Form States
  const [selectedPlcLog, setSelectedPlcLog] = useState(null);
  const [isPlcModalOpen, setIsPlcModalOpen] = useState(false);
  const [plcModalCycle, setPlcModalCycle] = useState(1);
  const [plcDate, setPlcDate] = useState('');
  const [plcLocation, setPlcLocation] = useState('');
  const [plcCheckedTeachers, setPlcCheckedTeachers] = useState([]);
  const [plcExternalMembers, setPlcExternalMembers] = useState('');
  const [plcOutcome, setPlcOutcome] = useState('');
  const [plcImages, setPlcImages] = useState([]);
  const [plcRevisedPlanUrl, setPlcRevisedPlanUrl] = useState('');
  const [isResizingPlc, setIsResizingPlc] = useState(false);
  const [activePlcLightbox, setActivePlcLightbox] = useState(null);

  // G. One-Page Report States
  const [selectedOnePageSupervision, setSelectedOnePageSupervision] = useState(null);
  const [isOnePageModalOpen, setIsOnePageModalOpen] = useState(false);
  const [onePageType, setOnePageType] = useState('image'); // 'image' | 'pdf' | 'link'
  const [onePageFile, setOnePageFile] = useState(''); // base64
  const [onePageLink, setOnePageLink] = useState('');
  const [onePageError, setOnePageError] = useState('');
  const [isProcessingOnePage, setIsProcessingOnePage] = useState(false);

  const handleOpenPostLessonModal = (plan) => {
    setSelectedTermPlan(plan);
    setPostLessonType(plan.postLessonRecord?.type || 'pdf');
    setPostLessonFile(plan.postLessonRecord?.type === 'pdf' ? plan.postLessonRecord.fileData : '');
    setPostLessonLink(plan.postLessonRecord?.type === 'link' ? plan.postLessonRecord.fileUrl : '');
    setPostLessonFileName(plan.postLessonRecord?.type === 'pdf' ? 'ไฟล์เดิมที่อัปโหลดไว้.pdf' : '');
    setPostLessonOutcome(plan.postLessonRecord?.outcome || '');
    setPostLessonFileError('');
  };

  const handlePostLessonFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPostLessonFileError('');
    setIsProcessingPostLessonFile(true);

    try {
      if (file.type === 'application/pdf') {
        const MAX_PDF_SIZE = 500 * 1024; // 500KB
        if (file.size > MAX_PDF_SIZE) {
          setPostLessonFileError('ไฟล์ PDF มีขนาดใหญ่เกินไป (ต้องไม่เกิน 500KB) กรุณาใช้ไฟล์ภาพหรือแนบลิงก์ Google Drive แทนครับ');
          e.target.value = '';
          setIsProcessingPostLessonFile(false);
          return;
        }

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
        });
        setPostLessonFile(dataUrl);
        setPostLessonFileName(file.name);
      } else {
        setPostLessonFileError('ไม่รองรับประเภทไฟล์นี้ กรุณาเลือกไฟล์ PDF เท่านั้นครับ');
        e.target.value = '';
      }
    } catch (err) {
      console.error(err);
      setPostLessonFileError('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
    } finally {
      setIsProcessingPostLessonFile(false);
    }
  };

  const handleOnePageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOnePageError('');
    setIsProcessingOnePage(true);

    try {
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_WIDTH = 1000;
              const MAX_HEIGHT = 1000;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(compressedUrl);
            };
            img.onerror = reject;
          };
          reader.onerror = reject;
        });
        setOnePageFile(dataUrl);
        setOnePageType('image');
      } else if (file.type === 'application/pdf') {
        const MAX_PDF_SIZE = 300 * 1024;
        if (file.size > MAX_PDF_SIZE) {
          setOnePageError('ไฟล์ PDF มีขนาดใหญ่เกินไป (ต้องไม่เกิน 300KB) กรุณาใช้ไฟล์ภาพหรือแนบลิงก์ Google Drive แทนครับ');
          e.target.value = '';
          setIsProcessingOnePage(false);
          return;
        }

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
        });
        setOnePageFile(dataUrl);
        setOnePageType('pdf');
      } else {
        setOnePageError('ไม่รองรับประเภทไฟล์นี้ กรุณาเลือกไฟล์ภาพ (JPG, PNG) หรือไฟล์ PDF เท่านั้นครับ');
      }
    } catch (err) {
      console.error(err);
      setOnePageError('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
    } finally {
      setIsProcessingOnePage(false);
    }
  };

  const handleOnePageSubmit = async (e) => {
    e.preventDefault();
    if (onePageType === 'link' && !onePageLink.trim()) {
      alert('กรุณากรอกลิงก์ Google Drive หรือลิงก์สาธารณะ');
      return;
    }
    if ((onePageType === 'image' || onePageType === 'pdf') && !onePageFile) {
      alert('กรุณาเลือกไฟล์อัปโหลด');
      return;
    }

    const onePageData = {
      type: onePageType,
      fileData: onePageType !== 'link' ? onePageFile : null,
      fileUrl: onePageType === 'link' ? onePageLink.trim() : null,
      uploadedAt: new Date().toISOString()
    };

    const success = await onUpdateSupervision(selectedOnePageSupervision.id, {
      onePageReport: onePageData
    });

    if (success) {
      alert('บันทึกรายงานการนิเทศหน้าเดียวเรียบร้อยแล้ว!');
      setIsOnePageModalOpen(false);
      setSelectedOnePageSupervision(null);
      setOnePageFile('');
      setOnePageLink('');
      setOnePageType('image');
      setOnePageError('');
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDeleteOnePage = async (supervisionId) => {
    if (window.confirm('คุณต้องการลบรายงานการนิเทศหน้าเดียวนี้ใช่หรือไม่?')) {
      const success = await onUpdateSupervision(supervisionId, {
        onePageReport: null
      });
      if (success) {
        alert('ลบรายงานนิเทศหน้าเดียวเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const handlePlcImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (plcImages.length + files.length > 4) {
      alert('สามารถอัปโหลดรูปภาพได้สูงสุด 4 รูปเท่านั้นครับ');
      return;
    }

    setIsResizingPlc(true);
    try {
      const resizedDataUrls = await Promise.all(
        files.map(file => resizeImage(file))
      );
      setPlcImages(prev => [...prev, ...resizedDataUrls]);
    } catch (err) {
      console.error('Error processing images:', err);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsResizingPlc(false);
      e.target.value = '';
    }
  };

  const removePlcImage = (indexToRemove) => {
    setPlcImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePlcSubmit = async (e) => {
    e.preventDefault();
    
    const isCycle4 = Number(plcModalCycle) === 4;
    const outcomeToSave = isCycle4 
      ? (plcOutcome.trim() || 'สะท้อนผลการจัดกิจกรรมการเรียนรู้และนำเสนอแผนการจัดการเรียนรู้ที่ได้รับการพัฒนาปรับปรุงเรียบร้อยแล้ว')
      : plcOutcome.trim();

    if (!plcDate || !plcLocation || (!isCycle4 && !outcomeToSave)) {
      alert('กรุณากรอกข้อมูลวัน-เวลา, สถานที่ และผลการดำเนินงานให้ครบถ้วน');
      return;
    }

    const memberNames = [currentUser.name, ...plcCheckedTeachers];
    if (plcExternalMembers.trim()) {
      memberNames.push(...plcExternalMembers.split(',').map(m => m.trim()).filter(Boolean));
    }
    const uniqueMembers = Array.from(new Set(memberNames));
    const finalMembersString = uniqueMembers.join(', ');

    const logData = {
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      plcGroup: currentUser.plcGroup,
      cycle: Number(plcModalCycle),
      date: plcDate.trim(),
      location: plcLocation.trim(),
      members: finalMembersString,
      outcome: outcomeToSave,
      images: Number(plcModalCycle) === 3 ? [] : plcImages,
      academicYear: selectedPlcYear
    };

    if (isCycle4) {
      logData.revisedPlanUrl = plcRevisedPlanUrl.trim();
    }

    let success = false;
    if (selectedPlcLog) {
      success = await onUpdatePlcLog(selectedPlcLog.id, logData);
      if (success) {
        alert(`แก้ไขข้อมูลกิจกรรม PLC วงรอบที่ ${plcModalCycle} สำเร็จเรียบร้อยแล้ว`);
      }
    } else {
      const addedLog = await onAddPlcLog(logData);
      success = !!addedLog;
      if (success) {
        alert(`บันทึกกิจกรรม PLC วงรอบที่ ${plcModalCycle} สำเร็จเรียบร้อยแล้ว`);
      }
    }

    if (success) {
      setIsPlcModalOpen(false);
      setSelectedPlcLog(null);
      setPlcDate('');
      setPlcLocation('');
      setPlcCheckedTeachers([]);
      setPlcExternalMembers('');
      setPlcOutcome('');
      setPlcImages([]);
      setPlcRevisedPlanUrl('');
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDeletePlcLogClick = async (logId, cycleNum) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบบันทึกกิจกรรม PLC วงรอบที่ ${cycleNum}? ข้อมูลทั้งหมดและภาพหลักฐานจะถูกนำออกจากระบบ`)) {
      const success = await onDeletePlcLog(logId);
      if (success) {
        alert(`ลบข้อมูลกิจกรรม PLC วงรอบที่ ${cycleNum} สำเร็จแล้ว`);
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Handle Supervision Request Submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !planUrl || !bookingLocation) {
      setRequestError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }
    
    const added = await onAddSupervision({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      subject,
      grade,
      room,
      location: bookingLocation.trim(),
      date: '', // Academic Department will schedule this
      time: '', // Academic Department will schedule this
      lessonPlanUrl: planUrl,
      academicYear: selectedPlcYear
    });

    if (added) {
      setSubject('');
      setPlanUrl('');
      setBookingLocation('');
      setRequestError('');
      setIsBookingModalOpen(false);
      alert('ส่งคำขอและอัปโหลดแผนการสอนเรียบร้อยแล้ว! ฝ่ายวิชาการจะเป็นผู้กำหนดวันและเวลานิเทศการสอน');
    } else {
      setRequestError('เกิดข้อผิดพลาดในการส่งข้อมูลการจอง กรุณาลองใหม่อีกครั้ง');
    }
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

  // Handle Classroom Evaluation Submit handled by imported component

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

    let recordData = {};

    if (postLessonType === 'pdf') {
      if (!postLessonFile) {
        alert('กรุณาเลือกไฟล์ PDF ที่ต้องการอัปโหลด');
        return;
      }
      recordData = {
        type: 'pdf',
        fileData: postLessonFile,
        submittedAt: new Date().toISOString()
      };
    } else {
      if (!postLessonLink.trim()) {
        alert('กรุณากรอกลิงก์ Google Drive หรือเว็บไซต์');
        return;
      }
      recordData = {
        type: 'link',
        fileUrl: postLessonLink.trim(),
        submittedAt: new Date().toISOString()
      };
    }

    const success = await onUpdateTermPlan(selectedTermPlan.id, {
      postLessonRecord: recordData
    });

    if (success) {
      alert('บันทึกหลังแผนการจัดการเรียนรู้สำเร็จเรียบร้อยแล้ว');
      setSelectedTermPlan(null);
      setPostLessonFile('');
      setPostLessonLink('');
      setPostLessonFileName('');
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
  const myRequests = supervisions.filter(s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear);
  const myTermPlans = termPlans.filter(tp => tp.teacherId === currentUser.id);
  const myPlcLogs = plcLogs.filter(log => log.teacherId === currentUser.id && log.academicYear === selectedPlcYear);
  
  // Supervisions of other teachers open for volunteering
  const openForVolunteering = supervisions.filter(
    s => s.teacherId !== currentUser.id && 
         s.academicYear === selectedPlcYear &&
         (s.status === 'pending' || (s.supervisors && s.supervisors.length < 2)) &&
         (!s.supervisors || !s.supervisors.some(sup => sup.id === currentUser.id)) &&
         s.status !== 'completed' &&
         s.status !== 'pending_approval'
  );

  // My volunteered items waiting or approved
  const myVolunteeredSupervisions = supervisions.filter(
    s => s.academicYear === selectedPlcYear &&
         ((s.supervisors && s.supervisors.some(sup => sup.id === currentUser.id)) || s.volunteerId === currentUser.id)
  );

  const completedCyclesCount = (() => {
    let count = 0;
    if (myPlcLogs.some(l => Number(l.cycle) === 1)) count++;
    if (myPlcLogs.some(l => Number(l.cycle) === 2)) count++;
    if (myPlcLogs.some(l => Number(l.cycle) === 4)) count++;
    const hasCycle3Booking = supervisions.some(
      s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear
    );
    if (hasCycle3Booking) count++;
    return count;
  })();

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

  // Helper functions handled by imported components

  return (
    <div>
      {/* Tabs Menu */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'plc' ? 'active' : ''}`}
          onClick={() => setActiveTab('plc')}
        >
          <RotateCw size={18} />
          บันทึกกิจกรรม PLC (4 วงรอบ) ({completedCyclesCount}/4)
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
          className={`tab-btn ${activeTab === 'my-duties' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-duties')}
        >
          <UserCheck size={18} />
          ตารางปฏิบัติหน้าที่ผู้นิเทศ ({myVolunteeredSupervisions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'volunteer' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteer')}
        >
          <Users size={18} />
          เสนอความจำนงเป็นผู้นิเทศการสอน ({openForVolunteering.length})
        </button>
      </div>



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
                          {plan.postLessonRecord ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}
                                onClick={() => {
                                  if (plan.postLessonRecord.type === 'pdf') {
                                    const newWindow = window.open();
                                    newWindow.document.write(`<iframe src="${plan.postLessonRecord.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                  } else if (plan.postLessonRecord.type === 'link') {
                                    window.open(plan.postLessonRecord.fileUrl, '_blank');
                                  } else {
                                    alert(`บันทึกหลังสอน (ข้อความ):\n\n${plan.postLessonRecord.outcome}`);
                                  }
                                }}
                              >
                                📄 เปิดดูหลังแผน
                              </button>
                              <button
                                className="btn btn-outline btn-secondary"
                                style={{ padding: '0.15rem 0.3rem', fontSize: '10px' }}
                                onClick={() => handleOpenPostLessonModal(plan)}
                              >
                                แก้ไขบันทึก
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap' }}
                              onClick={() => handleOpenPostLessonModal(plan)}
                            >
                              เขียนหลังแผน
                            </button>
                          )}
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
                  <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                      <strong>รายวิชา:</strong> {selectedTermPlan.subjectCode} {selectedTermPlan.subjectName} (ชั้น ม.{selectedTermPlan.grade.replace('ม.', '')}) <br />
                      <strong>ปีการศึกษา/ภาคเรียน:</strong> {selectedTermPlan.term}/{selectedTermPlan.academicYear}
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>รูปแบบการแนบบันทึกหลังแผน</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'normal', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="postLessonType"
                            value="pdf"
                            checked={postLessonType === 'pdf'}
                            onChange={() => setPostLessonType('pdf')}
                          />
                          อัปโหลดไฟล์ PDF (ไม่เกิน 500KB)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'normal', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="radio"
                            name="postLessonType"
                            value="link"
                            checked={postLessonType === 'link'}
                            onChange={() => setPostLessonType('link')}
                          />
                          แนบลิงก์ Google Drive / เว็บไซต์
                        </label>
                      </div>
                    </div>

                    {postLessonType === 'pdf' ? (
                      <div className="form-group">
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>เลือกไฟล์ PDF บันทึกหลังแผน</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePostLessonFileChange}
                          style={{ padding: '0.25rem', width: '100%' }}
                        />
                        {postLessonFileName && (
                          <div style={{ fontSize: '12px', color: 'var(--status-completed)', marginTop: '0.35rem', fontWeight: 600 }}>
                            ✓ ไฟล์ที่เลือก: {postLessonFileName}
                          </div>
                        )}
                        {postLessonFileError && (
                          <div style={{ fontSize: '12px', color: '#e74c3c', marginTop: '0.35rem' }}>
                            {postLessonFileError}
                          </div>
                        )}
                        {isProcessingPostLessonFile && (
                          <div style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '0.35rem' }}>
                            กำลังประมวลผลไฟล์...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="form-group">
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>ลิงก์บันทึกหลังแผน (Google Drive หรือ URL อื่นๆ)</label>
                        <input
                          type="url"
                          value={postLessonLink}
                          onChange={(e) => setPostLessonLink(e.target.value)}
                          placeholder="วางลิงก์ Google Drive หรือลิงก์บันทึกหลังแผนที่นี่..."
                          style={{ width: '100%', padding: '0.5rem' }}
                          required
                        />
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedTermPlan(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary" disabled={isProcessingPostLessonFile}>บันทึกข้อมูล</button>
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
                    <th>นิเทศหน้าเดียว</th>
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
                      <td>
                        {req.onePageReport ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => {
                                if (req.onePageReport.type === 'image') {
                                  setActivePlcLightbox(req.onePageReport.fileData);
                                } else {
                                  window.open(req.onePageReport.type === 'link' ? req.onePageReport.fileUrl : req.onePageReport.fileData, '_blank');
                                }
                              }}
                            >
                              📄 เปิดดูรายงาน
                            </button>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.15rem 0.3rem', fontSize: '10px' }}
                                onClick={() => {
                                  setSelectedOnePageSupervision(req);
                                  setOnePageType(req.onePageReport.type);
                                  setOnePageFile(req.onePageReport.fileData || '');
                                  setOnePageLink(req.onePageReport.fileUrl || '');
                                  setIsOnePageModalOpen(true);
                                }}
                              >
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-danger"
                                style={{ padding: '0.15rem 0.3rem', fontSize: '10px', color: '#e74c3c', borderColor: '#e74c3c' }}
                                onClick={() => handleDeleteOnePage(req.id)}
                              >
                                ลบ
                              </button>
                            </div>
                          </div>
                        ) : (
                          req.status === 'approved' || req.status === 'completed' ? (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                setSelectedOnePageSupervision(req);
                                setOnePageType('image');
                                setOnePageFile('');
                                setOnePageLink('');
                                setOnePageError('');
                                setIsOnePageModalOpen(true);
                              }}
                            >
                              📤 อัปโหลด
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                              รอบทเรียนอนุมัติ
                            </span>
                          )
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

      {/* Tab 4: My Supervision Duties */}
      {activeTab === 'my-duties' && (
        <div className="card">
          <h2 className="card-title">
            <UserCheck />
            กำหนดการปฏิบัติหน้าที่ผู้นิเทศของคุณ (ได้รับการแต่งตั้ง / อยู่ระหว่างรออนุมัติ)
          </h2>

          {myVolunteeredSupervisions.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem' }}>
              ไม่พบประวัติการเสนอความจำนงหรือภาระงานนิเทศการสอนของท่านในขณะนี้
            </p>
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
      )}

      {/* Tab 5: Volunteer & Volunteer Status */}
      {activeTab === 'volunteer' && (
        <div className="card">
          <h2 className="card-title">
            <Users />
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
      )}

      {/* Tab PLC: บันทึกกิจกรรม PLC (4 วงรอบ) */}
      {activeTab === 'plc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* PLC Group Banner */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '5px solid var(--primary-color)' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <RotateCw />
                บันทึกและติดตามกิจกรรม PLC (Professional Learning Community) 4 วงรอบ
              </h2>
              {currentUser.plcGroup ? (
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '14px', color: 'var(--text-medium)' }}>
                  คุณสังกัดกลุ่ม PLC: <strong style={{ color: 'var(--text-dark)', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{currentUser.plcGroup}</strong>
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e67e22', fontWeight: 600, fontSize: '14px', marginTop: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>ยังไม่สังกัดกลุ่ม PLC (กรุณาติดต่อฝ่ายวิชาการเพื่อระบุกลุ่ม PLC ในประวัติทำเนียบบุคลากร)</span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>ปีการศึกษา:</span>
                <select
                  value={selectedPlcYear}
                  onChange={(e) => setSelectedPlcYear(e.target.value)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                >
                  {(settings.academicYears || ['2567', '2568', '2569']).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {currentUser.plcGroup && (
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-color)' }}>
                  บันทึกความคืบหน้า: {completedCyclesCount} / 4 วงรอบ
                </div>
              )}
            </div>
          </div>

          {/* 4 Cycles Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { cycleNum: 1, title: 'วงรอบที่ 1: วิเคราะห์ปัญหาและกำหนดเป้าหมาย', subtitle: 'Analyze & Goal Setting' },
              { cycleNum: 2, title: 'วงรอบที่ 2: ออกแบบและพัฒนานวัตกรรมการจัดการเรียนรู้', subtitle: 'Design & Development' },
              { cycleNum: 3, title: 'วงรอบที่ 3: ปฏิบัติการสอนและนิเทศแบบชี้แนะ', subtitle: 'Implementation & Coaching' },
              { cycleNum: 4, title: 'วงรอบที่ 4: สะท้อนผล ขยายผล และยกระดับคุณภาพ', subtitle: 'Reflection & Scaling Up' }
            ].map(cycle => {
              let log = myPlcLogs.find(l => Number(l.cycle) === cycle.cycleNum);
              const cycle3Supervision = supervisions.find(
                s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear
              );

              // Virtualize Cycle 3 log if a supervision has been booked
              if (cycle.cycleNum === 3 && cycle3Supervision) {
                log = {
                  id: 'virtual-cycle-3',
                  cycle: 3,
                  date: cycle3Supervision.date ? `${formatThaiDate(cycle3Supervision.date)} (${cycle3Supervision.time})` : 'รอกำหนดเวลาจากฝ่ายวิชาการ',
                  location: cycle3Supervision.location || 'ไม่ได้ระบุสถานที่',
                  members: cycle3Supervision.supervisors && cycle3Supervision.supervisors.length > 0 
                    ? [currentUser.name, ...cycle3Supervision.supervisors.map(s => s.name)].join(', ') 
                    : currentUser.name,
                  outcome: 'ปฏิบัติการสอนและนิเทศในห้องเรียนเสร็จสิ้นหรือกำลังดำเนินการ',
                  images: []
                };
              }
              
              const cycle3Images = [];
              if (cycle3Supervision && cycle3Supervision.evaluations) {
                Object.values(cycle3Supervision.evaluations).forEach(ev => {
                  if (ev.images && Array.isArray(ev.images)) {
                    cycle3Images.push(...ev.images);
                  }
                });
              }

              const imagesToShow = cycle.cycleNum === 3 ? cycle3Images : (log ? (log.images || []) : []);

              return (
                <div key={cycle.cycleNum} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', border: '1px solid var(--border-color)', position: 'relative' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className={`badge badge-${log ? 'approved' : 'pending'}`} style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}>
                        {cycle.cycleNum === 3 
                          ? (cycle3Supervision ? '✓ จองเวลานิเทศแล้ว' : '⚠️ ยังไม่จองเวลา') 
                          : (log ? '✓ บันทึกผลแล้ว' : '⚠️ ยังไม่บันทึก')}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: log ? 'var(--primary-color)' : 'var(--text-light)' }}>
                        #{cycle.cycleNum}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 0.2rem 0', color: 'var(--text-dark)' }}>{cycle.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-medium)', margin: '0 0 1rem 0', fontStyle: 'italic' }}>{cycle.subtitle}</p>

                    {log ? (
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-medium)' }}>📅 วัน-เวลา:</strong> {log.date}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-medium)' }}>📍 สถานที่:</strong> {log.location}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-medium)' }}>👥 สมาชิก:</strong> <span style={{ color: 'var(--text-dark)', wordBreak: 'break-all' }}>{log.members}</span>
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <strong style={{ color: 'var(--text-medium)', display: 'block' }}>📝 ผลการดำเนินงาน:</strong>
                          <p style={{ margin: '0.1rem 0 0 0', color: 'var(--text-dark)', whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                            {log.outcome}
                          </p>
                        </div>

                        {cycle.cycleNum === 4 && log.revisedPlanUrl && (
                          <div style={{ marginTop: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: 'var(--text-medium)' }}>📄 แผนการสอนที่ปรับปรุงแล้ว:</strong>
                            <a
                              href={log.revisedPlanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline"
                              style={{ width: '100%', marginTop: '0.25rem', padding: '0.3rem', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', backgroundColor: 'white' }}
                            >
                              <FolderOpen size={12} />
                              เปิดดูแผนที่ปรับปรุงแล้ว
                            </a>
                          </div>
                        )}

                        {imagesToShow.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-medium)' }}>📷 {cycle.cycleNum === 3 ? 'ภาพการนิเทศ (โดยผู้นิเทศ):' : 'ภาพหลักฐาน:'}</strong>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '0.25rem' }}>
                              {imagesToShow.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setActivePlcLightbox(img)}
                                  style={{ width: '100%', aspectRatio: '4/3', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                >
                                  <img src={img} alt={`PLC log photo ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', border: '1px dashed #e2e8f0', borderRadius: '6px', color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', marginBottom: '1rem' }}>
                        ยังไม่มีข้อมูลบันทึกในรอบนี้
                      </div>
                    )}

                    {/* Integrated Supervision Booking inside Cycle 3 card */}
                    {cycle.cycleNum === 3 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 0.5rem 0' }}>📋 ตารางและข้อมูลการนิเทศการสอน</h4>
                        {!cycle3Supervision ? (
                          <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #e2e8f0', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-medium)', fontStyle: 'italic' }}>ยังไม่ได้จองเวลานิเทศการสอน</p>
                          </div>
                        ) : (
                          <div style={{ backgroundColor: '#f8fafc', padding: '0.8rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div><strong>วิชาที่นิเทศ:</strong> {cycle3Supervision.subject} (ชั้น ม.{cycle3Supervision.grade.replace('ม.', '')}/{cycle3Supervision.room})</div>
                            <div><strong>แผนการสอน:</strong> <a href={cycle3Supervision.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>เปิดดูแผนการจัดการเรียนรู้</a></div>
                            
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ width: '100%', marginTop: '0.4rem', padding: '0.35rem', fontSize: '11px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)', backgroundColor: 'white' }}
                              onClick={() => setSelectedReportSummary(cycle3Supervision)}
                            >
                              📊 ดูผลการประเมินการนิเทศ {cycle3Supervision.evaluations && Object.keys(cycle3Supervision.evaluations).length > 0 ? `(${Object.keys(cycle3Supervision.evaluations).length} ท่าน)` : '(ยังไม่ได้รับการนิเทศ)'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    {cycle.cycleNum === 3 ? (
                      cycle3Supervision ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ width: '100%', padding: '0.5rem', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderColor: 'var(--primary-color)', color: 'var(--primary-color)', backgroundColor: 'white' }}
                          onClick={() => setSelectedReportSummary(cycle3Supervision)}
                        >
                          📊 ดูผลการประเมินการนิเทศ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.5rem', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          disabled={!currentUser.plcGroup}
                          onClick={() => {
                            setSubject('');
                            setPlanUrl('');
                            setBookingLocation('');
                            setRequestError('');
                            setIsBookingModalOpen(true);
                          }}
                        >
                          <Plus size={14} />
                          จองเวลานิเทศการสอน
                        </button>
                      )
                    ) : log ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '0.4rem', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                          onClick={() => {
                            setSelectedPlcLog(log);
                            setPlcModalCycle(cycle.cycleNum);
                            
                            if (Number(cycle.cycleNum) === 4) {
                              const c3Sup = supervisions.find(
                                s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear
                              );
                              const c3DateStr = c3Sup?.date ? `${formatThaiDate(c3Sup.date)} (${c3Sup.time})` : log.date;
                              setPlcDate(c3DateStr);
                              setPlcLocation(c3Sup?.location || log.location);
                              const supervisorNames = c3Sup?.supervisors ? c3Sup.supervisors.map(s => s.name) : [];
                              setPlcCheckedTeachers(supervisorNames.length > 0 ? supervisorNames : log.members.split(',').map(m => m.trim()));
                              setPlcExternalMembers('');
                            } else {
                              setPlcDate(log.date);
                              setPlcLocation(log.location);
                              const membersArr = log.members.split(',').map(m => m.trim());
                              const checked = teachers
                                .filter(t => t.id !== currentUser.id && membersArr.includes(t.name))
                                .map(t => t.name);
                              setPlcCheckedTeachers(checked);
                              const teacherNames = teachers.map(t => t.name);
                              const external = membersArr.filter(name => name !== currentUser.name && !teacherNames.includes(name));
                              setPlcExternalMembers(external.join(', '));
                            }

                            setPlcOutcome(log.outcome || (Number(cycle.cycleNum) === 4 ? 'สะท้อนผลการจัดกิจกรรมการเรียนรู้และนำเสนอแผนการจัดการเรียนรู้ที่ได้รับการพัฒนาปรับปรุงเรียบร้อยแล้ว' : ''));
                            setPlcImages(log.images || []);
                            setPlcRevisedPlanUrl(log.revisedPlanUrl || '');
                            setIsPlcModalOpen(true);
                          }}
                        >
                          <Edit size={13} />
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-danger"
                          style={{ color: '#e74c3c', borderColor: '#e74c3c', padding: '0.4rem 0.6rem' }}
                          onClick={() => handleDeletePlcLogClick(log.id, cycle.cycleNum)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        disabled={!currentUser.plcGroup}
                        onClick={() => {
                          if (Number(cycle.cycleNum) === 4) {
                            const c3Sup = supervisions.find(
                              s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear
                            );
                            if (!c3Sup) {
                              alert('กรุณาดำเนินการขอรับการนิเทศในวงรอบที่ 3 ก่อน เพื่อใช้ข้อมูลในวงรอบที่ 4');
                              return;
                            }
                            const c3DateStr = c3Sup.date ? `${formatThaiDate(c3Sup.date)} (${c3Sup.time})` : 'รอกำหนดเวลาจากฝ่ายวิชาการ';
                            setPlcDate(c3DateStr);
                            setPlcLocation(c3Sup.location || 'ไม่ได้ระบุสถานที่');
                            const supervisorNames = c3Sup.supervisors ? c3Sup.supervisors.map(s => s.name) : [];
                            setPlcCheckedTeachers(supervisorNames);
                            setPlcExternalMembers('');
                            setPlcOutcome('สะท้อนผลการจัดกิจกรรมการเรียนรู้และนำเสนอแผนการจัดการเรียนรู้ที่ได้รับการพัฒนาปรับปรุงเรียบร้อยแล้ว');
                          } else {
                            setPlcDate('');
                            setPlcLocation('');
                            setPlcCheckedTeachers([]);
                            setPlcExternalMembers('');
                            setPlcOutcome('');
                          }
                          setSelectedPlcLog(null);
                          setPlcModalCycle(cycle.cycleNum);
                          setPlcImages([]);
                          setPlcRevisedPlanUrl('');
                          setIsPlcModalOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        บันทึกข้อมูลวงรอบ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Classroom Observation Evaluation Form */}
      {selectedEvalSupervision && (
        <EvaluationModal
          supervision={selectedEvalSupervision}
          currentUser={currentUser}
          onClose={() => setSelectedEvalSupervision(null)}
          onSubmit={async (newEvaluations) => {
            const success = await onUpdateSupervision(selectedEvalSupervision.id, {
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

      {/* Modal View Detailed Evaluation Summary Report */}
      {selectedReportSummary && (
        <EvaluationSummaryModal
          supervision={selectedReportSummary}
          onClose={() => setSelectedReportSummary(null)}
        />
      )}

      {/* Modal: Write/Edit PLC Cycle Log */}
      {isPlcModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>
                {selectedPlcLog ? 'แก้ไขบันทึกกิจกรรม PLC' : 'เพิ่มบันทึกกิจกรรม PLC'}: วงรอบที่ {plcModalCycle}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsPlcModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handlePlcSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '13px' }}>
                  <strong>กลุ่ม PLC:</strong> {currentUser.plcGroup} <br />
                  <strong>วงรอบ:</strong> วงรอบที่ {plcModalCycle}: {
                    Number(plcModalCycle) === 1 ? 'วิเคราะห์ปัญหาและกำหนดเป้าหมาย (Analyze & Goal Setting)' :
                    Number(plcModalCycle) === 2 ? 'ออกแบบและพัฒนานวัตกรรมการจัดการเรียนรู้ (Design & Development)' :
                    Number(plcModalCycle) === 3 ? 'ปฏิบัติการสอนและนิเทศแบบชี้แนะ (Implementation & Coaching)' :
                    'สะท้อนผล ขยายผล และยกระดับคุณภาพ (Reflection & Scaling Up)'
                  }
                </div>

                {Number(plcModalCycle) === 4 ? (
                  (() => {
                    const c3Sup = supervisions.find(
                      s => s.teacherId === currentUser.id && s.academicYear === selectedPlcYear
                    );
                    const supervisorNames = c3Sup?.supervisors ? c3Sup.supervisors.map(s => s.name) : [];
                    const finalMembers = [currentUser.name, ...supervisorNames].join(', ');
                    
                    return (
                      <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-color)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>📋 ข้อมูลการนิเทศการสอน (ดึงมาจากวงรอบที่ 3 อัตโนมัติ):</div>
                        <div><strong>📅 วัน-เวลานิเทศ:</strong> {c3Sup?.date ? `${formatThaiDate(c3Sup.date)} (${c3Sup.time})` : <span style={{ color: '#e67e22', fontStyle: 'italic' }}>รอกำหนดเวลานิเทศจากฝ่ายวิชาการ</span>}</div>
                        <div><strong>📍 สถานที่สอน:</strong> {c3Sup?.location || 'ไม่ได้ระบุ'}</div>
                        <div><strong>👥 ผู้เข้าร่วมนิเทศ (สมาชิก):</strong> {finalMembers}</div>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    <div className="form-group">
                      <label>วัน เดือน ปี และเวลา (เช่น 24 มิ.ย. 2569 เวลา 13.00 น.)</label>
                      <input
                        type="text"
                        value={plcDate}
                        onChange={(e) => setPlcDate(e.target.value)}
                        placeholder="เช่น 24 มิถุนายน 2569 เวลา 13.00 น."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>สถานที่ (เช่น ห้องสมุด, ห้องประชุมกลุ่มสาระคณิตศาสตร์)</label>
                      <input
                        type="text"
                        value={plcLocation}
                        onChange={(e) => setPlcLocation(e.target.value)}
                        placeholder="เช่น ห้องปฏิบัติการฟิสิกส์ หรือ อาคารอเนกประสงค์"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>สมาชิกผู้เข้าร่วมกิจกรรม PLC ในโรงเรียน (เลือกจากรายชื่อบุคลากร)</label>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.5rem', backgroundColor: '#fafafa' }}>
                        {teachers.filter(t => t.id !== currentUser.id).length === 0 ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>ไม่พบรายชื่อครูคนอื่นในระบบ</span>
                        ) : (
                          teachers.filter(t => t.id !== currentUser.id).map(t => (
                            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="checkbox"
                                checked={plcCheckedTeachers.includes(t.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPlcCheckedTeachers([...plcCheckedTeachers, t.name]);
                                  } else {
                                    setPlcCheckedTeachers(plcCheckedTeachers.filter(name => name !== t.name));
                                  }
                                }}
                              />
                              <span>{t.name} ({t.position?.split(' (')[0] || t.role})</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ระบุชื่อสมาชิกภายนอกเพิ่มเติม (ถ้ามี, คั่นด้วยเครื่องหมายจุลภาค ',')</label>
                      <input
                        type="text"
                        value={plcExternalMembers}
                        onChange={(e) => setPlcExternalMembers(e.target.value)}
                        placeholder="เช่น ศึกษานิเทศก์สมรศรี, อาจารย์ภายนอก"
                      />
                    </div>

                    <div className="form-group">
                      <label>ผลการดำเนินงานกิจกรรม PLC ในวงรอบนี้</label>
                      <textarea
                        rows="5"
                        value={plcOutcome}
                        onChange={(e) => setPlcOutcome(e.target.value)}
                        placeholder="ระบุรายละเอียดผลลัพธ์การประชุม ปัญหาที่วิเคราะห์ นวัตกรรมที่ออกแบบ การสะท้อนผล หรือขยายผล..."
                        required
                      ></textarea>
                    </div>
                  </>
                )}

                {Number(plcModalCycle) === 3 ? (
                  <div style={{ backgroundColor: '#fafafa', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee', fontSize: '13px', color: 'var(--text-medium)', marginBottom: '1rem' }}>
                    📷 <strong>ภาพกิจกรรมการนิเทศ:</strong> ภาพในวงรอบนี้จะถูกดึงมาจากการประเมินนิเทศในระบบโดยอัตโนมัติ (ผู้นิเทศเป็นผู้อัปโหลดรูปภาพ) ครูผู้สอนไม่ต้องอัปโหลดรูปภาพกิจกรรมในหน้านี้
                  </div>
                ) : (
                  <div className="form-group">
                    <label>อัปโหลดรูปภาพกิจกรรม PLC (สูงสุด 4 รูป, ระบบจะบีบอัดภาพอัตโนมัติ)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePlcImageChange}
                      disabled={isResizingPlc}
                    />
                    {isResizingPlc && <p style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '0.25rem' }}>กำลังประมวลผลและบีบอัดรูปภาพ...</p>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {plcImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ddd' }}>
                          <img src={img} alt={`PLC Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removePlcImage(idx)}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(231, 76, 60, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Number(plcModalCycle) === 4 && (
                  <div className="form-group" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem' }}>
                    <label style={{ fontWeight: 600 }}>ลิงก์แผนการจัดการเรียนรู้ที่ปรับปรุงแล้วจากการสังเกต/นิเทศ (Google Drive / ลิงก์ไฟล์)</label>
                    <input
                      type="url"
                      value={plcRevisedPlanUrl}
                      onChange={(e) => setPlcRevisedPlanUrl(e.target.value)}
                      placeholder="วางลิงก์ Google Drive หรือลิงก์ไฟล์ PDF แผนการเรียนรู้ที่ปรับปรุงแล้ว..."
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '0.2rem' }}>แผนการจัดการเรียนรู้ที่ผ่านการสะท้อนผลและปรับปรุงตามข้อสังเกตและคำแนะนำจากคณะกรรมการประเมินนิเทศเรียบร้อยแล้ว</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPlcModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={isResizingPlc}>
                  {isResizingPlc ? 'กำลังบันทึกภาพ...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for PLC Photos */}
      {activePlcLightbox && (
        <div 
          onClick={() => setActivePlcLightbox(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <button
            onClick={() => setActivePlcLightbox(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
          <img 
            src={activePlcLightbox} 
            alt="PLC Expanded Photo" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '85%', 
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              cursor: 'default'
            }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal: Upload One-Page Supervision Report */}
      {isOnePageModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="modal-header">
              <h3>รายงานการนิเทศหน้าเดียว (One-Page Report)</h3>
              <button className="modal-close-btn" onClick={() => setIsOnePageModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleOnePageSubmit}>
              <div className="modal-body">
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '13px' }}>
                  <strong>รายวิชา:</strong> {selectedOnePageSupervision.subject} (ม.{selectedOnePageSupervision.grade.replace('ม.', '')}/{selectedOnePageSupervision.room})
                </div>

                <div className="form-group">
                  <label>รูปแบบการรายงานผล</label>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="radio"
                        name="onePageType"
                        value="image"
                        checked={onePageType === 'image' || onePageType === 'pdf'}
                        onChange={() => {
                          setOnePageType('image');
                          setOnePageFile('');
                        }}
                      />
                      อัปโหลดไฟล์ (รูปภาพ / PDF &lt; 300KB)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="radio"
                        name="onePageType"
                        value="link"
                        checked={onePageType === 'link'}
                        onChange={() => {
                          setOnePageType('link');
                          setOnePageLink('');
                        }}
                      />
                      แนบลิงก์ (Google Drive / ลิงก์ภายนอก)
                    </label>
                  </div>
                </div>

                {onePageType !== 'link' ? (
                  <div className="form-group">
                    <label>เลือกไฟล์รายงาน (JPG, PNG, WebP หรือ PDF ขนาด &lt; 300KB)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleOnePageFileChange}
                      disabled={isProcessingOnePage}
                    />
                    {isProcessingOnePage && <p style={{ fontSize: '12px', color: 'var(--primary-color)', marginTop: '0.25rem' }}>กำลังประมวลผลไฟล์...</p>}
                    {onePageError && <p style={{ fontSize: '12px', color: '#e74c3c', marginTop: '0.25rem', fontWeight: 600 }}>⚠️ {onePageError}</p>}
                    
                    {onePageFile && (
                      <div style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem', backgroundColor: '#fcfcfc' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-medium)', fontWeight: 600 }}>ตัวอย่างรายงาน:</span>
                        {onePageFile.startsWith('data:application/pdf') ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '24px' }}>📕</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px' }}>เอกสาร PDF นิเทศหน้าเดียว</div>
                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{ padding: '0.2rem 0.4rem', fontSize: '10px', marginTop: '0.25rem' }}
                                onClick={() => window.open(onePageFile, '_blank')}
                              >
                                เปิดตัวอย่าง PDF
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '0.5rem', maxWidth: '100%', height: '150px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #eee' }}>
                            <img src={onePageFile} alt="One page report preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label>ลิงก์เอกสารนิเทศหน้าเดียว (Google Drive / PDF ลิงก์สาธารณะ)</label>
                    <input
                      type="url"
                      value={onePageLink}
                      onChange={(e) => setOnePageLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      required
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-medium)', marginTop: '0.25rem' }}>
                      * หากมีไฟล์ PDF ขนาดเกิน 300KB แนะนำให้อัปโหลดขึ้น Google Drive แล้วนำลิงก์มาวาง
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsOnePageModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={isProcessingOnePage}>บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Book Supervision & Upload Plan (Cycle 3 Integrated) */}
      {isBookingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header">
              <h3>
                <BookOpen size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle', display: 'inline-block' }} />
                จองเวลานิเทศการเรียนการสอนรายบุคคล ({selectedPlcYear})
              </h3>
              <button className="modal-close-btn" onClick={() => setIsBookingModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requestError && (
                  <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                    <AlertCircle size={16} />
                    {requestError}
                  </div>
                )}

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>ชื่อวิชา / รหัสวิชา (ตามหลักสูตรสถานศึกษา)</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="เช่น คณิตศาสตร์เพิ่มเติม (ค31201) หรือ ภาษาอังกฤษพื้นฐาน"
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>ระดับชั้นเรียน</label>
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
                    <label style={{ fontWeight: 600 }}>ห้องเรียนปฏิบัติการ</label>
                    <select value={room} onChange={(e) => setRoom(e.target.value)}>
                      <option value="1">ห้อง 1</option>
                      <option value="2">ห้อง 2</option>
                      <option value="3">ห้อง 3</option>
                      <option value="4">ห้อง 4</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>สถานที่จัดกิจกรรมการสอน/ห้องเรียนที่รับการนิเทศ</label>
                  <input
                    type="text"
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                    placeholder="เช่น ห้องปฏิบัติการชีววิทยา หรือ ห้องเรียน 421"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>ลิงก์เอกสารแผนการจัดการเรียนรู้คาบที่นิเทศ (Google Drive / PDF / ลิงก์สาธารณะ)</label>
                  <input
                    type="text"
                    value={planUrl}
                    onChange={(e) => setPlanUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsBookingModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={14} style={{ marginRight: '0.25rem', display: 'inline-block', verticalAlign: 'middle' }} />
                  ส่งคำขอจองและบันทึกแผน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
