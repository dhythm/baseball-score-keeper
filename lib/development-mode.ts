export function shouldShowDevelopmentTools(
  environment: string | undefined = process.env.NODE_ENV
): boolean {
  return environment === "development";
}
