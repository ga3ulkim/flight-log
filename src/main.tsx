import { createRoot } from 'react-dom/client';
import FlightLogChart from './components/FlightLogChart';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('The application root element was not found.');
}

createRoot(rootElement).render(<FlightLogChart />);
