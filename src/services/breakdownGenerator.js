/**
 * Breakdown Generator Service
 * High-level service class for integrating AI breakdown generation with the UI
 * Handles data transformation, error handling, and state compatibility via backend API
 */

import { API_BASE_URL } from "../dataService";

/**
 * Remove HTML tags from a string (similar to PHP's strip_tags)
 * @param {string} html - HTML string to strip
 * @returns {string} Plain text without HTML tags
 */
function stripTags(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Get text content (automatically strips HTML)
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Service class for generating project breakdowns
 * Provides a clean interface between the UI and the backend AI service
 */
export class BreakdownGeneratorService {
  constructor() {
    this.isGenerating = false;
    this.lastGenerationTime = null;
    this.generationCount = 0;
  }

  /**
   * Generate a project breakdown from user input
   * @param {string} projectDescription - Main project description
   * @param {string} clientInfo - Optional client information  
   * @param {Array<string>} employeeNames - Optional array of employee names
   * @param {string} additionalContext - Optional additional context
   * @returns {Promise<Array>} State-compatible breakdown array
   * @throws {Error} If generation fails or validation fails
   */
  async generateBreakdown(
    projectDescription, 
    clientInfo = '', 
    employeeNames = [], 
    additionalContext = ''
  ) {
    if (this.isGenerating) {
      throw new Error('A breakdown generation is already in progress. Please wait.');
    }

    try {
      this.isGenerating = true;
      this.generationCount++;
      const startTime = Date.now();

      // Validate input
      if (!projectDescription || projectDescription.trim().length < 10) {
        throw new Error('Project description must be at least 10 characters long');
      }

      // if (projectDescription.length > 5000) {
      //   throw new Error('Project description must be less than 5000 characters');
      // }

      // Prepare request payload
      const payload = {
        projectDescription: stripTags(projectDescription.trim()),
        clientName: clientInfo?.trim() || '',
        employeeNames: Array.isArray(employeeNames) ? employeeNames.filter(Boolean) : [],
        additionalContext: additionalContext?.trim() || ''
      };

      console.log('Calling backend AI service for breakdown generation...');
      
      // Call backend API
      const response = await fetch(`${API_BASE_URL}/ai/generate-breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Backend service returned an error');
      }

      // Validate the breakdown structure
      const breakdown = result.breakdown;
      if (!Array.isArray(breakdown) || breakdown.length === 0) {
        throw new Error('Invalid breakdown structure received from server');
      }

      const duration = Date.now() - startTime;
      this.lastGenerationTime = duration;

      console.log(`Breakdown generated successfully in ${duration}ms:`, {
        modules: breakdown.length,
        totalTasks: breakdown.reduce((sum, module) => sum + (module.tasks?.length || 0), 0)
      });

      return breakdown;

    } catch (error) {
      console.error('Breakdown generation failed:', error);
      throw this.transformError(error);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Test the backend AI service connection
   * @returns {Promise<boolean>} True if service is working
   */
  async testServiceConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/test`);
      if (!response.ok) {
        return false;
      }
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('AI service test failed:', error);
      return false;
    }
  }

  /**
   * Transform errors into user-friendly messages
   * @param {Error} error - Original error
   * @returns {Error} User-friendly error
   */
  transformError(error) {
    const message = error.message || 'Unknown error occurred';

    // Network/API errors
    if (message.includes('fetch') || message.includes('network') || message.includes('ENOTFOUND')) {
      return new Error('Network error: Unable to connect to AI service. Please check your internet connection and try again.');
    }

    // Authentication errors
    if (message.includes('401') || message.includes('403') || message.includes('API key') || message.includes('authentication')) {
      return new Error('Authentication error: Invalid API key. Please check your AI provider configuration.');
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
      return new Error('Rate limit exceeded: Too many requests. Please wait a moment and try again.');
    }

    // Model/provider errors
    if (message.includes('model') && message.includes('not found')) {
      return new Error('Model error: The configured AI model is not available. Please check your model configuration.');
    }

    // Validation errors (keep as-is, they're already user-friendly)
    if (message.includes('validation') || message.includes('Invalid') || message.includes('required')) {
      return error;
    }

    // JSON parsing errors
    if (message.includes('JSON') || message.includes('parse')) {
      return new Error('AI response error: Received invalid response from AI service. Please try again.');
    }

    // Generic AI service errors
    if (message.includes('AI') || message.includes('generation') || message.includes('breakdown')) {
      return new Error(`AI generation error: ${message}`);
    }

    // Unknown errors
    return new Error(`Breakdown generation failed: ${message}`);
  }

  /**
   * Get suggestions for improving generation results
   * @param {string} projectDescription - The project description that failed
   * @returns {Array<string>} Array of helpful suggestions
   */
  getGenerationSuggestions(projectDescription) {
    const suggestions = [];

    if (!projectDescription || projectDescription.length < 50) {
      suggestions.push('Provide a more detailed project description (at least 50 characters)');
    }

    if (projectDescription && !projectDescription.includes('web') && !projectDescription.includes('app') && !projectDescription.includes('system')) {
      suggestions.push('Specify the type of project (web app, mobile app, system, etc.)');
    }

    if (projectDescription && !this.hasTechnicalDetails(projectDescription)) {
      suggestions.push('Include technical details like frameworks, databases, or key features');
    }

    suggestions.push('Try being more specific about the project scope and requirements');
    suggestions.push('Include information about target users or business objectives');

    return suggestions;
  }

  /**
   * Check if description has technical details
   * @param {string} description - Project description
   * @returns {boolean} True if has technical details
   */
  hasTechnicalDetails(description) {
    const techKeywords = [
      'react', 'vue', 'angular', 'node', 'express', 'database', 'api', 'rest', 'graphql',
      'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'aws', 'azure', 'gcp',
      'frontend', 'backend', 'fullstack', 'authentication', 'payment', 'integration'
    ];
    
    const lowerDesc = description.toLowerCase();
    return techKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  /**
   * Get service statistics
   * @returns {Object} Service usage statistics
   */
  getStatistics() {
    return {
      isGenerating: this.isGenerating,
      generationCount: this.generationCount,
      lastGenerationTime: this.lastGenerationTime,
      backendUrl: API_BASE_URL,
    };
  }

  /**
   * Reset service statistics (useful for testing)
   */
  resetStatistics() {
    this.generationCount = 0;
    this.lastGenerationTime = null;
  }

  /**
   * Check if the service is ready for generation
   * @returns {boolean} True if ready
   */
  isReady() {
    return !this.isGenerating;
  }

  /**
   * Cancel ongoing generation (if possible)
   */
  cancel() {
    if (this.isGenerating) {
      console.warn('Cannot cancel AI generation - operation in progress');
      // Note: Actual cancellation would require AbortController support in Mastra
    }
  }
}

// Export singleton instance for easy use
export const breakdownGenerator = new BreakdownGeneratorService();

export default BreakdownGeneratorService;