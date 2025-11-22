import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { YearProvider } from './components/YearContext'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <YearProvider>
            <App />
        </YearProvider>
    </StrictMode>,
)
