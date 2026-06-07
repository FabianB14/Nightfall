import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '@/App';
import { useStore } from '@/store';

describe('UI smoke test (engine ↔ store ↔ UI)', () => {
  beforeEach(() => {
    useStore.setState({ screen: 'title', game: null, selectedCard: null });
  });

  it('renders the title, goes to crew select, and starts a run', () => {
    render(<App />);
    // Title screen is present.
    expect(screen.getByText(/Last Light/i)).toBeInTheDocument();

    // Title → crew select.
    fireEvent.click(screen.getByRole('button', { name: /New Run/i }));
    expect(screen.getByText(/Assemble your coven/i)).toBeInTheDocument();

    // The Trapper is selected by default; start the run.
    fireEvent.click(screen.getByRole('button', { name: /Into the Dark/i }));

    // We are now on the play screen: the Bloodmoon track and an End Turn control exist.
    expect(screen.getByLabelText(/Bloodmoon/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /End Turn/i })).toBeInTheDocument();

    // The board shows the Lord and the round chronicle has entries.
    expect(screen.getByText(/Round 1/i)).toBeInTheDocument();
  });

  it('lets a hunter play a self-targeted card from hand', () => {
    // Start a Trapper run with a known seed.
    useStore.getState().newRun('ui-smoke', ['trapper'], 1);
    render(<App />);

    const game = useStore.getState().game!;
    const trapper = game.hunters[0];
    // Force a deterministic, self-targeting card (Reload) into hand for the click test.
    useStore.setState({
      game: { ...game, hunters: [{ ...trapper, hand: ['reload'], resource: 0 }] },
    });

    const footer = screen.getByText(/Deck/i).closest('footer')!;
    const reload = within(footer).getByRole('button', { name: /Reload/i });
    fireEvent.click(reload);

    // Reload sets Silver rounds to 3 immediately (self-target auto-plays).
    expect(useStore.getState().game!.hunters[0].resource).toBe(3);
  });
});
