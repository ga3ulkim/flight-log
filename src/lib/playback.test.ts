import { describe, expect, it } from 'vitest';
import { makeFlight } from '../testFixtures';
import {
  advancePlayback,
  areSequentialFlightsConnected,
  chronologicalFlights,
  flightDuration,
  groundTransferDuration,
  playedRouteKeys,
} from './playback';

const START = { idx: 0, t: 0, hold: 0, holdTotal: 0 } as const;

describe('playback ordering and adjacency', () => {
  it('sorts by normalized date and then stable source id', () => {
    const flights = [
      makeFlight({ id: 4, sortKey: '2099.03.01', d: '2099.03.01' }),
      makeFlight({ id: 2, sortKey: '2099.01.01', d: '2099.01.01' }),
      makeFlight({ id: 1, sortKey: '2099.01.01', d: '2099.01.01' }),
      makeFlight({ id: 5, fa: 'ZZZ', ta: 'ICN' }),
      makeFlight({ id: 6, fa: 'ICN', ta: 'ICN' }),
    ];

    expect(chronologicalFlights(flights).map((flight) => flight.id)).toEqual([1, 2, 4]);
  });

  it('distinguishes connected and disconnected sequential flights', () => {
    const current = makeFlight({ fa: 'ICN', ta: 'NRT' });
    expect(
      areSequentialFlightsConnected(current, makeFlight({ fa: 'NRT', ta: 'HND' })),
    ).toBe(true);
    expect(
      areSequentialFlightsConnected(current, makeFlight({ fa: 'HND', ta: 'ICN' })),
    ).toBe(false);
  });
});

describe('playback advancement', () => {
  it('moves directly to a connected next flight', () => {
    const first = makeFlight({ id: 0, fa: 'ICN', ta: 'NRT' });
    const next = makeFlight({ id: 1, fa: 'NRT', ta: 'HND' });
    const result = advancePlayback(START, flightDuration(first) + 1, [first, next]);

    expect(result).toMatchObject({
      done: false,
      missingFlight: false,
      progress: { idx: 1, t: 0, hold: 0, holdTotal: 0 },
    });
  });

  it('starts a distance-based ground transfer for disconnected flights', () => {
    const first = makeFlight({ id: 0, fa: 'ICN', ta: 'NRT' });
    const next = makeFlight({ id: 1, fa: 'HND', ta: 'ICN' });
    const result = advancePlayback(START, flightDuration(first) + 1, [first, next]);

    expect(result.progress.idx).toBe(0);
    expect(result.progress.t).toBe(1);
    expect(result.progress.hold).toBeGreaterThan(0);
    expect(result.progress.holdTotal).toBe(result.progress.hold);
  });

  it('advances after a ground transfer hold expires', () => {
    const first = makeFlight({ id: 0, fa: 'ICN', ta: 'NRT' });
    const next = makeFlight({ id: 1, fa: 'HND', ta: 'ICN' });
    const transfer = advancePlayback(START, flightDuration(first) + 1, [first, next]);
    const result = advancePlayback(
      transfer.progress,
      transfer.progress.hold + 1,
      [first, next],
    );

    expect(result.progress).toEqual({ idx: 1, t: 0, hold: 0, holdTotal: 0 });
  });

  it('stops on the completed final flight', () => {
    const flight = makeFlight({ fa: 'ICN', ta: 'CJU' });
    const result = advancePlayback(START, flightDuration(flight) + 1, [flight]);
    expect(result.done).toBe(true);
    expect(result.progress).toEqual({ idx: 0, t: 1, hold: 0, holdTotal: 0 });
  });

  it('returns a reset signal for an empty sequence', () => {
    expect(advancePlayback(START, 16, [])).toMatchObject({
      missingFlight: true,
      progress: { idx: -1 },
    });
  });

  it('retains the reference duration clamps', () => {
    expect(groundTransferDuration(0)).toBe(500);
    expect(groundTransferDuration(10_000)).toBe(3000);
    expect(flightDuration(makeFlight({ fa: 'ICN', ta: 'CJU' }))).toBeGreaterThanOrEqual(1300);
    expect(flightDuration(makeFlight({ fa: 'ICN', ta: 'JFK' }))).toBeLessThanOrEqual(4800);
  });

  it('collects already-flown undirected route keys', () => {
    const sequence = [
      makeFlight({ id: 0, fa: 'ICN', ta: 'CJU' }),
      makeFlight({ id: 1, fa: 'CJU', ta: 'ICN' }),
      makeFlight({ id: 2, fa: 'ICN', ta: 'NRT' }),
    ];
    expect([...playedRouteKeys(sequence, 2)]).toEqual(['CJU|ICN', 'ICN|NRT']);
  });
});
