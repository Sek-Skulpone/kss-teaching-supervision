// Supervisions live in ONE packed array document, which is what caps them:
// every booking, evaluation and post-teaching record in the school shares a
// single 900KB budget, and nothing is ever removed. Measured on live data
// that is ~5KB per record, so a year of 33 teachers adds ~165KB and the
// document fills up -- and refuses every save -- within a few years.
//
// So finished academic years are moved out into one document per year,
// `system_db/supervisions_<year>`, leaving the working document holding the
// current year only. Reads merge them back, so the rest of the app still
// sees the single list it has always seen, and the ceiling now applies to
// one year at a time instead of to the school's whole history.
//
// These are the pure parts of that split, kept here so they can be tested
// without Firestore.

export const supervisionShardId = (academicYear) => `supervisions_${academicYear}`;

// Records in the working document that belong to a finished academic year,
// grouped by year. Records with no `academicYear` stay put: everywhere else
// in the app a missing year is read as the current one.
export const supervisionsToArchive = (list, currentAcademicYear) => {
  const byYear = {};
  if (!currentAcademicYear) return byYear;

  list.forEach(record => {
    const year = record.academicYear;
    if (!year || year === currentAcademicYear) return;
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(record);
  });
  return byYear;
};

// Splits an updated list back into the documents its records came from, so a
// write only touches the shard it belongs to. `shardOfId` maps a record id to
// the archived year holding it; anything it doesn't know -- brand new
// records included -- belongs to the working document.
export const regroupSupervisions = (list, shardOfId) => {
  const working = [];
  const byYear = {};

  list.forEach(record => {
    const year = shardOfId.get(record.id);
    if (!year) {
      working.push(record);
      return;
    }
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(record);
  });
  return { working, byYear };
};

// Merges records into an existing archive shard, with the incoming copy
// winning, and keeps the shard's original ordering stable.
export const mergeIntoShard = (existing, incoming) => {
  const byId = new Map(existing.map(record => [record.id, record]));
  incoming.forEach(record => byId.set(record.id, record));
  return Array.from(byId.values());
};
