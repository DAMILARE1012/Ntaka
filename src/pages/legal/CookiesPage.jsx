import LegalPage from '@/pages/LegalPage';
import { COOKIES } from '@/content/legal';

export default function CookiesPage() {
  return (
    <LegalPage
      seoKey="cookies"
      eyebrow="Cookies"
      title="Cookies and browser storage"
      intro="A short list, because we store very little and none of it for advertising."
      sections={COOKIES}
    />
  );
}
