import React from 'react'
import { MessageCircle, Search } from "lucide-react";
import Image from 'next/image';

const QASections = ({ questions, search, onSearchChange }: { questions: any[], search: string, onSearchChange: (value: string) => void }) => {
  // Filter questions based on search
  const filteredQuestions = questions.filter(item =>
    item.question.toLowerCase().includes(search.toLowerCase()) ||
    item.user.name.toLowerCase().includes(search.toLowerCase()) ||
    item.user.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* search bar */}
      <div className="flex justify-between gap-6">
        <div className={`w-full bg-[#F5F5F5] p-4 shrink rounded-xl flex gap-2 items-center border border-black/10`}>
          <Search className="size-6 text-black/30" />
          <input
            type="text"
            placeholder="Search for questions"
            className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button type="button" title="Search" className="text-[#2B1508] font-bold text-base p-4 rounded-2xl border border-[#00000026]">
            Ask
          </button>
        </div>
      </div>

      {/* questions */}
      <div className="flex flex-col gap-4">
        {/* All Questions Header */}
        <div className="mt-6">
          <h2 className="text-3xl font-coolvetica font-normal text-black mb-4">All Questions</h2>
        </div>

        {/* Question Items - Using map to render multiple questions */}
        {filteredQuestions.map((item) => (
          <div key={item.id} className="bg-white rounded-lg">
            {/* User Info */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-normal font-coolvetica text-black text-xl">{item.user.name}</h3>
                <p className="text-xs font-normal font-plus-jakarta text-[#575757]">{item.user.course}</p>
              </div>
            </div>

            {/* Question Content */}
            <div className="mb-4">
              <p className="text-black text-base font-normal leading-relaxed font-plus-jakarta">
                {item.question}
              </p>
            </div>

            {/* Reply Button */}
            <div className="flex items-center gap-2 ">
              <button type="button" title="Reply" className="cursor-pointer flex items-center gap-2 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-2 px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                <MessageCircle className="size-6 text-black" />
                <span className="text-base font-bold font-plus-jakarta text-black">Reply</span>
              </button>
            </div>
            <hr className="border-3 border-[#0000000D] my-5" />
          </div>
        ))}

        {/* No results message */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 font-plus-jakarta">No questions found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QASections