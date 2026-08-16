import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { makeFlight } from '../testFixtures';
import { knownAirport } from '../lib/geography';
import {
  geographicPoint,
  segmentTransferByLand,
  transferModeAt,
} from '../lib/landSeaTransfer';
import type { PlaybackState } from '../types';
import AircraftMarker from './AircraftMarker';
import PlaybackUI from './PlaybackUI';

const currentFlight = makeFlight({
  id: 0,
  fa: 'GDX',
  ta: 'ANC',
  d: '2099.06.01',
  sortKey: '2099.06.01',
});

const nextFlight = makeFlight({
  id: 1,
  fa: 'GDX',
  ta: 'PKC',
  d: '2099.06.02',
  sortKey: '2099.06.02',
});

describe('land/sea transfer presentation integration', () => {
  it('renders a synchronized bus to ferry to bus sequence', () => {
    const segments = segmentTransferByLand(
      geographicPoint(knownAirport(currentFlight.ta)),
      geographicPoint(knownAirport(nextFlight.fa)),
    );
    expect(segments.map((segment) => segment.mode)).toEqual(['land', 'sea', 'land']);

    const renderedKinds: string[] = [];
    for (const segment of segments) {
      const progress = (segment.startT + segment.endT) / 2;
      const transferMode = transferModeAt(segments, progress);
      const holdTotal = 2_000;
      const play: PlaybackState = {
        on: true,
        idx: 0,
        t: 1,
        hold: (1 - progress) * holdTotal,
        holdTotal,
        speed: 1,
      };
      const marker = renderToStaticMarkup(
        <svg>
          <AircraftMarker
            currentFlight={currentFlight}
            nextFlight={nextFlight}
            play={play}
            inverseCameraScale={1}
            transferMode={transferMode}
          />
        </svg>,
      );
      const status = renderToStaticMarkup(
        <PlaybackUI
          play={play}
          active
          currentFlight={currentFlight}
          nextFlight={nextFlight}
          transferMode={transferMode}
          sequenceLength={2}
          onToggle={() => undefined}
          onStop={() => undefined}
          onCycleSpeed={() => undefined}
        />,
      );
      const expectedKind = transferMode === 'sea' ? 'ferry' : 'bus';
      const expectedLabel = transferMode === 'sea' ? '해상 이동' : '지상 이동';

      expect(marker).toContain(`data-transfer-mode="${transferMode}"`);
      expect(marker).toContain(`data-vehicle-kind="${expectedKind}"`);
      expect(status).toContain(`data-transfer-mode="${transferMode}"`);
      expect(status).toContain(`${expectedLabel} → GDX`);
      renderedKinds.push(expectedKind);
    }

    expect(renderedKinds).toEqual(['bus', 'ferry', 'bus']);
  });
});
