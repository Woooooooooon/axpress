import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import { PaperProvider } from "@/contexts/PaperContext"
import { ChatbotProvider } from "@/contexts/ChatbotContext"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "AX College",
  description: "AX College",
  generator: "woon",
  icons: { icon: "/education-hat.ico" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="font-sans">
        <PaperProvider>
          <ChatbotProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <Toaster />
          </ChatbotProvider>
        </PaperProvider>
      </body>
    </html>
  )
}
