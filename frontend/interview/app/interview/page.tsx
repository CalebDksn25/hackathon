"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Send,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const mockQuestion = {
  id: 1,
  question: "Tell me about a time you optimized a web app for speed.",
  context: "This evaluates how you approach real-world performance issues.",
  totalQuestions: 5,
};

const mockFeedback = {
  score: 8.5,
  strengths: [
    "Clear structure using the STAR method",
    "Specific metrics mentioned (40% load time improvement)",
    "Technical depth with concrete examples (lazy loading, code splitting)",
  ],
  improvements: [
    "Could elaborate more on the team collaboration aspect",
    "Add more context about the business impact of the optimization",
    "Mention specific tools used (Lighthouse, Chrome DevTools, etc.)",
  ],
  suggestedAnswer:
    "In my previous role at TechCorp, I noticed our dashboard was taking 8+ seconds to load. I used Lighthouse to identify bottlenecks and found that we were loading all components upfront. I implemented React.lazy() for code splitting and optimized our bundle size by 60%. I also worked with our backend team to implement API response caching. These changes reduced load time to 3 seconds, which increased user engagement by 25% according to our analytics. The key was balancing technical solutions with cross-team collaboration.",
};

export default function InterviewPage() {
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [answer]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        // In a real app, you would send this to a speech-to-text API
        // For now, we'll simulate adding text
        const simulatedTranscription =
          "\n[Voice input] In my previous role, I optimized our React application by implementing code splitting and lazy loading...";
        setAnswer((prev) => prev + simulatedTranscription);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setHasSubmitted(true);
    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsAnalyzing(false);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    // In a real app, this would navigate to the next question
    setAnswer("");
    setHasSubmitted(false);
    setShowFeedback(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold mt-2">
                Mock Interview Practice
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Question</p>
              <p className="text-2xl font-bold text-primary">
                {mockQuestion.id}/{mockQuestion.totalQuestions}
              </p>
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-6 md:p-8 border-2 shadow-lg">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Technical Question</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-balance">
                {mockQuestion.question}
              </h2>
              <p className="text-muted-foreground">{mockQuestion.context}</p>
            </div>
          </Card>

          {/* Answer Input Card */}
          <Card className="p-6 md:p-8 border-2 shadow-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Answer</h3>

              {isRecording && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-medium text-destructive">
                    Recording in progress...
                  </span>
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here or use voice input..."
                  disabled={hasSubmitted}
                  rows={1}
                  className="flex-1 min-h-[44px] max-h-[300px] px-4 py-3 text-base rounded-lg border border-input bg-background resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ lineHeight: "1.5" }}
                />

                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={hasSubmitted}
                  className="h-11 w-11 rounded-full flex-shrink-0"
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || hasSubmitted}
                  size="lg"
                  className="gap-2 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  Submit Answer
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                {answer.length} characters
              </p>
            </div>
          </Card>

          {/* Analysis Loading */}
          {isAnalyzing && (
            <Card className="p-8 border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 text-primary">
                  <TrendingUp className="w-6 h-6 animate-pulse" />
                  <span className="text-xl font-bold">
                    Analyzing your response...
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Our AI is evaluating your answer and preparing feedback
                </p>
              </div>
            </Card>
          )}

          {/* Feedback Card */}
          {showFeedback && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Score Card */}
              <Card className="p-6 md:p-8 border-2 shadow-lg bg-gradient-to-br from-primary/5 to-purple-500/5">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>AI Evaluation Complete</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-6xl font-bold text-primary">
                      {mockFeedback.score}
                    </p>
                    <p className="text-lg text-muted-foreground">out of 10</p>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Great answer! You demonstrated technical knowledge and
                    problem-solving skills.
                  </p>
                </div>
              </Card>

              {/* Strengths */}
              <Card className="p-6 border-2 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold">What You Did Well</h3>
                  </div>
                  <ul className="space-y-3">
                    {mockFeedback.strengths.map((strength, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Improvements */}
              <Card className="p-6 border-2 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold">Areas for Improvement</h3>
                  </div>
                  <ul className="space-y-3">
                    {mockFeedback.improvements.map((improvement, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                      >
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Suggested Answer */}
              <Card className="p-6 border-2 shadow-lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">
                      Enhanced Answer Example
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Here's how you could strengthen your response by
                    incorporating the feedback above:
                  </p>
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <p className="text-sm leading-relaxed">
                      {mockFeedback.suggestedAnswer}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleNextQuestion}
                  size="lg"
                  className="flex-1 gap-2"
                >
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 bg-transparent"
                >
                  <Mic className="w-4 h-4" />
                  Practice Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
