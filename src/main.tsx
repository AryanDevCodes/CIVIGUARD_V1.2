
// Import regenerator-runtime to fix the regeneratorRuntime error
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
