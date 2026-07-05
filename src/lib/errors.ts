/**
 * Centralized error handling utilities.
 * Provides user-friendly messages in PT-BR and safe error extraction.
 */
import { toast } from "sonner";

export type UnknownError = unknown;

/** Extract a raw message string from any thrown value. */
export function getErrorMessage(error: UnknownError): string {
  if (!error) return "Erro desconhecido";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const anyErr = error as { message?: string; error_description?: string; msg?: string };
    return anyErr.message || anyErr.error_description || anyErr.msg || JSON.stringify(error);
  }
  return String(error);
}

/** Map raw Supabase / network errors to friendly PT-BR messages. */
export function toFriendlyMessage(error: UnknownError): string {
  const msg = getErrorMessage(error).toLowerCase();

  // Network
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed")) {
    return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "A operação demorou demais. Tente novamente.";
  }

  // Supabase auth
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Este e-mail já está cadastrado. Faça login.";
  }
  if (msg.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (msg.includes("invalid email")) return "E-mail inválido.";

  // Supabase / Postgres
  if (msg.includes("row-level security") || msg.includes("permission denied")) {
    return "Você não tem permissão para essa ação.";
  }
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    return "Este registro já existe.";
  }
  if (msg.includes("violates foreign key")) {
    return "Não foi possível salvar: dado relacionado não encontrado.";
  }
  if (msg.includes("not null") || msg.includes("null value")) {
    return "Preencha todos os campos obrigatórios.";
  }
  if (msg.includes("jwt") || msg.includes("token")) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  return "Ocorreu um erro. Tente novamente.";
}

interface ToastErrorOptions {
  /** Prefix like "Erro ao salvar" — will be shown as the toast title. */
  title?: string;
  /** Optional description override; defaults to the friendly message. */
  description?: string;
  /** Log to console for debugging (default true). */
  log?: boolean;
}

/** Show a friendly error toast and (optionally) log the raw error. */
export function toastError(error: UnknownError, options: ToastErrorOptions = {}): void {
  const { title, description, log = true } = options;
  const friendly = description ?? toFriendlyMessage(error);
  if (log) console.error(title || "Error:", error);
  if (title) {
    toast.error(title, { description: friendly });
  } else {
    toast.error(friendly);
  }
}

/**
 * Wrap an async operation with try/catch, showing a friendly toast on failure.
 * Returns the value on success, or `undefined` on error.
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  options: ToastErrorOptions = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    toastError(error, options);
    return undefined;
  }
}
