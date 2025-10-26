"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Sparkles,
  Loader2,
  Brain,
  CheckCircle2,
  Mic,
  Download,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";

const loadingSteps = [
  "Scanning company site",
  "Extracting common interview questions",
  "Analyzing your experience",
  "Preparing your mock interview…",
];

const mockQuestions = [
  {
    question: "Tell me about a time you optimized a web app for speed.",
    why: "This evaluates how you approach real-world performance issues.",
    tips: "Mention Lighthouse metrics or async loading strategies you've used.",
  },
  {
    question:
      "How do you handle disagreements with team members about technical decisions?",
    why: "This assesses your collaboration and communication skills.",
    tips: "Use the STAR method and emphasize listening and finding common ground.",
  },
  {
    question:
      "Describe your experience with React and modern frontend frameworks.",
    why: "This validates your technical expertise for the role requirements.",
    tips: "Reference specific projects from your resume and mention hooks, state management, and performance optimization.",
  },
  {
    question:
      "What interests you most about our company's mission and products?",
    why: "This shows whether you've researched the company and align with their values.",
    tips: "Connect their mission to your personal values and career goals.",
  },
  {
    question:
      "Tell me about a challenging bug you debugged and how you approached it.",
    why: "This reveals your problem-solving methodology and persistence.",
    tips: "Walk through your debugging process step-by-step, mentioning tools and techniques used.",
  },
];

