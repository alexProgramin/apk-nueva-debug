import { z } from "zod";

export interface Task {
  id: string;
  name: string;
  duration?: number; // in minutes
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
}

export interface Appointment {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  isTask?: boolean;
  isSuggestion?: boolean;
}

export interface TimeBlock {
  taskName: string;
  startTime: string;
  endTime: string;
  date: string;
}

export const TaskInsightsInputSchema = z.object({
  tasks: z.array(
    z.object({
      name: z.string().describe("The name of the task."),
      description: z.string().optional().describe("A detailed description of the task."),
      deadline: z.string().optional().describe("The deadline for the task (ISO format)."),
      priority: z.enum(['low', 'medium', 'high']).describe("The importance level of the task."),
      status: z.enum(['todo', 'in-progress', 'done']).describe("The current status of the task."),
    })
  ).describe('A list of tasks to analyze.'),
});

export type TaskInsightsInput = z.infer<typeof TaskInsightsInputSchema>;

export const TaskInsightsOutputSchema = z.object({
    insights: z.array(z.object({
        title: z.string().describe("A short, descriptive title for the insight."),
        description: z.string().describe("A detailed explanation of the insight or recommendation."),
        type: z.enum(['suggestion', 'warning', 'observation']).describe("The type of insight: 'suggestion' for actionable advice, 'warning' for potential issues, 'observation' for neutral findings."),
    })).describe('A list of insights and recommendations based on the tasks.')
});

export type TaskInsightsOutput = z.infer<typeof TaskInsightsOutputSchema>;
