import './globals.css'
import { Header } from '../components/Header'
import { ToastProvider } from '../components'

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="id">
      <body className="font-[Inter]">
        <ToastProvider>
          <Header />
          <main className="max-w-[1100px] mx-auto p-5">{children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
