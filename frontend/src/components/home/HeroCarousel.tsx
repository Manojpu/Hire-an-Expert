import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import heroConsultation from '@/assets/hero-consultation.jpg';
import heroTechnology from '@/assets/hero-technology.jpg';
import heroSuccess from '@/assets/hero-success.jpg';

const slides = [
	{
		id: 1,
		image: heroConsultation,
		title: 'Connect with Verified Experts Instantly',
		subtitle: 'Get professional advice from certified experts across multiple domains',
		cta: 'Find an Expert',
	},
	{
		id: 2,
		image: heroTechnology,
		title: 'Expert Guidance at Your Fingertips',
		subtitle: 'Book consultations with industry professionals who understand your needs',
		cta: 'Browse Categories',
	},
	{
		id: 3,
		image: heroSuccess,
		title: 'Transform Your Success Story',
		subtitle: "Join thousands who've achieved their goals with expert consultation",
		cta: 'Get Started',
	},
];

const HeroCarousel = () => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);

	useEffect(() => {
		if (!isAutoPlaying) return;

		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % slides.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [isAutoPlaying]);

	const goToSlide = (index: number) => {
		setCurrentSlide(index);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	const nextSlide = () => {
		setCurrentSlide((prev) => (prev + 1) % slides.length);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	const prevSlide = () => {
		setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	return (
		<div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-xl">
			{/* Slides */}
			<div className="relative h-full">
				{slides.map((slide, index) => (
					<div
						key={slide.id}
						className={`absolute inset-0 transition-opacity duration-1000 ${
							index === currentSlide ? 'opacity-100' : 'opacity-0'
						}`}
					>
						<div className="relative h-full">
							<img
								src={slide.image}
								alt={slide.title}
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 via-primary/60 to-primary/20" />

							{/* Content */}
							<div className="absolute inset-0 flex items-center">
								<div className="container mx-auto px-6 md:px-12">
									<div className="max-w-2xl">
										<h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
											{slide.title}
										</h1>
										<p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
											{slide.subtitle}
										</p>
										<div className="flex flex-col sm:flex-row gap-4">
											<Link to="/categories">
												<Button
													size="lg"
													className="bg-secondary hover:bg-secondary-light text-secondary-foreground font-semibold px-8 py-3 transition-all duration-300 hover:scale-105"
												>
													{slide.cta}
												</Button>
											</Link>
											<Link to="/become-expert">
												<Button
													variant="outline"
													size="lg"
													className="border-white/30 text-white bg-white/10 hover:bg-white/10 font-semibold px-8 py-3 transition-all duration-300"
												>
													Become an Expert
												</Button>
											</Link>
										</div>

										{/* Trust Indicators */}
										<div className="flex flex-wrap items-center gap-6 mt-8 text-white/80">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-white">500+</span>
												<span className="text-sm">Experts</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="font-semibold text-white">10,000+</span>
												<span className="text-sm">Consultations</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="font-semibold text-white">4.8★</span>
												<span className="text-sm">Rating</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Navigation Arrows */}
			<button
				onClick={prevSlide}
				className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
			>
				<ChevronLeft className="h-6 w-6 text-white" />
			</button>
			<button
				onClick={nextSlide}
				className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
			>
				<ChevronRight className="h-6 w-6 text-white" />
			</button>

			{/* Dots Indicator */}
			<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
				{slides.map((_, index) => (
					<button
						key={index}
						onClick={() => goToSlide(index)}
						className={`w-3 h-3 rounded-full transition-all duration-300 ${
							index === currentSlide
								? 'bg-white scale-110'
								: 'bg-white/50 hover:bg-white/70'
						}`}
					/>
				))}
			</div>
		</div>
	);
};

export default HeroCarousel;