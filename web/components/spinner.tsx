import React from 'react'
import classnames from 'classnames'
interface SpinnerProps {
  className?: string
}
const Spinner = ({ className }: SpinnerProps) => {
  const spinnerClassname = classnames(
    className,
    'spinner rounded-full w-5 h-5 border-gray-500 dark:border-gray-900 border-solid border-2',
  )
  return (
    <div className={spinnerClassname}>
      <style jsx>{`
        .spinner {
          border-left-color: #fff;
          animation: load8 0.8s infinite linear;
        }
        @-webkit-keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
        @keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default Spinner
