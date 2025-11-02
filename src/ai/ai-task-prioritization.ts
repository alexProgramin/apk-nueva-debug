'use server';

/**
 * @fileOverview AI-powered task prioritization flow.
 *
 * This file defines a Genkit flow that analyzes user tasks and suggests a prioritization
 * based on deadlines and importance.  It exports the prioritizeTasks function,
 * the AITaskPrioritizationInput type, and the AITaskPrioritizationOutput type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AITaskPrioritizationInputSchema = z.object({
  tasks: z.array(
    z.object({
      name: z.string().describe('The name of the task.'),
      description: z.string().describe('A detailed description of the task.'),
      deadline: z.string().describe('The deadline for the task (YYYY-MM-DD).'),
      importance: z
        .enum(['high', 'medium', 'low'])
        .describe('The importance level of the task.'),
    })
  ).describe('A list of tasks to prioritize.'),
});

export type AITaskPrioritizationInput = z.infer<
  typeof AITaskPrioritizationInputSchema
>;

const AITaskPrioritizationOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the task.'),
    priority: z.number().describe('The suggested priority of the task (1 being highest).'),
    reason: z.string().describe('The reasoning behind the assigned priority.'),
  })
);

export type AITaskPrioritizationOutput = z.infer<
  typeof AITaskPrioritizationOutputSchema
>;

export async function prioritizeTasks(
  input: AITaskPrioritizationInput
): Promise<AITaskPrioritizationOutput> {
  return aiTaskPrioritizationFlow(input);
}

const taskPrioritizationPrompt = ai.definePrompt({
  name: 'taskPrioritizationPrompt',
  input: {schema: AITaskPrioritizationInputSchema},
  output: {schema: AITaskPrioritizationOutputSchema},
  prompt: `You are an AI task prioritization expert. Analyze the following tasks and suggest a priority for each, with 1 being the highest priority. Provide a brief reason in Spanish for each priority assignment.

Tasks:
{{#each tasks}}
- Name: {{name}}
  Description: {{description}}
  Deadline: {{deadline}}
  Importance: {{importance}}
{{/each}}`,
});

const aiTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'aiTaskPrioritizationFlow',
    inputSchema: AITaskPrioritizationInputSchema,
    outputSchema: AITaskPrioritizationOutputSchema,
  },
  async input => {
    const {output} = await taskPrioritizationPrompt(input);
    return output!;
  }
);
