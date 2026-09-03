import Button from '@/components/ui/Button';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';

export default function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center py-28 text-center">
      <Seo {...STATIC_SEO.notFound} />
      <p className="font-display text-5xl font-semibold text-brand">404</p>
      <h1 className="mt-4 text-xl font-semibold">We could not find that page</h1>
      <p className="mt-2 max-w-md text-muted">
        The link may be old, or the page may have moved. Try starting from the languages you can
        learn on Ntaka.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/languages" variant="outline">
          Browse languages
        </Button>
      </div>
    </div>
  );
}
