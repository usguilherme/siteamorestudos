export type Theme = "light" | "dark" | "system";

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

// Script inline executado antes do primeiro paint — evita flash de tema errado.
// Lê o mesmo blob que o store grava (ea:v2:data).
export const themeScript = `(function(){try{
var raw=localStorage.getItem('ea:v2:data');
var t=raw?(JSON.parse(raw).settings||{}).theme:'system';
if(t!=='light'&&t!=='dark'){
  t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
var d=document.documentElement;
d.classList.toggle('dark',t==='dark');
d.style.colorScheme=t;
}catch(e){}})();`;
