import dynamic from 'next/dynamic';

export const CommitmentModal = dynamic(
  () =>
    import('@/components/commitments/commitment-modal').then(
      (m) => m.CommitmentModal,
    ),
  { ssr: false, loading: () => null },
);

export const ChatWidget = dynamic(
  () =>
    import('@/components/chat/chat-widget').then((m) => m.ChatWidget),
  { ssr: false, loading: () => null },
);

export const WelcomeSlides = dynamic(
  () =>
    import('@/components/onboarding/welcome-slides').then(
      (m) => m.WelcomeSlides,
    ),
  { ssr: false, loading: () => null },
);

export const CompareBar = dynamic(
  () =>
    import('@/components/products/compare-bar').then((m) => m.CompareBar),
  { ssr: false, loading: () => null },
);

export const PricingAiGuide = dynamic(
  () =>
    import('@/components/pricing/pricing-ai-guide').then(
      (m) => m.PricingAiGuide,
    ),
  { ssr: false, loading: () => null },
);

export const ProductPdfExport = dynamic(
  () =>
    import('@/components/products/product-pdf-export').then(
      (m) => m.ProductPdfExport,
    ),
  { ssr: false, loading: () => null },
);
