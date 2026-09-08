// Firebase Database Connector (Cloud Firestore)
// Optimized with single-document collections to minimize read/write count (completely free-tier safe)
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  documentId,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { hashPassword } from './utils/auth';
import {
  supervisionShardId,
  supervisionsToArchive,
  regroupSupervisions,
  mergeIntoShard
} from './utils/supervisionShards';

// NOTE: this config is not a secret — Firebase's own docs confirm the client
// config is safe to expose (https://firebase.google.com/docs/projects/api-keys).
// The actual access boundary must come from Firestore Security Rules, which
// require access to the Firebase Console to deploy and are NOT yet configured
// for this project. See README "Security" section for details/next steps.
const firebaseConfig = {
  apiKey: "AIzaSyCFPxEX5OvBTog0Qy00Y7Vup11p9fmURS8",
  authDomain: "kss-teaching-supervision.firebaseapp.com",
  projectId: "kss-teaching-supervision",
  storageBucket: "kss-teaching-supervision.firebasestorage.app",
  messagingSenderId: "94865568066",
  appId: "1:94865568066:web:200ca94ef554bbed8f18db",
  measurementId: "G-L8MVMQ610L"
};

// Firestore has a 1 MiB per-document limit; these collections are stored as a
// single document each, so guard writes instead of failing/losing data silently.
const MAX_DOC_BYTES = 900 * 1024;

const SEED_USERS = [
  { id: 'admin', username: 'admin', password: hashPassword('123'), name: 'ผอ.สมเกียรติ ยิ่งใหญ่', role: 'admin', position: 'ผู้อำนวยการโรงเรียน' },
  { id: 'academic', username: 'academic', password: hashPassword('123'), name: 'ครูวิชาการ (หัวหน้างานวิชาการ)', role: 'admin', position: 'หัวหน้างานวิชาการ' },
  { id: 'somchai', username: 'somchai', password: hashPassword('123'), name: 'ครูสมชาย ดีงาม', role: 'teacher', position: 'ครูชำนาญการพิเศษ (กลุ่มสาระคณิตศาสตร์)' },
  { id: 'somsri', username: 'somsri', password: hashPassword('123'), name: 'ครูสมศรี แสนดี', role: 'teacher', position: 'ครู (กลุ่มสาระภาษาไทย)' },
  { id: 'wilai', username: 'wilai', password: hashPassword('123'), name: 'ครูวิไล รักเรียน', role: 'teacher', position: 'ครูผู้ช่วย (กลุ่มสาระวิทยาศาสตร์)' },
  { id: 'wittaya', username: 'wittaya', password: hashPassword('123'), name: 'ครูวิทยา เก่งกล้า', role: 'teacher', position: 'ครูชำนาญการ (กลุ่มสาระภาษาต่างประเทศ)' },
  { id: 'nonglak', username: 'nonglak', password: hashPassword('123'), name: 'ครูนงลักษณ์ ไพเราะ', role: 'teacher', position: 'ครู (กลุ่มสาระศิลปะ)' }
];

// Helper to safely parse JSON strings
const safeJsonParse = (str, fallback) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// Initialize Firebase
let app;
let db;
let isFirebaseInitialized = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase Cloud Firestore successfully connected.");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
} else {
  console.warn("Using offline LocalStorage mode. Paste your firebaseConfig in src/db.js to sync online.");
}

// Memory cache
let dbCache = {
  teachers: null,
  supervisions: null,
  termPlans: null,
  plcLogs: null,
  lastLoaded: 0
};

const cacheTimeout = 1000; // 1 second cache window

// NOTE: plcLogs are deliberately NOT part of this bulk load. They carry
// embedded base64 photos (hundreds of KB) and are only needed on the PLC
// tabs, so they're fetched separately/on demand by getPlcLogs() instead of
// being downloaded on every page load just to render the calendar.
const ensureDBLoaded = async (force = false) => {
  const now = Date.now();
  if (!force && dbCache.teachers && dbCache.supervisions && dbCache.termPlans && (now - dbCache.lastLoaded < cacheTimeout)) {
    return dbCache;
  }

  if (!isFirebaseInitialized) {
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };
    return dbCache;
  }

  try {
    // Parallel fetch from Firestore
    const [teachersSnap, shardedSupervisions, termPlansSnap] = await Promise.all([
      getDoc(doc(db, "system_db", "teachers")),
      // Supervisions are split across the working document and one document
      // per archived academic year -- see readSupervisionShards().
      readSupervisionShards(),
      getDoc(doc(db, "system_db", "term_plans"))
    ]);

    let teachers = SEED_USERS;
    const supervisions = shardedSupervisions;
    let termPlans = [];

    // Process Teachers
    if (teachersSnap.exists()) {
      teachers = teachersSnap.data().list || SEED_USERS;
    } else {
      await setDoc(doc(db, "system_db", "teachers"), { list: SEED_USERS });
    }

    // Process Term Plans
    if (termPlansSnap.exists()) {
      termPlans = termPlansSnap.data().list || [];
    } else {
      await setDoc(doc(db, "system_db", "term_plans"), { list: [] });
    }

    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };

    // Cache locally (best-effort -- see safeCacheLocal).
    safeCacheLocal('ks_teachers', teachers);
    safeCacheLocal('ks_supervisions', supervisions);
    safeCacheLocal('ks_term_plans', termPlans);

    return dbCache;
  } catch (e) {
    console.warn("Firestore fetch failed, using local storage cache:", e);
    const teachers = safeJsonParse(localStorage.getItem('ks_teachers'), SEED_USERS);
    const supervisions = safeJsonParse(localStorage.getItem('ks_supervisions'), []);
    const termPlans = safeJsonParse(localStorage.getItem('ks_term_plans'), []);
    dbCache = { ...dbCache, teachers, supervisions, termPlans, lastLoaded: now };
    return dbCache;
  }
};

const byteSizeOf = (value) => new TextEncoder().encode(JSON.stringify(value)).length;

// Best-effort local mirror. This cache is optional (Firestore is the source
// of truth), so a full localStorage quota -- which happens in practice once
// enough evaluation photos/PLC logs accumulate -- must never make a
// successful Firestore write look like a failed save.
const safeCacheLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Could not cache "${key}" locally (quota?):`, e);
  }
};

// Maps the Firestore document name to the dbCache property it's stored under.
// (plc_logs is absent on purpose -- it uses per-document storage, not the
// single-array-document pattern these helpers implement. See section 5.)
const CACHE_KEY_BY_DATATYPE = {
  teachers: 'teachers',
  supervisions: 'supervisions',
  term_plans: 'termPlans'
};

// Refuses a document that would not fit, instead of letting Firestore fail
// the write (or, worse, letting the data grow until nothing can be saved).
const assertDocumentFits = (payload, whatIsTooBig) => {
  const size = byteSizeOf(payload);
  if (size > MAX_DOC_BYTES) {
    throw new Error(
      `${whatIsTooBig}มีขนาดใหญ่เกินไป (${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
      `ไม่สามารถบันทึกได้ กรุณาลบรูปภาพหรือไฟล์แนบเก่าออกก่อนบันทึกรายการใหม่`
    );
  }
};

