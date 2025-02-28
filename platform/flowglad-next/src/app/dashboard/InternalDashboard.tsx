// Generated with Ion on 10/31/2024, 6:10:56 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=1033:8693
'use client'
import PageTitle from '../components/ion/PageTitle'
import DateRangeRevenueChart from '../components/DateRangeRevenueChart'

export interface DashboardPageProps {
  organizationCreatedAt: Date
}

function InternalDashboardPage({
  organizationCreatedAt,
}: DashboardPageProps) {
  /**
   * Not declaring a default toDate, to handle the case where this
   * page is live across a date line (loaded < 12am, but open > 12am).
   */
  return (
    <>
      <div className="bg-internal flex-1 flex items-start gap-6 p-6 h-full w-full overflow-y-scroll">
        <div className="w-full flex flex-col gap-10 rounded-radius-sm">
          <PageTitle>Dashboard</PageTitle>
          <DateRangeRevenueChart
            organizationCreatedAt={organizationCreatedAt}
          />
          <div className="w-full flex flex-col gap-6">
            {/* <div className="w-full flex flex-col">
              <div className="w-full flex flex-col">
                <div className="w-full flex flex-col gap-8 pb-6">
                  <div className="text-3xl font-semibold text-on-primary-hover w-full">
                    Overview
                  </div>
                </div>
                <div className="w-full flex items-start gap-5">
                  <div className="bg-nav flex-1 w-full flex flex-col gap-3 p-8 rounded-radius-lg border border-stroke-subtle">
                    <div className="w-full flex items-center rounded-sm py-2">
                      <RevenueCategoryBar
                        serviceRevenue={1230}
                        productRevenue={500}
                        otherRevenue={100}
                      />
                    </div>
                  </div>
                  <div className="bg-nav flex-1 h-[244px] w-full relative flex flex-col gap-2 p-8 rounded-radius-lg border border-stroke-subtle"></div>
                </div>
              </div>
            </div>
            <div className="w-full flex items-start gap-5"> */}
            {/* <div className="bg-nav flex-1 w-full flex flex-col gap-3 p-8 rounded-radius-lg border border-stroke-subtle"> */}
            {/* <div className="w-full flex flex-col gap-1">
                  <Button onClick={buttonOnClickHandler}>
                    Button
                  </Button>
                </div> */}
            {/* <div className="w-full flex flex-col gap-2 text-sm">
                  <div className="w-full flex flex-col gap-2">
                    {[{}, {}, {}, {}].map(({}, index) => (
                      <div
                        className="w-full flex justify-between items-center gap-[66px] pb-2 border-b border-stroke-subtle"
                        key={index}
                      >
                        <div className="w-fit flex flex-col justify-center">
                          <div className="text-on-primary-hover">
                            John Doe
                          </div>
                          <div className="text-secondary">
                            john@justpaid.com
                          </div>
                        </div>
                        <div className="text-foreground">
                          $81,845.90
                        </div>
                      </div>
                    ))}
                  </div>
                </div> */}
            {/* <div className="w-full flex justify-between items-start gap-6">
                  <Button
                    variant="ghost"
                    color="primary"
                    size="md"
                    onClick={viewMoreClickHandler}
                  >
                    View More
                  </Button>
                  <div className="text-sm text-secondary">
                    Updated 7:01 PM
                  </div>
                </div> */}
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

export default InternalDashboardPage
