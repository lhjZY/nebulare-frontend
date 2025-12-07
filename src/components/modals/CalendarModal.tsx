import { useState, useEffect, useRef } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { zhCN } from 'date-fns/locale';
import dayjs from '@/lib/dayjs';
import type { DateRange } from 'react-day-picker';
import { Check, Clock, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
type CalendarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate?: number | string;
  dueDate?: number | string;
  onConfirm: (startDate?: number, dueDate?: number) => void;
  trigger?: React.ReactNode;
};

// 生成时间选项（00:00 - 24:00，半小时间隔）
const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});
const DEFAULT_TIMEZONE = 'Asia/Shanghai';

const getDefaultRangePreset = () => {
  const base = dayjs().tz(DEFAULT_TIMEZONE);
  return {
    today: base.startOf('day').toDate(),
    defaultStartTime: base.add(1, 'hour').startOf('hour').format('HH:mm'),
    defaultEndTime: base.add(2, 'hour').startOf('hour').format('HH:mm'),
  };
};

// 时间选择器组件
function TimeSelect({
  value,
  onChange,
  placeholder = '选择时间',
  leading,
  disabled = false,
}: {
  value?: string;
  onChange: (time?: string) => void;
  placeholder?: string;
  leading?: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (!value) {
      const nextHour = dayjs().tz(DEFAULT_TIMEZONE).add(1, 'hour').startOf('hour').format('HH:mm');
      const fallback = TIME_OPTIONS.includes(nextHour)
        ? nextHour
        : TIME_OPTIONS[TIME_OPTIONS.length - 1];
      onChange(fallback);
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!listRef.current) return;
      const target = listRef.current.querySelector<HTMLButtonElement>(`[data-time="${value}"]`);
      target?.scrollIntoView({ block: 'center' });
    });

    return () => cancelAnimationFrame(frame);
  }, [open, value, onChange]);

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors",
            disabled ? "bg-muted/60 text-muted-foreground cursor-not-allowed" : "bg-muted hover:bg-muted/80"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {leading}
            <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
              {value || placeholder}
            </span>
          </div>
          {value ? (
            <X
              className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(undefined);
                setOpen(false);
              }}
            />
          ) : (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                open ? "rotate-0" : "-rotate-90"
              )}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-0" align="end">
        <ScrollArea className="max-h-[220px]">
          <div className="p-1" ref={listRef}>
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                type="button"
                data-time={time}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  value === time && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  onChange(time);
                  setOpen(false);
                }}
              >
                {time}
                {value === time && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function CalendarModal({
  open,
  onOpenChange,
  startDate,
  dueDate,
  onConfirm,
  trigger,
}: CalendarModalProps) {
  // 当前选中的 tab
  const [activeTab, setActiveTab] = useState<'date' | 'timePeriod'>('date');

  // 日期模式的草稿状态（单选 startDate）
  const [draftSingleDate, setDraftSingleDate] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  // 日期模式的时间
  const [draftSingleTime, setDraftSingleTime] = useState<string | undefined>();

  // 时间段模式的草稿状态（范围选择 startDate 和 dueDate）
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    startDate || dueDate
      ? {
          from: startDate ? new Date(startDate) : undefined,
          to: dueDate ? new Date(dueDate) : undefined,
        }
      : undefined
  );
  // 时间段模式的时间
  const [draftStartTime, setDraftStartTime] = useState<string | undefined>();
  const [draftEndTime, setDraftEndTime] = useState<string | undefined>();
  const [rangeAllDay, setRangeAllDay] = useState(false);

  // 时间段模式的日期选择器状态
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  // 从时间戳提取时间字符串
  const extractTime = (timestamp?: number | string): string | undefined => {
    if (!timestamp) return undefined;
    const d = dayjs(timestamp).tz(DEFAULT_TIMEZONE);
    const h = d.hour();
    const m = d.minute();
    // 四舍五入到最近的半小时
    const roundedMinutes = m < 15 ? 0 : m < 45 ? 30 : 0;
    const roundedHours = m >= 45 ? h + 1 : h;
    return `${roundedHours.toString().padStart(2, '0')}:${roundedMinutes === 0 ? '00' : '30'}`;
  };

  // 弹窗打开时重置草稿状态
  useEffect(() => {
    if (open) {
      // 根据是否有 dueDate/startDate 决定默认 tab；都为空则默认日期 tab 且选中今天
      if (startDate && dueDate) {
        setActiveTab('timePeriod');
      } else {
        setActiveTab('date');
      }

      const { today, defaultStartTime, defaultEndTime } = getDefaultRangePreset();
      setDraftSingleDate(startDate ? new Date(startDate) : (!startDate && !dueDate ? today : undefined));
      setDraftSingleTime(extractTime(startDate));
      setDraftRange(
        startDate || dueDate
          ? {
              from: startDate ? new Date(startDate) : undefined,
              to: dueDate ? new Date(dueDate) : undefined,
            }
          : {
              from: today,
              to: today,
            }
      );
      const startTimeVal = startDate ? extractTime(startDate) : defaultStartTime;
      const endTimeVal = dueDate ? extractTime(dueDate) : defaultEndTime;
      const inferredAllDay = !startTimeVal && !endTimeVal && (!!startDate || !!dueDate);
      setRangeAllDay(inferredAllDay);
      setDraftStartTime(inferredAllDay ? undefined : startTimeVal);
      setDraftEndTime(inferredAllDay ? undefined : endTimeVal);
    }
  }, [open, startDate, dueDate]);

  // 合并日期和时间
  const combineDateTime = (date?: Date, time?: string): number | undefined => {
    if (!date) return undefined;
    const base = dayjs(date).tz(DEFAULT_TIMEZONE);
    if (!time) return base.valueOf();
    const [hours, minutes] = time.split(':').map(Number);
    const combined = base.hour(hours).minute(minutes).second(0).millisecond(0);
    return combined.valueOf();
  };

  const handleConfirm = () => {
    if (activeTab === 'date') {
      // 日期模式：只设置 startDate，清除 dueDate
      onConfirm(
        combineDateTime(draftSingleDate, draftSingleTime),
        undefined
      );
    } else {
      // 时间段模式：设置 startDate 和 dueDate
      onConfirm(
        combineDateTime(draftRange?.from, draftStartTime),
        combineDateTime(draftRange?.to, draftEndTime)
      );
    }
    onOpenChange(false);
  };

  const handleClear = () => {
    if (activeTab === 'date') {
      setDraftSingleDate(undefined);
      setDraftSingleTime(undefined);
    } else {
      setDraftRange(undefined);
      setDraftStartTime(undefined);
      setDraftEndTime(undefined);
      setRangeAllDay(false);
    }
    onConfirm(undefined, undefined);
    onOpenChange(false);
  };

  // 格式化显示日期
  const formatDisplayDate = (date?: Date) => {
    if (!date) return '选择日期';
    return dayjs(date).tz(DEFAULT_TIMEZONE).format('YY/M/D');
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent className="w-[300px] p-2" side="top" align="start">
        <Tabs
          defaultValue="date"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'date' | 'timePeriod')}
        >
          <TabsList className="w-full rounded-none rounded-t-lg">
            <TabsTrigger value="date" className="flex-1">
              日期
            </TabsTrigger>
            <TabsTrigger value="timePeriod" className="flex-1">
              时间段
            </TabsTrigger>
          </TabsList>
          <div>
            <TabsContent value="date" className="mt-0 p-2">
              <Calendar
                locale={zhCN}
                mode="single"
                selected={draftSingleDate}
                onSelect={(date) => setDraftSingleDate(date ?? undefined)}
                formatters={{
                  formatMonthDropdown: (date) => dayjs(date).format('MMM'),
                }}
              />
              <div className="mt-2">
                <TimeSelect
                  value={draftSingleTime}
                  onChange={setDraftSingleTime}
                  placeholder="--:--"
                  leading={
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">时间</span>
                    </>
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="timePeriod" className="mt-0 p-2">
              {/* 开始日期时间 */}
              <div className="mb-3 flex items-center gap-2">
                <span className="w-8 shrink-0 text-sm text-muted-foreground">开始</span>
                <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-background px-2 text-sm hover:bg-accent"
                    >
                      {formatDisplayDate(draftRange?.from)}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={zhCN}
                      mode="single"
                      selected={draftRange?.from}
                      onSelect={(date) => {
                        setDraftRange((prev) => ({ from: date ?? undefined, to: prev?.to }));
                        setStartDatePickerOpen(false);
                      }}
                      formatters={{
                        formatMonthDropdown: (date) => dayjs(date).format('MMM'),
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex-1 shrink-0">
                  <TimeSelect
                    value={draftStartTime}
                    onChange={setDraftStartTime}
                    placeholder="--:--"
                    disabled={rangeAllDay}
                  />
                </div>
              </div>
              {/* 结束日期时间 */}
              <div className="mb-3 flex items-center gap-2">
                <span className="w-8 shrink-0 text-sm text-muted-foreground">结束</span>
                <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-md border border-input bg-background px-2 text-sm hover:bg-accent"
                    >
                      {formatDisplayDate(draftRange?.to)}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={zhCN}
                      mode="single"
                      selected={draftRange?.to}
                      onSelect={(date) => {
                        setDraftRange((prev) => ({ from: prev?.from, to: date ?? undefined }));
                        setEndDatePickerOpen(false);
                      }}
                      formatters={{
                        formatMonthDropdown: (date) => dayjs(date).format('MMM'),
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex-1 shrink-0">
                  <TimeSelect
                    value={draftEndTime}
                    onChange={setDraftEndTime}
                    placeholder="--:--"
                    disabled={rangeAllDay}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">全天</span>
                <Checkbox
                  checked={rangeAllDay}
                  onCheckedChange={(checked) => {
                    const on = Boolean(checked);
                    setRangeAllDay(on);
                    if (on) {
                      setDraftStartTime(undefined);
                      setDraftEndTime(undefined);
                    } else {
                      const { defaultStartTime, defaultEndTime } = getDefaultRangePreset();
                      setDraftStartTime((prev) => prev ?? defaultStartTime);
                      setDraftEndTime((prev) => prev ?? defaultEndTime);
                    }
                  }}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex items-center gap-2 border-t p-3">
          <Button variant="ghost" onClick={handleClear} className="flex-1">
            清除
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
