export interface QuestionPreset {
  label: string;
  type: "short" | "long";
}

export const QUESTION_BANK: { category: string; options: QuestionPreset[] }[] = [
  {
    category: "Wedding day details",
    options: [
      { label: "Ceremony venue name and address", type: "short" },
      { label: "Reception venue name and address (if different)", type: "short" },
      { label: "Getting-ready location", type: "short" },
      { label: "Wedding day timeline / schedule", type: "long" },
      { label: "Officiant's name", type: "short" },
      { label: "Wedding planner or coordinator's name and phone", type: "short" },
      { label: "Are you doing a first look?", type: "short" },
      { label: "Is the ceremony unplugged (no guest phones/cameras)?", type: "short" },
      { label: "Family formal portrait list (names, relationships, ages)", type: "long" },
      { label: "Must-have shots or moments", type: "long" },
      { label: "Any family dynamics or sensitivities I should know about", type: "long" },
    ],
  },
  {
    category: "Portrait / adventure session details",
    options: [
      { label: "Who's coming to the session (names, ages, relationships)?", type: "long" },
      { label: "Preferred location(s)", type: "short" },
      { label: "Outfit changes planned", type: "short" },
      { label: "Mood or vibe you're going for", type: "long" },
      { label: "Inspiration photos or Pinterest board link", type: "short" },
      { label: "Any pets joining the session?", type: "short" },
      { label: "Any mobility or physical considerations for the location", type: "long" },
    ],
  },
  {
    category: "Logistics & day-of",
    options: [
      { label: "Best phone number for day-of communication", type: "short" },
      { label: "Emergency contact name and phone", type: "short" },
      { label: "Parking or access instructions", type: "long" },
      { label: "Backup plan if it rains", type: "long" },
      { label: "Any allergies or accessibility needs", type: "long" },
    ],
  },
  {
    category: "Vision & style",
    options: [
      { label: "Three words to describe the vibe you want", type: "short" },
      { label: "Anything you specifically want to avoid", type: "long" },
      { label: "How did you hear about us?", type: "short" },
    ],
  },
];
