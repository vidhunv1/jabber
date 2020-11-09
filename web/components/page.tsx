import NextHead from 'next/head'
import React from 'react'

interface PageProps {
  children: JSX.Element
  description?: string
  title?: string
}
const Page = ({ children, title = 'Jabber', description = 'Encrypted messaging on Solana' }: PageProps) => {
  return (
    <>
      <NextHead>
        <title>{title}</title>
        <meta name="og:title" content={title} />

        <meta name="description" content={description} />
        <meta property="og:description" content={description} />

        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
        <meta name="theme-color" content="#000000" />
      </NextHead>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #000;
        }
      `}</style>

      <main>{children}</main>
    </>
  )
}

export default Page
