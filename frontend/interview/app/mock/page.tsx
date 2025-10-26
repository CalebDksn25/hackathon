"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
} from "lucide-react";
import HiringSignals from "@/components/ui/hiring-signals";
import { mockQuestions } from "@/lib/mockData";

export default function MockInterviewPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    jobUrl?: string;
    interviewerName?: string;
  } | null>(null);
  const [showQuestionsList, setShowQuestionsList] = useState(false);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? sessionStorage.getItem("mockInterviewData")
          : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
      } else {
        setData({});
      }
    } catch (e) {
      setData({});
    }
  }, []);

  const getCompanyName = (jobUrl?: string) => {
    try {
      if (!jobUrl) return "the Company";
      const url = new URL(jobUrl);
      const hostname = url.hostname.replace("www.", "");
      const name = hostname.split(".")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return "the Company";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        <div className="flex items-center justify-between mb-8 gap-6">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Mock Interview</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Mock Interview Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">{`Interviewer: ${
              data?.interviewerName || "(not set)"
            }`}</p>
            <p className="text-sm text-muted-foreground">{`Company: ${getCompanyName(
              data?.jobUrl
            )}`}</p>
          </div>

          {/* header controls removed - replaced by a floating Start button */}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          {/* Main content - AI generated summary + toggle */}
          <div className="lg:col-span-2 space-y-6">
            {/* interview runner removed - replaced by floating start button that links to /interview */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">What to Expect</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {`Based on our analysis for ${getCompanyName(
                  data?.jobUrl
                )}, expect a ~45 minute interview mixing technical (React, performance, debugging) and behavioral questions around teamwork and ownership. Prepare concrete examples of performance improvements, collaboration wins, and how you approach difficult bugs.`}
              </p>

              <div className="flex gap-3 items-center">
                <Button onClick={() => setShowQuestionsList((s) => !s)}>
                  {showQuestionsList ? "Hide Questions" : "See Questions"}
                </Button>

                <Button variant="outline" onClick={() => router.push("/")}>
                  Back
                </Button>
              </div>
            </Card>

            {/* Questions are always rendered but blurred when hidden for a smoother UX */}
            <div
              className={`space-y-4 transition-all duration-300 ease-in-out ${
                showQuestionsList
                  ? "blur-none opacity-100 pointer-events-auto"
                  : "blur-sm opacity-60 pointer-events-none"
              }`}
            >
              {mockQuestions.map((q, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{q.question}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {q.tips}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar - AI scraped company insights */}
          <aside className="space-y-6 flex flex-col">
            <Card className="p-6 flex-1">
              <h3 className="text-lg font-bold mb-3">Company Insights</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Recent News
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                      {getCompanyName(data?.jobUrl)} announces new AI-powered
                      features for enterprise customers
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                      Company expands engineering team by 30% in Q4
                    </p>
                    <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                      Leadership publishes new product roadmap focused on
                      integrations
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Core Values
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Customer-first innovation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Collaboration & ownership</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">Data-informed decisions</span>
                    </div>
                  </div>
                </div>

                {/* HiringSignals moved below the sidebar card */}
              </div>
            </Card>

            {/* place HiringSignals as its own component under the sidebar card */}
            <div className="mt-4">
              <HiringSignals />
            </div>
          </aside>
        </div>
      </div>

      {/* Floating start button — redirects to /interview */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="px-6 rounded-full shadow-lg"
          onClick={() => router.push("/interview")}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start Mock Interview
        </Button>
      </div>
    </div>
  );
}
