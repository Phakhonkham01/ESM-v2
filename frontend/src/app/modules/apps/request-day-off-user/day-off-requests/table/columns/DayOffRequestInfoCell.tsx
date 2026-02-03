interface DayOffRequestInfoCellProps {
  name: string
  email?: string
}

const DayOffRequestInfoCell = ({ name, email }: DayOffRequestInfoCellProps) => {
  return (
    <div className="d-flex align-items-center">
      <div className="d-flex flex-column">
        <span className="fw-semibold text-gray-800">{name}</span>
        {email && <span className="text-muted fs-7">{email}</span>}
      </div>
    </div>
  )
}

export { DayOffRequestInfoCell }