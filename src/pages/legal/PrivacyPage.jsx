import LegalPage from '@/pages/LegalPage';
import { PRIVACY } from '@/content/legal';

export default function PrivacyPage() {
  return (
    <LegalPage
      seoKey="privacy"
      eyebrow="Privacy"
      title="Privacy policy"
      intro="What we collect, why, who else sees it, and what happens to your voice recordings. Written to be read, not to be skipped."
      sections={PRIVACY}
    />
  );
}
