import Link from "next/link";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-slate">
          The page you are looking for does not exist. Try the dashboard or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/app">Go to dashboard</Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate/20 bg-white px-5 py-2 text-sm font-semibold text-slate transition hover:border-ink hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </Card>
    </div>
  );
}
