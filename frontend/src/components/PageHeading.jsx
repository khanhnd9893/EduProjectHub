function PageHeading({ eyebrow, title, description, status }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {status && <span className="status-chip">{status}</span>}
    </div>
  )
}

export default PageHeading
