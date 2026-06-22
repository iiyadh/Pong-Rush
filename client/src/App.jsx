import { useEffect } from 'react';
import { useUIStore } from './stores/uiStore';

function App() {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  return null;
}

export default App;
