interface HeroMenuProps {
  image: string;
  title: string;
  subtitle: string;
}

export default function HeroMenu({ image, title, subtitle }: HeroMenuProps) {
  return (
    <div className="relative h-[50vh] md:h-[60vh] bg-gradient-to-b from-red-900/80 to-red-900/20 overflow-hidden">
      {/* Background Image */}
      <img
        src={image}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" data-testid="text-hero-title">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-white/90" data-testid="text-hero-subtitle">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
