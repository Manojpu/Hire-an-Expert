import { Search, Calendar, MessageCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Find Your Expert',
    description: 'Browse through verified professionals in your area of interest and compare their expertise, ratings, and pricing.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Book Consultation',
    description: 'Schedule your consultation at a convenient time. Choose between online video calls or in-person meetings.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 3,
    icon: MessageCircle,
    title: 'Get Expert Advice',
    description: 'Connect with your chosen expert and receive personalized guidance tailored to your specific needs and goals.',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting expert advice has never been easier. Follow these simple steps to connect with professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="relative text-center group">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent transform translate-x-4 -translate-y-1/2 z-0" />
                )}

                {/* Step Number */}
                <div className="relative mb-6">
                  <div className={`w-24 h-24 mx-auto rounded-full ${step.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-10 w-10 ${step.color}`} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {step.id}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-3 bg-gradient-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
              Start Your Journey
            </button>
            <button className="px-8 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-muted transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;