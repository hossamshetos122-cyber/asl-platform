export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // آ أ إ -> ا
    .replace(/\u0629/g, "\u0647") // ة -> ه
    .replace(/\u0649/g, "\u064A") // ى -> ي
    .replace(/[\u064B-\u0652\u0640]/g, ""); // حذف التشكيل والتطويل
}
