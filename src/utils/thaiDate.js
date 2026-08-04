// Thai (Buddhist-era) date formatting helpers.
//
// Dates throughout the app are stored as ISO strings (YYYY-MM-DD). These
// helpers convert them into Thai-language display strings. Both functions
// are defensive against invalid/unparseable input: instead of ever
// rendering "NaN" or "undefined", they fall back to returning the original
// (raw) string unchanged, or an empty string when there is nothing to show.

const MONTHS_SHORT_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const MONTHS_FULL_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Parses a "YYYY-MM-DD" string into its Thai-era parts. Returns null if the
// string can't be safely parsed (wrong shape or non-numeric parts).
function parseIsoDateToThaiParts(dateStr) {
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;

  const yearTh = parseInt(parts[0], 10) + 543;
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (
    Number.isNaN(yearTh) ||
    Number.isNaN(monthIndex) ||
    Number.isNaN(day) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  return { yearTh, monthIndex, day };
}

// Short format, e.g. "17 มิ.ย. 2569"
export function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const parsed = parseIsoDateToThaiParts(dateStr);
  if (!parsed) return dateStr;
  return `${parsed.day} ${MONTHS_SHORT_TH[parsed.monthIndex]} ${parsed.yearTh}`;
}

// Full format, e.g. "วันที่ 17 มิถุนายน พ.ศ. 2569"
export function formatThaiDateFull(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const parsed = parseIsoDateToThaiParts(dateStr);
  if (!parsed) return dateStr;
  return `วันที่ ${parsed.day} ${MONTHS_FULL_TH[parsed.monthIndex]} พ.ศ. ${parsed.yearTh}`;
}
