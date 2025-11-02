
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrainCircuit, CheckCircle } from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  setHours,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

type CalendarViewProps = {
  appointments: Appointment[];
  initialDate?: Date;
  onDateChange: (date: Date) => void;
};

const HOUR_HEIGHT = 60; // in pixels for 60 minutes

const timeToPosition = (date: Date, startHour: number) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return (hours - startHour + minutes / 60) * HOUR_HEIGHT;
};

const durationToHeight = (start: Date, end: Date) => {
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return (durationMinutes / 60) * HOUR_HEIGHT;
};

const DaySelector = ({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) => {
  const weekStartsOn = 1; // Monday
  const today = new Date();
  const week = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWeek(today, { weekStartsOn }), i)
  );

  return (
    <div className="flex justify-center md:justify-start items-center mb-4">
      <div className="flex flex-wrap justify-center gap-1 bg-muted p-1 rounded-md">
        {week.map((day) => (
          <Button
            key={day.toString()}
            variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
            size="sm"
            onClick={() => onDateChange(day)}
            className={cn("flex flex-col h-auto px-2 py-1.5", 
              isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
              isToday(day) && !isSameDay(day, selectedDate) && "bg-accent/50",
            )}
          >
            <span className="text-xs capitalize">
              {format(day, "eee", { locale: es })}
            </span>
            <span className="font-bold text-base">{format(day, "d")}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export function CalendarView({
  appointments,
  initialDate = new Date(),
  onDateChange,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  const startHour = useMemo(() => {
    if (!isClient) return 0; // Default for SSR
    if (isToday(selectedDate)) {
      return new Date().getHours();
    }
    return 0; // Start from midnight for other days
  }, [selectedDate, isClient]);

  const hours = useMemo(() => {
    if (!isClient) return []; // Default for SSR
    if (isToday(selectedDate)) {
      const currentHour = new Date().getHours();
      return Array.from({ length: 24 - currentHour }, (_, i) => i + currentHour);
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [selectedDate, isClient]);
  
  useEffect(() => {
    if (containerRef.current && isClient) {
      if (isToday(selectedDate)) {
        // Scroll to current time
        containerRef.current.scrollTop = 0; // It will start from current hour, so no need to scroll
      } else {
        // Scroll to top for other days
        containerRef.current.scrollTop = 0;
      }
    }
  }, [selectedDate, hours, isClient, startHour]);


  const filteredAppointments = useMemo(() => 
    appointments.filter((appt) =>
      isSameDay(appt.startTime, selectedDate)
    ), [appointments, selectedDate]);
  
  if (!isClient) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Horario del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] flex items-center justify-center">
            <p>Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Horario del {format(selectedDate, "d 'de' MMMM", {locale: es})}</CardTitle>
        <DaySelector
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
      </CardHeader>
      <Separator />
      <CardContent className="pr-4 md:pr-10 flex-grow">
        <div ref={containerRef} className="relative overflow-y-auto" style={{ height: '420px' }}>
          {/* Hour markers and lines */}
          <div className="relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] flex text-xs text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                <div className={cn("w-10 text-right pr-2", hour === 0 || (isToday(selectedDate) && hour === new Date().getHours()) ? "pt-0" : "-translate-y-2")}>
                  {format(setHours(new Date(), hour), 'h a')}
                </div>
                <div className="flex-1 border-t border-dashed"></div>
              </div>
            ))}
          </div>

          {/* Appointments and Tasks */}
          {filteredAppointments.map((appt) => {
            const top = timeToPosition(appt.startTime, startHour);
            if (top < 0 && isToday(selectedDate)) return null; // Don't render appointments that have already passed today
            const height = durationToHeight(appt.startTime, appt.endTime);
            return (
              <div
                key={appt.id}
                className={cn(
                  "absolute left-12 right-0 rounded-lg p-2 shadow-sm flex flex-col justify-start",
                  appt.isSuggestion
                    ? "bg-accent/20 border-l-4 border-accent text-accent-foreground"
                    : appt.isTask 
                      ? "bg-primary/20 border-l-4 border-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground"
                )}
                style={{ top: `${top}px`, height: `${Math.max(height, 30)}px` }}
              >
                <p className="font-semibold text-sm flex items-center gap-2">
                  {appt.isSuggestion && <BrainCircuit className="w-4 h-4 text-accent" />}
                  {appt.isTask && <CheckCircle className="w-4 h-4 text-primary" />}
                  {appt.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(appt.startTime, 'p', {locale: es})} - {format(appt.endTime, 'p', {locale: es})}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
