export type Theme = "light" | "dark" | "system";

/** App é dark-first: na dúvida (SSR, sem preferência), escuro. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const d = document.documentElement;
  d.classList.toggle("light", resolved === "light");
  d.classList.toggle("dark", resolved === "dark");
  d.style.colorScheme = resolved;
}

// Script inline executado antes do primeiro paint — evita flash de tema errado.
// Lê o MESMO bloco que o store grava hoje (ea:v2:user); cai para o legado e,
// por fim, para o escuro (padrão do app).
export const themeScript = `(function(){try{
var raw=localStorage.getItem('ea:v2:user')||localStorage.getItem('ea:v2:data');
var t=raw?((JSON.parse(raw).settings||{}).theme||'dark'):'dark';
if(t==='system'){
  t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
}
var d=document.documentElement;
d.classList.toggle('light',t==='light');
d.classList.toggle('dark',t==='dark');
d.style.colorScheme=t;
}catch(e){}})();`;
