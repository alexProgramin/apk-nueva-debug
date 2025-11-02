
"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { TaskList } from "@/components/dashboard/task-list";
import type { Task } from "@/lib/types";
import { AIPrioritizer } from "@/components/dashboard/ai-prioritizer";
import { isSameDay, startOfToday } from 'date-fns';
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

/**
 * @page DashboardPage
 * @description La página principal de la aplicación, que muestra el "Dashboard" o panel de control.
 * Se centra en mostrar las tareas del día actual y permite su gestión completa (crear,
 * actualizar, eliminar, reordenar) y priorización mediante IA.
 */
export default function DashboardPage() {
  /**
   * @state allTasks - Almacena todas las tareas del usuario.
   * @type {Task[]}
   */
  const [allTasks, setAllTasks] = React.useState<Task[]>([]);

  /**
   * @state isMounted - Un flag para controlar si el componente ya se ha montado en el cliente.
   * Esto es crucial para evitar errores de hidratación y acceder a APIs del navegador como localStorage.
   * @type {boolean}
   */
  const [isMounted, setIsMounted] = React.useState(false);

  /**
   * @effect
   * Se ejecuta una sola vez cuando el componente se monta.
   * 1. Establece `isMounted` a `true`.
   * 2. Carga las tareas desde `localStorage` si existen.
   */
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setAllTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
  }, []);

  // Debug: Log when component mounts and unmounts
  React.useEffect(() => {
    console.log("DashboardPage mounted");
    return () => {
      console.log("DashboardPage unmounting");
    };
  }, []);

  /**
   * @effect
   * Se ejecuta cada vez que el estado `allTasks` cambia (y una vez que `isMounted` es `true`).
   * Guarda el estado actual de las tareas en `localStorage` para persistir los datos.
   */
  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem("tasks", JSON.stringify(allTasks));
    }
  }, [allTasks, isMounted]);
  
  /**
   * @memo todayTasks
   * Filtra `allTasks` para obtener solo las tareas que corresponden al día de hoy.
   * Se memoiza para evitar recálculos innecesarios en cada renderizado.
   * Una tarea se considera "de hoy" si no tiene fecha límite o si su fecha límite es hoy.
   * @returns {Task[]}
   */
  const todayTasks = React.useMemo(() => {
    if (!isMounted) return [];
    const today = startOfToday();
    return allTasks.filter(task => 
      !task.deadline || isSameDay(new Date(task.deadline), today)
    );
  }, [allTasks, isMounted]);

  /**
   * @handler handleAddTask
   * @description Añade una nueva tarea a la lista `allTasks`.
   * Asigna un ID único y un estado inicial 'todo'. Si no se especifica una fecha límite,
   * se le asigna la fecha y hora actual.
   * @param {Omit<Task, 'id' | 'status'>} newTask - Los datos de la nueva tarea desde el formulario.
   */
  const handleAddTask = (newTask: Omit<Task, 'id' | 'status'>) => {
    const deadline = newTask.deadline ? new Date(newTask.deadline).toISOString() : new Date().toISOString();
    setAllTasks(prev => [...prev, { ...newTask, id: crypto.randomUUID(), status: 'todo', deadline: deadline?.toString() }]);
  };

  /**
   * @handler handleUpdateTask
   * @description Actualiza una tarea existente en la lista `allTasks`.
   * @param {Task} updatedTask - La tarea con los datos actualizados.
   */
  const handleUpdateTask = (updatedTask: Task) => {
    setAllTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };
  
  /**
   * @handler handleDeleteTask
   * @description Elimina una tarea de la lista `allTasks` por su ID.
   * @param {string} taskId - El ID de la tarea a eliminar.
   */
  const handleDeleteTask = (taskId: string) => {
    setAllTasks(prev => prev.filter(task => task.id !== taskId));
  };

  /**
   * @handler handleApplyPriority
   * @description Aplica el orden de prioridad sugerido por la IA a las tareas de hoy.
   * Mantiene las tareas de otros días en su posición.
   * @param {Array<{ name: string; priority: number }>} prioritizedTasks - La lista de tareas con su nueva prioridad numérica.
   */
  const handleApplyPriority = (prioritizedTasks: { name: string; priority: number }[]) => {
    const priorityMap = new Map(prioritizedTasks.map(p => [p.name, p.priority]));
    
    setAllTasks(currentTasks => {
      const today = startOfToday();
      // Filtra las tareas de hoy que necesitan ser reordenadas
      const currentTodayTasks = currentTasks.filter(task => !task.deadline || isSameDay(new Date(task.deadline), today));
      // Separa las tareas que no son de hoy
      const otherTasks = currentTasks.filter(task => task.deadline && !isSameDay(new Date(task.deadline), today));

      // Ordena las tareas de hoy según el mapa de prioridades de la IA
      const sortedTodayTasks = [...currentTodayTasks].sort((a, b) => {
        const priorityA = priorityMap.get(a.name) ?? Infinity;
        const priorityB = priorityMap.get(b.name) ?? Infinity;
        return priorityA - priorityB;
      });

      // Combina las tareas de otros días con las tareas de hoy ya ordenadas
      return [...otherTasks, ...sortedTodayTasks];
    });
  };

  /**
   * @handler onDragEnd
   * @description Se dispara cuando el usuario termina de arrastrar una tarea.
   * Actualiza el orden de las tareas en el estado `allTasks`.
   * @param {DragEndEvent} event - El evento que contiene la información del arrastre.
   */
  const onDragEnd = (event: DragEndEvent) => {
    console.log("onDragEnd called", { active: event.active.id, over: event.over?.id });
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = active.id.toString();
      const overId = over.id.toString();

      console.log("Processing drag", { activeId, overId, todayTasks: todayTasks.map(t => t.id) });

      const oldIndex = todayTasks.findIndex(t => t.id === activeId);
      const newIndex = todayTasks.findIndex(t => t.id === overId);

      console.log("Indices", { oldIndex, newIndex });

      if (oldIndex === -1 || newIndex === -1) {
        console.error("Invalid indices for drag operation", { oldIndex, newIndex });
        return;
      }

      // Crea un nuevo array de tareas de hoy con el orden actualizado
      const reorderedTodayTasks = arrayMove(todayTasks, oldIndex, newIndex);

      // Separa las tareas que no son de hoy
      const todayTaskIds = new Set(todayTasks.map(t => t.id));
      const otherTasks = allTasks.filter(task => !todayTaskIds.has(task.id));

      console.log("Updating tasks", { otherTasksCount: otherTasks.length, reorderedCount: reorderedTodayTasks.length });

      // Actualiza el estado global con el nuevo orden
      setAllTasks([...otherTasks, ...reorderedTodayTasks]);
    }
  };

  // Force re-render when tasks change to prevent stale references
  const [forceUpdate, setForceUpdate] = React.useState(0);
  React.useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [allTasks]);
  

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background min-h-screen">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-6">
            {/* El contexto DndContext envuelve los componentes que usarán la funcionalidad de arrastrar y soltar */}
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} key={forceUpdate}>
              <TaskList
                tasks={todayTasks}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </DndContext>
            <AIPrioritizer 
              tasks={todayTasks}
              onApplyPriority={handleApplyPriority}
            />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
