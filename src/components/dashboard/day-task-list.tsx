
"use client";

import * as React from "react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, MoreVertical, Clock, CalendarIcon, GripVertical } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * @typedef DayTaskListProps
 * @property {Date | undefined} selectedDate - La fecha seleccionada cuyas tareas se mostrarán.
 * @property {Task[]} tasks - La lista de tareas para el día seleccionado.
 * @property {() => void} onAddTask - Callback para iniciar la creación de una nueva tarea.
 * @property {(task: Task) => void} onUpdateTask - Callback para actualizar una tarea.
 * @property {(taskId: string) => void} onDeleteTask - Callback para eliminar una tarea.
 */
type DayTaskListProps = {
  selectedDate: Date | undefined;
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
};

// Estilos para la barra lateral de prioridad
const priorityStyles = {
    high: "border-l-destructive",
    medium: "border-l-accent",
    low: "border-l-primary",
};
  
// Estilos para la insignia (badge) de prioridad
const priorityBadgeStyles = {
    high: "bg-destructive/20 text-destructive-foreground border-destructive/50",
    medium: "bg-accent/20 text-accent-foreground border-accent/50",
    low: "bg-primary/20 text-primary-foreground border-primary/50",
}
  
// Texto legible para cada nivel de prioridad
const priorityText = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
}

/**
 * @component SortableTaskItem
 * @description Representa un único elemento de tarea en la lista que se puede arrastrar y reordenar.
 * Es idéntico en función a su contraparte en `task-list.tsx`.
 */
function SortableTaskItem({ task, onOpenForm, onDeleteTask, onUpdateTask }: { task: Task, onOpenForm: (task: Task) => void, onDeleteTask: (taskId: string) => void, onUpdateTask: (task: Task) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
    };

    const handleCheckedChange = (checked: boolean) => {
        onUpdateTask({ ...task, status: checked ? 'done' : 'todo' });
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "p-3 rounded-lg bg-card-foreground/5 border-l-4 flex justify-between items-start gap-2",
          priorityStyles[task.priority],
          task.status === 'done' && 'opacity-50',
          isDragging && "shadow-lg"
        )}
      >
        {/* El "handle" o agarre para iniciar el arrastre */}
        <div {...attributes} {...listeners} className="flex-shrink-0 pt-1 cursor-grab">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className={cn("font-medium", task.status === 'done' && 'line-through')}>{task.name}</p>
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              {task.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.duration} min</span>}
              <Badge variant="outline" className={cn("capitalize", priorityBadgeStyles[task.priority])}>{priorityText[task.priority]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.status === 'done'}
            onCheckedChange={handleCheckedChange}
            className="mt-1"
          />
          {/* Menú de acciones (editar, eliminar) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpenForm(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
}

/**
 * @component DayTaskList
 * @description Muestra una lista de tareas para una fecha específica, permitiendo
 * añadir, actualizar, eliminar y reordenar tareas. Se usa en la página de Calendario.
 */
export function DayTaskList({ selectedDate, tasks, onAddTask, onUpdateTask, onDeleteTask }: DayTaskListProps) {
  // Formatea la fecha seleccionada para mostrarla en el encabezado.
  const formattedDate = selectedDate
  ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })
  : "Selecciona una fecha";

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  const taskIds = React.useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
      <Card className="flex-grow flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
                <CardTitle>Tareas</CardTitle>
                <CardDescription>{capitalizedDate}</CardDescription>
            </div>
          <Button variant="ghost" size="icon" onClick={onAddTask}>
            <PlusCircle className="h-6 w-6 text-primary" />
            <span className="sr-only">Añadir Tarea</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          <ScrollArea className="h-full pr-4">
            {/* Contexto para habilitar el ordenamiento de los elementos hijos */}
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onOpenForm={onUpdateTask}
                      onDeleteTask={onDeleteTask}
                      onUpdateTask={onUpdateTask}
                    />
                  ))
                ) : (
                  // Mensaje que se muestra cuando no hay tareas para el día seleccionado.
                  <div className="text-center text-muted-foreground py-10 h-full flex flex-col justify-center items-center">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                      <p className="font-semibold">No hay tareas para este día.</p>
                      <p className="text-sm">¡Añade una para empezar a organizarte!</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
  );
}
