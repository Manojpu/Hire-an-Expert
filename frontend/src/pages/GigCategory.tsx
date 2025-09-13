import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star, Clock, Users, MapPin, Briefcase, MessageCircle } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllCategories} from "@/services/categoryService.ts";

// Import the new types
import { gigServiceAPI } from "@/services/gigService";
import {Gig} from "@/types/publicGigs.ts";

const PAGE_SIZE = 6;

const Category = () => {
    const { slug } = useParams<{ slug: string }>();

    // State for filters
    const [query, setQuery] = useState("");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000);
    // minRating state is removed as it's not supported by the new GigFilters
    const [sort, setSort] = useState<"relevance" | "priceAsc" | "priceDesc" | "rating" | "experience">("relevance");
    const [page, setPage] = useState(1);

    // State for data
    const [gigs, setGigs] = useState<Gig[]>([]); // Use the new Gig type
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);

        // The API call is updated to use the new filters.
        // We assume `page`, `size`, and `sort` are handled by the service implementation,
        // as they are common for paginated and sorted lists.
        gigServiceAPI.getPublic({
            category_id: slug, // Adheres to the GigFilters interface
            min_rate: minPrice,
            max_rate: maxPrice,
            search_query: query,
            page,
            size: PAGE_SIZE,
            sort: sort,
        })
            .then((res) => {
                // The response shape matches GigListResponse
                setGigs(res.gigs);
                setTotal(res.total);
            })
            .catch((err) => {
                setGigs([]);
                setTotal(0);
                console.error("Failed to fetch gigs:", err);
            })
            .finally(() => setLoading(false));
        // `minRating` is removed from dependencies, `sort` is added to make it functional.
    }, [slug, query, minPrice, maxPrice, sort, page]);

    const canLoadMore = gigs.length < total;
    const categoryName = (slug || "All Categories").replace(/-/g, " ");

    return (
        <div className="container w-11/12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <nav className="text-sm text-muted-foreground">
                        <Link to="/" className="hover:underline">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-foreground capitalize">{categoryName}</span>
                    </nav>
                    <h1 className="text-3xl font-bold mt-2 capitalize">{categoryName}</h1>
                    {/* Updated text to reflect services/gigs instead of experts */}
                    <p className="text-sm text-muted-foreground mt-1">{total} services available • Find the right professional for your needs</p>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {/* Updated icon and text */}
                        <Users className="h-4 w-4" />
                        <div className="font-medium">{total} Services</div>
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
                            placeholder="Search skills, keywords..."
                            className="w-full px-3 py-2 border border-border rounded-md bg-input text-sm"
                        />

                        <div className="mt-4">
                            <label className="text-sm font-medium">Price Range (LKR)</label>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="number" value={minPrice} onChange={(e) => { setMinPrice(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border border-border rounded-md text-sm" />
                                <input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border border-border rounded-md text-sm" />
                            </div>
                        </div>

                        {/* Minimum Rating filter is removed as the new Gig model doesn't contain rating data */}

                        <div className="mt-4">
                            <label className="text-sm font-medium">Sort By</label>
                            <select value={sort} onChange={(e) => { setSort(e.target.value as any); setPage(1); }} className="w-full mt-2 px-3 py-2 border border-border rounded-md text-sm bg-input">
                                <option value="relevance">Relevance</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                {/* "Rating" sort option removed */}
                                <option value="experience">Experience</option>
                            </select>
                        </div>

                        <div className="mt-6">
                            {/* `setMinRating` is removed from the reset handler */}
                            <button onClick={() => { setQuery(""); setMinPrice(0); setMaxPrice(5000); setSort("relevance"); setPage(1); }} className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">Reset Filters</button>
                        </div>
                    </div>
                </aside>

                {/* Results Column */}
                <section className="col-span-1 lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading && page === 1 ? (
                            <div className="text-center text-muted-foreground">Loading services...</div>
                        ) : gigs.length === 0 ? (
                            <div className="text-center text-muted-foreground">No services found — try adjusting filters.</div>
                        ) : (
                            gigs.map((gig) => (
                                <Card
                                    key={gig.id} // Use gig.id
                                    className="group hover:shadow-hover transition-all duration-300 hover:-translate-y-1 bg-background border-0"
                                >
                                    <CardContent className="p-0">
                                        {/* The banner is simplified as expert-specific images are not in the Gig model */}
                                        <div className="relative h-36 bg-gradient-primary rounded-t-lg overflow-hidden flex items-center justify-center p-4">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-primary-dark/40" />
                                            <div className="relative text-center text-white">
                                                <div className="font-semibold text-lg drop-shadow">{gig.category.name}</div>
                                                <div className="text-xs drop-shadow mt-1">{gig.expertise_areas.slice(0, 2).join(' • ')}</div>
                                            </div>
                                        </div>

                                        <div className="px-3 pb-6 pt-4">
                                            {/* Title is now derived from expertise areas as expert name/title are unavailable */}
                                            <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors h-10 line-clamp-2">
                                                {gig.expertise_areas.join(', ')}
                                            </h3>

                                            {/* The main description of the service */}
                                            {gig.service_description && (
                                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{gig.service_description}</p>
                                            )}

                                            {/* Rating and review counts are removed */}

                                            <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-muted-foreground">
                                                <div className="flex items-center"><Clock className="h-3 w-3 mr-1" />{gig.response_time || '< 24 hours'}</div>
                                                {/* Replaced location with experience years */}
                                                <div className="flex items-center"><Briefcase className="h-3 w-3 mr-1" />{gig.experience_years ? `${gig.experience_years}+ years exp` : 'General Experience'}</div>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <span className="text-lg font-bold text-foreground">{gig.currency} {gig.hourly_rate?.toLocaleString()}</span>
                                                    <span className="text-sm text-muted-foreground"> /hour</span>
                                                </div>
                                                {/* Consultation count is removed */}
                                            </div>

                                            <div className="flex gap-2">
                                                {/* Links are updated to point to a gig-specific page using gig.id */}
                                                <Link to={`/gig/${gig.id}`} className="flex-1">
                                                    <Button variant="default" size="sm" className="w-full bg-gradient-primary">View Service</Button>
                                                </Link>
                                                <Link to={`/book/${gig.id}`}>
                                                    <Button variant="outline" size="sm" className="px-3"><MessageCircle className="h-4 w-4" /></Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Load More / Empty State */}
                    <div className="mt-6 flex items-center justify-center">
                        {canLoadMore && !loading ? (
                            <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Load More</button>
                        ) : !loading && gigs.length > 0 ? (
                            <div className="text-sm text-muted-foreground">Showing all results</div>
                        ) : null}
                        {loading && page > 1 && <div className="text-sm text-muted-foreground">Loading...</div>}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Category;