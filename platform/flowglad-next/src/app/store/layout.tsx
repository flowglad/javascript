import SidebarLayout from '@/app/components/SidebarLayout'

const CatalogLayout = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <SidebarLayout>{children}</SidebarLayout>
}

export default CatalogLayout
