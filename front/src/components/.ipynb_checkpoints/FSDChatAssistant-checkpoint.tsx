// src/components/FSDChatAssistant.tsx
import { useState } from "react";
import { Send, Bot, User } from "lucide-react";

type SentimentPoint = {
  topic: string;
  score: number;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  // 백엔드에서 받은 sentimentChart로 상단 그래프 업데이트할 때 사용
  onUpdateSentiment?: (points: SentimentPoint[]) => void;
};

export default function FSDChatAssistant({ onUpdateSentiment }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "안녕하세요! 저는 테슬라 FSD(완전자율주행)와 로보택시, 다른 자율주행 브랜드들의 안전 이슈와 시장 인식을 분석해 주는 리서치 보조원입니다. 최근 시장 반응, 안전 사고, 규제 동향 등에 대해 자유롭게 질문해 주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // 1) 사용자 메시지 먼저 띄우기
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 2) 백엔드 /fsd-chat 호출
      const res = await fetch("http://127.0.0.1:8000/fsd-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      // 3) 답변 메시지 추가
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.answer ?? "(응답 본문 없음)",
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // 4) 상단 Consumer Sentiment 그래프 갱신
      if (onUpdateSentiment && Array.isArray(data.sentimentChart)) {
        onUpdateSentiment(data.sentimentChart as SentimentPoint[]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 2,
        role: "assistant",
        content:
          "백엔드 호출 중 오류가 발생했어요. 서버(backend)가 켜져 있는지 확인해 주세요.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // 🔹 높이를 h-full + min-h 로 변경해서 아래 여백까지 꽉 차도록
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-gray-200/70 shadow-xl p-6 flex flex-col h-full min-h-[380px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-red-600/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black">
              Sentiment Research Assistant
            </h3>
            <p className="text-xs text-gray-500">
              FSD 안전, 사고, 시장 인식에 대해 질문해 보세요.
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 rounded-2xl bg-gray-50/80 border border-gray-200/60 px-4 py-3 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm
              ${
                msg.role === "user"
                  ? "bg-red-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] opacity-70">
                {msg.role === "user" ? (
                  <>
                    <span>나</span>
                    <User className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3" />
                    <span>fsd-bot</span>
                  </>
                )}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="mt-4 flex items-center gap-3">
        <input
          className="flex-1 rounded-2xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-transparent bg-white/90"
          placeholder="예: 최근 테슬라 FSD에 대한 시장 인식을 분석해줘"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-md transition-all ${
            loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg"
          }`}
        >
          <Send className="w-4 h-4" />
          {loading ? "분석 중..." : "전송"}
        </button>
      </div>
    </div>
  );
}
