const IS_DEV = process.env.NODE_ENV === 'development'

export const getBaseURL = () => {
  // allow override in dev
  if (IS_DEV && process.env.FLOWGLAD_API_URL_OVERRIDE) {
    return process.env.FLOWGLAD_API_URL_OVERRIDE
  }
  return 'https://app.flowglad.com'
}
