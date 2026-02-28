import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/header"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.08),transparent_50%)] pointer-events-none" />
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10 relative z-10">
        <div className="w-full max-w-sm">
          <Card className="border-purple-500/20 shadow-lg shadow-purple-500/10">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-red-500 flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-br from-purple-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base">
                We&apos;ve sent you a confirmation link to verify your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Please check your email and click the confirmation link to activate your account. Once confirmed,
                you&apos;ll be able to track your reading progress across all novels.
              </p>
              <Link href="/" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-red-500 hover:from-purple-600 hover:to-red-600">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
