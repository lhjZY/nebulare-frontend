"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { zhCN } from "date-fns/locale"
import { getDateLabel } from "@/lib/dayjs"
import dayjs from "@/lib/dayjs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: number
  onChange: (value: number | undefined) => void
  triggerClassName?: string
  onConfirm?: () => void
}

export function DatePicker({ value, onChange, triggerClassName, onConfirm }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [draftDate, setDraftDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  React.useEffect(() => {
    if (open) {
      setDraftDate(value ? new Date(value) : undefined)
    }
  }, [open, value])

  const selectedDate = draftDate ?? (value ? new Date(value) : undefined)

  const renderDateLabel = (date: Date) => {
    return getDateLabel(date.getTime())
  }

  const handleConfirm = () => {
    onChange(draftDate ? draftDate.getTime() : undefined)
    setOpen(false)
    onConfirm?.()
  }

  const handleClear = () => {
    setDraftDate(undefined)
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          data-empty={!selectedDate}
          className={cn(
            "data-[empty=true]:text-muted-foreground h-9 justify-end text-right font-normal border-0 bg-transparent",
            triggerClassName
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {selectedDate ? (
            renderDateLabel(selectedDate)
          ) : (
            ''
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          locale={zhCN}
          mode="single"
          selected={selectedDate}
          onSelect={(date) => setDraftDate(date ?? undefined)}
          formatters={{
            formatMonthDropdown: (date) => dayjs(date).format("MMM"),
          }}
        />
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
  )
}
