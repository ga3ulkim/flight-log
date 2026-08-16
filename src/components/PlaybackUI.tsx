import type { Flight, PlaybackState } from '../types';
import type { TransferMode } from '../lib/landSeaTransfer';

interface PlaybackUIProps {
  play: PlaybackState;
  active: boolean;
  currentFlight: Flight | null;
  nextFlight: Flight | undefined;
  transferMode: TransferMode | null;
  sequenceLength: number;
  onToggle: () => void;
  onStop: () => void;
  onCycleSpeed: () => void;
}

export default function PlaybackUI({
  play,
  active,
  currentFlight,
  nextFlight,
  transferMode,
  sequenceLength,
  onToggle,
  onStop,
  onCycleSpeed,
}: PlaybackUIProps) {
  const transferProgress =
    play.hold > 0 && play.holdTotal > 0 ? 1 - play.hold / play.holdTotal : play.t;
  const overallProgress =
    active && sequenceLength > 0
      ? Math.max(
          0,
          Math.min(100, ((Math.max(0, play.idx) + transferProgress) / sequenceLength) * 100),
        )
      : 0;
  const playLabel = play.on ? '⏸ 일시정지' : active ? '▶ 계속 재생' : '▶ PLAY MY JOURNEY';

  return (
    <>
      {currentFlight && (
        <div
          className="flc-playback-console"
          aria-label={`현재 여정 ${Math.min(play.idx + 1, sequenceLength)}번째`}
        >
          <div className="flc-playback-kicker">
            <span>
              {Math.min(play.idx + 1, sequenceLength)}/{sequenceLength} ·{' '}
              {currentFlight.d || currentFlight.y || '날짜 미상'}
            </span>
            <span>{play.on ? 'IN FLIGHT' : 'PAUSED'}</span>
          </div>
          <div className="flc-playback-route">
            {currentFlight.fa} → {currentFlight.ta}
          </div>
          {(currentFlight.al || currentFlight.fn || currentFlight.ac) && (
            <div className="flc-playback-meta">
              {currentFlight.al || '항공사 미상'}
              {currentFlight.fn ? ` · ${currentFlight.fn}` : ''}
              {currentFlight.ac ? ` · ${currentFlight.ac}` : ''}
            </div>
          )}
          {play.hold > 0 && nextFlight && (
            <div
              className="flc-playback-transfer"
              data-transfer-mode={transferMode ?? 'land'}
            >
              {transferMode === 'sea' ? '해상 이동' : '지상 이동'} → {nextFlight.fa}
            </div>
          )}
          <div
            className="flc-progress-track"
            role="progressbar"
            aria-label="전체 여정 재생 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(overallProgress)}
          >
            <div className="flc-progress-value" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flc-playback-controls" aria-label="여정 재생 컨트롤">
        <button
          className="flc-zoom flc-play-primary"
          type="button"
          aria-label={play.on ? '일시정지' : '재생'}
          disabled={sequenceLength === 0}
          title={sequenceLength === 0 ? '지도 좌표가 있는 노선이 없어 재생할 수 없어요.' : undefined}
          onClick={onToggle}
        >
          {playLabel}
        </button>
        {active && (
          <button className="flc-zoom" type="button" aria-label="처음으로" onClick={onStop}>
            ⏹
          </button>
        )}
        <button
          className="flc-zoom"
          type="button"
          aria-label="재생 속도"
          onClick={onCycleSpeed}
        >
          ×{play.speed}
        </button>
      </div>
    </>
  );
}