export default function InterviewPrepPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!resumeFile) return;

    setIsGenerating(true);
    setShowResults(false);

    try {
      // Upload and parse the resume
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("candidateId", "");
      formData.append("filepond", resumeFile);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload resume");
      }

      const uploadData = await uploadResponse.json();
      setParsedText(uploadData.parsedText);

      // Simulate additional processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsGenerating(false);
      setShowResults(true);
    } catch (error) {
      console.error("Error:", error);
      setIsGenerating(false);
      // You might want to show an error message here
    }
  };

  const handleReset = () => {
    setResumeFile(null);
    setJobUrl("");
    setInterviewerName("");
    setShowResults(false);
    setIsGenerating(false);
    setExpandedQuestion(null);
    setParsedText(null);
  };

  const getCompanyName = () => {
    try {
      const url = new URL(jobUrl);
      const hostname = url.hostname.replace("www.", "");
      const name = hostname.split(".")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return "the Company";
    }
  };

  const isFormValid = resumeFile && jobUrl.trim() && interviewerName.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div
          className={showResults ? "max-w-7xl mx-auto" : "max-w-2xl mx-auto"}>
          {/* Header */}
          {!showResults && (
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI-Powered Interview Prep
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-balance">
                Prepare for your next interview with AI
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                Upload your resume and job details to generate a tailored mock
                interview
              </p>
            </div>
          )}

          {/* Main Form Card */}
          {!showResults && (
            <Card className="p-6 md:p-8 shadow-xl border-2">
              <div className="space-y-6">
                {/* Resume Upload */}
                <div className="space-y-2">
                  <Label htmlFor="resume" className="text-base font-semibold">
                    Resume Upload
                  </Label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-accent/5"
                    }`}>
                    <input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      {resumeFile ? (
                        <>
                          <p className="font-medium text-foreground">
                            {resumeFile.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Click or drag to replace
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">
                            Drop your resume here or click to browse
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports PDF, DOC, DOCX
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parsed Text Display */}
                {parsedText && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Parsed Text
                    </Label>
                    <div className="p-4 border-2 rounded-lg bg-accent/30 border-border max-h-60 overflow-y-auto">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {parsedText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Job URL */}
                <div className="space-y-2">
                  <Label htmlFor="jobUrl" className="text-base font-semibold">
                    Job Website URL
                  </Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    placeholder="https://company.com/careers/job-posting"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                {/* Interviewer Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="interviewer"
                    className="text-base font-semibold">
                    Interviewer Name
                  </Label>
                  <Input
                    id="interviewer"
                    type="text"
                    placeholder="e.g., Sarah Johnson"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!isFormValid || isGenerating}
                  className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Interview Prep...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Interview Prep
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {isGenerating && (
            <Card className="mt-8 p-8 md:p-12 shadow-xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center gap-3 text-primary">
                  <Brain className="w-8 h-8 animate-pulse" />
                  <span className="text-2xl font-bold">
                    Researching {getCompanyName()}...
                  </span>
                </div>
                <p className="text-lg text-muted-foreground">
                  Analyzing your resume and building your personalized interview
                </p>

                <div className="max-w-md mx-auto space-y-4 mt-8">
                  {loadingSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-500 ${
                        index <= loadingStep
                          ? "bg-primary/10 border-2 border-primary/20"
                          : "bg-accent/30 border-2 border-transparent"
                      }`}>
                      {index < loadingStep ? (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : index === loadingStep ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          index <= loadingStep
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {showResults && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Dashboard Header */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-balance">
                  Your Personalized Interview for Frontend Developer at{" "}
                  {getCompanyName()}
                </h1>
                <p className="text-muted-foreground">
                  Interviewer: {interviewerName}
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content - Interview Questions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary Card */}
                  <Card className="p-6 border-2 shadow-lg">
                    <h2 className="text-xl font-bold mb-4">
                      Here's what to expect based on our analysis:
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Target className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Focus: React, REST APIs, teamwork
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Type: Technical + Behavioral Mix
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Topic: AI integrations in CRM tools
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Mock Interview Questions */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">
                      Mock Interview Questions
                    </h2>
                    {mockQuestions.map((item, index) => (
                      <Card
                        key={index}
                        className={`p-6 border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                          expandedQuestion === index
                            ? "shadow-lg border-primary/50"
                            : ""
                        }`}
                        onClick={() =>
                          setExpandedQuestion(
                            expandedQuestion === index ? null : index
                          )
                        }>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-lg text-foreground">
                                {item.question}
                              </p>
                            </div>
                          </div>

                          {expandedQuestion === index && (
                            <div className="space-y-4 pl-11 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm font-semibold text-blue-700 mb-1">
                                  Why it matters:
                                </p>
                                <p className="text-sm text-blue-900/80">
                                  {item.why}
                                </p>
                              </div>
                              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                <p className="text-sm font-semibold text-green-700 mb-1">
                                  Tips:
                                </p>
                                <p className="text-sm text-green-900/80">
                                  {item.tips}
                                </p>
                              </div>
                              <Button
                                className="w-full bg-transparent"
                                variant="outline">
                                <Mic className="w-4 h-4 mr-2" />
                                Practice Answer
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Next Steps */}
                  <Card className="p-6 border-2 shadow-lg bg-gradient-to-br from-primary/5 to-purple-500/5">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 text-2xl font-bold">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <span>You're ready for this.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          className="gap-2 bg-transparent">
                          <Sparkles className="w-4 h-4" />
                          Generate New Interview
                        </Button>
                        <Button variant="default" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download Notes
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        ParallelPrep: helping you prepare smarter, not harder.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Sidebar - Company Insights */}
                <div className="space-y-6">
                  <Card className="p-6 border-2 shadow-lg sticky top-6">
                    <h3 className="text-xl font-bold mb-4">Company Insights</h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Recent News
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                            {getCompanyName()} announces new AI-powered features
                            for enterprise customers
                          </p>
                          <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                            Company expands engineering team by 30% in Q4
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Culture & Values
                        </h4>
                        <p className="text-sm p-3 rounded-lg bg-accent/50 border">
                          Known for innovation-first mindset and collaborative
                          work environment
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                          Insider Intel
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                Glassdoor Difficulty
                              </p>
                              <p className="text-xs text-muted-foreground">
                                3.1/5
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                Average Length
                              </p>
                              <p className="text-xs text-muted-foreground">
                                45 minutes
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">
                                Behavioral Focus
                              </p>
                              <p className="text-xs text-muted-foreground">
                                60%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
