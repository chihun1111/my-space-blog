try {
  document.documentElement.dataset.theme = localStorage.getItem('my-space-theme-v3') || 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}
const themeColor = document.querySelector('meta[name="theme-color"]');
if (themeColor) themeColor.content = document.documentElement.dataset.theme === 'dark' ? '#101116' : '#f8f9fc';
