
"use client";

import * as React from "react";
import { isSameDay } from 'date-fns';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import type { Task } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { TaskForm } from "@/components/dashboard/task-form";
import { DayTaskList } from "@/components/dashboard/day-task-list";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

/**
 * @page CalendarPage
 * @description Página que muestra un calendario para seleccionar fechas y una lista
 * de tareas asociadas al día seleccionado. Permite la gestión completa de tareas
 * para cualquier día del calendario.
 */
export default function CalendarPage() {
  /**
   * @state tasks - Almacena todas las tareas del usuario.
   * @type {Task[]}
   */
  const [tasks, setTasks] = React.useState<Task[]>([]);

  /**
   * @state isMounted - Flag para saber si el componente está montado en el cliente.
   * @type {boolean}
   */
  const [isMounted, setIsMounted] = React.useState(false);

  /**
   * @state selectedDate - La fecha actualmente seleccionada en el calendario.
   * @type {Date | undefined}
   */
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  /**
   * @state isFormOpen - Controla la visibilidad del formulario para añadir/editar tareas.
   * @type {boolean}
   */
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  /**
   * @state editingTask - Almacena la tarea que se está editando actualmente. Si es `null`, el formulario es para una nueva tarea.
   * @type {Task | null}
   */
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  /**
   * @effect
   * Se ejecuta al montar el componente. Carga las tareas desde `localStorage`.
   */
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
  }, []);

  /**
   * @effect
   * Persiste las tareas en `localStorage` cada vez que el estado `tasks` cambia.
   */
  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  }, [tasks, isMounted]);
  
  /**
   * @handler handleOpenForm
   * @description Abre el formulario de tareas. Si se pasa una tarea, la prepara para edición.
   * @param {Task | null} task - La tarea a editar, o `null` para crear una nueva.
   */
  const handleOpenForm = (task: Task | null = null) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  /**
   * @handler handleUpdateTask
   * @description Maneja la actualización de una tarea. Si solo cambia el estado (p.ej., marcar como completada),
   * lo hace directamente. Si no, abre el formulario para una edición completa.
   * @param {Task} updatedTask - La tarea con los datos a actualizar.
   */
  const handleUpdateTask = (updatedTask: Task) => {
    const originalTask = tasks.find(t => t.id === updatedTask.id);
    // Actualización directa de estado (checkbox)
    if (originalTask && originalTask.status !== updatedTask.status && updatedTask.status) {
        setTasks(prev => prev.map(t => (t.id === updatedTask.id ? { ...t, status: updatedTask.status } : t)));
    } else {
        // Para otras ediciones, abrir el formulario completo
        handleOpenForm(updatedTask);
    }
  };

  /**
   * @handler handleDayClick
   * @description Actualiza el estado `selectedDate` cuando el usuario hace clic en un día del calendario.
   * @param {Date} day - El día seleccionado.
   */
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  /**
   * @handler handleAddTaskToDate
   * @description Inicia el proceso de añadir una nueva tarea para un día específico.
   * @param {Date | undefined} day - El día para el cual se añadirá la tarea.
   */
  const handleAddTaskToDate = (day: Date | undefined) => {
    if (!day) return;
    setSelectedDate(day);
    handleOpenForm(null);
  };

  /**
   * @handler handleFormSubmit
   * @description Gestiona el envío del formulario, ya sea para crear o actualizar una tarea.
   * @param {Omit<Task, 'id' | 'status'> | Task} data - Los datos de la tarea del formulario.
   */
  const handleFormSubmit = (data: Omit<Task, 'id' | 'status'> | Task) => {
    if ('id' in data) {
      // Actualiza una tarea existente
      const updatedTask = data as Task;
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } else {
      // Crea una nueva tarea
      const deadline = data.deadline ? new Date(data.deadline) : selectedDate || new Date();
      const newTask: Task = {
        ...data,
        id: crypto.randomUUID(),
        status: 'todo',
        deadline: deadline.toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
    }
    // Cierra el formulario y resetea el estado de edición
    setIsFormOpen(false);
    setEditingTask(null);
  };
  
  /**
   * @handler handleDeleteTask
   * @description Elimina una tarea de la lista.
   * @param {string} taskId - El ID de la tarea a eliminar.
   */
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  /**
   * @memo tasksForSelectedDay
   * @description Filtra y devuelve las tareas que corresponden al día seleccionado en el calendario.
   * Se memoiza para optimizar el rendimiento.
   * @returns {Task[]}
   */
  const tasksForSelectedDay = React.useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => task.deadline && isSameDay(new Date(task.deadline), selectedDate));
  }, [tasks, selectedDate]);

  /**
   * @handler onDragEnd
   * @description Se dispara al soltar una tarea después de arrastrarla para reordenar.
   * @param {DragEndEvent} event - El evento de arrastre.
   */
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      const oldIndex = tasks.findIndex(t => t.id === activeId);
      const newIndex = tasks.findIndex(t => t.id === overId);
      
      setTasks(arrayMove(tasks, oldIndex, newIndex));
    }
  };


  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex flex-col bg-background min-h-screen">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <div>
                <Card>
                  <CardContent className="p-0 md:p-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      onDayClick={handleDayClick}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="min-h-[400px]">
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={tasksForSelectedDay.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <DayTaskList 
                      selectedDate={selectedDate}
                      tasks={tasksForSelectedDay}
                      onAddTask={() => handleAddTaskToDate(selectedDate)}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <TaskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        task={editingTask}
      />
    </>
  );
}
