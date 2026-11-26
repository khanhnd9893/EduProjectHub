import { useEffect, useRef, useState } from 'react'

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function dateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function startOfWeek(date) {
  return addDays(dateOnly(date), -((date.getDay() + 6) % 7))
}

function deadlineDate(value) {
  if (!value) return null
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayLabel(date) {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function timeLabel(date) {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    ...(date.getSeconds() ? { second: '2-digit' } : {}),
    hour12: false,
  })
}

function ReportsCalendar({ reports, selectedId, onSelect, onShowList, onCreate, disabled, focusDeadline }) {
  const [now, setNow] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => dateOnly(deadlineDate(focusDeadline?.value) || new Date()))
  const [mode, setMode] = useState('week')
  const [miniMonth, setMiniMonth] = useState(() => {
    const date = deadlineDate(focusDeadline?.value) || new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const gridRef = useRef(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const grid = gridRef.current
    const morning = grid?.querySelector('[data-hour="8"]')
    if (grid && morning) {
      grid.scrollTop = morning.getBoundingClientRect().top - grid.getBoundingClientRect().top + grid.scrollTop - 48
    }
  }, [mode])

  const deadlines = reports
    .map((report) => ({ report, date: deadlineDate(report.deadline) }))
    .filter((entry) => entry.date)
    .sort((a, b) => a.date - b.date || a.report.id - b.report.id)
  const days = mode === 'day'
    ? [selectedDate]
    : Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(selectedDate), index))
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(monthStart), index))
  const miniDays = Array.from({ length: 42 }, (_, index) => addDays(startOfWeek(miniMonth), index))
  const upcoming = deadlines.filter((entry) => entry.date.getTime() >= now.getTime()).slice(0, 5)
  const withoutDeadline = reports.filter((report) => !deadlineDate(report.deadline))
  const title = selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  const range = mode === 'day'
    ? dayLabel(selectedDate)
    : mode === 'week' ? `${dayLabel(days[0])} – ${dayLabel(days[6])}` : ''

  function chooseDate(date) {
    setSelectedDate(dateOnly(date))
    setMiniMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  function navigate(amount) {
    if (mode === 'month') {
      chooseDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, 1))
    } else {
      chooseDate(addDays(selectedDate, amount * (mode === 'week' ? 7 : 1)))
    }
  }

  function eventButton(entry) {
    return (
      <button key={entry.report.id} type="button" className={`calendar-event${String(entry.report.id) === selectedId ? ' is-selected' : ''}`}
        disabled={disabled} onClick={() => onSelect(entry.report.id)}
        aria-label={`${entry.report.title}, ${entry.report.groupName || 'nhóm'}, hạn ${dayLabel(entry.date)} ${timeLabel(entry.date)}`}>
        <strong>{timeLabel(entry.date)} · {entry.report.title}</strong>
        {entry.report.groupName && <span>{entry.report.groupName}</span>}
      </button>
    )
  }

  return (
    <div className="calendar-content">
      <section className="workspace-panel calendar-main" aria-label="Lịch hạn nộp báo cáo">
        <div className="calendar-heading">
          <div className="calendar-navigation">
            <button type="button" onClick={() => navigate(-1)} aria-label="Kỳ trước">‹</button>
            <button type="button" onClick={() => navigate(1)} aria-label="Kỳ sau">›</button>
            <button type="button" onClick={() => chooseDate(new Date())}>Hôm nay</button>
          </div>
          <h2>{title}</h2>
          {onCreate && (
            <button type="button" className="calendar-create" onClick={onCreate}>+ Tạo đợt báo cáo</button>
          )}
        </div>
        <div className="calendar-subheading">
          <div className="reports-filters calendar-modes" role="group" aria-label="Chế độ xem lịch">
            {[['day', 'Ngày'], ['week', 'Tuần'], ['month', 'Tháng']].map(([value, label]) => (
              <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>
            ))}
          </div>
          {range && <span className="calendar-range">{range}</span>}
        </div>
        {mode === 'month' ? (
          <div className="calendar-month-scroll">
            <div className="calendar-month-grid">
              {weekdays.map((day) => <strong className="calendar-weekday" key={day}>{day}</strong>)}
              {monthDays.map((date) => (
                <div className={`calendar-month-day${date.getMonth() !== selectedDate.getMonth() ? ' is-outside' : ''}`} key={date.toDateString()}>
                  <button type="button" className="calendar-day-number" onClick={() => { chooseDate(date); setMode('day') }}>{date.getDate()}</button>
                  {deadlines.filter((entry) => sameDay(entry.date, date)).map(eventButton)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="calendar-grid-scroll" ref={gridRef} tabIndex="0" aria-label="Lưới lịch 24 giờ, cuộn để xem các giờ">
            <div className="calendar-time-grid" style={{ '--calendar-days': days.length }}>
              <div className="calendar-time-header">Giờ</div>
              {days.map((date) => (
                <div className={`calendar-time-header${sameDay(date, selectedDate) ? ' is-today' : ''}`} key={date.toDateString()}>
                  <strong>{weekdays[(date.getDay() + 6) % 7]}</strong>
                  <span>{String(date.getDate()).padStart(2, '0')}/{String(date.getMonth() + 1).padStart(2, '0')}</span>
                </div>
              ))}
              {Array.from({ length: 24 }, (_, hour) => (
                <div className="calendar-hour-row" key={hour}>
                  <div className="calendar-hour-label" data-hour={hour}>{String(hour).padStart(2, '0')}:00</div>
                  {days.map((date) => (
                    <div className={`calendar-hour-cell${sameDay(date, selectedDate) ? ' is-today' : ''}`} key={date.toDateString()}>
                      {deadlines.filter((entry) => sameDay(entry.date, date) && entry.date.getHours() === hour).map(eventButton)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {mode !== 'month' && <p className="calendar-scroll-hint">Cuộn trong lịch để xem đầy đủ 00:00–23:59.</p>}
        {withoutDeadline.length > 0 && (
          <p className="muted calendar-no-deadline">{withoutDeadline.length} báo cáo không có hạn nộp. <button type="button" className="calendar-text-button" onClick={onShowList}>Xem danh sách</button></p>
        )}
      </section>
      <aside className="calendar-sidebar">
        <section className="workspace-panel calendar-mini" aria-label="Lịch chọn ngày">
          <div className="calendar-mini-heading">
            <h2>{miniMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h2>
            <button type="button" aria-label="Tháng trước" onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1))}>‹</button>
            <button type="button" aria-label="Tháng sau" onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="calendar-mini-grid">
            {weekdays.map((day) => <strong key={day}>{day}</strong>)}
            {miniDays.map((date) => (
              <button type="button" key={date.toDateString()} aria-label={dayLabel(date)}
                aria-pressed={sameDay(date, selectedDate)}
                className={`${date.getMonth() !== miniMonth.getMonth() ? 'is-outside ' : ''}${deadlines.some((entry) => sameDay(entry.date, date)) ? 'has-deadline' : ''}`}
                onClick={() => { chooseDate(date); setMode('week') }}>{date.getDate()}</button>
            ))}
          </div>
        </section>
        <section className="workspace-panel calendar-upcoming">
          <div className="calendar-mini-heading"><h2>Hạn nộp sắp tới</h2><button type="button" className="calendar-text-button" onClick={onShowList}>Xem tất cả</button></div>
          {upcoming.length ? upcoming.map((entry) => (
            <button type="button" className="calendar-upcoming-item" key={entry.report.id} disabled={disabled} onClick={() => onSelect(entry.report.id)}>
              <strong>{entry.report.title}</strong><span>{timeLabel(entry.date)} · {dayLabel(entry.date)}</span>
              {entry.report.groupName && <span>{entry.report.groupName}</span>}
            </button>
          )) : <p className="muted">Không có hạn nộp sắp tới.</p>}
        </section>
      </aside>
    </div>
  )
}

export default ReportsCalendar
