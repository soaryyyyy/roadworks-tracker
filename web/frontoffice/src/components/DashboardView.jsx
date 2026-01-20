import PropTypes from 'prop-types'
import './DashboardView.css'

export function DashboardView({ events }) {
  const statusCounts = events.reduce(
    (acc, event) => {
      const state = event.detail_problem.etat
      acc[state] = (acc[state] || 0) + 1
      return acc
    },
    {}
  )

  return (
    <div className="dashboard-panel">
      <section className="dashboard-summary">
        <h2>Vue d ensemble</h2>
        <div className="summary-grid">
          {Object.entries(statusCounts).map(([status, count]) => (
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
                <li>Equipe : {event.detail_problem.entreprise_assign.name}</li>
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
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
        }),
        description: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
}
