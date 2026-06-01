import mongoose from "mongoose";

const GenreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

GenreSchema.pre("validate", function () {
  if (typeof this.name === "string") {
    this.name = this.name.trim().toLowerCase();
  }
});

const Genre = mongoose.model("Genre", GenreSchema);
export default Genre;
