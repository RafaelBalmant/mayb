import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { t } from "../content.js";
import { citiesByDay, daysInMonth, monthKey, upcomingServiceDays, visibleMonths } from "../domain/agenda.js";
import { BookingModal } from "../components/BookingModal.jsx";
import { Layout } from "../components/Layout.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useSwipe } from "../components/useSwipe.js";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// Agenda: the visitor picks the month and sees, day by day, whether the doctor works in Maringá,
// in Siqueira Campos or not at all. The months are those in data/agenda.json (current month on, at most 4);
// the city names are in content.json.
export function AgendaScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const today = useMemo(() => new Date(), []);
  const months = visibleMonths(today);
  const index = Math.min(Math.max(state.ui.agendaMonth || 0, 0), months.length - 1);
  const month = months[index];

  const [slide, setSlide] = useState(null); // "right" | "left": where the new calendar comes in from
  const [booking, setBooking] = useState(false);
  const calendarRef = useRef();
  const bookRef = useRef();

  const monthNames = t("agenda.months");
  const locations = t("agenda.locations");
  const days = citiesByDay(month);
  const total = daysInMonth(month);
  const isCurrentMonth = monthKey(month) === monthKey(today);
  const monthName = monthNames[month.getMonth()].toLowerCase();
  const upcoming = upcomingServiceDays(month, today, days);

  const changeMonth = useCallback(
    (to) => {
      if (to < 0 || to >= months.length || to === index) return;
      setSlide(to > index ? "right" : "left");
      dispatch({ type: "SET_AGENDA_MONTH", index: to });
    },
    [dispatch, index, months.length],
  );
  // dragging the calendar sideways: to the left goes to the next month, to the right back to the previous one
  useSwipe(
    calendarRef,
    useCallback((direction) => changeMonth(index - direction), [changeMonth, index]),
  );

  const statusOf = (day) => (days[day] || []).map((c) => locations[c] ?? c).join(" · ") || t("agenda.noService");
  const daysByCity = Object.fromEntries(
    Object.keys(locations).map((c) => [c, upcoming.filter((d) => days[d]?.includes(c))]),
  );

  const closeBooking = useCallback(() => {
    setBooking(false);
    bookRef.current?.focus({ preventScroll: true });
  }, []);

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => goTo("start")}>
        {t("agenda.back")}
      </button>
      <button
        class="btn primary"
        id="book"
        ref={bookRef}
        disabled={upcoming.length === 0}
        onClick={() => setBooking(true)}
      >
        {t("agenda.book", { month: monthName })}
      </button>
    </>
  );

  return (
    <>
      <Layout bar={bar}>
        <Topbar screen="agenda" />
        <h1>{t("agenda.title")}</h1>
        <p class="explain">{t("agenda.explanation")}</p>
        <div class="segmented months" role="group" aria-label={t("agenda.chooseMonth")}>
          <span
            class="indicator slides"
            aria-hidden="true"
            style={{ width: `calc((100% - 6px) / ${months.length})`, transform: `translateX(${index * 100}%)` }}
          />
          {months.map((m, i) => (
            <button key={monthKey(m)} aria-pressed={i === index} onClick={() => changeMonth(i)}>
              {t("agenda.shortMonths")[m.getMonth()]}
            </button>
          ))}
        </div>
        <section key={index} ref={calendarRef} class={slide ? `calendar enter-${slide}` : "calendar"}>
          <h2>{t("agenda.monthYear", { month: monthNames[month.getMonth()], year: month.getFullYear() })}</h2>
          <div class="grid" role="grid">
            {t("agenda.weekdays").map((w) => (
              <span key={w} class="weekday" aria-hidden="true">
                {w}
              </span>
            ))}
            {Array.from({ length: month.getDay() }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: total }, (_, i) => {
              const day = i + 1;
              const here = days[day] || [];
              const classes = ["day", ...here.map((c) => `location-${c}`)];
              if (here.length > 1) classes.push("many");
              if (isCurrentMonth && day < today.getDate()) classes.push("past");
              return (
                <span
                  key={day}
                  class={classes.join(" ")}
                  role="gridcell"
                  aria-label={t("agenda.dayLabel", { day, month: monthName, status: statusOf(day) })}
                >
                  {day}
                </span>
              );
            })}
          </div>
          <ul class="legend" aria-label={t("agenda.legend")}>
            {Object.entries(locations).map(([code, name]) => (
              <li key={code}>
                <i class={`location-${code}`} />
                {name}
              </li>
            ))}
          </ul>
        </section>
        {upcoming.length === 0 && <p class="empty">{t("agenda.noDates")}</p>}
      </Layout>
      {booking && <BookingModal monthName={monthName} daysByCity={daysByCity} onClose={closeBooking} />}
    </>
  );
}