const SUPERVISIONS_DOC = 'supervisions';
const supervisionsRef = () => doc(db, 'system_db', SUPERVISIONS_DOC);

// Which academic years currently sit in their own archive document (read
// from the working document, the one place that records it), and the
// records the working document itself held on the last read -- the
// archiver looks at those rather than at the merged list.
let archivedSupervisionYears = [];
let workingSupervisions = [];

// Reads the working document plus every archive document and returns them as
// the single list the rest of the app expects. Archived (older) years come
// first, so the merged order still runs oldest to newest.
const readSupervisionShards = async () => {
  const workingSnap = await getDoc(supervisionsRef());
  if (!workingSnap.exists()) {
    await setDoc(supervisionsRef(), { list: [] });
    archivedSupervisionYears = [];
    workingSupervisions = [];
    return [];
  }

  const data = workingSnap.data();
  archivedSupervisionYears = Array.isArray(data.archivedYears) ? data.archivedYears : [];
  workingSupervisions = data.list || [];
  if (archivedSupervisionYears.length === 0) return workingSupervisions;

  const archiveSnaps = await Promise.all(
    archivedSupervisionYears.map(year => getDoc(doc(db, 'system_db', supervisionShardId(year))))
  );
  const archived = archiveSnaps.flatMap(snap => (snap.exists() ? (snap.data().list || []) : []));
  return [...archived, ...workingSupervisions];
};

// The supervisions equivalent of the packed-document transaction below: it
// reads the working document and every archive, hands `mutateFn` the merged
// list exactly as before, then writes each record back to the document it
// came from -- touching only the documents that actually changed.
const mutateSupervisionShards = async (mutateFn) => {
  return runTransaction(db, async (transaction) => {
    const workingSnap = await transaction.get(supervisionsRef());
    const workingData = workingSnap.exists() ? workingSnap.data() : {};
    const workingList = workingData.list || [];
    const archivedYears = Array.isArray(workingData.archivedYears) ? workingData.archivedYears : [];

    // Every read has to happen before the first write in a transaction.
    const shardOfId = new Map();
    const archivedLists = {};
    for (const year of archivedYears) {
      const snap = await transaction.get(doc(db, 'system_db', supervisionShardId(year)));
      const list = snap.exists() ? (snap.data().list || []) : [];
      archivedLists[year] = list;
      list.forEach(record => shardOfId.set(record.id, year));
    }

    const merged = [
      ...archivedYears.flatMap(year => archivedLists[year]),
      ...workingList
    ];
    const nextList = mutateFn(merged);
    const { working, byYear } = regroupSupervisions(nextList, shardOfId);

    // An archive whose records have all been deleted is removed, so it stops
    // costing a read on every page load.
    const remainingYears = [];
    for (const year of archivedYears) {
      const nextShard = byYear[year] || [];
      const shardRef = doc(db, 'system_db', supervisionShardId(year));

      if (nextShard.length === 0) {
        transaction.delete(shardRef);
        continue;
      }
      remainingYears.push(year);
      if (JSON.stringify(nextShard) === JSON.stringify(archivedLists[year])) continue;
      const payload = { academicYear: year, list: nextShard };
      assertDocumentFits(payload, `ข้อมูลการนิเทศของปีการศึกษา ${year}`);
      transaction.set(shardRef, payload);
    }

    const listChanged = JSON.stringify(working) !== JSON.stringify(workingList);
    if (listChanged || remainingYears.length !== archivedYears.length) {
      const payload = { ...workingData, list: working, archivedYears: remainingYears };
      assertDocumentFits(payload, 'ข้อมูลการนิเทศของปีการศึกษาปัจจุบัน');
      transaction.set(supervisionsRef(), payload);
    }

    return nextList;
  });
};

// Atomically read-modify-write a collection using a Firestore transaction, so
// two clients writing around the same time can't silently drop each other's
// change (the old code read a cached array, mutated it, then blindly
// overwrote the whole document). `mutateFn` receives the latest array
// straight from Firestore and must return the new array.
const mutateCollection = async (datatype, mutateFn) => {
  const cacheKey = CACHE_KEY_BY_DATATYPE[datatype];

  if (!isFirebaseInitialized) {
    // Offline mode has no Firestore backup -- localStorage IS the datastore
    // here, so a write failure genuinely means the save failed.
    try {
      const dbData = await ensureDBLoaded();
      const nextList = mutateFn(dbData[cacheKey] || []);
      dbData[cacheKey] = nextList;
      localStorage.setItem(`ks_${datatype}`, JSON.stringify(nextList));
      return { success: true, list: nextList };
    } catch (e) {
      console.error(`Failed to save ${datatype} locally:`, e);
      return { success: false, list: null, error: e };
    }
  }

  try {
    const ref = doc(db, "system_db", datatype);
    const nextList = datatype === SUPERVISIONS_DOC
      ? await mutateSupervisionShards(mutateFn)
      : await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        const currentList = snap.exists() ? (snap.data().list || []) : [];
        const updatedList = mutateFn(currentList);
        const payload = { list: updatedList };

        assertDocumentFits(payload, `ข้อมูล "${datatype}"`);
        transaction.set(ref, payload);
        return updatedList;
      });

    dbCache[cacheKey] = nextList;
    dbCache.lastLoaded = Date.now();
    // Best-effort mirror -- the Firestore write above already succeeded, so
    // a full localStorage quota here must not be reported as a failed save.
    safeCacheLocal(`ks_${datatype}`, nextList);
    return { success: true, list: nextList };
  } catch (e) {
    console.error(`Failed to save ${datatype} to Firestore:`, e);
    return { success: false, list: null, error: e };
  }
};

/* ==========================================================================
   1. USER / PERSONNEL MANAGEMENT
   ========================================================================== */

export const getUsers = async () => {
  const dbData = await ensureDBLoaded();
  return dbData.teachers;
};

export const addTeacher = async (teacherData) => {
  const newTeacher = {
    id: `teacher-${crypto.randomUUID()}`,
    ...teacherData,
    ...(teacherData.password ? { password: hashPassword(teacherData.password) } : {})
  };
  const { success } = await mutateCollection('teachers', (list) => [...list, newTeacher]);
  return success ? newTeacher : null;
};

export const deleteTeacher = async (teacherId) => {
  const { success } = await mutateCollection('teachers', (list) => list.filter(t => t.id !== teacherId));
  return success;
};

export const updateTeacher = async (teacherId, updatedFields) => {
  const fields = updatedFields.password
    ? { ...updatedFields, password: hashPassword(updatedFields.password) }
    : updatedFields;
  const { success } = await mutateCollection('teachers', (list) =>
    list.map(t => (t.id === teacherId ? { ...t, ...fields } : t))
  );
  return success;
};


