export const themeBootstrapScript = `
(() => {
  try {
    const stored = localStorage.getItem("smart-campus-theme");
    const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const light = theme === "light" || (theme === "system" && matchMedia("(prefers-color-scheme: light)").matches);
    document.documentElement.classList.toggle("light", light);
    document.documentElement.classList.toggle("dark", !light);
    document.documentElement.style.colorScheme = light ? "light" : "dark";
  } catch {}
})();
`;
