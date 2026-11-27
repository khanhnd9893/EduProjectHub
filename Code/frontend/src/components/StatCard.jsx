const statIcons = {
  groups: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20m6-9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm6-6.8a3.5 3.5 0 010 6.6M20 20v-1.5a3.5 3.5 0 00-2.7-3.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  tasks: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M8 5h11M8 12h11M8 19h11M4 5h.01M4 12h.01M4 19h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  ),
  deadline: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  users: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20m6-9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm6-6.8a3.5 3.5 0 010 6.6M20 20v-1.5a3.5 3.5 0 00-2.7-3.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  topics: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M6 4.5h12a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18V6A1.5 1.5 0 016 4.5zM8 9h8M8 12.5h8M8 16h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  ),
  rounds: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="15" rx="2" stroke="currentColor" strokeWidth="1.8" width="16" x="4" y="6" />
      <path d="M8 3.5v5M16 3.5v5M4 10h16m-11 4h2m3 0h2m-7 3h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ),
}

function getIcon(label) {
  if (label.includes('Nhóm')) return statIcons.groups
  if (label.includes('Nhiệm vụ')) return statIcons.tasks
  if (label.includes('Hạn')) return statIcons.deadline
  if (label.includes('Tài khoản')) return statIcons.users
  if (label.includes('Đợt')) return statIcons.rounds
  return statIcons.topics
}

function StatCard({ label, value, detail, detailTone = 'neutral' }) {
  return (
    <article className="stat-card">
      <span className="stat-icon">{getIcon(label)}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className={`stat-detail stat-detail--${detailTone}`}>{detail}</span>
    </article>
  )
}

export default StatCard
