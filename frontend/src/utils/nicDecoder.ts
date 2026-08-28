/**
 * Sri Lankan Department of Registration of Persons (DRP) NIC Decoder
 * Decodes Birthday (YYYY-MM-DD) and Gender from 10-digit (old) and 12-digit (new) NICs.
 */
export function decodeNicToBirthdayAndGender(nic: string): { birthday: string; gender: "Male" | "Female" } | null {
  const raw = (nic || "").trim().toUpperCase();
  let birthYear: number | null = null;
  let dayOfYear: number | null = null;

  // Old format: 9 digits + V/X (e.g. 981234567V)
  if (raw.length === 10 && /^\d{9}[VX]$/.test(raw)) {
    birthYear = 1900 + parseInt(raw.slice(0, 2), 10);
    dayOfYear = parseInt(raw.slice(2, 5), 10);
  } 
  // New format: 12 digits (e.g. 199812345678 or 200321513168)
  else if (raw.length === 12 && /^\d{12}$/.test(raw)) {
    birthYear = parseInt(raw.slice(0, 4), 10);
    dayOfYear = parseInt(raw.slice(4, 7), 10);
  }

  if (!birthYear || !dayOfYear || isNaN(birthYear) || isNaN(dayOfYear)) {
    return null;
  }

  let gender: "Male" | "Female" = "Male";
  if (dayOfYear > 500) {
    gender = "Female";
    dayOfYear -= 500;
  }

  // DRP Standard: February is always treated as 29 days
  const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 0;
  let remainingDays = dayOfYear;

  while (month < 12 && remainingDays > monthDays[month]) {
    remainingDays -= monthDays[month];
    month++;
  }

  // Guard against invalid day of year (> 366)
  if (month >= 12 || remainingDays <= 0) {
    remainingDays = Math.min(Math.max(remainingDays, 1), 28);
    month = Math.min(month, 11);
  }

  const mm = String(month + 1).padStart(2, "0");
  const dd = String(remainingDays).padStart(2, "0");

  return {
    birthday: `${birthYear}-${mm}-${dd}`,
    gender,
  };
}
