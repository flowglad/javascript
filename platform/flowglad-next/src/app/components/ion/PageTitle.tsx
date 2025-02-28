const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-4xl font-semibold text-on-primary-hover">
      {children}
    </div>
  )
}

export default PageTitle
