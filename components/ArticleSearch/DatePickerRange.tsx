
import * as React from "react"
import {  format } from "date-fns"
import { CalendarRange as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { subDays } from "date-fns"
import { useState } from "react"


interface Props {
    date:DateRange | undefined;
    setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
    className?:string | undefined;
}
        
export function DatePickerWithRange(props:Props ) {

  const {className, date, setDate } = props;
  const [isOpenCalendar ,setIsOpenCalendar] = useState(false)

  const setDateRangeOnOpenCalendar = () => {
    !date &&
    setDate({
        from: subDays(new Date(), 20),
        to: new Date(),
      })
  }     

  return (
    <div className={cn("grid sm:ml-2 mr-2", className)} >
      <Popover onOpenChange={()=>setDateRangeOnOpenCalendar()} open={isOpenCalendar}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size={'icon'}
            onMouseOver={()=>setIsOpenCalendar(true)}
            className={cn("text-left font-normal bg-transparent border-2 hover:bg-transparent h-8 w-8",)}>
            <CalendarIcon className="text-white w-11 "   />
          </Button>

        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start" onInteractOutside={()=>setIsOpenCalendar(false)}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        <div className="text-center m-2">
        {date?.from && date?.to ? (
            <>
              {format(date.from, "LLL dd, y")} -{" "}
              {format(date.to, "LLL dd, y")}
            </>) 
            : date?.from ? (
              <>
                {format(date.from, "LLL dd, y")} {" "}
                Up to....
              </>
            ) : <>Enter date range...</>
            }
        </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}


