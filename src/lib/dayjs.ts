import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import "dayjs/locale/zh-cn";

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// 设置默认语言为中文
dayjs.locale("zh-cn");

// 获取浏览器默认时区
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// 获取当前时间（指定时区）
export function nowInTimezone(tz?: string): dayjs.Dayjs {
  const timezone = tz || getBrowserTimezone();
  return dayjs().tz(timezone);
}

// 将时间戳解析为指定时区的时间
export function parseInTimezone(ts: number | string, tz?: string): dayjs.Dayjs {
  const timezone = tz || getBrowserTimezone();
  return dayjs(ts).tz(timezone);
}

// 判断是否是今天（指定时区）
export function isTodayInTz(ts: number, tz?: string): boolean {
  const now = nowInTimezone(tz);
  const target = parseInTimezone(ts, tz);
  return target.isSame(now, "day");
}

// 判断是否是明天（指定时区）
export function isTomorrowInTz(ts: number, tz?: string): boolean {
  const now = nowInTimezone(tz);
  const target = parseInTimezone(ts, tz);
  return target.isSame(now.add(1, "day"), "day");
}

// 判断是否是本周内（指定时区，从周一开始）
export function isThisWeekInTz(ts: number, tz?: string): boolean {
  const now = nowInTimezone(tz);
  const target = parseInTimezone(ts, tz);
  const weekStart = now.startOf("week");
  const weekEnd = now.endOf("week");
  return target.isSameOrAfter(weekStart, "day") && target.isSameOrBefore(weekEnd, "day");
}

// 判断是否已过期（指定时区）
export function isOverdueInTz(ts: number, tz?: string): boolean {
  const now = nowInTimezone(tz);
  const target = parseInTimezone(ts, tz);
  return target.isBefore(now, "day");
}

// 格式化日期显示
export function formatDateInTz(ts: number, tz?: string, format = "M月D日"): string {
  return parseInTimezone(ts, tz).format(format);
}

// 获取日期显示标签（今天、明天、周几、日期）
export function getDateLabel(ts: number, tz?: string): string {
  if (isTodayInTz(ts, tz)) return "今天";
  if (isTomorrowInTz(ts, tz)) return "明天";
  if (isThisWeekInTz(ts, tz)) return parseInTimezone(ts, tz).format("ddd");
  return formatDateInTz(ts, tz);
}

export default dayjs;
