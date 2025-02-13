const IS_DEV = process.env.NODE_ENV === 'development'

export const getBaseURL = () => {
  if (IS_DEV) {
    return 'http://localhost:3000'
  }
  return 'https://app.flowglad.com'
}
