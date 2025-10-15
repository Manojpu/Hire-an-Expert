import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  Users,
  MessageCircle,
  Shield,
  Sparkles,
  Rocket,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    title: "Tell Us What You Need",
    description:
      "Create a free account, set your goals, and let us know the outcomes you are aiming for. Our guided intake makes it easy to share what matters most.",
    icon: Sparkles,
  },
  {
    title: "Match With Verified Experts",
    description:
      "We surface experts who fit your brief using ratings, availability, domain focus, and collaboration style—no endless scrolling required.",
    icon: Users,
  },
  {
    title: "Book, Chat & Collaborate",
    description:
      "Pick a time, sync to your calendar, and keep discussions organised in one secure workspace with file sharing and persistent chat threads.",
    icon: MessageCircle,
  },
  {
    title: "Deliver Results Faster",
    description:
      "From milestone tracking to automated payouts, we remove friction so you and your expert can stay focused on impact.",
    icon: Rocket,
  },
];

const valueHighlights = [
  {
    heading: "Verified talent only",
    copy: "Every expert is vetted through skills assessments, portfolio reviews, and identity verification before they meet you.",
    icon: Shield,
  },
  {
    heading: "Calendar-native scheduling",
    copy: "Real-time availability, timezone translation, reminders, and iCal/Google Calendar sync built in.",
    icon: CalendarCheck,
  },
  {
    heading: "Transparent pricing",
    copy: "See scopes, hourly rates, and projected totals up front—no hidden fees, ever.",
    icon: Clock,
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background" />
        <div className="container mx-auto px-4 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-primary">
                Guided onboarding
              </span>
              <h1 className="text-4xl font-bold text-foreground md:text-5xl">
                Turn ideas into delivery-ready projects with our experts
              </h1>
              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Hire an Expert combines curated talent, transparent pricing, and
                collaborative tools so you can launch, iterate, and scale
                without losing momentum.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-primary text-base shadow-sm"
                >
                  <Link to="/signup">
                    Start for free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  <Link to="/experts">Browse experts</Link>
                </Button>
              </div>
            </div>
            <Card className="border-none bg-white/70 backdrop-blur">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary/80">
                      Why founders choose us
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-foreground">
                      Built for clarity, speed, and trust
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        Average time to match
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        48 hours
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        97% of clients
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        Return for Phase 2
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        Countries covered
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        120+
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs text-muted-foreground">
                        Avg. delivery acceleration
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        36%
                      </p>
                    </div>
                  </div>
                  <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                    “Within days we had a vetted specialist working alongside
                    our team. Communication, contracts, and delivery all lived
                    on Hire an Expert— it felt like onboarding a teammate, not
                    hiring a freelancer.”
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-primary/70">
              Your journey
            </span>
            <h2 className="text-3xl font-semibold text-foreground">
              Four guided steps from idea to launch
            </h2>
            <p className="text-sm text-muted-foreground">
              We blend automation with concierge support so every engagement
              starts fast and stays aligned.
            </p>
          </div>
          <div className="space-y-6">
            {steps.map(({ title, description, icon: Icon }, index) => (
              <Card
                key={title}
                className="border-border/80 bg-white/70 transition hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="flex items-start gap-5 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary/70">
                      <span>Step {index + 1}</span>
                      <span className="h-1 w-1 rounded-full bg-primary/60" />
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-primary/70">
              Designed for trust
            </span>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">
              Everything you need to collaborate with confidence
            </h2>
            <p className="mt-4 text-sm text-muted-foreground">
              From secure payments to structured communication, we make sure
              both clients and experts feel protected at every step.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {valueHighlights.map(({ heading, copy, icon: Icon }) => (
              <Card
                key={heading}
                className="border-border/70 bg-background transition hover:-translate-y-1 hover:border-primary/60"
              >
                <CardContent className="space-y-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {heading}
                  </h3>
                  <p className="text-sm text-muted-foreground">{copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-primary/70">
              Take the next step
            </span>
            <h2 className="text-3xl font-semibold text-foreground">
              Hire an Expert is where ambitious teams meet verified specialists
            </h2>
            <p className="text-sm text-muted-foreground">
              Join a community of founders, operators, and creatives who partner
              with expert talent to build faster. Publish your gig, review
              matches in one dashboard, and keep every conversation, contract,
              and deliverable in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary text-base shadow-sm"
              >
                <Link to="/create-gig">
                  Become an expert
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/categories">Discover services</Link>
              </Button>
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <Shield className="h-5 w-5 text-primary" />
                <span>Secure contracts & escrow-managed payouts</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                <Users className="h-5 w-5 text-primary" />
                <span>Dedicated success support for premium engagements</span>
              </div>
            </div>
          </div>
          <Card className="border-border/80 bg-white/80">
            <CardContent className="space-y-5 p-6 md:p-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  “The clarity sold us immediately.”
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  “We briefed the project on Monday and had three vetted experts
                  ready for intro calls mid-week. Contracts, milestones, and
                  payments all happened inside the platform.”
                </p>
              </div>
              <div className="grid gap-4 text-sm">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    Teams onboarded last quarter
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    1,200+
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">
                    Average project rating
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    4.9 / 5
                  </p>
                </div>
              </div>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/experts">See success stories</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
