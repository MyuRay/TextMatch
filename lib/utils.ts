// lib/utils.ts

// classNameの結合ユーティリティ
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// 日付フォーマット関数
export function formatDate(date: any) {
  // Firestore の Timestamp 対応
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(dateObj.getTime())) return "不明";

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}
