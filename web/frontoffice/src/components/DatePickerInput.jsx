import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

const pad2 = (value) => `${value}`.padStart(2, '0')

const formatDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

const parseDateText = (text) => {
  const trimmed = (text || '').trim()
  if (!trimmed) return null

  // Accept dd/MM/yyyy or dd-MM-yyyy
  const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  const candidate = new Date(year, month - 1, day)
  if (Number.isNaN(candidate.getTime())) return null
  // Guard invalid dates like 31/02/2026
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null
  }
  candidate.setHours(0, 0, 0, 0)
  return candidate
}

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)
const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
const dayOfWeekMondayFirst = (date) => (date.getDay() + 6) % 7
const YEAR_CHUNK = 10
const YEAR_ITEM_HEIGHT = 28

const isSameDay = (a, b) => {
  if (!(a instanceof Date) || !(b instanceof Date)) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function DatePickerInput({ value, onChange, placeholder }) {
  const rootRef = useRef(null)
  const popoverRef = useRef(null)
  const yearListRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [yearOpen, setYearOpen] = useState(false)
  const [placement, setPlacement] = useState('bottom')
  const [shiftX, setShiftX] = useState(0)
  const [draft, setDraft] = useState(() => formatDate(value))
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value ?? new Date()))
  const [yearStart, setYearStart] = useState(() => viewMonth.getFullYear() - YEAR_CHUNK)
  const [yearEnd, setYearEnd] = useState(() => viewMonth.getFullYear() + YEAR_CHUNK)
  const pendingPrependRef = useRef(0)
  const initializedScrollRef = useRef(false)

  useEffect(() => {
    setDraft(formatDate(value))
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      setViewMonth(startOfMonth(value))
    }
  }, [value])

  useEffect(() => {
    if (!open) {
      initializedScrollRef.current = false
      setYearOpen(false)
      return
    }
    const year = viewMonth.getFullYear()
    setYearStart(year - YEAR_CHUNK)
    setYearEnd(year + YEAR_CHUNK)
  }, [open])

  useEffect(() => {
    if (!yearOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setYearOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [yearOpen])

  useEffect(() => {
    const year = viewMonth.getFullYear()
    if (year < yearStart) {
      setYearStart(year - YEAR_CHUNK)
    } else if (year > yearEnd) {
      setYearEnd(year + YEAR_CHUNK)
    }
  }, [viewMonth, yearStart, yearEnd])

  useEffect(() => {
    const onDocMouseDown = (event) => {
      const root = rootRef.current
      if (!root) return
      if (root.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    if (pendingPrependRef.current && yearListRef.current) {
      yearListRef.current.scrollTop += pendingPrependRef.current * YEAR_ITEM_HEIGHT
      pendingPrependRef.current = 0
    }
  }, [yearStart])

  useEffect(() => {
    if (!open || !yearOpen || initializedScrollRef.current || !yearListRef.current) return
    const year = viewMonth.getFullYear()
    const offset = Math.max(0, year - yearStart)
    yearListRef.current.scrollTop = Math.max(0, offset * YEAR_ITEM_HEIGHT - YEAR_ITEM_HEIGHT * 2)
    initializedScrollRef.current = true
  }, [open, yearOpen, yearStart, viewMonth])

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    const popover = popoverRef.current
    if (!root || !popover) return

    const measure = () => {
      const margin = 8
      const rect = popover.getBoundingClientRect()
      const container = root.closest('.filters-panel, .filters-bar')
      const bounds = container ? container.getBoundingClientRect() : null
      const minLeft = (bounds?.left ?? 0) + margin
      const maxRight = (bounds?.right ?? window.innerWidth) - margin

      let nextShift = 0
      if (rect.right > maxRight) {
        nextShift -= rect.right - maxRight
      }
      if (rect.left + nextShift < minLeft) {
        nextShift += minLeft - (rect.left + nextShift)
      }
      setShiftX(nextShift)

      const viewportBottom = window.innerHeight - margin
      const wouldOverflowBottom = rect.bottom > viewportBottom
      setPlacement(wouldOverflowBottom ? 'top' : 'bottom')
    }

    // Let the browser lay out once (fonts/width) before measuring.
    const raf = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open])

  const weeks = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const leading = dayOfWeekMondayFirst(first)
    const totalDays = daysInMonth(viewMonth)
    const cells = []

    for (let i = 0; i < leading; i += 1) cells.push(null)
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
    }
    while (cells.length % 7 !== 0) cells.push(null)

    const rows = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [viewMonth])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const commitParsedIfValid = () => {
    const parsed = parseDateText(draft)
    if (!parsed) return false
    onChange(parsed)
    return true
  }

  const monthOptions = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
    return Array.from({ length: 12 }, (_, idx) => ({
      value: idx,
      label: formatter.format(new Date(2026, idx, 1)),
    }))
  }, [])

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = yearStart; y <= yearEnd; y += 1) years.push(y)
    return years
  }, [yearStart, yearEnd])

  return (
    <div className="dp" ref={rootRef}>
      <div className="dp-inputShell">
        <input
          className="dp-input"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              return
            }
            if (event.key === 'Enter') {
              if (commitParsedIfValid()) setOpen(false)
            }
          }}
          onBlur={() => {
            // Don’t close here (clicking a day triggers blur); document handler closes on outside click.
            commitParsedIfValid()
          }}
        />
        <button
          type="button"
          className="dp-iconBtn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Ouvrir le calendrier"
        />
      </div>

      {open && (
        <div
          className={[
            'dp-popover',
            placement === 'top' ? 'dp-popover--top' : 'dp-popover--bottom',
          ].join(' ')}
          role="dialog"
          aria-label="Calendrier"
          ref={popoverRef}
          style={{ transform: `translateX(${shiftX}px)` }}
        >
          <div className="dp-header">
            <button
              type="button"
              className="dp-navBtn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setViewMonth((prev) => addMonths(prev, -1))}
              aria-label="Mois précédent"
            >
              ←
            </button>
            <div className="dp-monthControls">
              <select
                className="dp-select"
                value={viewMonth.getMonth()}
                onChange={(event) => {
                  const month = Number(event.target.value)
                  if (!Number.isFinite(month)) return
                  setViewMonth((prev) => new Date(prev.getFullYear(), month, 1))
                }}
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="dp-yearSelect">
                <button
                  type="button"
                  className="dp-select dp-yearSelectBtn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    initializedScrollRef.current = false
                    setYearOpen((prev) => !prev)
                  }}
                  aria-expanded={yearOpen}
                >
                  {viewMonth.getFullYear()}
                </button>
                {yearOpen && (
                  <div className="dp-yearDropdown" role="listbox">
                    <div
                      className="dp-yearList"
                      ref={yearListRef}
                      onScroll={(event) => {
                        const el = event.currentTarget
                        const threshold = 12
                        if (el.scrollTop < threshold) {
                          pendingPrependRef.current += YEAR_CHUNK
                          setYearStart((prev) => prev - YEAR_CHUNK)
                        }
                        if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
                          setYearEnd((prev) => prev + YEAR_CHUNK)
                        }
                      }}
                    >
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          className={[
                            'dp-yearItem',
                            year === viewMonth.getFullYear() ? 'dp-yearItem--active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setViewMonth((prev) => new Date(year, prev.getMonth(), 1))
                            setYearOpen(false)
                          }}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="dp-navBtn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setViewMonth((prev) => addMonths(prev, 1))}
              aria-label="Mois suivant"
            >
              →
            </button>
          </div>

          <div className="dp-grid">
            {['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'].map((label, idx) => (
              <div key={`${label}_${idx}`} className="dp-dow">
                {label}
              </div>
            ))}

            {weeks.flat().map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} className="dp-cell dp-cell--empty" />
              }
              const selected = value && isSameDay(cell, value)
              const isToday = isSameDay(cell, today)
              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  className={[
                    'dp-cell',
                    selected ? 'dp-cell--selected' : '',
                    isToday ? 'dp-cell--today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(cell)
                    setDraft(formatDate(cell))
                    setOpen(false)
                  }}
                >
                  {cell.getDate()}
                </button>
              )
            })}
          </div>

          <div className="dp-actions">
            <button
              type="button"
              className="dp-actionBtn"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(null)
                setDraft('')
                setOpen(false)
              }}
            >
              Effacer
            </button>
            <button
              type="button"
              className="dp-actionBtn dp-actionBtn--primary"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const d = new Date()
                d.setHours(0, 0, 0, 0)
                onChange(d)
                setDraft(formatDate(d))
                setViewMonth(startOfMonth(d))
                setOpen(false)
              }}
            >
              Aujourd’hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

DatePickerInput.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
}

DatePickerInput.defaultProps = {
  value: null,
  placeholder: 'jj/mm/aaaa',
}
