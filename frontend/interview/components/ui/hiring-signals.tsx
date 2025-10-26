import * as React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Clock, Target } from "lucide-react";

type HiringSignalsProps = {
  glassdoor?: string;
  avgLength?: string;
  behavioralFocus?: string;
  className?: string;
};

export default function HiringSignals({
  glassdoor = "3.1/5",
  avgLength = "45 minutes",
  behavioralFocus = "60%",
  className = "",
}: HiringSignalsProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-bold mb-3">Hiring Signals</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Glassdoor Difficulty</p>
            <p className="text-xs text-muted-foreground">{glassdoor}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Average Length</p>
            <p className="text-xs text-muted-foreground">{avgLength}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Behavioral Focus</p>
            <p className="text-xs text-muted-foreground">{behavioralFocus}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
