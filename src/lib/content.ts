/**
 * Client-safe content constants (no server-only imports). These can be used in
 * both server and client components. The server-only data loader lives in
 * `settings.ts`, which re-exports everything here for convenience.
 */

export type Settings = Record<string, string>;

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_title: "For Natalia & the Kids",
  hero_kicker: "For the people who love them",
  hero_image_url: "",
  intro_title: "For Natalia & the Kids",
  intro_message:
    "In the wake of Joe's passing, so many people have asked how they can show up for Natalia and the kids.\n\nThere is no way to fill the space Joe leaves behind. But there are ways to surround the people he loved most with presence, friendship, consistency, and care.\n\nThis page is simply a way to help us do that together.\n\nRather than everyone reaching out at once, or Natalia having to coordinate what she needs, we're creating a gentle rhythm of support around the family for the months ahead.\n\nChoose whatever feels natural to you. A weekend with the kids. Dinner with Natalia. A visit, an errand, or simply some company.\n\nThank you for loving them.",

  kids_subtitle: "Showing up for them, month after month",
  kids_intro:
    "One thing we would especially love to create is a consistent connection between the kids and the people who knew and loved their dad.\n\nOnce a month, one of Joe's friends will take a weekend to spend some time with the kids. It does not need to be anything elaborate. Take them to lunch, a game, the beach, an activity, or simply spend time together.\n\nThe purpose is less about what you do and more about continuing to show up.\n\nWe hope these visits give the kids another way to remain connected to Joe's world, his friendships, his stories, and the people who loved him.",
  kids_choose_note:
    "Select any open weekend below that works for you. Once a weekend is chosen, it will be marked as claimed so we can keep the visits spread throughout the year.",

  support_subtitle: "Being there after everything gets quiet",
  support_intro:
    "In the first days and weeks after a loss, people gather quickly. Over time, life inevitably begins moving again for everyone around the person who is grieving.\n\nGrief does not move quite that fast.\n\nWe want to make sure Natalia continues to feel surrounded in the weeks and months ahead, without ever having to be the one asking people to come.\n\nThis can look however you want it to look.\n\nBring dinner. Sit with her for an hour. Take her out for coffee or a walk. Come watch a show. Help with something around the house. Stop by with no agenda at all.\n\nYou do not need to fix anything or find the right words.\n\nJust come.",
  support_choose_note:
    "Choose an open date below. You can leave a note letting Natalia know what you're thinking, or simply sign up and decide later.",

  events_subtitle: "Show up for the little big moments",
  events_intro:
    "The kids have games, recitals, and everyday milestones that mean the world when familiar faces are in the crowd. When Natalia adds one here, add your name so they look up and see they're surrounded.\n\nEveryone is welcome at these — the more the better.",
  events_empty:
    "No events on the calendar right now. When there's a game or a milestone to show up for, it'll appear here.",
  events_confirmation:
    "You're on the list — thank you for showing up for them. 💛",

  allergy_note:
    "One important note for anyone bringing food: Alexander is allergic to cashews and pistachios. Please avoid both, and check labels for “may contain” warnings. Thank you for keeping him safe. 💛",
  family_address: "10 Mechanic Street, Newton, MA",

  other_ways:
    "There are many ways to support a family after a loss, and sometimes the smallest practical things make the biggest difference.\n\nIf a scheduled visit is not right for you, you can still help by:\n\n• Sending a meal or restaurant gift card\n• Helping with groceries or errands\n• Offering rides or help with the kids\n• Dropping off something you know the family loves\n• Checking in months from now, not only today\n• Sharing stories, photos, or memories of Joe\n• Remembering important dates and milestones\n• Simply continuing to include Natalia and the kids in your life\n\nThere is no perfect way to support someone through grief.\nPresence matters most.",

  confirmation_message:
    "Thank you for showing up for Natalia and the kids. Your date is reserved.\n\nSometimes love looks like something enormous. And sometimes it simply looks like being there.",

  stories_title: "Tell the Kids a Story About Their Dad",
  stories_body:
    "There are parts of Joe's life that only you knew.\n\nStories from before the kids were born. Trips you took. Things he said. The way he showed up when someone needed him. The ridiculous things he did that still make you laugh.\n\nHis kids deserve to know those versions of their dad, too.\n\nWe would love to collect the stories, photos, and little memories that might otherwise disappear with time.\n\nIt does not have to be profound. In fact, it probably shouldn't be.\n\nTell them about the time he made everyone laugh until they cried. The trouble you got into together. Something he was weirdly obsessed with. A trip you will never forget. Something he did for you that you never forgot. What he was like at 25. What made him Joe.\n\nWrite it as though you are telling the story directly to his kids.\n\nSomeday, they will get to know another piece of their dad through you.",
  stories_privacy:
    "Everything you share here is completely private. It goes only to Natalia and the family through a secure, password-protected page — it is never shown publicly on this site.",
  stories_confirmation:
    "Thank you for sharing this with the kids. It's safe with the family, and one day it will help them know their dad a little more. 💛",

  gifts_title: "Give a Gift of Rest",
  gifts_intro:
    "Grief is exhausting, and the everyday things — cooking, errands, a moment to breathe — get so heavy. If you'd like to give something a little bigger, you can chip in toward a gift that lets Natalia rest and be cared for.\n\nContribute whatever you're comfortable with using any of the options below. When enough is gathered, we'll arrange it.",
  pay_venmo: "natalia-digiovanni",
  pay_cashapp: "nataliab85",
  pay_zelle: "904 866 6753",
  gifts_confirmation:
    "Thank you for your generosity — it means more than you know. 💛",

  contact_email: "brookefrenkel@gmail.com",
  footer_note:
    "For Natalia and the kids, with love.\nThis page is private and intended only for friends and family.",
};

