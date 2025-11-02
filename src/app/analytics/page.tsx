
"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Task } from "@/lib/types";
import { format, subDays, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const chartConfigCompleted = {
  tasks: {
    label: "Tareas Completadas",
    color: "hsl(var(--primary))",
  },
};

const chartConfigPriority = {
    count: {
        label: "Nº de Tareas",
    },
    high: { label: "Alta", color: "hsl(var(--destructive))" },
    medium: { label: "Media", color: "hsl(var(--accent))" },
    low: { label: "Baja", color: "hsl(var(--primary))" },
};

export default function AnalyticsPage() {
    const [tasks, setTasks] = React.useState<Task[]>([]);

    React.useEffect(() => {
        try {
            const storedTasks = localStorage.getItem("tasks");
            if (storedTasks) {
                const parsedTasks: Task[] = JSON.parse(storedTasks);
                setTasks(parsedTasks);
            }
        } catch (error) {
            console.error("Error loading tasks from localStorage", error);
        }
    }, []);

    const completedTasksChartData = React.useMemo(() => {
        const today = startOfDay(new Date());
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, i)).reverse();
        
        return last7Days.map(day => {
            const completedOnDay = tasks.filter(task => {
                if (task.status !== 'done' || !task.deadline) return false;
                const taskDate = startOfDay(new Date(task.deadline));
                return isWithinInterval(taskDate, { start: day, end: day });
            });
            return {
                day: format(day, 'eee', { locale: es }),
                tasks: completedOnDay.length,
            };
        });
    }, [tasks]);

    const priorityDistributionData = React.useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, { high: 0, medium: 0, low: 0 });

        return [
            { priority: "Alta", count: counts.high, fill: "var(--color-high)" },
            { priority: "Media", count: counts.medium, fill: "var(--color-medium)" },
            { priority: "Baja", count: counts.low, fill: "var(--color-low)" },
        ];
    }, [tasks]);


  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                    <CardTitle>Tareas Completadas por Día</CardTitle>
                    <CardDescription>Un resumen de las tareas completadas durante la última semana.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <ChartContainer config={chartConfigCompleted} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={completedTasksChartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle>Distribución de Prioridad de Tareas</CardTitle>
                    <CardDescription>Cómo se distribuyen tus tareas por nivel de prioridad.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <ChartContainer config={chartConfigPriority} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer layout="vertical" data={priorityDistributionData} margin={{ left: 10 }}>
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="priority"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="count" layout="vertical" radius={4} />
                        </BarChart>
                    </ChartContainer>
                    </CardContent>
                </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
