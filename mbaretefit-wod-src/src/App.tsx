import { AppShell } from './components/layout/AppShell';
import { AppDataProvider } from './hooks/AppDataProvider';
import { useHashRoute } from './hooks/useHashRoute';
import { HistoryPage } from './pages/History/HistoryPage';
import { HomePage } from './pages/Home/HomePage';
import { PlateCalculatorPage } from './pages/PlateCalculator/PlateCalculatorPage';
import { RMCalculatorPage } from './pages/RMCalculator/RMCalculatorPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { StrengthPage } from './pages/Strength/StrengthPage';
import type { StorageAdapter } from './services/storage/adapter';

function Routes() {
  const [route, navigate] = useHashRoute();
  return (
    <AppShell route={route}>
      {route === 'inicio' && <HomePage navigate={navigate} />}
      {route === 'rm' && <RMCalculatorPage />}
      {route === 'strength' && <StrengthPage />}
      {route === 'discos' && <PlateCalculatorPage />}
      {route === 'historial' && <HistoryPage navigate={navigate} />}
      {route === 'ajustes' && <SettingsPage />}
    </AppShell>
  );
}

export function App({ adapter }: { adapter?: StorageAdapter }) {
  return (
    <AppDataProvider adapter={adapter}>
      <Routes />
    </AppDataProvider>
  );
}
