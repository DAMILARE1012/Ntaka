import Hero from '@/features/home/components/Hero';
import LanguageRail from '@/features/home/components/LanguageRail';
import PlacementBanner from '@/features/home/components/PlacementBanner';
import Offerings from '@/features/home/components/Offerings';
import FeaturedTeachers from '@/features/home/components/FeaturedTeachers';
import { UpcomingClasses, PopularCourses } from '@/features/home/components/HomeRails';
import Testimonials from '@/features/home/components/Testimonials';
import Partners from '@/features/home/components/Partners';
import TeachCta from '@/features/home/components/TeachCta';
import Seo from '@/components/common/Seo';
import { homeSeo } from '@/lib/seo';
import { graph, organization, website } from '@/lib/structuredData';

export default function HomePage() {
  return (
    <>
      <Seo {...homeSeo()} jsonLd={graph(organization(), website())} />
      <Hero />
      <LanguageRail />
      <PlacementBanner />
      <Offerings />
      <FeaturedTeachers />
      <UpcomingClasses />
      <PopularCourses />
      <Testimonials />
      <Partners />
      <TeachCta />
    </>
  );
}
