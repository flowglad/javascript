import { FieldError, GlobalError } from 'react-hook-form'

const ErrorLabel = ({
  error,
}: {
  error?: string | FieldError | GlobalError
}) => {
  if (!error) {
    return null
  }
  const errorMessage =
    typeof error === 'string' ? error : error.message
  return <p className="mt-1 text-sm text-danger">{errorMessage}</p>
}

export default ErrorLabel
