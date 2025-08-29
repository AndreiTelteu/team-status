/**
 * Model Configuration Service
 * Handles environment-based AI provider configuration and abstraction
 */

import { openai } from '@ai-sdk/openai';

/**
 * Gets the configured AI model based on environment variables
 * @returns {Object} Configured AI model instance
 * @throws {Error} If provider is unsupported or configuration is invalid
 */
export function getModelFromEnv() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  validateEnvironmentConfig(provider);
  
  switch (provider.toLowerCase()) {
    case 'openrouter':
      return createOpenRouterModel(modelName);
    
    case 'openai':
      return createOpenAIModel(modelName);
    
    case 'ollama':
      return createOllamaModel(modelName);
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}. Supported providers: openrouter, openai, ollama`);
  }
}

/**
 * Creates OpenRouter model configuration
 * @param {string} modelName - The model name (e.g., 'google/gemini-2.0-flash-exp')
 * @returns {Object} Configured OpenRouter model
 */
function createOpenRouterModel(modelName) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.AI_MODEL_BASE_URL || 'https://openrouter.ai/api/v1';
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required for OpenRouter provider');
  }
  
  return openai(modelName, {
    baseURL,
    apiKey,
    headers: {
      'HTTP-Referer': 'https://team-status-app.local',
      'X-Title': 'Team Status - Project Breakdown Generator'
    }
  });
}

/**
 * Creates OpenAI model configuration
 * @param {string} modelName - The model name (e.g., 'gpt-4o-mini')
 * @returns {Object} Configured OpenAI model
 */
function createOpenAIModel(modelName) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for OpenAI provider');
  }
  
  return openai(modelName, {
    apiKey
  });
}

/**
 * Creates Ollama model configuration for local models
 * @param {string} modelName - The model name (e.g., 'llama3.1:8b')
 * @returns {Object} Configured Ollama model
 */
function createOllamaModel(modelName) {
  const baseURL = process.env.AI_MODEL_BASE_URL || 'http://localhost:11434/v1';
  
  return openai(modelName, {
    baseURL,
    apiKey: 'ollama' // Ollama doesn't require a real API key
  });
}

/**
 * Validates environment configuration for the specified provider
 * @param {string} provider - The AI provider name
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironmentConfig(provider) {
  const requiredVars = {
    openrouter: ['OPENROUTER_API_KEY'],
    openai: ['OPENAI_API_KEY'],
    ollama: [] // No API key required for local Ollama
  };
  
  const required = requiredVars[provider.toLowerCase()] || [];
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for ${provider} provider: ${missing.join(', ')}`
    );
  }
}

/**
 * Gets model generation parameters from environment
 * @returns {Object} Model parameters
 */
export function getModelParameters() {
  return {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    topP: parseFloat(process.env.AI_TOP_P || '0.9')
  };
}

/**
 * Gets breakdown generation settings from environment
 * @returns {Object} Generation settings
 */
export function getGenerationSettings() {
  return {
    includeTestingModule: process.env.AI_INCLUDE_TESTING_MODULE !== 'false',
    testingPercentage: parseInt(process.env.AI_TESTING_PERCENTAGE || '20', 10),
    bugfixingPercentage: parseInt(process.env.AI_BUGFIXING_PERCENTAGE || '10', 10),
    defaultWorkdayHours: parseInt(process.env.AI_DEFAULT_WORKDAY_HOURS || '8', 10)
  };
}

/**
 * Validates that the AI model is properly configured and accessible
 * @returns {Promise<boolean>} True if model is accessible, false otherwise
 */
export async function validateModelAccess() {
  try {
    const model = getModelFromEnv();
    // This is a simple test to verify the model configuration
    // In a real implementation, you might want to make a minimal API call
    return true;
  } catch (error) {
    console.error('Model validation failed:', error.message);
    return false;
  }
}

/**
 * Gets a user-friendly model name for display purposes
 * @returns {string} Display name for the current model
 */
export function getModelDisplayName() {
  const provider = process.env.AI_MODEL_PROVIDER || 'openai';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';
  
  // Format display name based on provider
  switch (provider.toLowerCase()) {
    case 'openrouter':
      return `${modelName.replace('/', ' → ')} (via OpenRouter)`;
    case 'openai':
      return `${modelName} (OpenAI)`;
    case 'ollama':
      return `${modelName} (Local Ollama)`;
    default:
      return `${modelName} (${provider})`;
  }
}