/* ==========================================================================
   2. SUPERVISION BOOKINGS
   ========================================================================== */

// Moves photos that older evaluations stored inline out into the per-
// supervision photo documents, shrinking the shared supervisions document
// (see EVAL_IMG_PREFIX below for why). Runs at most once per page session,
// and only actually writes if inline photos are still present.
let inlineEvalImagesChecked = false;
const migrateInlineEvaluationImages = async (supervisions) => {
  if (inlineEvalImagesChecked || !isFirebaseInitialized) return false;
  inlineEvalImagesChecked = true;

  const needing = supervisions.filter(s =>
    Object.values(s.evaluations || {}).some(ev => Array.isArray(ev.images) && ev.images.length > 0)
  );
  if (needing.length === 0) return false;

  try {
    for (const sup of needing) {
      for (const [supervisorId, ev] of Object.entries(sup.evaluations || {})) {
        if (Array.isArray(ev.images) && ev.images.length > 0) {
          await writeEvaluationImages(sup.id, supervisorId, ev.images);
        }
      }
    }

    // Strip the now-duplicated inline photos from the supervisions document.
    await mutateCollection('supervisions', (list) =>
      list.map(s => {
        if (!needing.some(n => n.id === s.id)) return s;
        const evaluations = {};
        Object.entries(s.evaluations || {}).forEach(([id, ev]) => {
          const { images, ...rest } = ev;
          evaluations[id] = { ...rest, imageCount: Array.isArray(images) ? images.length : (ev.imageCount || 0) };
        });
        return { ...s, evaluations };
      })
    );
    console.log(`Moved inline evaluation photos out of ${needing.length} supervision(s).`);
    return true;
  } catch (e) {
    // Non-fatal: the app still works with photos inline, it just stays large.
    console.warn('Could not move inline evaluation images:', e);
    return false;
  }
};

// Moves One-Page report files that older records stored inline out into
// their own documents (see ONE_PAGE_PREFIX below). Runs at most once per
// page session, and only writes if inline files are still present.
let inlineOnePageChecked = false;
const migrateInlineOnePageReports = async (supervisions) => {
  if (inlineOnePageChecked || !isFirebaseInitialized) return false;
  inlineOnePageChecked = true;

  const needing = supervisions.filter(s => s.onePageReport && s.onePageReport.fileData);
  if (needing.length === 0) return false;

  try {
    for (const sup of needing) {
      await onePageStore.write(sup.id, sup.onePageReport.fileData);
    }

    // Strip the now-duplicated file payloads from the supervisions document.
    await mutateCollection('supervisions', (list) =>
      list.map(s => (needing.some(n => n.id === s.id) && s.onePageReport
        ? { ...s, onePageReport: { ...s.onePageReport, fileData: null } }
        : s))
    );
    console.log(`Moved ${needing.length} inline One-Page report file(s) out of the supervisions document.`);
    return true;
  } catch (e) {
    // Non-fatal: the app still works with the files inline, it just stays large.
    console.warn('Could not move inline One-Page report files:', e);
    return false;
  }
};

// Moves records from finished academic years out of the working document
// and into one document per year, so the working document only ever holds
// the year in progress (see utils/supervisionShards.js for why). Runs at
// most once per page session; the move is a single transaction, so records
// are never absent from both documents at once.
let supervisionArchiveChecked = false;
const archivePastSupervisionYears = async () => {
  if (supervisionArchiveChecked || !isFirebaseInitialized) return false;
  supervisionArchiveChecked = true;
  if (workingSupervisions.length === 0) return false;

  try {
    const settingsSnap = await getDoc(doc(db, 'system_db', 'settings'));
    const currentAcademicYear = settingsSnap.exists()
      ? settingsSnap.data().currentAcademicYear
      : null;
    // Without a current academic year there is no way to tell which years
    // are finished, so leave everything where it is.
    if (!currentAcademicYear) return false;
    if (Object.keys(supervisionsToArchive(workingSupervisions, currentAcademicYear)).length === 0) return false;

    const moved = await runTransaction(db, async (transaction) => {
      const workingSnap = await transaction.get(supervisionsRef());
      if (!workingSnap.exists()) return 0;

      const data = workingSnap.data();
      const list = data.list || [];
      const byYear = supervisionsToArchive(list, currentAcademicYear);
      const years = Object.keys(byYear);
      if (years.length === 0) return 0;

      // Every read has to happen before the first write in a transaction.
      const existing = {};
      for (const year of years) {
        const snap = await transaction.get(doc(db, 'system_db', supervisionShardId(year)));
        existing[year] = snap.exists() ? (snap.data().list || []) : [];
      }

      const archivedYears = Array.isArray(data.archivedYears) ? [...data.archivedYears] : [];
      const archivedIds = new Set();

      years.forEach(year => {
        const shardList = mergeIntoShard(existing[year], byYear[year]);
        const payload = { academicYear: year, list: shardList };
        assertDocumentFits(payload, `ข้อมูลการนิเทศของปีการศึกษา ${year}`);
        transaction.set(doc(db, 'system_db', supervisionShardId(year)), payload);

        if (!archivedYears.includes(year)) archivedYears.push(year);
        byYear[year].forEach(record => archivedIds.add(record.id));
      });

      transaction.set(supervisionsRef(), {
        ...data,
        list: list.filter(record => !archivedIds.has(record.id)),
        archivedYears: archivedYears.sort()
      });
      return archivedIds.size;
    });

    if (moved > 0) {
      console.log(`Archived ${moved} supervision(s) from finished academic years.`);
      return true;
    }
    return false;
  } catch (e) {
    // Non-fatal: everything still works from the working document, it just
    // stays larger. Retried on the next page load.
    console.warn('Could not archive past academic years:', e);
    return false;
  }
};

export const getSupervisions = async () => {
  const dbData = await ensureDBLoaded();
  const movedInline = await migrateInlineEvaluationImages(dbData.supervisions);
  // Runs after the inline migration so photos it just wrote into the older
  // per-supervision documents get split out in the same pass.
  await migrateLegacyEvalImageDocs(dbData.supervisions);
  const movedOnePage = await migrateInlineOnePageReports(dbData.supervisions);
  const archived = await archivePastSupervisionYears();
  if (movedInline || movedOnePage || archived) {
    const refreshed = await ensureDBLoaded(true);
    return refreshed.supervisions;
  }
  return dbData.supervisions;
};

export const addSupervision = async (supervision) => {
  const newSupervision = {
    id: `sup-${crypto.randomUUID()}`,
    status: 'pending',
    supervisors: [],
    volunteerId: '',
    volunteerName: '',
    postTeachingRecord: null,
    // When the request was entered into the system -- distinct from `date`,
    // which is when the lesson is actually observed. Needed to show who was
    // recorded before whom; PLC logs and term plans already carry the
    // equivalent `submittedAt`.
    createdAt: new Date().toISOString(),
    ...supervision
  };
  const { success } = await mutateCollection('supervisions', (list) => [...list, newSupervision]);
  return success ? newSupervision : null;
};

