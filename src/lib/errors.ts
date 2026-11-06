// Carries an HTTP status from Jira (or the demo provider) through to the API response.
export class JiraError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
