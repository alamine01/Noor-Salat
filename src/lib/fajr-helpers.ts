import { loadTodayTimes, toDate } from './prayer';
import { scheduleDay } from './blocker';

export { loadTodayTimes, toDate };

export async function scheduleSafe() {
  try {
    const d = await loadTodayTimes();
    await scheduleDay(d.times);
  } catch {}
}