export const updateSupervision = async (supervisionId, updatedFields) => {
  let fields = updatedFields;

  // The One-Page report's file goes into its own document; only the
  // metadata (type/link/uploadedAt) stays in the shared supervisions
  // document. See ONE_PAGE_PREFIX below for why.
  // Offline mode keeps it inline -- localStorage is the datastore there and
  // has no companion document to read the file back out of.
  if (isFirebaseInitialized && 'onePageReport' in updatedFields) {
    try {
      fields = {
        ...updatedFields,
        onePageReport: await onePageStore.detach(supervisionId, updatedFields.onePageReport)
      };
    } catch (e) {
      console.error('Failed to save the One-Page report file:', e);
      return false;
    }
  }

  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId ? { ...s, ...fields } : s))
  );
  return success;
};

export const deleteSupervision = async (supervisionId) => {
  const { success } = await mutateCollection('supervisions', (list) => list.filter(s => s.id !== supervisionId));

  // Remove the companion photo documents -- one per supervisor plus any
  // pre-split document -- so deleted supervisions don't leave their
  // evaluation images behind (see EVAL_IMG_PREFIX below).
  if (success && isFirebaseInitialized) {
    try {
      await deleteEvaluationImageDocs(supervisionId);
    } catch (e) {
      console.warn('Supervision deleted but its evaluation images could not be removed:', e);
    }
    try {
      await onePageStore.write(supervisionId, null);
    } catch (e) {
      console.warn('Supervision deleted but its One-Page report file could not be removed:', e);
    }
  }
  localStorage.removeItem(`ks_evalimg_${supervisionId}`);
  return success;
};

export const volunteerToSupervise = async (supervisionId, teacherId, teacherName) => {
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, status: 'pending_approval', volunteerId: teacherId, volunteerName: teacherName }
      : s))
  );
  return success;
};

export const approveVolunteer = async (supervisionId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId && s.volunteerId) {
        matched = true;
        const supervisors = [...(s.supervisors || [])];
        if (!supervisors.some(sup => sup.id === s.volunteerId)) {
          supervisors.push({ id: s.volunteerId, name: s.volunteerName });
        }
        const status = supervisors.length >= 2 ? 'approved' : 'pending';
        return { ...s, status, supervisors, volunteerId: '', volunteerName: '' };
      }
      return s;
    })
  );
  return matched && success;
};

export const rejectVolunteer = async (supervisionId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId) {
        matched = true;
        const supervisorsCount = s.supervisors ? s.supervisors.length : 0;
        const status = supervisorsCount >= 2 ? 'approved' : 'pending';
        return { ...s, status, volunteerId: '', volunteerName: '' };
      }
      return s;
    })
  );
  return matched && success;
};

// Appoints one or more supervisors in a SINGLE transaction. Assigning a
// whole committee used to mean one write (and one status recalculation) per
// person, which briefly left the record in a half-appointed state and could
// interleave with another admin's writes; doing it in one pass avoids both.
// `newSupervisors` is [{ id, name }]. Already-appointed people are ignored.
export const assignSupervisors = async (supervisionId, newSupervisors) => {
  const toAdd = (newSupervisors || []).filter(s => s && s.id);
  if (toAdd.length === 0) return false;

  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id !== supervisionId) return s;
      matched = true;

      const supervisors = [...(s.supervisors || [])];
      toAdd.forEach(({ id, name }) => {
        if (!supervisors.some(sup => sup.id === id)) {
          supervisors.push({ id, name });
        }
      });

      const status = supervisors.length >= 2 ? 'approved' : 'pending';
      const res = { ...s, status, supervisors };
      // A volunteer who has now been appointed is no longer pending approval.
      if (toAdd.some(({ id }) => id === s.volunteerId)) {
        res.volunteerId = '';
        res.volunteerName = '';
      }
      return res;
    })
  );
  return matched && success;
};

export const assignSupervisor = async (supervisionId, supervisorId, supervisorName) =>
  assignSupervisors(supervisionId, [{ id: supervisorId, name: supervisorName }]);

export const removeSupervisor = async (supervisionId, supervisorId) => {
  let matched = false;
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id === supervisionId) {
        matched = true;
        const supervisors = (s.supervisors || []).filter(sup => sup.id !== supervisorId);
        let status = s.status;
        if (supervisors.length >= 2) {
          status = 'approved';
        } else if (s.status !== 'completed') {
          status = 'pending';
        }
        return { ...s, status, supervisors };
      }
      return s;
    })
  );
  return matched && success;
};

// Records ONE supervisor's evaluation, merging it into whatever evaluations
// already exist on the record.
//
// This must merge server-side, inside mutateCollection's Firestore
// transaction, rather than having the caller send a pre-merged
// `evaluations` object. Each committee member's browser holds a snapshot of
// the supervision taken when their page last loaded; if two members evaluate
// the same lesson, the second one to save would otherwise write back a
// snapshot that predates the first member's submission and silently erase
// it -- which is why supervisions with several committee members were only
// ever showing a single evaluation.
// Evaluation photos are stored OUTSIDE the supervisions document, one photo
// document per supervision at `system_db/evalimg_<supervisionId>`, shaped as
// { images: { [supervisorId]: [dataUrl, ...] } }.
//
// Two reasons, both measured against real data:
//   * Ceiling. A single evaluation with 4 photos measured ~187KB. The whole
//     supervisions collection lives in ONE Firestore document capped at
//     1 MiB, and every supervision has a 3-person committee, so a handful of
//     evaluated lessons would exceed it and block all further saves.
//   * Load cost. The supervisions document is fetched on EVERY page view to
//     draw the calendar. Keeping photos inline meant downloading every
//     evaluation photo in the school just to see the month grid.
// Keeping only the text and ratings inline leaves the supervisions document
// small and lets photos be fetched on demand by the report screens.
// Photos are stored ONE DOCUMENT PER SUPERVISOR, at
// `system_db/evalimg_<supervisionId>_<supervisorId>` shaped as
// { images: [dataUrl, ...] }.
//
// They used to share a single per-supervision document keyed by supervisor.
// That put the whole committee under one 900KB ceiling, so a member whose
// own photos were small could still be refused because colleagues had
// already filled it -- measured on live data at 734KB (81% of the cap) for a
// three-member committee, with one member alone occupying 664KB. Splitting
// per supervisor means the ceiling applies to one person's 4 photos
// (~200KB) instead of the committee's combined ~800KB, which removes the
// ceiling rather than postponing it. Same reasoning as the PLC logs in
// section 5.
const EVAL_IMG_PREFIX = 'evalimg_';
// Documents written before the split: one per supervision, holding
// { images: { [supervisorId]: [...] } }. Still read so existing photos keep
// showing, and drained by migrateLegacyEvalImageDocs().
const legacyEvalImgDocId = (supervisionId) => `${EVAL_IMG_PREFIX}${supervisionId}`;
const evalImgDocId = (supervisionId, supervisorId) =>
  `${EVAL_IMG_PREFIX}${supervisionId}_${supervisorId}`;

