/**
 * Schema Definitions for AI-Generated Breakdown Data
 * Validates and ensures type safety for breakdown generation using Zod
 */

import { z } from 'zod';

/**
 * Time format validation regex patterns
 * Supports formats like: "1d 4h", "48h", "1w", "30m", "2d", "3h 45m"
 */
const TIME_FORMAT_PATTERNS = {
  // Matches patterns like "1w", "2d", "4h", "30m"
  units: /^(\d+\s*[wdhm]\s*)+$/i,
  // Matches plain numbers (interpreted as hours)
  numeric: /^\d*\.?\d+$/,
  // Combined pattern for full validation
  combined: /^((\d+\s*[wdhm]\s*)+|\d*\.?\d+)$/i
};

/**
 * Custom Zod validator for time format strings
 * Accepts formats: "1d 4h", "48h", "1w", "30m", plain numbers
 */
const timeFormatValidator = z
  .string()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true; // Empty is valid
      return TIME_FORMAT_PATTERNS.combined.test(value.trim().toLowerCase());
    },
    {
      message: "Invalid time format. Use formats like: 1d 4h, 48h, 1w, 30m, or plain numbers (hours)"
    }
  );

/**
 * Task schema matching the existing breakdown structure
 * Each task has a name and estimation in time format
 */
export const TaskSchema = z.object({
  name: z
    .string()
    .min(1, "Task name is required")
    .max(200, "Task name must be 200 characters or less")
    .trim(),
  estimation: timeFormatValidator
    .transform(val => val?.trim() || '')
    .optional()
    .default('')
});

/**
 * Module schema matching the existing breakdown structure
 * Each module has a name and an array of tasks
 */
export const ModuleSchema = z.object({
  name: z
    .string()
    .min(1, "Module name is required")
    .max(100, "Module name must be 100 characters or less")
    .trim(),
  tasks: z
    .array(TaskSchema)
    .min(1, "Each module must have at least one task")
    .max(20, "Maximum 20 tasks per module")
});

/**
 * Complete breakdown schema for AI generation output
 * Represents the full project breakdown structure
 */
export const BreakdownSchema = z.object({
  modules: z
    .array(ModuleSchema)
    .min(1, "At least one module is required")
    .max(10, "Maximum 10 modules allowed")
});

/**
 * Input context schema for breakdown generation
 * Validates the input data provided to the AI
 */
export const GenerationContextSchema = z.object({
  projectDescription: z
    .string()
    .min(10, "Project description must be at least 10 characters")
    .max(5000, "Project description must be 5000 characters or less")
    .trim(),
  clientName: z
    .string()
    .max(100, "Client name must be 100 characters or less")
    .optional()
    .default(''),
  employeeNames: z
    .array(z.string().max(100))
    .max(50, "Maximum 50 employees")
    .optional()
    .default([]),
  additionalContext: z
    .string()
    .max(1000, "Additional context must be 1000 characters or less")
    .optional()
    .default('')
});

/**
 * AI generation settings schema
 * Configures how the AI should generate breakdowns
 */
export const GenerationSettingsSchema = z.object({
  includeTestingModule: z.boolean().default(true),
  includeBugfixingModule: z.boolean().default(true),
  testingPercentage: z.number().min(5).max(50).default(20),
  bugfixingPercentage: z.number().min(5).max(30).default(10),
  defaultWorkdayHours: z.number().min(4).max(12).default(8),
  maxModules: z.number().min(1).max(10).default(8),
  maxTasksPerModule: z.number().min(1).max(20).default(15)
});

/**
 * State-compatible breakdown schema
 * This matches exactly what the React state expects
 */
export const StateBreakdownSchema = z.array(
  z.object({
    name: z.string(),
    tasks: z.array(
      z.object({
        id: z.number().optional(), // Auto-generated in transformation
        name: z.string(),
        estimation: z.string()
      })
    )
  })
);

/**
 * Error response schema for failed generations
 */
export const GenerationErrorSchema = z.object({
  error: z.string(),
  code: z.enum(['VALIDATION_ERROR', 'API_ERROR', 'NETWORK_ERROR', 'UNKNOWN_ERROR']),
  details: z.string().optional(),
  suggestions: z.array(z.string()).optional().default([])
});

/**
 * Validates time format using the same logic as timeParser.js
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateTimeFormat(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return true; // Empty is valid
  }
  
  const cleanInput = timeStr.trim().toLowerCase();
  
  if (cleanInput === '') {
    return true;
  }
  
  return TIME_FORMAT_PATTERNS.combined.test(cleanInput);
}

/**
 * Transforms AI output to state-compatible format
 * @param {Breakdown} breakdown - Validated breakdown from AI
 * @returns {StateBreakdown} State-compatible breakdown
 */
export function transformToStateFormat(breakdown) {
  return breakdown.modules.map(module => ({
    name: module.name,
    tasks: module.tasks.map(task => ({
      id: Date.now() + Math.random(), // Generate unique ID
      name: task.name,
      estimation: task.estimation || ''
    }))
  }));
}

/**
 * Validates and processes AI generation input
 * @param {Object} input - Raw input data
 * @returns {GenerationContext} Validated context
 * @throws {Error} If validation fails
 */
export function validateGenerationInput(input) {
  try {
    return GenerationContextSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Input validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates AI generation output
 * @param {Object} output - Raw AI output
 * @returns {Breakdown} Validated breakdown
 * @throws {Error} If validation fails
 */
export function validateGenerationOutput(output) {
  try {
    return BreakdownSchema.parse(output);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`AI output validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}