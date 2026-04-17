import mongoose from "mongoose";

const BooksSchema = new mongoose.Schema({}, { timestamps: true });

const Books = mongoose.model("Books", BooksSchema);

export default Books;
