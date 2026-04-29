import Event from "../models/Event.js";
import FamilyGroup from "../models/FamilyGroup.js";

// Create new event
export const createEvent = async (req, res) => {
  try {
    const { title, type, date, time, isAllDay, description, familyId } = req.body;

    // Find all families user belongs to
    const families = await FamilyGroup.find({ members: req.user._id });
    if (families.length === 0) {
      return res.status(400).json({ message: "User has no family" });
    }

    let selectedFamilyId = null;

    // Single-family user → auto-assign
    if (families.length === 1) {
      selectedFamilyId = families[0]._id;
    }

    // Multi-family user → require selection
    if (families.length > 1) {
      if (!familyId) {
        return res.status(400).json({ message: "Family selection required" });
      }

      const isValidFamily = families.some(f => f._id.equals(familyId));
      if (!isValidFamily) {
        return res.status(403).json({ message: "Unauthorized family access" });
      }

      selectedFamilyId = familyId;
    }

    // Create event
    const event = await Event.create({
      title,
      type,
      date,
      time,
      isAllDay,
      description,
      createdBy: req.user._id,
      createdByName: req.user.name,
      familyId: selectedFamilyId,
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// Get all events for the user's families
export const getFamilyEvents = async (req, res) => {
  try {
    const families = await FamilyGroup.find({ members: req.user._id });
    if (families.length === 0) return res.status(400).json({ message: "User has no family" });

    const familyIds = families.map(f => f._id);

    const events = await Event.find({ familyId: { $in: familyIds } }).sort({ date: 1, time: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// Edit event (only creator)
export const editEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.createdBy.equals(req.user._id))
      return res.status(403).json({ message: "Not authorized to edit this event" });

    const { title, type, date, time, isAllDay, description } = req.body;
    event.title = title ?? event.title;
    event.type = type ?? event.type;
    event.date = date ?? event.date;
    event.time = time ?? event.time;
    event.isAllDay = isAllDay ?? event.isAllDay;
    event.description = description ?? event.description;

    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update event" });
  }
};

// Delete event (only creator)
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.createdBy.equals(req.user._id))
      return res.status(403).json({ message: "Not authorized to delete this event" });

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};
