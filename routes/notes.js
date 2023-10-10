const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");

// Route1 : fetch all notes of the logged in user. Login Required
router.get("/fetchnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id });
    res.send(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Some error occured");
  }
});

// Route2 : Adding a note to a particular use. Login Required
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Enter a title of minimum 3 characters").isLength({ min: 3 }),
    body("description", "Enter a description of minimum 5 characters").isLength(
      { min: 5 }
    ),
  ],
  async (req, res) => {
    let { title, description, tag } = req.body;
    if(!tag){
      tag="General"
    }
    try {
      // Give error if validation is failed
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const note = new Notes({
        title,
        description,
        tag,
        user: req.user.id,
      });

      const savedNote = await note.save();
      res.send(savedNote);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occured");
    }
  }
);

// Route3 : Updating an existing note. Login Required
router.patch("/updatenote/:id", fetchuser, async (req, res) => {
  let { title, description, tag } = req.body;

  let isId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!isId) {
    res.status(404).send("Enter valid object id");
  } else {
    try {
      let note = await Notes.findById(req.params.id);
      // If any element is coming in req.body will be added to newNote
      let newNote = {};
      if (title) {
        newNote.title = title;
      }
      if (description) {
        newNote.description = description;
      }
      if (tag) {
        newNote.tag = tag;
      }

      // Checking whether the note with given id is available or not

      if (!note) {
        res.status(404).send("404 Not Found");
      } else {
        // Checking whether the request is coming from note owner or another user
        if (note.user.toString() !== req.user.id) {
          res.status(401).send("Not authorized");
        } else {
          // finding the note and updating it
          note = await Notes.findByIdAndUpdate(
            req.params.id,
            { $set: newNote },
            { new: true }
          );
          res.send(note);
        }
      }
    } catch (error) {
      res.send(error);
    }
  }
});

// Route4: Deleting an note. Login Required
router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    let isId = mongoose.Types.ObjectId.isValid(req.params.id);
    if (!isId) {
      res.status(404).send("Enter valid object id");
    } else {
      let note = await Notes.findById(req.params.id);
      if (!note) {
        res.status(404).send("404 Not Found");
      } else {
        // Checking whether the request is coming from note owner or another user
        if (note.user.toString() !== req.user.id) {
          res.status(401).send("Not authorized");
        } else {
          // finding the note and updating it
          note = await Notes.findByIdAndDelete(req.params.id);
          res.send({ Success: "Note has been deleted", note: note });
        }
      }
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
