// Canal mínimo para abrir a command palette de qualquer lugar,
// sem context nem dependência nova.

export const COMMAND_EVENT = "ea:open-command";

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMMAND_EVENT));
  }
}
