import { SimulazioniHero } from '@/components/simulazioni/SimulazioniHero';
import { BookExamCtaBanner } from '@/components/simulazioni/BookExamCtaBanner';

export default function SimulazioniPage() {
  return (
    <div className="w-full px-6 lg:px-9 pt-3 pb-7 space-y-6">
      <SimulazioniHero />
      <BookExamCtaBanner />
    </div>
  );
}
