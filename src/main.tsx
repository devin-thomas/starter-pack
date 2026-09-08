import { hydrateRoot } from 'react-dom/client';
import App, { type SiteData } from './App';
import './index.css';

const root = document.getElementById('root');
const payload = document.getElementById('site-data');
if (!root || !payload?.textContent) throw new Error('Site content is missing. Run the documented build or dev command.');
const data: SiteData = JSON.parse(payload.textContent);
hydrateRoot(root, <App path={window.location.pathname.replace(/\/$/, '') || '/'} data={data} />);
