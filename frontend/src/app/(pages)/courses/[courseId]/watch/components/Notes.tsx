import React, { useState } from 'react'
import { ChevronDown, PlusCircle, Clock, Edit, Trash2 } from "lucide-react";
import AddNotes from './AddNotes';

const Notes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNoteContent('');
  };

  const handleSaveNote = () => {
    // TODO: Implement save functionality
    console.log('Saving note:', noteContent);
    handleCloseModal();
  };

  return (
    <div>
      {/* search bar */}
      <div className="flex justify-between gap-6">
        <div className={`w-full bg-[#F5F5F5] p-[6px] shrink rounded-xl flex gap-2 items-center border border-black/10`}>
          <input
            type="text"
            placeholder="Create a new note at 00:01"
            className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
          />
          <button
            type="button"
            title="Send"
            className="cursor-pointer flex items-center gap-4 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl py-2 px-4 shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
            onClick={handleAddClick}
          >
            <PlusCircle className="size-6 text-black" />
            <span className='text-base font-bold font-plus-jakarta text-black'>Add</span>
          </button>
        </div>
      </div>
      {/* Note Creation Modal */}
      {isModalOpen && <AddNotes onClose={handleCloseModal} onSave={handleSaveNote} onNoteContentChange={setNoteContent} noteContent={noteContent}  />}

      {/* Filter Buttons */}
      <div className="flex justify-start gap-6 my-5">
        <button type="button" title="All Lectures" className="flex items-center gap-2 border border-[#00000026] rounded-2xl py-4 px-8">
          <span className='text-base font-bold font-plus-jakarta text-[#2B1508]'>All Lectures</span>
          <ChevronDown className="size-6 text-[#2B1508]" />
        </button>
        <button type="button" title="Sort By recents" className="flex items-center gap-2 border border-[#00000026] rounded-2xl py-4 px-8">
          <span className='text-base font-bold font-plus-jakarta text-[#2B1508]'>Sort By recents</span>
          <ChevronDown className="size-6 text-[#2B1508]" />
        </button>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 bg-[#0000000D] rounded-lg px-3 py-1">
              <Clock className="size-4 text-white" fill="#000000" />
              <span className="text-base font-semibold font-plus-jakarta text-black">00:01</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button type="button" title="Edit" className="cursor-pointer flex items-center gap-4 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl p-[11px] shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                <Edit className="size-6 text-black" />
              </button>
              <button type="button" title="Delete" className="cursor-pointer flex items-center gap-4 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl p-[11px] shadow-[0px_-3px_3.7px_0px_#0146E721_inset]">
                <Trash2 className="size-6 text-black" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-bold text-black text-lg mb-3">Modal 1 | Episode 2</h3>
            <p className="text-black text-base font-normal leading-relaxed">
              Lorem ipsum dolor sit amet consectetur. Orci at ultricies pellentesque egestas sollicitudin amet morbi tortor. Mattis odio sagittis ullamcorper maecenas viverra orci at.
            </p>
          </div>
          <hr className="border-3 border-[#0000000D] my-5" />
        </div>
      </div>
    </div>
  )
}

export default Notes