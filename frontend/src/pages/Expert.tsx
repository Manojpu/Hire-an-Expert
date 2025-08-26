import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Clock, Users, CheckCircle } from "lucide-react";
import { MOCK_EXPERTS, Expert as ExpertType } from "@/data/mockExperts";
import { Button } from "@/components/ui/button";

const tabs = ["Overview", "Reviews", "Qualifications", "Portfolio"] as const;

type TabKey = typeof tabs[number];

const Expert = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");

  const expert = useMemo(() => {
    if (!slug) return undefined;
    return MOCK_EXPERTS.find((e) => e.slug === slug || e.id === slug);
  }, [slug]);

  if (!expert) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Expert not found</h2>
          <p className="text-muted-foreground mt-2">We couldn't find the expert you're looking for.</p>
          <Link to="/categories" className="inline-block mt-4 text-primary underline">Browse Categories</Link>
        </div>
      </div>
    );
  }

  const sampleReviews = [
    { id: 1, name: "Asha K.", rating: 5, text: "Incredibly knowledgeable and helpful. Resolved my issue in one session.", date: "2024-05-12" },
    { id: 2, name: "Ravi S.", rating: 4, text: "Great insights and practical advice. Recommended.", date: "2024-03-08" },
  ];

  return (
    <div className="space-y-8 container w-11/12">
      {/* Hero */}
      <div className="relative rounded-lg overflow-hidden">
        <img src={expert.bannerImage} alt={expert.name} className="w-full h-56 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent" />

        <div className="absolute left-6 bottom-4 flex items-end gap-4">
          <img src={expert.profileImage} alt={expert.name} className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg" />
          <div className="text-white">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold drop-shadow">{expert.name}</h1>
              {expert.rating >= 4.5 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/90 text-xs font-semibold">Verified <CheckCircle className="h-3 w-3" /></span>
              )}
            </div>
            <div className="text-sm drop-shadow">{expert.title}</div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">{expert.rating}</span>
                <span className="text-muted-foreground">({expert.totalReviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" /> <span>{expert.totalConsultations} consultations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-6 bottom-6 flex flex-col items-end gap-3">
          <div className="bg-white/90 rounded-lg p-3 text-right shadow">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="text-lg font-bold">{expert.pricing.currency} {expert.pricing.hourlyRate}</div>
            <div className="text-xs text-muted-foreground">per hour</div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to={`/book/${expert.id}`}>
                <span className="inline-block w-full text-center">Book Consultation</span>
              </Link>
            </Button>
            <Button variant="outline" size="default">Message Expert</Button>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Tabs + content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center gap-2 border-b pb-3 mb-3">
              {tabs.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-2 text-sm font-medium rounded ${activeTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div>
              {activeTab === "Overview" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">About</h3>
                  <p className="text-sm text-muted-foreground">{expert.bio}</p>

                  <div>
                    <h4 className="font-medium mt-4">Expertise</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {expert.subcategories.map((s) => (
                        <span key={s} className="px-2 py-1 text-xs bg-muted rounded">{s.replace(/-/g, ' ')}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium">Languages</h4>
                    <div className="text-sm text-muted-foreground mt-1">{expert.languages.join(', ')}</div>
                  </div>

                  <div className="mt-6 bg-card rounded p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Response Time</div>
                        <div className="font-medium">{expert.responseTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Total Consultations</div>
                        <div className="font-medium">{expert.totalConsultations}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Reviews" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reviews</h3>
                  <div className="space-y-3">
                    {sampleReviews.map((r) => (
                      <div key={r.id} className="border rounded p-3 bg-background">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{r.name}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 text-yellow-400" /> {r.rating}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{r.text}</p>
                        <div className="text-xs text-muted-foreground mt-2">{r.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Qualifications" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Qualifications & Certifications</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    <li>B.Sc. in Automotive Engineering — University of Colombo</li>
                    <li>Certified Vehicle Diagnostics Specialist</li>
                    <li>10+ years professional experience</li>
                  </ul>
                </div>
              )}

              {activeTab === "Portfolio" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Portfolio / Case Studies</h3>
                  <p className="text-sm text-muted-foreground">Portfolio items and case studies will be listed here (images, descriptions, outcomes).</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Sticky summary */}
        <aside className="space-y-4">
          <div className="sticky top-24 border rounded-lg p-4 bg-background">
            <div className="flex items-center gap-3">
              <img src={expert.profileImage} alt={expert.name} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <div className="font-medium">{expert.name}</div>
                <div className="text-sm text-muted-foreground">{expert.title}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-muted-foreground">Starting at</div>
              <div className="text-xl font-bold">{expert.pricing.currency} {expert.pricing.hourlyRate}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button asChild className="flex-1">
                <Link to={`/book/${expert.id}`}>
                  <span className="w-full text-center">Request Booking</span>
                </Link>
              </Button>
              <Button variant="outline">Save</Button>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {expert.responseTime}</div>
              <div className="flex items-center gap-2 mt-2"><Users className="h-4 w-4" /> {expert.totalConsultations} consultations</div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-background">
            <h4 className="font-medium">Quick Info</h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-2">
              <li>Languages: {expert.languages.join(', ')}</li>
              <li>Response Time: {expert.responseTime}</li>
              <li>Verified: {expert.rating >= 4.5 ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Expert;
