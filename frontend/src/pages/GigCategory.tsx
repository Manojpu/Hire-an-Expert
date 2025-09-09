
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, Clock, Users, MapPin, ArrowRight, MessageCircle } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MOCK_EXPERTS, Expert } from "@/data/mockExperts";

const PAGE_SIZE = 6;

const Category = () => {
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<"relevance" | "priceAsc" | "priceDesc" | "rating" | "experience">("relevance");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const matchesCategory = (expert: Expert) => {
      if (!slug) return true;
      return expert.category.includes(slug) || expert.subcategories.includes(slug);
    };

    return MOCK_EXPERTS.filter((e) => {
      if (!matchesCategory(e)) return false;
      if (query && !`${e.name} ${e.title} ${e.bio}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (e.pricing.hourlyRate < minPrice) return false;
      if (e.pricing.hourlyRate > maxPrice) return false;
      if (e.rating < minRating) return false;
      return true;
    });
  }, [slug, query, minPrice, maxPrice, minRating]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case "priceAsc":
        return copy.sort((a, b) => a.pricing.hourlyRate - b.pricing.hourlyRate);
      case "priceDesc":
        return copy.sort((a, b) => b.pricing.hourlyRate - a.pricing.hourlyRate);
      case "rating":
        return copy.sort((a, b) => b.rating - a.rating);
      case "experience":
        return copy.sort((a, b) => b.totalConsultations - a.totalConsultations);
      default:
        return copy;
    }
  }, [filtered, sort]);

  const paged = useMemo(() => {
    return sorted.slice(0, page * PAGE_SIZE);
  }, [sorted, page]);

  const canLoadMore = paged.length < sorted.length;

  return (
    <div className="container w-11/12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-foreground">{(slug || "All").replace(/-/g, " ")}</span>
          </nav>
          <h1 className="text-3xl font-bold mt-2">{(slug || "All Categories").replace(/-/g, " ")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{sorted.length} experts • Find the right professional for your needs</p>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <div className="font-medium">{sorted.length} Experts</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <div className="font-medium">Flexible Scheduling</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Column */}
        <aside className="col-span-1">
          <div className="border rounded-lg p-4 bg-background">
            <h3 className="font-semibold mb-3">Search & Filters</h3>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search experts, skills..."
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm"
            />

            <div className="mt-4">
              <label className="text-sm font-medium">Price Range (LKR)</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" value={minPrice} onChange={(e) => { setMinPrice(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border border-border rounded-md text-sm" />
                <input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border border-border rounded-md text-sm" />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Minimum Rating</label>
              <select value={minRating} onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }} className="w-full mt-2 px-3 py-2 border border-border rounded-md text-sm bg-input">
                <option value={0}>Any</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
                <option value={4.8}>4.8+ stars</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Sort By</label>
              <select value={sort} onChange={(e) => { setSort(e.target.value as 'relevance' | 'priceAsc' | 'priceDesc' | 'rating' | 'experience'); setPage(1); }} className="w-full mt-2 px-3 py-2 border border-border rounded-md text-sm bg-input">
                <option value="relevance">Relevance</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            <div className="mt-6">
              <button onClick={() => { setQuery(""); setMinPrice(0); setMaxPrice(5000); setMinRating(0); setSort("relevance"); setPage(1); }} className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">Reset Filters</button>
            </div>
          </div>
        </aside>

        {/* Results Column */}
        <section className="col-span-1 lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paged.map((expert) => (
              <Card
                key={expert.id}
                className="group hover:shadow-hover transition-all duration-300 hover:-translate-y-1 bg-background border-0"
              >
                <CardContent className="p-0">
                  <div className="relative h-36 bg-gradient-primary rounded-t-lg overflow-hidden">
                    {expert.bannerImage && (
                      <img src={expert.bannerImage} alt={expert.name} className="object-cover w-full h-full" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary-dark/40" />

                    <div className="absolute left-4 bottom-3 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-4 border-background overflow-hidden">
                          <img src={expert.profileImage} alt={expert.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-white">
                          <div className="font-semibold text-base drop-shadow">{expert.name}</div>
                          <div className="text-xs drop-shadow">{expert.category}</div>
                        </div>
                      </div>

                      <div>
                        <span className="px-2 py-1 text-xs rounded-full bg-accent text-accent-foreground">
                          {expert.responseTime || 'Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-6 pt-4">
                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{expert.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{expert.title}</p>

                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-foreground ml-1">{expert.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">({expert.totalReviews || expert.totalConsultations || 0} reviews)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center"><Clock className="h-3 w-3 mr-1" />{expert.responseTime || '< 24 hours'}</div>
                      <div className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{expert.category.replace(/-/g, ' ')}</div>
                    </div>

                    {/* Service Description Preview */}
                    {expert.bio && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{expert.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-4">
                      {expert.subcategories.slice(0, 2).map((skill) => (
                        <span key={skill} className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">{skill.replace(/-/g, ' ')}</span>
                      ))}
                      {expert.subcategories.length > 2 && (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">+{expert.subcategories.length - 2}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-foreground">{expert.pricing?.currency || 'LKR'} {expert.pricing?.hourlyRate?.toLocaleString?.() ?? expert.pricing?.hourlyRate}</span>
                        <span className="text-sm text-muted-foreground"> /hour</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{expert.totalConsultations || 0}+ consultations</div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/expert/${expert.id}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full bg-gradient-primary">View Profile</Button>
                      </Link>
                      <Link to={`/book/${expert.id}`}>
                        <Button variant="outline" size="sm" className="px-3"><MessageCircle className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More / Empty State */}
          <div className="mt-6 flex items-center justify-center">
            {sorted.length === 0 ? (
              <div className="text-center text-muted-foreground">No experts found — try adjusting filters.</div>
            ) : canLoadMore ? (
              <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Load More</button>
            ) : (
              <div className="text-sm text-muted-foreground">Showing all results</div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
};


export default Category;
