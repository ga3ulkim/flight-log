import { describe, expect, it } from 'vitest';
import { makeFlight } from '../testFixtures';
import { groupFlightsForTimeline, timelineDateLabel } from './timeline';

describe('groupFlightsForTimeline', () => {
  it('groups dated flights by descending year and date for archive browsing', () => {
    const groups = groupFlightsForTimeline([
      makeFlight({ id: 1, y: 2097, d: '2097.08.20', sortKey: '2097.08.20' }),
      makeFlight({ id: 2, y: 2099, d: '2099.01.03', sortKey: '2099.01.03' }),
      makeFlight({ id: 3, y: 2099, d: '2099.11.04', sortKey: '2099.11.04' }),
      makeFlight({ id: 4, y: 2098, d: '2098.02.10', sortKey: '2098.02.10' }),
    ]);

    expect(groups.map((group) => group.year)).toEqual([2099, 2098, 2097]);
    expect(groups[0].flights.map((flight) => flight.id)).toEqual([3, 2]);
  });

  it('uses reverse source order as the same-day tie-break without mutating input', () => {
    const input = [
      makeFlight({ id: 10, sortKey: '2099.04.02', d: '2099.04.02' }),
      makeFlight({ id: 11, sortKey: '2099.04.02', d: '2099.04.02' }),
    ];

    expect(groupFlightsForTimeline(input)[0].flights.map((flight) => flight.id)).toEqual([
      11,
      10,
    ]);
    expect(input.map((flight) => flight.id)).toEqual([10, 11]);
  });

  it('keeps undated records in an honest final group', () => {
    const groups = groupFlightsForTimeline([
      makeFlight({ id: 1, y: null, d: '', sortKey: '9999.99.99' }),
      makeFlight({ id: 2, y: 2099, d: '2099', sortKey: '2099.00.00' }),
    ]);

    expect(groups.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: '2099', label: '2099' },
      { key: 'unknown', label: '날짜 미상' },
    ]);
    expect(groups[1].flights[0].d).toBe('');
  });

  it('operates only on the supplied filter-ready subset', () => {
    const filteredFlights = [
      makeFlight({ id: 7, y: 2098, type: '국내선' }),
      makeFlight({ id: 9, y: 2098, type: '국내선' }),
    ];

    const groups = groupFlightsForTimeline(filteredFlights);

    expect(groups).toHaveLength(1);
    expect(groups[0].flights).toHaveLength(2);
    expect(groups[0].flights.every((flight) => flight.type === '국내선')).toBe(true);
  });
});

describe('timelineDateLabel', () => {
  it('formats full, partial, and missing dates without adding precision', () => {
    expect(timelineDateLabel(makeFlight({ d: '2099.01.16' }))).toEqual({
      primary: 'JAN 16',
      dateTime: '2099-01-16',
      accessible: '2099.01.16',
    });
    expect(timelineDateLabel(makeFlight({ d: '2099' }))).toEqual({
      primary: '연도만 기록',
      dateTime: '2099',
      accessible: '2099',
    });
    expect(timelineDateLabel(makeFlight({ d: '', y: null }))).toEqual({
      primary: '—',
      accessible: '날짜 미상',
    });
  });
});
