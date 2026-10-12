import { createContext, useContext, useState, type ReactNode } from 'react';

interface HeroSlideContextValue {
  pastFirstSlide: boolean;
  setPastFirstSlide: (value: boolean) => void;
}

const HeroSlideContext = createContext<HeroSlideContextValue | undefined>(undefined);

export function HeroSlideProvider({ children }: { children: ReactNode }) {
  const [pastFirstSlide, setPastFirstSlide] = useState(false);
  return <HeroSlideContext.Provider value={{ pastFirstSlide, setPastFirstSlide }}>{children}</HeroSlideContext.Provider>;
}

export function useHeroSlide() {
  const ctx = useContext(HeroSlideContext);
  if (!ctx) throw new Error('useHeroSlide must be used within HeroSlideProvider');
  return ctx;
}
