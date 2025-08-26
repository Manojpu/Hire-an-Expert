import { Star, MapPin, Clock, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const featuredExperts = [
	{
		id: 'expert-001',
		name: 'Dr. Sarah Johnson',
		title: 'Senior Automotive Engineer',
		category: 'Automobile Advice',
		profileImage:
			'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
		rating: 4.9,
		reviewCount: 127,
		hourlyRate: 2500,
		totalConsultations: 450,
		responseTime: '< 2 hours',
		location: 'Colombo, Sri Lanka',
		expertise: [
			'Electric Vehicles',
			'Engine Diagnostics',
			'Vehicle Purchasing',
		],
		availability: 'Available Now',
	},
	{
		id: 'expert-002',
		name: 'Michael Chen',
		title: 'Tech Hardware Specialist',
		category: 'Electronic Devices',
		profileImage:
			'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
		rating: 4.8,
		reviewCount: 203,
		hourlyRate: 3000,
		totalConsultations: 380,
		responseTime: '< 1 hour',
		location: 'Kandy, Sri Lanka',
		expertise: ['Laptop Repair', 'Gaming Setups', 'Smart Home'],
		availability: 'Available Today',
	},
	{
		id: 'expert-003',
		name: 'Priya Patel',
		title: 'Career Development Coach',
		category: 'Education & Career',
		profileImage:
			'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
		rating: 4.9,
		reviewCount: 189,
		hourlyRate: 2200,
		totalConsultations: 520,
		responseTime: '< 3 hours',
		location: 'Galle, Sri Lanka',
		expertise: [
			'Career Planning',
			'Interview Prep',
			'Skill Development',
		],
		availability: 'Available Now',
	},
];

const FeaturedExperts = () => {
	return (
		<section className="py-16 bg-muted/30">
			<div className="container mx-auto px-4">
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
						Featured Experts
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Connect with our top-rated professionals who have helped thousands
						achieve their goals
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
					{featuredExperts.map((expert) => (
						<Card
							key={expert.id}
							className="group hover:shadow-hover transition-all duration-300 hover:-translate-y-1 bg-background border-0"
						>
							<CardContent className="p-0">
								{/* Header with Image */}
								<div className="relative h-32 bg-gradient-primary rounded-t-lg overflow-hidden">
									<div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-dark/60" />
									<div className="absolute bottom-4 left-4 right-4">
										<div className="flex items-center justify-between">
											<div className="text-white">
												<div className="text-xs opacity-90">
													{expert.category}
												</div>
												<div className="flex items-center mt-1">
													<span
														className={`px-2 py-1 text-xs rounded-full ${
															expert.availability ===
															'Available Now'
																? 'bg-accent text-accent-foreground'
																: 'bg-secondary text-secondary-foreground'
														}`}
													>
														{expert.availability}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Profile Image */}
								<div className="relative px-6 -mt-8">
									<div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden bg-background">
										<img
											src={expert.profileImage}
											alt={expert.name}
											className="w-full h-full object-cover"
										/>
									</div>
								</div>

								{/* Content */}
								<div className="px-6 pb-6 pt-2">
									<h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
										{expert.name}
									</h3>
									<p className="text-sm text-muted-foreground mb-3">
										{expert.title}
									</p>

									{/* Rating and Reviews */}
									<div className="flex items-center mb-3">
										<div className="flex items-center">
											<Star className="h-4 w-4 text-yellow-500 fill-current" />
											<span className="text-sm font-medium text-foreground ml-1">
												{expert.rating}
											</span>
										</div>
										<span className="text-sm text-muted-foreground ml-2">
											({expert.reviewCount} reviews)
										</span>
									</div>

									{/* Key Stats */}
									<div className="grid grid-cols-2 gap-3 mb-4 text-xs">
										<div className="flex items-center text-muted-foreground">
											<Clock className="h-3 w-3 mr-1" />
											{expert.responseTime}
										</div>
										<div className="flex items-center text-muted-foreground">
											<MapPin className="h-3 w-3 mr-1" />
											{expert.location.split(',')[0]}
										</div>
									</div>

									{/* Expertise Tags */}
									<div className="flex flex-wrap gap-1 mb-4">
										{expert.expertise.slice(0, 2).map((skill, index) => (
											<span
												key={index}
												className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md"
											>
												{skill}
											</span>
										))}
										{expert.expertise.length > 2 && (
											<span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">
												+{expert.expertise.length - 2}
											</span>
										)}
									</div>

									{/* Pricing */}
									<div className="flex items-center justify-between mb-4">
										<div>
											<span className="text-lg font-bold text-foreground">
												Rs. {expert.hourlyRate.toLocaleString()}
											</span>
											<span className="text-sm text-muted-foreground">
												/hour
											</span>
										</div>
										<div className="text-xs text-muted-foreground">
											{expert.totalConsultations}+ consultations
										</div>
									</div>

									{/* Actions */}
									<div className="flex gap-2">
										<Link to={`/expert/${expert.id}`} className="flex-1">
											<Button
												variant="default"
												size="sm"
												className="w-full bg-gradient-primary"
											>
												View Profile
											</Button>
										</Link>
										<Link to={`/book/${expert.id}`}>
											<Button
												variant="outline"
												size="sm"
												className="px-3"
											>
												<MessageCircle className="h-4 w-4" />
											</Button>
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* View All Experts */}
				<div className="text-center mt-12">
					<Link to="/experts">
						<Button
							variant="outline"
							size="lg"
							className="group"
						>
							View All Experts
							<ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
						</Button>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default FeaturedExperts;