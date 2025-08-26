import { Car, Laptop, Home, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

// Background pattern image imports
import carPattern from '@/assets/patterns/car-pattern.svg';
import techPattern from '@/assets/patterns/tech-pattern.svg';
import homePattern from '@/assets/patterns/home-pattern.svg';
import eduPattern from '@/assets/patterns/edu-pattern.svg';

const categories = [
  {
    id: 'automobile-advice',
    title: 'Automobile Advice',
    description: 'Expert guidance on vehicles, repairs, and automotive decisions',
    icon: Car,
    pattern: carPattern,
    subcategories: ['Brand New Vehicles', 'Vehicle Repair & Maintenance', 'Spare Parts & Accessories', 'Insurance & Financing', 'Electric Vehicles', 'Vintage Cars'],
    expertCount: 150,
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600',
    color: 'text-primary-600'
  },
  {
    id: 'electronic-devices',
    title: 'Electronic Devices Advice',
    description: 'Professional advice on technology, gadgets, and device decisions',
    icon: Laptop,
    pattern: techPattern,
    subcategories: ['Laptops & Computers', 'Mobile Phones & Tablets', 'Device Repair', 'Gaming Equipment', 'Smart Home Devices', 'Audio/Visual Equipment'],
    expertCount: 200,
    gradient: 'bg-gradient-to-br from-primary-400 to-primary-500',
    color: 'text-primary-500'
  },
  {
    id: 'home-appliance',
    title: 'Home Appliance Guidance',
    description: 'Expert help with home appliances, repairs, and installations',
    icon: Home,
    pattern: homePattern,
    subcategories: ['Electrical Repairs', 'Kitchen Appliances', 'HVAC Systems', 'Smart Home Integration', 'Appliance Installation', 'Energy Efficiency'],
    expertCount: 120,
    gradient: 'bg-gradient-to-br from-primary-600 to-primary-700',
    color: 'text-primary-600'
  },
  {
    id: 'education-career',
    title: 'Education & Career Guidance',
    description: 'Professional guidance for education, career, and skill development',
    icon: GraduationCap,
    pattern: eduPattern,
    subcategories: ['Academic Guidance', 'Higher Education Planning', 'Business & Entrepreneurship', 'Career Development', 'Skill Development', 'Professional Certifications'],
    expertCount: 180,
    gradient: 'bg-gradient-to-br from-primary-300 to-primary-400',
    color: 'text-primary-500'
  }
];

const CategoryCards = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-b from-primary-50/30 to-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-6">
            Expert Categories
          </h2>
          <p className="text-xl text-primary-700/80 font-medium">
            Connect with industry-leading professionals across our specialized domains
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} to={`/category/${category.id}`}>
                <Card className="group h-full transition-all duration-500 bg-white/90 hover:bg-white/95 backdrop-blur-xl border border-primary-100/50 hover:border-primary-300/50 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden">
                  <CardContent className="p-8 relative">
                    {/* Pattern Background */}
                    <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500">
                      <img
                        src={category.pattern}
                        alt=""
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                    
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-100/0 via-primary-200/0 to-primary-300/0 group-hover:from-primary-100/30 group-hover:via-primary-200/20 group-hover:to-primary-300/10 transition-all duration-500" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon & Title Section */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className={`p-4 ${category.gradient} rounded-2xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative overflow-hidden`}>
                            {/* Icon Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                              <img
                                src={category.pattern}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Icon className="h-6 w-6 text-white relative z-10" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-primary-800 group-hover:text-primary-600 transition-colors duration-300">
                              {category.title}
                            </h3>
                            <p className="text-sm text-primary-500 mt-1">
                              {category.expertCount}+ Verified Experts
                            </p>
                          </div>
                        </div>
                        
                        {/* Animated Separator */}
                        <div className="h-px bg-gradient-to-r from-transparent via-primary-200/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                      </div>

                      {/* Description */}
                      <p className="text-primary-600/90 text-sm leading-relaxed mb-6">
                        {category.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {category.subcategories.slice(0, 3).map((sub, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-gradient-to-br from-primary-50/50 to-primary-100/50 text-primary-700 text-xs font-medium rounded-full border border-primary-100/50 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-primary-100/30">
                        <span className="text-sm font-medium bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                          Explore Category
                        </span>
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary-50 to-primary-100/50 group-hover:from-primary-100 group-hover:to-primary-200/50 transition-colors duration-300">
                          <ArrowRight className={`h-4 w-4 ${category.color} transform group-hover:translate-x-1 transition-all duration-300`} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* View All Link */}
        <div className="mt-20 text-center">
          <Link 
            to="/categories"
            className="inline-flex items-center px-8 py-4 bg-white/90 backdrop-blur-xl border border-primary-200 rounded-2xl hover:bg-primary-50/80 transition-all duration-300 group shadow-lg hover:shadow-xl"
          >
            <span className="text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              Explore All Categories
            </span>
            <div className="ml-3 p-2 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors duration-300">
              <ArrowRight className="h-5 w-5 text-primary-600 transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;