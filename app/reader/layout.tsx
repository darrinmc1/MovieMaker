import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Plasma from "@/components/plasma"

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Novel Reading Platform | Immersive Story Experience",
  description:
    "Discover and read novels with an enhanced reading experience. Track characters, plot threads, and timelines while enjoying beautifully formatted chapters with director's notes and community discussions.",
  generator: "v0.app",
  openGraph: {
    title: "Novel Reading Platform | Immersive Story Experience",
    description:
      "Discover and read novels with an enhanced reading experience featuring character tracking, plot threads, and community discussions.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Novel Reading Platform | Immersive Story Experience",
    description:
      "Discover and read novels with an enhanced reading experience featuring character tracking, plot threads, and community discussions.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className}`}>
      <body>
        <div className="fixed inset-0 z-0 bg-black">
          <Plasma color="#8b5cf6" speed={0.8} direction="forward" scale={1.5} opacity={0.4} mouseInteractive={true} />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
