import React from 'react'

type CardProps = React.HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  const base = 'bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 transition-colors'
  const cls = [base, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  )
}
