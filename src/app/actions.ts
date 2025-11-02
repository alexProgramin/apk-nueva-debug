"use server";

import {
  prioritizeTasks,
  type AITaskPrioritizationInput,
} from "@/ai/ai-task-prioritization";
import { getAIChatResponse, type ChatInput } from "@/ai/flows/ai-assistant-flow";
import type { Task } from "@/lib/types";

/**
 * @serverAction getAIPrioritization
 * @description Llama al flujo de IA de Genkit para obtener una lista priorizada de tareas.
 * Transforma los datos de las tareas del cliente al formato que espera el flujo de IA.
 * @param {Task[]} tasks - La lista de tareas del usuario desde el cliente.
 * @returns {Promise<AITaskPrioritizationOutput>} Una promesa que se resuelve con la lista de tareas priorizadas y la razón de la IA.
 * @throws {Error} Si el flujo de IA falla.
 */
export async function getAIPrioritization(tasks: Task[]) {
  // Prepara el input para el flujo de IA, mapeando los campos necesarios.
  const input: AITaskPrioritizationInput = {
    tasks: tasks.map((task) => ({
      name: task.name,
      description: `Estado: ${task.status}`, // Una descripción simple para dar contexto a la IA.
      deadline: task.deadline || "ninguno",
      importance: task.priority,
    })),
  };

  try {
    const result = await prioritizeTasks(input);
    return result;
  } catch (error) {
    console.error("Error in prioritizeTasks flow:", error);
    throw new Error("Failed to get prioritization from AI.");
  }
}

/**
 * @serverAction askAIAssistant
 * @description Llama al flujo de IA del asistente de chat para obtener una respuesta conversacional.
 * @param {string} userMessage - El mensaje del usuario.
 * @param {Task[]} tasks - La lista de tareas actual del usuario para darle contexto al asistente.
 * @returns {Promise<string>} Una promesa que se resuelve con la respuesta de texto del asistente.
 * @throws {Error} Si el flujo de IA falla.
 */
export async function askAIAssistant(
  userMessage: string,
  tasks: Task[]
): Promise<string> {
  const input: ChatInput = {
    userMessage,
    tasks: tasks,
  };

  try {
    const result = await getAIChatResponse(input);
    return result.response;
  } catch (error) {
    console.error("Error in getAIChatResponse flow:", error);
    throw new Error("Failed to get response from AI.");
  }
}
