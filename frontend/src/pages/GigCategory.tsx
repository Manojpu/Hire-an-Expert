import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Briefcase, Clock, MessageCircle, Users } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import the new types
import { gigServiceAPI } from "@/services/gigService";
import { Gig } from "@/types/publicGigs.ts";

const PAGE_SIZE = 6;

const Category = () => {
    const { slug } = useParams<{ slug: string }>();

    // State for filters
    const [query, setQuery] = useState("");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(5000);
    const [sort, setSort] = useState<"relevance" | "priceAsc" | "priceDesc" | "rating" | "experience">("relevance");
    const [page, setPage] = useState(1);

    // State for data
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);

        gigServiceAPI.getPublic({
            category_id: slug,
            min_rate: minPrice,
            max_rate: maxPrice,
            search_query: query,
            page,
            size: PAGE_SIZE,
            sort: sort,
        })
            .then((res) => {
                setGigs(res.gigs);
                setTotal(res.total);
            })
            .catch((err) => {
                setGigs([]);
                setTotal(0);
                console.error("Failed to fetch gigs:", err);
            })
            .finally(() => setLoading(false));
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
                    <p className="text-sm text-muted-foreground mt-1">{total} services available • Find the right professional for your needs</p>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                        <div className="mt-4">
                            <label className="text-sm font-medium">Sort By</label>
                            <select value={sort} onChange={(e) => { setSort(e.target.value as any); setPage(1); }} className="w-full mt-2 px-3 py-2 border border-border rounded-md text-sm bg-input">
                                <option value="relevance">Relevance</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                <option value="experience">Experience</option>
                            </select>
                        </div>

                        <div className="mt-6">
                            <button onClick={() => { setQuery(""); setMinPrice(0); setMaxPrice(5000); setSort("relevance"); setPage(1); }} className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">Reset Filters</button>
                        </div>
                    </div>
                </aside>

                {/* Results Column */}
                <section className="col-span-1 lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading && page === 1 ? (
                            <div className="text-center text-muted-foreground col-span-full">Loading services...</div>
                        ) : gigs.length === 0 ? (
                            <div className="text-center text-muted-foreground col-span-full">No services found — try adjusting filters.</div>
                        ) : (
                            gigs.map((gig) => (
                                <Card
                                    key={gig.id}
                                    className="group overflow-hidden hover:shadow-hover transition-all duration-300 hover:-translate-y-1 bg-background border-0 flex flex-col"
                                >
                                    <CardContent className="p-0 flex flex-col flex-grow">
                                        {/* == Banner & Avatar Section == */}
                                        <div className="relative">
                                            {/* Future Thumbnail will go here */}
                                             <img src={gig.thumbnail_url} className="w-full h-32 object-cover"  alt="Service Thumbnail"/>
                                            {/*<div className="w-full h-32 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">*/}
                                            {/*    <span className="text-slate-400 text-xs">Thumbnail Placeholder</span>*/}
                                            {/*</div>*/}

                                            {/* Avatar Placeholder */}
                                            <div className="absolute -bottom-8 left-4">
                                                {/* Future Avatar will go here */}
                                                {/* <img src={gig.expert.avatarUrl} className="w-16 h-16 rounded-full border-4 border-background object-cover" /> */}
                                                <div className="w-16 h-16 rounded-full border-4 border-background bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                                    <Users className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* == Main Content Section == */}
                                        <div className="p-4 pt-10 flex flex-col flex-grow">
                                            {/* Expert Name Placeholder */}
                                            <div className="mb-2">
                                                {/*<h3 className="font-bold text-lg group-hover:text-primary transition-colors">*/}
                                                {/*    Expert Name*/}
                                                {/*</h3>*/}
                                                <p className="text-sm text-muted-foreground -mt-1">{gig.category.name}</p>
                                            </div>

                                            {/* Gig Title / Description */}
                                            <p className="text-sm text-foreground mb-3 line-clamp-2 font-medium h-10">
                                                {gig.service_description || gig.expertise_areas.join(', ')}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-muted-foreground">
                                                <div className="flex items-center"><Clock className="h-3 w-3 mr-1.5" />{gig.response_time || '< 24 hours'}</div>
                                                <div className="flex items-center"><Briefcase className="h-3 w-3 mr-1.5" />{gig.experience_years ? `${gig.experience_years}+ years exp` : 'Experienced'}</div>
                                            </div>

                                            {/* Spacer to push price and buttons to the bottom */}
                                            <div className="flex-grow" />

                                            {/* Price & Actions */}
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Starts at</span>
                                                        <p className="text-xl font-bold text-foreground -mt-1">{gig.currency} {gig.hourly_rate?.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Link to={`/gig/${gig.id}`} className="flex-1">
                                                        <Button variant="default" size="sm" className="w-full bg-gradient-primary">View Service</Button>
                                                    </Link>
                                                    <Link to={`/book/${gig.id}`}>
                                                        <Button variant="outline" size="sm" className="px-3"><MessageCircle className="h-4 w-4" /></Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                            ))
                        )}
                    </div>

                    {/* Load More / Empty State */}
                    <div className="mt-8 flex items-center justify-center">
                        {canLoadMore && !loading ? (
                            <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Load More</button>
                        ) : !loading && gigs.length > 0 ? (
                            <div className="text-sm text-muted-foreground">Showing all {total} results</div>
                        ) : null}
                        {loading && page > 1 && <div className="text-sm text-muted-foreground">Loading...</div>}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Category;