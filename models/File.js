import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    // Original file name
    filename: {
      type: String,
      required: true,
    },

    // Stored file path (/uploads/xyz.pdf)
    filePath: {
      type: String,
      required: true,
    },

    // File type: image, document, video, audio
    fileType: {
      type: String,
      enum: ["image", "document", "video", "audio", "other"],
      default: "other",
    },

    // MIME type (pdf, jpg, png, mp4, etc.)
    mimeType: {
      type: String,
    },

    // File size in KB
    fileSize: {
      type: Number,
    },

    // Who uploaded the file
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Family group it belongs to
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: true,
    },

    // Optional link to chat message
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // AI / manual tags
    tags: {
      type: [String],
      default: [],
    },

    // Flag for important documents
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