export const SETTING_LABELS: Record<string, string> = {
  site_title: "Site title (browser tab)",
  hero_kicker: "Hero kicker (small line above the title — leave blank to hide)",
  hero_image_url: "Hero photo URL (e.g. /hero.jpg, or a link — leave blank for a placeholder)",
  intro_title: "Hero heading",
  intro_message: "Hero / intro message",
  kids_subtitle: "“Visits for the Kids” subtitle",
  kids_intro: "“Visits for the Kids” intro",
  kids_choose_note: "“Visits for the Kids” — note above the weekends",
  support_subtitle: "“Support for Natalia” subtitle",
  support_intro: "“Support for Natalia” intro",
  support_choose_note: "“Support for Natalia” — note above the days",
  events_subtitle: "“Come Cheer Them On” subtitle",
  events_intro: "“Come Cheer Them On” intro",
  events_empty: "“Come Cheer Them On” — empty state text",
  events_confirmation: "Message shown after someone RSVPs to an event",
  allergy_note: "Allergy note (shown in the meals area)",
  family_address: "Family address (for maps & meal delivery)",
  other_ways: "“Other ways to help” text",
  confirmation_message: "Confirmation message (shown after someone signs up)",
  stories_title: "“Tell the Kids a Story” heading",
  stories_body: "“Tell the Kids a Story” body",
  stories_privacy: "“Tell the Kids a Story” privacy reassurance",
  stories_confirmation: "Message shown after someone shares a memory",
  gifts_title: "“Give a Gift” heading",
  gifts_intro: "“Give a Gift” intro",
  pay_venmo: "Venmo username (without the @)",
  pay_cashapp: "Cash App cashtag (without the $)",
  pay_zelle: "Zelle phone or email",
  gifts_confirmation: "Message shown after someone chips in",
  contact_email: "Contact email (shown in footer)",
  footer_note: "Footer note",
};

// These render as multi-line textareas in the admin editor.
export const MULTILINE_SETTINGS = new Set([
  "intro_message",
  "kids_intro",
  "kids_choose_note",
  "support_intro",
  "support_choose_note",
  "events_intro",
  "allergy_note",
  "other_ways",
  "confirmation_message",
  "stories_body",
  "stories_privacy",
  "stories_confirmation",
  "gifts_intro",
  "footer_note",
]);
