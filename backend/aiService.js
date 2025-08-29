/**
 * Backend AI Service for Project Breakdown Generation
 * Uses direct HTTP requests to OpenRouter API for better compatibility
 */

import { z } from 'zod';

/**
 * Environment configuration for AI service
 */
function getAIConfig() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  switch (provider.toLowerCase()) {
    case 'openrouter':
      return createOpenRouterConfig(modelName);
    case 'openai':
      return createOpenAIConfig(modelName);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function createOpenRouterConfig(modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = 'https://openrouter.ai/api/v1';
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }
  
  console.log('Creating OpenRouter configuration with:', { modelName, baseURL });
  
  return {
    provider: 'openrouter',
    modelName,
    apiKey,
    baseURL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://team-status-app.local',
      'X-Title': 'Team Status - Project Breakdown Generator'
    }
  };
}

function createOpenAIConfig(modelName) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  return {
    provider: 'openai',
    modelName,
    apiKey,
    baseURL: 'https://api.openai.com/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Zod schemas for validation
 */
const TaskSchema = z.object({
  name: z.string().min(1).max(200),
  estimation: z.string().optional().default('')
});

const ModuleSchema = z.object({
  name: z.string().min(1).max(100),
  tasks: z.array(TaskSchema).min(1).max(20)
});

const BreakdownSchema = z.object({
  modules: z.array(ModuleSchema).min(1).max(10)
});

const GenerationContextSchema = z.object({
  projectDescription: z.string().min(10).max(5000),
  clientName: z.string().max(100).optional().default(''),
  employeeNames: z.array(z.string().max(100)).max(50).optional().default([]),
  additionalContext: z.string().max(1000).optional().default('')
});

/**
 * AI Service for breakdown generation using direct HTTP requests
 */
class BackendBreakdownService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.config = getAIConfig();
      this.initialized = true;
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  buildPrompt(context) {
    const { projectDescription, clientName, employeeNames, additionalContext } = context;
    const testingPercentage = parseInt(process.env.AI_TESTING_PERCENTAGE || '20', 10);
    const bugfixingPercentage = parseInt(process.env.AI_BUGFIXING_PERCENTAGE || '10', 10);
    const defaultWorkdayHours = parseInt(process.env.AI_DEFAULT_WORKDAY_HOURS || '8', 10);
    
    let prompt = `You are a world-class project estimation expert specializing in software development breakdowns.

TASK: Analyze the following project and generate a detailed, realistic breakdown with modules and tasks.

STRUCTURE REQUIREMENTS:
- Create 2-8 logical modules based on project complexity
- Each module should have 2-15 specific, actionable tasks
- Always include Testing and Bugfixing modules (unless explicitly inappropriate)
- Use clear, professional task names that reflect actual work

TIME ESTIMATION GUIDELINES:
- Use formats: "1d 4h", "48h", "1w", "30m", "2d" (where 1d = ${defaultWorkdayHours}h workday)
- Testing should be ~${testingPercentage}% of development time
- Bugfixing should be ~${bugfixingPercentage}% of development time
- Be realistic but not overly conservative

If the description could be in English or Romanian.
Please generate modules and tasks in the same language as the description.

PROJECT DESCRIPTION:\n${projectDescription}\n\n`;
    
    if (clientName) {
      prompt += `CLIENT: ${clientName}\n\n`;
    }
    
    if (employeeNames && employeeNames.length > 0) {
      prompt += `TEAM MEMBERS: ${employeeNames.join(', ')}\n`;
      prompt += `TEAM SIZE: ${employeeNames.length} developer${employeeNames.length > 1 ? 's' : ''}\n\n`;
    }
    
    if (additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${additionalContext}\n\n`;
    }

    prompt += `Generate a comprehensive project breakdown with realistic time estimations.
Focus on creating actionable tasks that can be tracked and measured.
Consider the project scope, complexity, and team size in your estimations.`;

    return prompt;
  }

  async generateBreakdown(context) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const prompt = this.buildPrompt(context);
      console.log('Generating breakdown with AI...');
      
      // Add JSON schema to the prompt for structured output
      const jsonPrompt = `${prompt}

Please respond with a JSON object in this exact format:
{
  "modules": [
    {
      "name": "Module Name",
      "tasks": [
        {
          "name": "Task Name",
          "estimation": "1d 4h"
        }
      ]
    }
  ]
}

Return ONLY the JSON object, no additional text or markdown formatting.`;
      
      // Make direct HTTP request to the correct endpoint
      const response = await this.makeAPIRequest(jsonPrompt);
      
      // Parse the JSON response
      let jsonResponse;
      try {
        // Clean the response to ensure it's valid JSON
        let cleanedText = response.trim();
        
        // Remove markdown code block formatting if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        jsonResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError.message);
        console.error('Raw response:', response);
        throw new Error('AI response was not valid JSON');
      }
      
      // Validate the parsed JSON against our schema
      const validatedResult = BreakdownSchema.parse(jsonResponse);
      
      console.log('Breakdown generated successfully:', {
        modules: validatedResult.modules.length,
        totalTasks: validatedResult.modules.reduce((sum, module) => sum + module.tasks.length, 0)
      });
      
      return validatedResult;
    } catch (error) {
      console.error('Breakdown generation failed:', error);
      throw error;
    }
  }

  async makeAPIRequest(prompt) {
    const endpoint = `${this.config.baseURL}/chat/completions`;
    
    const requestBody = {
      model: this.config.modelName,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
      max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10)
    };

    console.log('Making API request to:', endpoint);
    console.log('Model:', this.config.modelName);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.config.headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      console.error('Invalid API response structure:', responseData);
      throw new Error('Invalid API response structure');
    }

    return responseData.choices[0].message.content;
  }
}

// Singleton instance
const breakdownService = new BackendBreakdownService();
export default breakdownService;

/**
 * Main API function for generating breakdowns
 */
export async function generateProjectBreakdown(context) {
  try {
    // Validate input
    const validatedContext = GenerationContextSchema.parse(context);
    
    // Generate breakdown
    const breakdown = await breakdownService.generateBreakdown(validatedContext);
    
    // Transform to state-compatible format
    const stateBreakdown = breakdown.modules.map(module => ({
      name: module.name,
      tasks: module.tasks.map(task => ({
        id: Date.now() + Math.random(),
        name: task.name,
        estimation: task.estimation || ''
      }))
    }));
    
    return {
      success: true,
      breakdown: stateBreakdown
    };
  } catch (error) {
    console.error('Generate project breakdown error:', error);
    
    let userMessage = 'Failed to generate breakdown. Please try again.';
    
    if (error.message.includes('API key')) {
      userMessage = 'AI service configuration error. Please check API key settings.';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your internet connection and try again.';
    } else if (error.name === 'ZodError') {
      userMessage = 'Invalid input data. Please check your project description and try again.';
    }
    
    return {
      success: false,
      error: userMessage,
      details: error.message
    };
  }
}

/**
 * Test the AI service
 */
export async function testAIService() {
  try {
    const testContext = {
      projectDescription: "Simple test web application with user authentication and basic CRUD operations",
      clientName: "Test Client",
      employeeNames: ["Test Developer"],
      additionalContext: ""
    };
    
    const result = await generateProjectBreakdown(testContext);
    return result.success;
  } catch (error) {
    console.error('AI service test failed:', error);
    return false;
  }
}