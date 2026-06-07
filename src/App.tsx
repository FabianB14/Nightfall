import { useStore } from '@/store';
import { TitleScreen } from '@ui/TitleScreen';
import { CharacterSelect } from '@ui/CharacterSelect';
import { Game } from '@ui/Game';

export default function App() {
  const screen = useStore((s) => s.screen);
  if (screen === 'play') return <Game />;
  if (screen === 'crew') return <CharacterSelect />;
  return <TitleScreen />;
}
