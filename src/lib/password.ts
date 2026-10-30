export function passwordError(password: string): string | null {
  return password.length >= 8 ? null : "Use at least 8 characters.";
}
