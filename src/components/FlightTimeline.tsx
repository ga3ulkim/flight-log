import { useId } from 'react';
import type { Flight } from '../types';
import { groupFlightsForTimeline, timelineDateLabel } from '../lib/timeline';

interface FlightTimelineProps {
  flights: readonly Flight[];
}

function joinedCities(flight: Flight): string {
  return [flight.fcity, flight.tcity].filter(Boolean).join(' → ');
}

export default function FlightTimeline({ flights }: FlightTimelineProps) {
  const headingId = useId();
  const groups = groupFlightsForTimeline(flights);

  return (
    <section className="flc-timeline" aria-labelledby={headingId}>
      <header className="flc-section-heading flc-timeline-heading">
        <div>
          <div className="flc-eyebrow" aria-hidden="true">
            FLIGHT ARCHIVE
          </div>
          <h2 id={headingId}>비행 타임라인</h2>
        </div>
        <p>{flights.length.toLocaleString()}개의 기록 · 최신순</p>
      </header>

      {groups.length === 0 ? (
        <div className="flc-timeline-empty" role="status">
          현재 필터에 해당하는 비행 기록이 없습니다.
        </div>
      ) : (
        <div className="flc-timeline-groups">
          {groups.map((group) => {
            const groupHeadingId = `${headingId}-${group.key}`;
            return (
              <section
                className="flc-timeline-year"
                aria-labelledby={groupHeadingId}
                key={group.key}
              >
                <header className="flc-timeline-year-heading">
                  <h3 id={groupHeadingId}>{group.label}</h3>
                  <span>{group.flights.length} FLIGHTS</span>
                </header>

                <ol className="flc-timeline-list">
                  {group.flights.map((flight) => {
                    const date = timelineDateLabel(flight);
                    const cities = joinedCities(flight);
                    return (
                      <li
                        className="flc-timeline-item"
                        data-flight-type={flight.type === '국제선' ? 'international' : 'domestic'}
                        key={flight.id}
                      >
                        <article>
                          <div className="flc-timeline-date">
                            {date.dateTime ? (
                              <time dateTime={date.dateTime} aria-label={date.accessible}>
                                {date.primary}
                              </time>
                            ) : (
                              <span aria-label={date.accessible}>{date.primary}</span>
                            )}
                          </div>

                          <div className="flc-timeline-flight">
                            <h4 aria-label={`${flight.fa}에서 ${flight.ta}까지`}>
                              <span aria-hidden="true">{flight.fa}</span>
                              <span aria-hidden="true">→</span>
                              <span aria-hidden="true">{flight.ta}</span>
                            </h4>
                            {cities && <p className="flc-timeline-cities">{cities}</p>}
                            {flight.al && <p className="flc-timeline-airline">{flight.al}</p>}
                          </div>

                          <div className="flc-timeline-meta">
                            <span className="flc-timeline-type">{flight.type}</span>
                            {flight.fn && <span>{flight.fn}</span>}
                            {flight.ac && <span>{flight.ac}</span>}
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
