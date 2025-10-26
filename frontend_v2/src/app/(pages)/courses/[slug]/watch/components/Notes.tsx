import { useState } from "react";
import { PlusCircle, Clock, Edit, Trash2, X } from "lucide-react";
import AddNotes from "./AddNotes";

const Notes = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState("");

  // Sample existing note data
  const existingNoteContent =
    "Lorem ipsum dolor sit amet consectetur. Orci at ultricies pellentesque egestas sollicitudin amet morbi tortor. Mattis odio sagittis ullamcorper maecenas viverra orci at.";

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNoteContent("");
  };

  const handleSaveNote = () => {
    // TODO: Implement save functionality
    console.log("Saving note:", noteContent);
    handleCloseModal();
  };

  const handleEditClick = () => {
    setEditNoteContent(existingNoteContent);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditNoteContent("");
  };

  const handleSaveEditNote = () => {
    // TODO: Implement save edit functionality
    console.log("Saving edited note:", editNoteContent);
    handleCloseEditModal();
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    // TODO: Implement delete functionality
    console.log("Deleting note");
    handleCloseDeleteModal();
  };

  return (
    <div>
      {/* search bar */}
      <div className="flex justify-between gap-6">
        <div
          className={`w-full bg-[#F5F5F5] p-[6px] shrink rounded-xl flex gap-2 items-center border border-black/10`}
        >
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
            <span className="text-base font-bold font-plus-jakarta text-black">
              Add
            </span>
          </button>
        </div>
      </div>
      {/* Note Creation Modal */}
      {isModalOpen && (
        <AddNotes
          onClose={handleCloseModal}
          onSave={handleSaveNote}
          onNoteContentChange={setNoteContent}
          noteContent={noteContent}
        />
      )}

      {/* Edit Note Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#201E1E99]/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Edit Note</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Textarea */}
            <div className="mb-6">
              <textarea
                value={editNoteContent}
                onChange={(e) => setEditNoteContent(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your note content..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseEditModal}
                className="px-6 py-2 text-orange-500 bg-white border border-orange-500 rounded-lg hover:bg-orange-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditNote}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-[#201E1E99]/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Delete Note</h2>
              <button
                onClick={handleCloseDeleteModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-700 text-base">
                Are you sure you want to delete this note? This action cannot be
                undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex justify-start gap-6 my-5">
        <select
          title="All Lectures"
          className="flex items-center gap-2 border border-[#00000026] rounded-2xl py-4 pl-2 bg-white text-base font-bold font-plus-jakarta text-[#2B1508] cursor-pointer"
        >
          <option value="all">All Lectures</option>
          <option value="current">Current Lecture</option>
          <option value="completed">Completed Lectures</option>
          <option value="upcoming">Upcoming Lectures</option>
        </select>
        <select
          title="Sort By recents"
          className="flex items-center gap-2 border border-[#00000026] rounded-2xl py-4 pl-2 bg-white text-base font-bold font-plus-jakarta text-[#2B1508] cursor-pointer"
        >
          <option value="recent">Sort By recents</option>
          <option value="oldest">Sort By oldest</option>
          <option value="alphabetical">Sort By alphabetical</option>
          <option value="duration">Sort By duration</option>
        </select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 bg-[#0000000D] rounded-lg px-3 py-1">
              <Clock className="size-4 text-white" fill="#000000" />
              <span className="text-base font-semibold font-plus-jakarta text-black">
                00:01
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                title="Edit"
                className="cursor-pointer flex items-center gap-4 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl p-[11px] shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                onClick={handleEditClick}
              >
                <Edit className="size-6 text-black" />
              </button>
              <button
                type="button"
                title="Delete"
                className="cursor-pointer flex items-center gap-4 hover:text-gray-800 transition-colors border border-[#00000021] rounded-xl p-[11px] shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                onClick={handleDeleteClick}
              >
                <Trash2 className="size-6 text-black" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-bold text-black text-lg mb-3">
              Modal 1 | Episode 2
            </h3>
            <p className="text-black text-base font-normal leading-relaxed">
              {existingNoteContent}
            </p>
          </div>
          <hr className="border-3 border-[#0000000D] my-5" />
        </div>
      </div>
    </div>
  );
};

export default Notes;
