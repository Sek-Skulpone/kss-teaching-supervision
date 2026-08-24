// Calendar dates in this app are plain YYYY-MM-DD strings representing a
// LOCAL calendar day (a supervision on "2026-08-24" means the 24th in
// Thailand, not an instant in time).
//
// Calling toISOString() on a Date converts to UTC first, so in Thailand
// (UTC+7) it reports the previous day for any local time before 07:00 --
// and for a Date built as local midnight it is ALWAYS off by one. Both
// mistakes were present in the codebase and produced wrong calendar cells
// and a "today" that lagged until 07:00 each morning.
//
// Always go through these helpers instead of toISOString() directly.

/** YYYY-MM-DD for the local calendar day the given Date falls on. */
export const toLocalDateString = (dateObj) => {
  const offsetMs = dateObj.getTimezoneOffset() * 60 * 1000;
  return new Date(dateObj.getTime() - offsetMs).toISOString().split('T')[0];
};

/** YYYY-MM-DD for today, in the viewer's local timezone. */
export const todayDateString = () => toLocalDateString(new Date());
