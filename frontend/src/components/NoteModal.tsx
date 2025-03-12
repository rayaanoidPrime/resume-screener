import React, { useState, useEffect } from "react";
import { Candidate, Note } from "../services/api";
import { getNotes, createNote, updateNote, deleteNote } from "../services/api";

interface NoteModalProps {
  candidate: Candidate;
  onClose: () => void;
  onUpdateNotes: (candidateId: string, updatedNotes: Note[]) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({
  candidate,
  onClose,
  onUpdateNotes,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    const fetchNotes = async () => {
      const fetchedNotes = await getNotes(candidate.id);
      setNotes(fetchedNotes);
    };
    fetchNotes();
  }, [candidate.id]);

  const handleCreateNote = async () => {
    if (newNoteContent.trim() === "") return; // Prevent empty notes
    const note = await createNote(candidate.id, newNoteContent);
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    onUpdateNotes(candidate.id, updatedNotes);
    setNewNoteContent("");
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    const updatedNote = await updateNote(noteId, content);
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? updatedNote : note
    );
    setNotes(updatedNotes);
    onUpdateNotes(candidate.id, updatedNotes);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    onUpdateNotes(candidate.id, updatedNotes);
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Notes for {candidate.resumes[0]?.structuredData?.contact_info?.name}
        </h3>
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center justify-between">
              <textarea
                className="w-full border rounded p-2"
                value={note.content}
                onChange={(e) => handleUpdateNote(note.id, e.target.value)}
              />
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                Delete
              </button>
            </div>
          ))}
          <div className="flex items-center">
            <textarea
              className="w-full border rounded p-2"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Add a new note"
            />
            <button
              onClick={handleCreateNote}
              className="text-blue-600 hover:text-blue-800 ml-2"
            >
              Add
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NoteModal;
