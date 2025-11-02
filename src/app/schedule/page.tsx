
"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { CalendarView } from "@/components/dashboard/calendar-view";
import type { Task, Appointment } from "@/lib/types";
import { isSameDay } from "date-fns";

export default function SchedulePage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isClient, setIsClient] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  const loadData = () => {
    try {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
      const storedAppointments = localStorage.getItem("appointments");
      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments).map((appt: Appointment) => ({
          ...appt,
          startTime: new Date(appt.startTime),
          endTime: new Date(appt.endTime),
        }));
        setAppointments(parsedAppointments);
      }
    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
  };

  React.useEffect(() => {
    setIsClient(true);
    loadData();
  }, []);

  React.useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const tasksAsAppointments: Appointment[] = React.useMemo(() => tasks
    .filter(task => {
        if (!task.deadline || !selectedDate) return false;
        const taskDate = new Date(task.deadline);
        // Exclude tasks that are at midnight (likely no time set)
        if (taskDate.getHours() === 0 && taskDate.getMinutes() === 0 && taskDate.getSeconds() === 0) {
            return false;
        }
        return isSameDay(taskDate, selectedDate);
    })
    .map(task => {
      const startTime = new Date(task.deadline!);
      const duration = task.duration || 60;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      return {
        id: task.id,
        name: task.name,
        startTime: startTime,
        endTime: endTime,
        isTask: true,
      };
    }), [tasks, selectedDate]);

  const allAppointmentsForSelectedDay = React.useMemo(() => {
    const dayAppointments = appointments.filter(
      (appt) => selectedDate && isSameDay(appt.startTime, selectedDate)
    );
    return [...dayAppointments, ...tasksAsAppointments];
  }, [appointments, tasksAsAppointments, selectedDate]);


  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <CalendarView 
              appointments={allAppointmentsForSelectedDay} 
              initialDate={selectedDate}
              onDateChange={handleDateChange}
            />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
