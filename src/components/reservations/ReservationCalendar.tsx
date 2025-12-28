import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reservation } from "@/lib/reservations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ReservationCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  reservations: Reservation[];
}

export function ReservationCalendar({
  selectedDate,
  onDateSelect,
  reservations
}: ReservationCalendarProps) {
  const reservationDates = reservations.reduce((acc, res) => {
    const date = res.reservation_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(res);
    return acc;
  }, {} as Record<string, Reservation[]>);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          locale={es}
          className={cn("p-0 pointer-events-auto")}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
          }}
        />
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
