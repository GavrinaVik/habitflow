import { useEffect } from "react";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
import Faq from "../components/Faq";
import { initVisitTiming } from "../lib/metrica";
import { usePageMeta } from "../lib/seo";

/**
 * Лендинг: главная страница сервиса.
 * Сегменты ссылаются на страницу тарифов (/pricing).
 */
export default function LandingPage() {
  usePageMeta("HabitFlow", "Превратите полезные привычки в игру: численные цели, прогресс-бары и награды за серии.");
  useEffect(() => {
    initVisitTiming();
  }, []);

  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Faq />
    </main>
  );
}