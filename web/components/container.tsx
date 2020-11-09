import React from 'react'

interface Container {
  children: JSX.Element | JSX.Element[] | string
}

const Container = ({ children }: Container): JSX.Element => (
  <div className="py-6 h-screen">
    <div className="container mx-auto max-w-lg bg-gray-100 h-full rounded-sm">{children}</div>
  </div>
)

export default Container
