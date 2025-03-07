import { useState } from 'react'
import { DateRangePicker } from './ion/Datepicker'
import { RevenueChart } from './RevenueChart'

const DateRangeRevenueChart = ({
  organizationCreatedAt,
  alignDatePicker = 'left',
  ProductId,
}: {
  organizationCreatedAt: Date
  alignDatePicker?: 'left' | 'right'
  ProductId?: string
}) => {
  const defaultFromDate = new Date(organizationCreatedAt)
  const [range, setRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(organizationCreatedAt),
    to: new Date(),
  })

  return (
    <>
      <div
        className={`flex ${
          alignDatePicker === 'right' ? 'justify-end' : ''
        }`}
      >
        <DateRangePicker
          fromDate={range.from}
          toDate={range.to}
          minDate={new Date(organizationCreatedAt)}
          maxDate={new Date()}
          onSelect={(range) => {
            setRange({
              from: range?.from ?? defaultFromDate,
              to: range?.to ?? new Date(),
            })
          }}
          mode="range"
        />
      </div>
      <div className="w-full flex flex-col">
        <div className="bg-nav w-full relative flex flex-col gap-6 p-8 pt-4 rounded-radius-sm border border-stroke-subtle">
          <div className="w-full flex flex-col gap-2">
            <RevenueChart
              fromDate={range.from}
              toDate={range.to}
              ProductId={ProductId}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default DateRangeRevenueChart