// Bounds a document-id range query to one supervision's per-supervisor
// photo documents.  is the conventional high sentinel for Firestore
// prefix queries -- it sorts after any realistic supervisor id.
const evalImgRange = (supervisionId) => [
  `${EVAL_IMG_PREFIX}${supervisionId}_`,
  `${EVAL_IMG_PREFIX}${supervisionId}_`
];


/** Returns { [supervisorId]: [dataUrl, ...] } for one supervision. */
export const getEvaluationImages = async (supervisionId) => {
  if (!isFirebaseInitialized) {
    return safeJsonParse(localStorage.getItem(`ks_evalimg_${supervisionId}`), {});
  }
  try {
    const [lo, hi] = evalImgRange(supervisionId);
    // The legacy document sorts before `lo` (it has no trailing "_"), so it
    // needs its own read rather than falling out of the range query.
    const [perSupervisorSnap, legacySnap] = await Promise.all([
      getDocs(query(
        collection(db, 'system_db'),
        where(documentId(), '>=', lo),
        where(documentId(), '<=', hi)
      )),
      getDoc(doc(db, 'system_db', legacyEvalImgDocId(supervisionId)))
    ]);

    const images = legacySnap.exists() ? { ...(legacySnap.data().images || {}) } : {};
    // Per-supervisor documents are authoritative where both exist.
    perSupervisorSnap.docs.forEach(d => {
      const supervisorId = d.id.slice(`${EVAL_IMG_PREFIX}${supervisionId}_`.length);
      const list = d.data().images;
      if (Array.isArray(list) && list.length > 0) images[supervisorId] = list;
    });

    try {
      localStorage.setItem(`ks_evalimg_${supervisionId}`, JSON.stringify(images));
    } catch { /* quota - the local mirror is optional */ }
    return images;
  } catch (e) {
    console.warn('Failed to load evaluation images, using local cache:', e);
    return safeJsonParse(localStorage.getItem(`ks_evalimg_${supervisionId}`), {});
  }
};

