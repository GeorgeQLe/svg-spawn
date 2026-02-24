/**
 * Builds a prompt for retrying after a validation failure.
 * Includes the previous (invalid) response and the specific validation errors.
 */
export function buildRetryPrompt(previousResponse: string, errors: string[]): string {
  const parts: string[] = [];

  parts.push('## Previous Response (Invalid)\n');
  parts.push(previousResponse);

  parts.push('\n\n## Validation Errors\n');
  parts.push('The previous response had the following errors:\n');
  for (const error of errors) {
    parts.push(`- ${error}`);
  }

  parts.push('\n\nPlease fix these errors and return a corrected AnimationPlan JSON. Respond with ONLY the JSON object.');

  return parts.join('\n');
}
