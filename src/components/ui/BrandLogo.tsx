import logoWithText from '@/assets/images/logo(text).png';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'h-12 w-auto' }: BrandLogoProps) {
  return <img src={logoWithText} alt="Threefold" className={className} />;
}