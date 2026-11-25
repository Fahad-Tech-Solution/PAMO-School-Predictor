import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Map server action `fieldErrors` onto react-hook-form so FormMessage can highlight. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string[] | undefined> | undefined,
): string[] {
  if (!fieldErrors) return [];

  const messages: string[] = [];
  for (const [name, errors] of Object.entries(fieldErrors)) {
    const message = errors?.find((entry) => entry.trim().length > 0);
    if (!message) continue;
    messages.push(message);
    setError(name as Path<T>, { type: "server", message });
  }
  return messages;
}
