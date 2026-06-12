type ClassPrimitive = string | number | boolean | null | undefined;
type ClassDictionary = Record<string, unknown>;
type ClassValue = ClassPrimitive | ClassDictionary | ClassValue[];

function toClassName(input: ClassValue): string {
  if (!input) return "";
  if (typeof input === "string" || typeof input === "number") return String(input);
  if (Array.isArray(input)) {
    return input.map(toClassName).filter(Boolean).join(" ");
  }
  if (typeof input === "object") {
    return Object.entries(input)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)
      .join(" ");
  }
  return "";
}

export function cn(...inputs: ClassValue[]) {
  return inputs.map(toClassName).filter(Boolean).join(" ");
}
