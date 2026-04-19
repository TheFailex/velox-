import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { Trip } from '@/types';

interface Props {
  trips: Trip[];
  unit?: 'kmh' | 'mph';
}

const CELL = 13;   // cell size px
const GAP = 2;     // gap between cells
const WEEKS = 20;  // how many weeks to show
const DAYS = 7;

const DAYS_LABEL = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Color ramp: 0 km → dark, more km → greener
function kmToColor(km: number): string {
  if (km === 0) return 'rgba(30,30,42,0.9)';
  if (km < 5)  return 'rgba(0,200,150,0.22)';
  if (km < 20) return 'rgba(0,200,150,0.45)';
  if (km < 50) return 'rgba(0,200,150,0.70)';
  return '#00C896';
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function ActivityCalendar({ trips, unit = 'kmh' }: Props) {
  const { grid, monthLabels, maxKm } = useMemo(() => {
    // Build km-per-day map
    const kmByDay: Record<string, number> = {};
    for (const trip of trips) {
      const key = trip.started_at.slice(0, 10);
      kmByDay[key] = (kmByDay[key] ?? 0) + trip.distance_km;
    }

    // Build the WEEKS×7 grid, ending today
    const today = startOfDay(new Date());
    // Find the Sunday of the current week so columns align Sun→Sat
    const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
    const gridEnd = new Date(today);
    gridEnd.setDate(gridEnd.getDate() + (6 - dayOfWeek)); // last Saturday of this week

    const totalDays = WEEKS * DAYS;
    const gridStart = new Date(gridEnd);
    gridStart.setDate(gridEnd.getDate() - (totalDays - 1));

    // Build column arrays: each column = 1 week (Sun→Sat)
    const columns: { date: Date; km: number }[][] = [];
    let monthLabelMap: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; km: number }[] = [];
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * DAYS + d);
        const key = isoDate(date);
        const km = kmByDay[key] ?? 0;
        week.push({ date, km });
      }
      // Month label on first day of a new month in this column
      const firstOfCol = week[0].date;
      if (firstOfCol.getMonth() !== lastMonth) {
        const monthName = firstOfCol.toLocaleString('default', { month: 'short' });
        monthLabelMap.push({ col: w, label: monthName });
        lastMonth = firstOfCol.getMonth();
      }
      columns.push(week);
    }

    const maxKm = Math.max(...Object.values(kmByDay), 1);

    return {
      grid: columns,
      monthLabels: monthLabelMap,
      maxKm,
    };
  }, [trips]);

  const displayUnit = unit === 'mph' ? 'mi' : 'km';

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Day-of-week labels on the left */}
        <View style={styles.dayLabels}>
          {/* Spacer for month label row */}
          <View style={{ height: 14 }} />
          {DAYS_LABEL.map((d, i) => (
            <View key={i} style={[styles.dayLabelCell, { opacity: i % 2 === 0 ? 1 : 0 }]}>
              <Text style={styles.dayLabelText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Weeks columns */}
        <View>
          {/* Month labels row */}
          <View style={styles.monthRow}>
            {grid.map((_, colIdx) => {
              const label = monthLabels.find((m) => m.col === colIdx);
              return (
                <View key={colIdx} style={styles.monthLabelCell}>
                  {label && <Text style={styles.monthLabelText}>{label.label}</Text>}
                </View>
              );
            })}
          </View>

          {/* Cell grid */}
          <View style={styles.gridRow}>
            {grid.map((week, colIdx) => (
              <View key={colIdx} style={styles.weekCol}>
                {week.map((day, rowIdx) => (
                  <View
                    key={rowIdx}
                    style={[styles.cell, { backgroundColor: kmToColor(day.km) }]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 5, 20, 50, 100].map((km) => (
          <View key={km} style={[styles.legendCell, { backgroundColor: kmToColor(km) }]} />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const CELL_STEP = CELL + GAP;

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  scrollContent: { paddingRight: 8 },

  dayLabels: { marginRight: GAP },
  dayLabelCell: {
    width: 14,
    height: CELL,
    marginBottom: GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelText: { color: '#8E8EA0', fontSize: 9, fontWeight: '600' },

  monthRow: { flexDirection: 'row', marginBottom: GAP },
  monthLabelCell: { width: CELL_STEP, height: 14 },
  monthLabelText: { color: '#8E8EA0', fontSize: 9, fontWeight: '600' },

  gridRow: { flexDirection: 'row', gap: GAP },
  weekCol: { gap: GAP },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 2,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { color: '#8E8EA0', fontSize: 9, fontWeight: '600' },
});
