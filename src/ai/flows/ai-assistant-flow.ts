'use server';

/**
 * @fileOverview An AI assistant that provides productivity insights based on user tasks.
 *
 * - getTaskInsights - A function that analyzes tasks and returns recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Task } from '@/lib/types';


const ChatInputSchema = z.object({
  userMessage: z.string().describe('The user\'s question or message.'),
  tasks: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      status: z.enum(['todo', 'in-progress', 'done']),
      deadline: z.string().optional(),
    })
  ).describe('The user\'s current list of tasks for context.')
});

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's conversational response to the user's message."),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


const prompt = ai.definePrompt({
  name: 'aiChatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are a helpful and friendly productivity assistant called PlanSmart AI. Your role is to chat with the user, answer their questions, and provide actionable insights about their tasks. Your tone should be encouraging and supportive. You MUST answer in Spanish.

The user has sent the following message:
"{{userMessage}}"

Here is the user's current task list for your context. You should use this list to answer questions about their tasks or provide relevant suggestions.
{{#if tasks}}
{{#each tasks}}
- Tarea: {{name}} (Prioridad: {{priority}}, Estado: {{status}}{{#if deadline}}, Fecha Límite: {{deadline}}{{/if}})
{{/each}}
{{else}}
The user has no tasks.
{{/if}}

Based on the user's message and their task list, provide a concise and helpful response. If the user asks a general question, answer it. If they ask about their tasks, use the provided list to give a specific answer.`,
});

const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function getAIChatResponse(input: ChatInput): Promise<ChatOutput> {
  return aiChatFlow(input);
}
