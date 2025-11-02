
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task } from "@/lib/types";

export const taskSchema = z.object({
  name: z.string().min(3, { message: "El nombre de la tarea debe tener al menos 3 caracteres." }),
  duration: z.coerce.number().min(1, { message: "La duración debe ser de al menos 1 minuto." }).optional().or(z.literal('')),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

type TaskFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: Omit<Task, 'id' | 'status'> | Task) => void;
  task?: Task | null;
};

// Helper function to format a date for a datetime-local input
const toDateTimeLocalString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function TaskForm({ isOpen, onOpenChange, onSubmit, task }: TaskFormProps) {
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || "",
      duration: task?.duration || "",
      priority: task?.priority || "medium",
      deadline: task?.deadline ? toDateTimeLocalString(new Date(task.deadline)) : "",
    },
  });

  React.useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        duration: task.duration || "",
        priority: task.priority,
        deadline: task.deadline ? toDateTimeLocalString(new Date(task.deadline)) : "",
      });
    } else {
      form.reset({
        name: "",
        duration: "",
        priority: "medium",
        deadline: "",
      });
    }
  }, [task, form, isOpen]);

  const handleSubmit = (values: z.infer<typeof taskSchema>) => {
    // The value from datetime-local input is already in local time.
    // new Date() will parse it correctly according to user's timezone.
    const deadlineISO = values.deadline ? new Date(values.deadline).toISOString() : undefined;
    const duration = values.duration ? Number(values.duration) : undefined;

    if (task) {
        onSubmit({ ...task, ...values, duration, deadline: deadlineISO });
    } else {
        onSubmit({ ...values, duration, deadline: deadlineISO });
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Añadir una nueva tarea"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Tarea</FormLabel>
                  <FormControl>
                    <Input placeholder="p. ej., Diseñar un nuevo logo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (minutos) (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="p. ej., 60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Límite (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
              <Button type="submit">Guardar Tarea</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
