import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { Bucket, Candidate } from "../services/api";

interface BucketComponentProps {
  buckets: Bucket[];
  candidates: Candidate[];
  onDragEnd: (result: any) => void;
  onDeleteBucket: (bucket: Bucket) => void;
  onResetBuckets: () => void;
  formatScore: (score: number) => string;
  onViewResume: (resumeId: string) => void;
  onAddBucket: () => void;
}

export default function BucketComponent({
  buckets,
  candidates,
  onDragEnd,
  onDeleteBucket,
  onResetBuckets,
  formatScore,
  onViewResume,
  onAddBucket,
}: BucketComponentProps) {
  const [sortOrders, setSortOrders] = useState<Record<string, "asc" | "desc">>(
    {}
  );

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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Candidate Buckets
        </h2>
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
                      ? "bg-green-100"
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
                                </div>
                                <button
                                  onClick={() =>
                                    onViewResume(candidate.resumes[0]?.id)
                                  }
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  View
                                </button>
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
    </div>
  );
}