// Writes ONE supervisor's photos, leaving every other supervisor's photos
// untouched (they live in their own documents).
const writeEvaluationImages = async (supervisionId, supervisorId, images) => {
  const ref = doc(db, 'system_db', evalImgDocId(supervisionId, supervisorId));

  if (images && images.length > 0) {
    const payload = { supervisionId, supervisorId, images };
    const size = byteSizeOf(payload);
    if (size > MAX_DOC_BYTES) {
      throw new Error(
        `รูปภาพประกอบการนิเทศของท่านมีขนาดรวมใหญ่เกินไป ` +
        `(${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
        `กรุณาลดจำนวนรูปภาพลงแล้วบันทึกใหม่อีกครั้ง`
      );
    }
    await setDoc(ref, payload);
  } else {
    await deleteDoc(ref);
  }

  // Drop this supervisor's entry from the pre-split document too, so a stale
  // copy there can't resurrect deleted photos or mask an update.
  await removeFromLegacyEvalImgDoc(supervisionId, supervisorId);
  localStorage.removeItem(`ks_evalimg_${supervisionId}`);
};

// Removes every photo document belonging to one supervision: each
// supervisor's own document plus any pre-split one.
const deleteEvaluationImageDocs = async (supervisionId) => {
  const [lo, hi] = evalImgRange(supervisionId);
  const snap = await getDocs(query(
    collection(db, 'system_db'),
    where(documentId(), '>=', lo),
    where(documentId(), '<=', hi)
  ));

  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'system_db', legacyEvalImgDocId(supervisionId)));
  await batch.commit();
};

// One-time drain of the pre-split per-supervision photo documents into one
// document per supervisor. A marker document keeps this to a single run
// across all clients (rather than once per session per browser), since the
// scan costs one read per supervision that has been evaluated.
let legacyEvalImagesChecked = false;
const EVAL_IMG_MIGRATION_DOC = ['system_db', 'evalimg_migration'];
const migrateLegacyEvalImageDocs = async (supervisions) => {
  if (legacyEvalImagesChecked || !isFirebaseInitialized) return;
  legacyEvalImagesChecked = true;

  try {
    const markerRef = doc(db, ...EVAL_IMG_MIGRATION_DOC);
    const markerSnap = await getDoc(markerRef);
    if (markerSnap.exists() && markerSnap.data().done) return;

    // Only supervisions that actually hold evaluations can have photos.
    const evaluated = supervisions.filter(s =>
      s.evaluations && Object.keys(s.evaluations).length > 0
    );

    for (const sup of evaluated) {
      const legacyRef = doc(db, 'system_db', legacyEvalImgDocId(sup.id));
      const legacySnap = await getDoc(legacyRef);
      if (!legacySnap.exists()) continue;

      const bySupervisor = legacySnap.data().images || {};
      const entries = Object.entries(bySupervisor)
        .filter(([, list]) => Array.isArray(list) && list.length > 0);
      if (entries.length === 0) {
        await deleteDoc(legacyRef);
        continue;
      }

      // Written one at a time rather than batched: a committee's photos can
      // total ~800KB, which would blow past the 10 MiB per-batch limit once
      // several supervisions are migrated together.
      for (const [supervisorId, list] of entries) {
        await setDoc(doc(db, 'system_db', evalImgDocId(sup.id, supervisorId)), {
          supervisionId: sup.id,
          supervisorId,
          images: list
        });
      }
      await deleteDoc(legacyRef);
      console.log(`Split ${entries.length} supervisor photo set(s) out of ${sup.id}.`);
    }

    await setDoc(markerRef, { done: true, migratedAt: new Date().toISOString(), scanned: evaluated.length });
  } catch (e) {
    // Non-fatal: getEvaluationImages still reads the legacy documents, and
    // the marker is only written on a clean pass so this retries next load.
    console.warn('Could not split legacy evaluation photo documents:', e);
  }
};

// Removes one supervisor's photos from the pre-split per-supervision
// document, deleting the document once it holds nothing else.
const removeFromLegacyEvalImgDoc = async (supervisionId, supervisorId) => {
  const legacyRef = doc(db, 'system_db', legacyEvalImgDocId(supervisionId));
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(legacyRef);
      if (!snap.exists()) return;
      const current = snap.data().images || {};
      if (!(supervisorId in current)) return;

      const next = { ...current };
      delete next[supervisorId];
      if (Object.keys(next).length === 0) {
        transaction.delete(legacyRef);
      } else {
        transaction.set(legacyRef, { images: next });
      }
    });
  } catch (e) {
    // Non-fatal: the per-supervisor document above is authoritative.
    console.warn('Could not clean up the legacy photo document:', e);
  }
};

export const submitEvaluation = async (supervisionId, supervisorId, evaluation) => {
  const { images = [], ...evaluationText } = evaluation;

  if (isFirebaseInitialized) {
    try {
      await writeEvaluationImages(supervisionId, supervisorId, images);
    } catch (e) {
      console.error('Failed to save evaluation images:', e);
      return false;
    }
  }

  // Stored without the photo payload; imageCount lets the UI show how many
  // there are without having to fetch them.
  const stored = { ...evaluationText, imageCount: images.length };

  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, evaluations: { ...(s.evaluations || {}), [supervisorId]: stored } }
      : s))
  );
  return success;
};

// Removes ONE supervisor's evaluation. Merged server-side inside the
// transaction for the same reason submitEvaluation is (see above): deleting
// via a client-held snapshot would resurrect or erase other members' entries.
export const deleteEvaluation = async (supervisionId, supervisorId) => {
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => {
      if (s.id !== supervisionId) return s;
      const remaining = { ...(s.evaluations || {}) };
      delete remaining[supervisorId];
      return { ...s, evaluations: remaining };
    })
  );

  // Drop the photos too, so removing an evaluation doesn't leave its images
  // orphaned in the photo document forever.
  if (success && isFirebaseInitialized) {
    try {
      await writeEvaluationImages(supervisionId, supervisorId, []);
    } catch (e) {
      console.warn('Evaluation removed but its images could not be cleaned up:', e);
    }
  }
  return success;
};

export const submitPostTeachingRecord = async (supervisionId, record) => {
  const fullRecord = {
    ...record,
    submittedAt: new Date().toISOString()
  };
  const { success } = await mutateCollection('supervisions', (list) =>
    list.map(s => (s.id === supervisionId
      ? { ...s, status: 'completed', postTeachingRecord: fullRecord }
      : s))
  );
  return success;
};

// ATTACHED FILES (One-Page reports, post-lesson records)
//
// Both of these attach one big file -- a base64 image, or a PDF of up to
// 300-500KB -- to a record that lives inside a packed array document.
// Keeping the file inline is exactly what has broken saving in this project
// before, so each file gets a document of its own, `<prefix><recordId>`,
// and only the metadata (type, link, uploadedAt) stays inline. That is all
// the lists and badges need in order to show that a file exists.
//
// Measured on live data: the supervisions document stood at 256KB of the
// 900KB cap for 27 records, and 123KB of that -- nearly half -- was a
// SINGLE teacher's One-Page image. Every teacher is expected to upload one
// per year (33 teachers), so about seven more uploads would have taken it
// past the cap and blocked every save in the system. The term plans
// document is smaller but more fragile still: it accepts PDFs of up to
// 500KB, so the second teacher to attach one would have finished it off.
//
// Load cost matters too: both packed documents are fetched on every page
// view, so files kept inline were downloaded by everyone just to draw the
// calendar or the plan list. Files are now read on demand, only when
// someone actually opens one.
const attachmentStore = (prefix, whatIsTooBig) => {
  const refFor = (ownerId) => doc(db, 'system_db', `${prefix}${ownerId}`);

  // Writes (or, with a falsy `fileData`, removes) one record's file document.
  const write = async (ownerId, fileData) => {
    const ref = refFor(ownerId);

    if (!fileData) {
      await deleteDoc(ref);
      return;
    }

    const payload = { ownerId, fileData };
    const size = byteSizeOf(payload);
    if (size > MAX_DOC_BYTES) {
      throw new Error(
        `${whatIsTooBig}มีขนาดใหญ่เกินไป ` +
        `(${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
        `กรุณาลดขนาดไฟล์แล้วบันทึกใหม่อีกครั้ง`
      );
    }
    await setDoc(ref, payload);
  };

  const read = async (ownerId) => {
    const snap = await getDoc(refFor(ownerId));
    return snap.exists() ? (snap.data().fileData || null) : null;
  };

  // Moves `record.fileData` into its own document and returns the record
  // with only the metadata left inline. A record being removed outright, or
  // replaced by a link, has no file any more -- anything else arriving
  // without a `fileData` is a metadata-only update, and must leave the
  // stored file where it is rather than wipe it.
  const detach = async (ownerId, record) => {
    const clearsFile = !record || record.type === 'link';
    if (clearsFile || record.fileData) {
      await write(ownerId, clearsFile ? null : record.fileData);
    }
    return record ? { ...record, fileData: null } : null;
  };

  // Reads a record's file back: from the document, or from the record
  // itself for rows written before the split and for offline mode, where
  // localStorage is the datastore and has no companion document.
  const load = async (ownerId, record) => {
    if (!record || record.type === 'link') return null;
    if (record.fileData) return record.fileData;
    if (!isFirebaseInitialized) return null;
    try {
      return await read(ownerId);
    } catch (e) {
      console.warn(`Failed to load ${prefix}${ownerId}:`, e);
      return null;
    }
  };

  return { write, load, detach };
};

const onePageStore = attachmentStore('onepage_', 'ไฟล์รายงานนิเทศหน้าเดียว');
const postLessonStore = attachmentStore('postlesson_', 'ไฟล์บันทึกหลังแผนการจัดการเรียนรู้');

/** Returns the One-Page report's base64 file for one supervision, or null. */
export const getOnePageReportFile = async (supervision) =>
  onePageStore.load(supervision && supervision.id, supervision && supervision.onePageReport);

/** Returns the post-lesson record's base64 file for one term plan, or null. */
export const getPostLessonRecordFile = async (plan) =>
  postLessonStore.load(plan && plan.id, plan && plan.postLessonRecord);

/* ==========================================================================
   3. TERM LESSON PLANS ARCHIVE
   ========================================================================== */

// Moves post-lesson files that older plans stored inline out into their own
// documents (see attachmentStore above). Runs at most once per page session,
// and only writes if inline files are still present.
let inlinePostLessonChecked = false;
const migrateInlinePostLessonFiles = async (plans) => {
  if (inlinePostLessonChecked || !isFirebaseInitialized) return false;
  inlinePostLessonChecked = true;

  const needing = plans.filter(p => p.postLessonRecord && p.postLessonRecord.fileData);
  if (needing.length === 0) return false;

  try {
    for (const plan of needing) {
      await postLessonStore.write(plan.id, plan.postLessonRecord.fileData);
    }

    // Strip the now-duplicated file payloads from the term plans document.
    await mutateCollection('term_plans', (list) =>
      list.map(p => (needing.some(n => n.id === p.id) && p.postLessonRecord
        ? { ...p, postLessonRecord: { ...p.postLessonRecord, fileData: null } }
        : p))
    );
    console.log(`Moved ${needing.length} inline post-lesson file(s) out of the term plans document.`);
    return true;
  } catch (e) {
    // Non-fatal: the app still works with the files inline, it just stays large.
    console.warn('Could not move inline post-lesson files:', e);
    return false;
  }
};

export const getTermPlans = async () => {
  const dbData = await ensureDBLoaded();
  if (await migrateInlinePostLessonFiles(dbData.termPlans)) {
    const refreshed = await ensureDBLoaded(true);
    return refreshed.termPlans;
  }
  return dbData.termPlans;
};

export const addTermPlan = async (planData) => {
  const newPlan = {
    id: `plan-${crypto.randomUUID()}`,
    postLessonRecord: null,
    submittedAt: new Date().toISOString(),
    ...planData
  };
  const { success } = await mutateCollection('term_plans', (list) => [...list, newPlan]);
  return success ? newPlan : null;
};

export const updateTermPlan = async (planId, updatedFields) => {
  let fields = updatedFields;

  // The post-lesson record's file (a PDF of up to 500KB) goes into its own
  // document; only the metadata stays in the shared term plans document.
  // Offline mode keeps it inline -- localStorage is the datastore there and
  // has no companion document to read the file back out of.
  if (isFirebaseInitialized && 'postLessonRecord' in updatedFields) {
    try {
      fields = {
        ...updatedFields,
        postLessonRecord: await postLessonStore.detach(planId, updatedFields.postLessonRecord)
      };
    } catch (e) {
      console.error('Failed to save the post-lesson file:', e);
      return false;
    }
  }

  const { success } = await mutateCollection('term_plans', (list) =>
    list.map(p => (p.id === planId ? { ...p, ...fields } : p))
  );
  return success;
};

export const deleteTermPlan = async (planId) => {
  const { success } = await mutateCollection('term_plans', (list) => list.filter(p => p.id !== planId));

  // Remove the companion file document, so deleted plans don't leave their
  // post-lesson PDF behind.
  if (success && isFirebaseInitialized) {
    try {
      await postLessonStore.write(planId, null);
    } catch (e) {
      console.warn('Term plan deleted but its post-lesson file could not be removed:', e);
    }
  }
  return success;
};

/* ==========================================================================
   4. SYSTEM SETTINGS (POSITIONS & DEPARTMENTS)
   ========================================================================== */

const defaultSettings = {
  positions: ['ครูผู้ช่วย', 'ครู', 'ครูชำนาญการ', 'ครูชำนาญการพิเศษ', 'ครูเชี่ยวชาญ', 'หัวหน้างานวิชาการ', 'ผู้อำนวยการโรงเรียน', 'รองผู้อำนวยการโรงเรียน'],
  departments: [
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ'
  ],
  plcGroups: [
    'กลุ่ม PLC คณิตศาสตร์',
    'กลุ่ม PLC ภาษาต่างประเทศ',
    'กลุ่ม PLC วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่ม PLC ภาษาไทย',
    'กลุ่ม PLC สังคมศึกษา ศาสนา และวัฒนธรรม',
    'กลุ่ม PLC ศิลปะ',
    'กลุ่ม PLC สุขศึกษาและพลศึกษา',
    'กลุ่ม PLC การงานอาชีพ'
  ],
  academicYears: ['2567', '2568', '2569'],
  currentAcademicYear: '2569'
};

const mergeSettingsWithDefaults = (settingsObj) => {
  return {
    ...defaultSettings,
    ...settingsObj
  };
};

export const getSystemSettings = async () => {
  if (!isFirebaseInitialized) {
    const local = localStorage.getItem('ks_settings');
    return local ? mergeSettingsWithDefaults(safeJsonParse(local, {})) : defaultSettings;
  }
  
  try {
    const docRef = doc(db, "system_db", "settings");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() || defaultSettings;
      const merged = mergeSettingsWithDefaults(data);
      localStorage.setItem('ks_settings', JSON.stringify(merged));
      return merged;
    } else {
      await setDoc(docRef, defaultSettings);
      localStorage.setItem('ks_settings', JSON.stringify(defaultSettings));
      return defaultSettings;
    }
  } catch (err) {
    console.warn("Failed to load settings from Firebase, using cache:", err);
    const local = localStorage.getItem('ks_settings');
    return local ? mergeSettingsWithDefaults(safeJsonParse(local, {})) : defaultSettings;
  }
};

export const updateSystemSettings = async (newSettings) => {
  safeCacheLocal('ks_settings', newSettings);

  if (!isFirebaseInitialized) {
    return true;
  }
  
  try {
    await setDoc(doc(db, "system_db", "settings"), newSettings);
    return true;
  } catch (e) {
    console.error("Failed to update settings in Firebase:", e);
    return false;
  }
};

/* ==========================================================================
   5. PLC LOGS MANAGEMENT
   ========================================================================== */

// PLC logs are stored as ONE FIRESTORE DOCUMENT PER LOG, unlike the other
// collections which pack everything into a single `system_db/<name>` document.
//
// Why: each log embeds up to 4 base64 photos (~50-100KB each). Firestore caps
// a single document at 1 MiB, so packing every teacher's logs into one array
// document hits a hard ceiling fast -- with 33 teachers x 4 PLC cycles the
// collection would need ~50 MB. Per-document storage means the 1 MiB limit
// applies to a single log (comfortably under it) instead of to all of them
// combined, which removes the ceiling entirely.
// Each log lives at `system_db/plclog_<id>` -- deliberately a document inside
// the existing system_db collection rather than a new top-level collection,
// so it keeps working under Firestore rules scoped to `match /system_db/{docId}`
// without needing a rules change deployed first.
const PLC_DOC_PREFIX = 'plclog_';
const plcDocId = (logId) => `${PLC_DOC_PREFIX}${logId}`;
// The pre-split `system_db/plc_logs` array document was drained into these
// per-log documents long ago, and was deleted in Sept 2026 once every log in
// it had been confirmed present here; the code that read it is gone with it.

const readLocalPlcLogs = () => safeJsonParse(localStorage.getItem('ks_plc_logs'), []);

const cachePlcLogsLocally = (logs) => {
  try {
    localStorage.setItem('ks_plc_logs', JSON.stringify(logs));
  } catch (e) {
    // Photos can push this past the ~5MB localStorage quota. The offline
    // mirror is a nice-to-have, so degrade rather than break the save.
    console.warn('Could not cache PLC logs locally (quota?):', e);
  }
};

// PLC photos are stored OUTSIDE the log document, one document per log at
// `system_db/plcimg_<logId>` shaped as { logId, images: [dataUrl, ...] }.
//
// The logs themselves are already one document each, so this is not about a
// ceiling -- it is about what every visit costs. getPlcLogs() reads the
// whole collection to build the PLC screens, and the photos are ~99% of it:
// measured on live data, 13 logs came to 1.8MB, one of them 415KB on its
// own. With 33 teachers x 4 cycles a year that is ~18MB downloaded on every
// visit within a year, nearly all of it never looked at. Keeping only
// `imageCount` in the log took the same 13 logs down to 21.8KB in total,
// and the photos are fetched for the log actually being viewed.
const PLC_IMG_PREFIX = 'plcimg_';
const plcImgDocId = (logId) => `${PLC_IMG_PREFIX}${logId}`;

const writePlcLogImages = async (logId, images) => {
  const ref = doc(db, 'system_db', plcImgDocId(logId));

  if (!images || images.length === 0) {
    await deleteDoc(ref);
    return;
  }
  const payload = { logId, images };
  assertDocumentFits(payload, 'รูปภาพประกอบบันทึก PLC');
  await setDoc(ref, payload);
};

/** Returns one PLC log's photos. Fetched only when a log is opened. */
export const getPlcLogImages = async (logId) => {
  if (!logId || !isFirebaseInitialized) return [];
  try {
    const snap = await getDoc(doc(db, 'system_db', plcImgDocId(logId)));
    return snap.exists() ? (snap.data().images || []) : [];
  } catch (e) {
    console.warn('Failed to load PLC log images:', e);
    return [];
  }
};

// One-time move of photos still stored inside the log documents. A marker
// keeps it to a single run across all clients. Each log is written photos
// first, then slimmed down, so a failure part-way leaves the photos
// readable from both places rather than from neither.
const PLC_IMG_MIGRATION_DOC = ['system_db', 'plc_images_migration'];
const migrateInlinePlcImages = async (logs) => {
  const markerRef = doc(db, ...PLC_IMG_MIGRATION_DOC);
  const markerSnap = await getDoc(markerRef);
  if (markerSnap.exists() && markerSnap.data().done) return logs;

  const slimmed = [];
  let moved = 0;
  for (const log of logs) {
    if (!Array.isArray(log.images) || log.images.length === 0) {
      slimmed.push(log);
      continue;
    }
    const { images, ...rest } = log;
    const slimLog = { ...rest, imageCount: images.length };
    await writePlcLogImages(log.id, images);
    await setDoc(doc(db, 'system_db', plcDocId(log.id)), slimLog);
    slimmed.push(slimLog);
    moved += 1;
  }

  await setDoc(markerRef, { done: true, migratedAt: new Date().toISOString(), moved });
  if (moved > 0) console.log(`Moved photos out of ${moved} PLC log(s).`);
  return slimmed;
};

export const getPlcLogs = async () => {
  if (!isFirebaseInitialized) return readLocalPlcLogs();

  try {
    // Document-ID range query bounded by the shared prefix, so this reads only
    // the PLC log documents and not the large packed array documents that
    // share the system_db collection.  is the conventional high sentinel
    // for Firestore prefix queries -- it sorts after any realistic id suffix.
    const snap = await getDocs(query(
      collection(db, 'system_db'),
      where(documentId(), '>=', PLC_DOC_PREFIX),
      where(documentId(), '<=', `${PLC_DOC_PREFIX}`)
    ));
    let logs = snap.docs.map(d => d.data());
    try {
      logs = await migrateInlinePlcImages(logs);
    } catch (e) {
      // Non-fatal: the photos are still readable inline, the read just
      // stays heavy. Retried on the next load.
      console.warn('Could not move inline PLC photos:', e);
    }
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return logs;
  } catch (e) {
    console.warn('Failed to load PLC logs from Firestore, using local cache:', e);
    return readLocalPlcLogs();
  }
};

// Guards a single log document against Firestore's 1 MiB per-document limit.
const assertPlcLogFits = (log) => {
  const size = byteSizeOf(log);
  if (size > MAX_DOC_BYTES) {
    throw new Error(
      `บันทึก PLC นี้มีขนาดใหญ่เกินไป (${(size / 1024).toFixed(0)}KB จากสูงสุด ${(MAX_DOC_BYTES / 1024).toFixed(0)}KB) ` +
      `กรุณาลดจำนวนรูปภาพลงแล้วบันทึกใหม่อีกครั้ง`
    );
  }
};

export const addPlcLog = async (logData) => {
  const newLog = {
    id: `plc-${crypto.randomUUID()}`,
    submittedAt: new Date().toISOString(),
    ...logData
  };

  if (!isFirebaseInitialized) {
    const logs = [...readLocalPlcLogs(), newLog];
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return newLog;
  }

  try {
    // Photos go to their own document; the log keeps only the count.
    const { images = [], ...rest } = newLog;
    const storedLog = { ...rest, imageCount: images.length };
    await writePlcLogImages(newLog.id, images);
    assertPlcLogFits(storedLog);
    await setDoc(doc(db, 'system_db', plcDocId(newLog.id)), storedLog);

    const logs = [...(dbCache.plcLogs || readLocalPlcLogs()), storedLog];
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return storedLog;
  } catch (e) {
    console.error('Failed to add PLC log:', e);
    return null;
  }
};

export const updatePlcLog = async (logId, updatedFields) => {
  const applyLocally = (logs) =>
    logs.map(log => {
      if (log.id !== logId) return log;
      const next = { ...log, ...updatedFields, updatedAt: new Date().toISOString() };
      if (!isFirebaseInitialized) return next;
      // Online, the cached list mirrors what is stored: counts, not photos.
      const { images, ...rest } = next;
      return 'images' in updatedFields
        ? { ...rest, imageCount: (images || []).length }
        : rest;
    });

  if (!isFirebaseInitialized) {
    const logs = applyLocally(readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  }

  try {
    const ref = doc(db, 'system_db', plcDocId(logId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;

    const merged = { ...snap.data(), ...updatedFields, updatedAt: new Date().toISOString() };
    // Photos live in their own document -- write them there and keep only
    // the count on the log itself. An update that doesn't mention images
    // leaves the stored photos alone.
    const { images, ...rest } = merged;
    let updated = rest;
    if ('images' in updatedFields) {
      const list = images || [];
      await writePlcLogImages(logId, list);
      updated = { ...rest, imageCount: list.length };
    }
    assertPlcLogFits(updated);
    await setDoc(ref, updated);

    const logs = applyLocally(dbCache.plcLogs || readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  } catch (e) {
    console.error('Failed to update PLC log:', e);
    return false;
  }
};

export const deletePlcLog = async (logId) => {
  const removeLocally = (logs) => logs.filter(log => log.id !== logId);

  if (!isFirebaseInitialized) {
    const logs = removeLocally(readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  }

  try {
    await deleteDoc(doc(db, 'system_db', plcDocId(logId)));
    try {
      await writePlcLogImages(logId, []);
    } catch (e) {
      console.warn('PLC log deleted but its photos could not be removed:', e);
    }
    const logs = removeLocally(dbCache.plcLogs || readLocalPlcLogs());
    dbCache.plcLogs = logs;
    cachePlcLogsLocally(logs);
    return true;
  } catch (e) {
    console.error('Failed to delete PLC log:', e);
    return false;
  }
};

export const updateTeacherPlcGroup = async (teacherId, plcGroup) => {
  const { success } = await mutateCollection('teachers', (list) =>
    list.map(t => (t.id === teacherId ? { ...t, plcGroup } : t))
  );
  return success;
};
