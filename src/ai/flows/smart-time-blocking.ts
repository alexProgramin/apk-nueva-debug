'use server';

/**
 * @fileOverview A smart time blocking AI agent.
 *
 * - suggestTimeBlocks - A function that suggests time blocks in the calendar for tasks.
 * - SuggestTimeBlocksInput - The input type for the suggestTimeBlocks function.
 * - SuggestTimeBlocksOutput - The return type for the suggestTimeBlocks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimeBlocksInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().describe('The name of the task.'),
        duration: z.number().optional().describe('The estimated duration of the task in minutes.'),
        deadline: z.string().optional().describe('The deadline for the task (ISO format).'),
        priority: z.string().optional().describe('The priority of the task (e.g., high, medium, low).'),
      })
    )
    .describe('The list of tasks to schedule.'),
  existingAppointments: z
    .array(
      z.object({
        startTime: z.string().describe('The start time of the appointment (ISO format).'),
        endTime: z.string().describe('The end time of the appointment (ISO format).'),
      })
    )
    .describe('The list of existing appointments in the calendar.'),
  workingHoursStart: z.string().describe('The start time of the working hours (HH:mm).'),
  workingHoursEnd: z.string().describe('The end time of the working hours (HH:mm).'),
});
export type SuggestTimeBlocksInput = z.infer<typeof SuggestTimeBlocksInputSchema>;

const SuggestTimeBlocksOutputSchema = z.object({
  suggestedBlocks: z
    .array(
      z.object({
        taskName: z.string().describe('The name of the task.'),
        startTime: z.string().describe('The suggested start time for the task (ISO format).'),
        endTime: z.string().describe('The suggested end time for the task (ISO format).'),
      })
    )
    .describe('The list of suggested time blocks for the tasks.'),
});
export type SuggestTimeBlocksOutput = z.infer<typeof SuggestTimeBlocksOutputSchema>;

export async function suggestTimeBlocks(input: SuggestTimeBlocksInput): Promise<SuggestTimeBlocksOutput> {
  return suggestTimeBlocksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimeBlocksPrompt',
  input: {schema: SuggestTimeBlocksInputSchema},
  output: {schema: SuggestTimeBlocksOutputSchema},
  prompt: `You are an AI assistant that helps users to schedule their tasks in a calendar.

Given the following list of tasks with their durations, deadlines and priorities:
{{#each tasks}}
- Task: {{name}}, Duration: {{#if duration}}{{duration}} minutes{{else}}Not specified{{/if}}, Deadline: {{deadline}}, Priority: {{priority}}
{{/each}}

And the following existing appointments in the calendar:
{{#each existingAppointments}}
- From: {{startTime}} to {{endTime}}
{{/each}}

Considering that the working hours are from {{workingHoursStart}} to {{workingHoursEnd}}, suggest time blocks for each task in the calendar.
If a task does not have a duration, assume a default duration of 30 minutes.
Optimize the schedule around the existing appointments and try to meet the deadlines and priorities of the tasks.
Return the suggested time blocks as a list of objects with the task name, start time and end time in ISO format.
Make sure that the suggested time blocks do not overlap with existing appointments or exceed working hours.

Output format: 
{
  "suggestedBlocks": [
    {
      "taskName": "Task 1",
      "startTime": "2024-01-01T09:00:00Z",
      "endTime": "2024-01-01T10:00:00Z"
    },
    {
      "taskName": "Task 2",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T11:00:00Z"
    }
  ]
}

`,}
);

const suggestTimeBlocksFlow = ai.defineFlow(
  {
    name: 'suggestTimeBlocksFlow',
    inputSchema: SuggestTimeBlocksInputSchema,
    outputSchema: SuggestTimeBlocksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
