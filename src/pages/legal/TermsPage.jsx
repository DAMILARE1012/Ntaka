import LegalPage from '@/pages/LegalPage';
import { TERMS } from '@/content/legal';

export default function TermsPage() {
  return (
    <LegalPage
      seoKey="terms"
      eyebrow="Terms"
      title="Terms of service"
      intro="The agreement between you and Ntaka: accounts, bookings, payments, and what we each owe the other."
      sections={TERMS}
    />
  );
}
