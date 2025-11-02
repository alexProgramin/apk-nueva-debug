"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Loader2, Check } from "lucide-react";
import type { Task } from "@/lib/types";
import { getAIPrioritization } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type AITaskPrioritizationOutput = {
  name: string;
  priority: number;
  reason: string;
}[];

type AIPrioritizerProps = {
  tasks: Task[];
  onApplyPriority: (prioritizedTasks: AITaskPrioritizationOutput) => void;
};

export function AIPrioritizer({ tasks, onApplyPriority }: AIPrioritizerProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<AITaskPrioritizationOutput | null>(null);
  const { toast } = useToast();

  const handleGetPrioritization = async () => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await getAIPrioritization(tasks);
      if (result && result.length > 0) {
        setSuggestions(result);
      } else {
        toast({
          title: "¡Todo en orden!",
          description: "La IA no encontró tareas para priorizar.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al priorizar",
        description: "La IA no pudo generar un orden. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAndClose = () => {
    if (suggestions) {
      onApplyPriority(suggestions);
      toast({
        title: "¡Prioridad aplicada!",
        description: "Tus tareas han sido reordenadas.",
      });
    }
    setSuggestions(null);
  };

  const todoTasks = tasks.filter(task => task.status === 'todo');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Priorización con IA
          </CardTitle>
          <CardDescription>
            Deja que la IA organice tus tareas de la forma más coherente y productiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={handleGetPrioritization}
            disabled={isLoading || todoTasks.length < 2}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Priorizando..." : "Priorizar Tareas"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!suggestions} onOpenChange={() => setSuggestions(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sugerencia de Prioridad</DialogTitle>
            <CardDescription>La IA sugiere el siguiente orden para tus tareas:</CardDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {suggestions?.sort((a,b) => a.priority - b.priority).map((item) => (
              <div key={item.name} className="flex items-start gap-4 p-3 border rounded-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {item.priority}
                </span>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleApplyAndClose}>
              <Check className="mr-2 h-4 w-4" />
              Aplicar Prioridad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
