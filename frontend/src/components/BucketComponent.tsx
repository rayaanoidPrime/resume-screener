import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { Bucket, Candidate, Note } from "../services/api";
import NoteModal from "./NoteModal";
import { FaStickyNote, FaEye } from "react-icons/fa";

interface BucketComponentProps {
  buckets: Bucket[];
  candidates: Candidate[];
  selectedCandidates: Set<string>;
  onDragEnd: (result: any) => void;
  onDeleteBucket: (bucket: Bucket) => void;
  onResetBuckets: () => void;
  formatScore: (score: number) => string;
  onViewResume: (resumeId: string) => void;
  onAddBucket: () => void;
  onToggleSelect: (candidate: Candidate) => void;
  onCompareSelected: () => void;
  onUpdateNotes: (candidateId: string, updatedNotes: Note[]) => void;
}

export default function BucketComponent({
  buckets,
  candidates,
  selectedCandidates,
  onDragEnd,
  onDeleteBucket,
  onResetBuckets,
  formatScore,
  onViewResume,
  onAddBucket,
  onToggleSelect,
  onCompareSelected,
  onUpdateNotes,
}: BucketComponentProps) {
  const [sortOrders, setSortOrders] = useState<Record<string, "asc" | "desc">>(
    {}
  );
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const handleSort = (bucketId: string) => {
    const newOrder = sortOrders[bucketId] === "asc" ? "desc" : "asc";
    setSortOrders((prev) => ({
      ...prev,
      [bucketId]: newOrder,
    }));
  };

  const getCandidatesForBucket = (bucketId: string) => {
    const bucketsCandiates = candidates.filter(
      (candidate) => candidate.bucketId === bucketId
    );
    const order = sortOrders[bucketId];

    if (!order) return bucketsCandiates;

    return [...bucketsCandiates].sort((a, b) => {
      const scoreA = a.resumes[0]?.evaluation?.totalScore || 0;
      const scoreB = b.resumes[0]?.evaluation?.totalScore || 0;
      return order === "asc" ? scoreA - scoreB : scoreB - scoreA;
    });
  };

  const handleNoteClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsNoteModalOpen(true);
  };

  const handleNoteUpdate = (candidateId: string, updatedNotes: Note[]) => {
    onUpdateNotes(candidateId, updatedNotes);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Candidate Buckets
          </h2>
          {selectedCandidates.size > 0 && (
            <button
              onClick={onCompareSelected}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={selectedCandidates.size < 2}
            >
              Compare Selected ({selectedCandidates.size})
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onResetBuckets}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Reset All
          </button>
          <button
            onClick={onAddBucket}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Bucket
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buckets.map((bucket) => (
            <Droppable droppableId={bucket.id} key={bucket.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`${
                    bucket.name === "Excellent"
                      ? "bg-green-200"
                      : bucket.name === "Good"
                      ? "bg-blue-100"
                      : bucket.name === "No Go"
                      ? "bg-red-100"
                      : "bg-gray-50"
                  } rounded-lg p-4 min-h-[200px] ${
                    snapshot.isDraggingOver ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {bucket.name}
                      {bucket.isDefault && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort(bucket.id)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {sortOrders[bucket.id] === "asc" ? "↑" : "↓"} Score
                      </button>
                      {!bucket.isDefault && (
                        <button
                          onClick={() => onDeleteBucket(bucket)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {getCandidatesForBucket(bucket.id).map(
                      (candidate, index) => (
                        <Draggable
                          key={candidate.id}
                          draggableId={candidate.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-4 shadow-sm ${
                                snapshot.isDragging ? "shadow-lg" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center h-5">
                                    <input
                                      type="checkbox"
                                      checked={selectedCandidates.has(
                                        candidate.id
                                      )}
                                      onChange={() => onToggleSelect(candidate)}
                                      disabled={
                                        !selectedCandidates.has(candidate.id) &&
                                        selectedCandidates.size >= 5
                                      }
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {candidate.resumes[0]?.structuredData
                                        ?.contact_info?.name ||
                                        "Unknown Candidate"}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      {
                                        candidate.resumes[0]?.structuredData
                                          ?.contact_info?.email
                                      }
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                      {candidate.notes?.map((note, i) => (
                                        <span
                                          key={i}
                                          className="text-sm text-gray-700 bg-yellow-300 rounded px-1 max-w-xs truncate"
                                        >
                                          {note.content.slice(0, 10)}...
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleNoteClick(candidate)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FaStickyNote />
                                  </button>
                                  <button
                                    onClick={() =>
                                      onViewResume(candidate.resumes[0]?.id)
                                    }
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FaEye />
                                  </button>
                                </div>
                              </div>
                              {candidate.resumes[0]?.evaluation && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">
                                    Match Score:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatScore(
                                      candidate.resumes[0].evaluation.totalScore
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      )
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {isNoteModalOpen && selectedCandidate && (
        <NoteModal
          candidate={selectedCandidate}
          onClose={() => setIsNoteModalOpen(false)}
          onUpdateNotes={handleNoteUpdate}
        />
      )}
    </div>
  );
}
