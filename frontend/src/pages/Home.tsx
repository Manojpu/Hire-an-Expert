import Header from '@/components/navigation/Header';
import Footer from '@/components/ui/footer';
import HeroCarousel from '@/components/home/HeroCarousel';
import CategoryCards from '@/components/home/CategoryCards';
import HowItWorks from '@/components/home/HowItWorks';
import FeaturedExperts from '@/components/home/FeaturedExperts';

const Home = () => {
  return (
    <div className="min-h-screen ">
      <main className='m-0'>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-6">
          <HeroCarousel />
        </section>

        {/* Categories Section */}
        <CategoryCards />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Featured Experts Section */}
        <FeaturedExperts />
      </main>
      
    </div>
  );
};

export default Home;