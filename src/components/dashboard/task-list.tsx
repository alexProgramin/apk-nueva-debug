
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Clock, Calendar, MoreVertical, Edit, Trash2, GripVertical } from "lucide-react";
import type { Task } from "@/lib/types";
import { TaskForm } from "./task-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
 * @typedef TaskListProps
 * @property {Task[]} tasks - La lista de tareas a mostrar.
 * @property {(data: Omit<Task, 'id' | 'status'>) => void} onAddTask - Función callback para añadir una nueva tarea.
 * @property {(task: Task) => void} onUpdateTask - Función callback para actualizar una tarea existente.
 * @property {(taskId: string) => void} onDeleteTask - Función callback para eliminar una tarea.
 */
type TaskListProps = {
  tasks: Task[];
  onAddTask: (data: Omit<Task, 'id' | 'status'>) => void;
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
 * Utiliza el hook `useSortable` de @dnd-kit para la lógica de arrastre.
 */
function SortableTaskItem({ task, onOpenForm, onDeleteTask, onUpdateTask }: { task: Task, onOpenForm: (task: Task) => void, onDeleteTask: (taskId: string) => void, onUpdateTask: (task: Task) => void }) {
   const [isClient, setIsClient] = React.useState(false);
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging,
   } = useSortable({ id: task.id });

   // Debug: Log when sortable item mounts/unmounts
   React.useEffect(() => {
     console.log(`SortableTaskItem ${task.id} mounted`);
     return () => {
       console.log(`SortableTaskItem ${task.id} unmounting`);
     };
   }, [task.id]);

  const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 1 : 0, // Pone la tarea que se arrastra por encima de las demás
  };

  React.useEffect(() => {
    setIsClient(true);
  }, []);

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
        task.status === 'done' && "opacity-50",
        isDragging && "shadow-lg"
      )}
    >
      {/* El icono de agarre que actúa como el "handle" para arrastrar */}
      <div {...attributes} {...listeners} className="flex-shrink-0 pt-1 cursor-grab">
         <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className={cn("font-medium", task.status === 'done' && "line-through")}>{task.name}</p>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            {task.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.duration} min</span>}
            {/* Solo renderiza la fecha en el cliente para evitar errores de hidratación */}
            {task.deadline && isClient && (
                <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}
                </span>
            )}
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
 * @component TaskList
 * @description Muestra una lista de tareas para el día de hoy, permitiendo añadir, editar,
 * eliminar y reordenarlas mediante arrastrar y soltar.
 */
export function TaskList({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TaskListProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  
  // Memoiza los IDs de las tareas para el contexto de ordenamiento.
  const taskIds = React.useMemo(() => tasks.map(t => t.id), [tasks]);

  // Force re-render when tasks change to prevent stale references
  const [forceUpdate, setForceUpdate] = React.useState(0);
  React.useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [tasks]);

  const handleOpenForm = (task: Task | null = null) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<Task, 'id' | 'status'> | Task) => {
    if ('id' in data) {
      onUpdateTask(data);
    } else {
      onAddTask(data);
    }
    setIsFormOpen(false);
  };

  return (
    <>
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Tareas de Hoy</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => handleOpenForm()}>
            <PlusCircle className="h-6 w-6 text-primary" />
            <span className="sr-only">Añadir Tarea</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          <ScrollArea className="h-full">
            {/* El contexto de SortableContext necesita los IDs de los elementos para funcionar */}
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3" key={forceUpdate}>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      onOpenForm={handleOpenForm}
                      onDeleteTask={onDeleteTask}
                      onUpdateTask={onUpdateTask}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <p>Aún no hay tareas.</p>
                    <p>¡Añade una tarea para empezar!</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* El formulario modal para añadir/editar tareas */}
      <TaskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        task={editingTask}
      />
    </>
  );
}
