import { useStore } from '@/store';
import { RunSetup } from '@ui/RunSetup';
import { Game } from '@ui/Game';

export default function App() {
  const screen = useStore((s) => s.screen);
  return screen === 'play' ? <Game /> : <RunSetup />;
}
