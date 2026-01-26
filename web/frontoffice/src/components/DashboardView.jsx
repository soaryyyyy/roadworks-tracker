import PropTypes from 'prop-types'
import './DashboardView.css'

export function DashboardView({ events }) {
  const summary = events.reduce(
    (acc, event) => {
      const state = event.detail_problem.etat
      acc.states[state] = (acc.states[state] || 0) + 1
      acc.nbPoints += 1
      acc.totalSurface += event.detail_problem.surface_m2
      acc.totalBudget += event.detail_problem.budget
      if (state === 'termine') {
        acc.completed += 1
      }
      return acc
    },
    {
      states: {},
      nbPoints: 0,
      totalSurface: 0,
      totalBudget: 0,
      completed: 0,
    }
  )

  const progressPercent = summary.nbPoints ? Math.round((summary.completed / summary.nbPoints) * 100) : 0

  return (
    <div className="dashboard-panel">
      <section className="dashboard-summary">
        <h2>Tableau de recap</h2>
        <div className="summary-grid summary-grid--highlight">
          <article>
            <p>Nb de points</p>
            <strong>{summary.nbPoints}</strong>
          </article>
          <article>
            <p>Total surface</p>
            <strong>{Math.round(summary.totalSurface)} m²</strong>
          </article>
          <article>
            <p>Total budget</p>
            <strong>{summary.totalBudget.toLocaleString()} Ar</strong>
          </article>
          <article>
            <p>Avancement</p>
            <strong>{progressPercent}%</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-summary">
        <h2>Vue d'ensemble</h2>
        <div className="summary-grid">
          {Object.entries(summary.states).map(([status, count]) => (
            <div className="summary-card" key={status}>
              <strong>{status.replace('_', ' ')}</strong>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-list">
        <h3>Liste des problèmes</h3>
        <div className="issue-list">
          {events.map((event) => (
            <article key={event.id} className="issue-card">
              <header>
                <span className="issue-icon">{event.illustration_problem}</span>
                <div>
                  <strong>{event.type_problem.replace(/_/g, ' ')}</strong>
                  <p>Etat : {event.detail_problem.etat}</p>
                </div>
              </header>
              <ul>
                <li>Date : {new Date(event.detail_problem.date_problem).toLocaleDateString()}</li>
                <li>Surface : {event.detail_problem.surface_m2} m²</li>
                <li>Budget : {event.detail_problem.budget.toLocaleString()} Ar</li>
                <li>Equipe : {event.detail_problem.entreprise_assign?.name ?? '—'}</li>
              </ul>
              <p className="issue-description">{event.detail_problem.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

DashboardView.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type_problem: PropTypes.string.isRequired,
      illustration_problem: PropTypes.string.isRequired,
      detail_problem: PropTypes.shape({
        etat: PropTypes.string.isRequired,
        date_problem: PropTypes.string.isRequired,
        surface_m2: PropTypes.number.isRequired,
        budget: PropTypes.number.isRequired,
        entreprise_assign: PropTypes.shape({
          id: PropTypes.number,
          name: PropTypes.string,
        }),
        description: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
}
