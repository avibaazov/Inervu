"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview"; // specify allowed values
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  // Form fields for generating interview
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");
  const [typeAnswer, setTypeAnswer] = useState("technical");
  const [amount, setAmount] = useState("5");
  const [techstack, setTechstack] = useState("");

  useEffect(() => {
    if (type === "generate") return; // Skip if creating interview manually

    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.error("Vapi Error:", error);

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [type]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED && type !== "generate") {
      handleGenerateFeedback(messages);
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    let formattedQuestions = "";
    if (questions) {
      formattedQuestions = questions.map((q) => `- ${q}`).join("\n");
    }

    await vapi.start(interviewer, {
      variableValues: {
        questions: formattedQuestions,
      },
    });
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeAnswer,
          role,
          level,
          techstack,
          amount,
          userid: userId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      console.log("✅ Interview generated successfully");
      router.push("/");
    } catch (error) {
      console.error("❌ Error creating interview:", error);
      alert("Failed to create interview.");
    }
  };

  return (
    <>
      {type === "generate" ? (
        <div className="flex justify-center mt-10">
          <div className="card-border lg:min-w-[566px] ">
            <Card className="card w-full ">
              <CardHeader>
                <CardTitle className="text-center ">
                  Generate Interview
                </CardTitle>
                <CardDescription className="text-center">
                  Fill out the details to create a custom mock interview
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Role (e.g., Full Stack Developer)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="behavioural">Behavioural</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Level (Entry, Junior, Senior)"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Input
                  type="text"
                  placeholder="Number of Questions (e.g., 5)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
                <Input
                  type="text"
                  placeholder="Tech Stack (e.g., React, Node.js)"
                  value={techstack}
                  onChange={(e) => setTechstack(e.target.value)}
                  className="border px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </CardContent>

              <CardFooter className="flex justify-center">
                <Button onClick={handleCreateInterview} className="btn-primary">
                  Create Interview
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* AI Interviewer + User Cards */}
          <div className="call-view">
            <div className="card-interviewer">
              <div className="avatar">
                <Image
                  src="/ai-avatar.png"
                  alt="AI Avatar"
                  width={65}
                  height={54}
                  className="object-cover"
                />
                {isSpeaking && <span className="animate-speak " />}
              </div>
              <h3>AI Interviewer</h3>
            </div>

            <div className="card-border">
              <div className="card-content">
                <Image
                  src="/user-avatar.png"
                  alt="User Avatar"
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
                <h3>{userName}</h3>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="transcript-border">
              <div className="transcript">
                <p
                  key={lastMessage}
                  className={cn(
                    "transition-opacity duration-500 opacity-0",
                    "animate-fadeIn opacity-100",
                  )}
                >
                  {lastMessage}
                </p>
              </div>
            </div>
          )}

          <div className="w-full flex justify-center">
            {callStatus !== "ACTIVE" ? (
              <button className="relative btn-call" onClick={handleCall}>
                <span
                  className={cn(
                    "absolute animate-ping rounded-full opacity-75",
                    callStatus !== "CONNECTING" && "hidden",
                  )}
                />
                <span className="relative">
                  {callStatus === "INACTIVE" || callStatus === "FINISHED"
                    ? "Call"
                    : ". . ."}
                </span>
              </button>
            ) : (
              <button className="btn-disconnect" onClick={handleDisconnect}>
                End
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Agent;
