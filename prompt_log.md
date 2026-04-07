AI tools： Claude Chat and Claude Code (3 agents)

***Chat***

**Brainstorming Phase**

1. "Do you have any app idea recommendations for this assignment?"
2. "Can you actually map out all the Korok seed locations in Zelda? And how would a Zelda tracker satisfy the assignment requirements?"
3. "Zelda already has a built-in quest log, so why would I need a separate app for that?"
4. "Let's think of something else — what other app ideas could work?"

**Requirements Clarification Phase**

5. "I think I really need a time-tracking app — I want to know how long I spend on each project. I also want a quick note-taking feature for code ideas and bug fixes. What details are missing from this idea?"
6. *(Answering your five clarifying questions)* "Use timestamps for the timer so it works in the background. Only one active session at a time. Both start and end times should be editable. What fixed tags make sense? Search by name and filter by tag should be two separate features."
7. "Besides 'WorK' and 'Life', what other fixed tags should the app have?"
8. "How should paused intervals be displayed in the record? And what should the screen/navigation structure look like?"

**SPEC.md Phase**

9. "Compared to the spec template from my last assignment, what is missing or weak in my current SPEC.md?"
10. "Based on the gaps you identified, please update and rewrite the full SPEC.md."

**Learning React Native Phase**

11. "I'm brand new to React Native. Can you explain at a high level how these files come together to create a working app?"
12. "What's the difference between React Native and a regular website? How is a View different from a div?"
13. "How do I add a button and a text input to a React Native screen? Show me a simple example and explain the useState hook."
14. "Write out the full Expo folder and file structure for my project, and describe what each file does."
15. "What is React?"
16. "Can I understand React and React Native using a frontend/backend analogy?"
17. "Is React Native like frontend development in the sense that it controls both appearance and logic?"
18. "Besides .tsx files, what other file types exist in an Expo project, and what does each one do?"
19. "What is a .ts file? How do I implement basic features like text input, alerts, a timer, styling, and AsyncStorage? Should I split everything into multiple files and use imports to combine them?"

***Agent 1***

**Codebase Exploration Phase**

20. "Please read the files in my project directory and tell me what this folder is doing — this is a project I need to build."
21. "These are the assignment requirements. Can you summarize what kind of app I need to build?"
22. "Can you read my SPEC.md file?"

**Agentic Build Phase**

23. "This is an English-language app. Based on the SPEC.md in this project, implement the complete mobile app exactly as specified. Create all necessary files, ensure error handling matches what the spec describes, and after the files are created, try to run the app (if possible) to verify it starts without errors."

**Git Troubleshooting Phase**

24. "How do I move my master branch into main? It looks like I accidentally created a branch I didn't want."
25. "Can you analyze what actually caused me to run into this situation in the first place?"

**App Behavior Questions**

26. "Where is my data being stored right now?"
27. "I want to confirm — is it true that the user cannot navigate back to the history screen while a timer session is in progress?"

***Agent 2***

**Code Review & Debugging Phase**

28. "Please review the code in this project against the spec in SPEC.md. For each acceptance criterion, check whether the code implements it correctly. Also check for bugs or logic errors, missing error handling, code quality issues, and security concerns. Format your findings as a numbered list marked [PASS], [FAIL], or [WARN]."
29. "Can I understand most of the FAILs and WARNs as being tag-related?"
30. "For finding 11 — what does it mean that the custom tag in the Detail Screen is not 'persisted'? For finding 17 — what does 'silent revert' mean? For finding 7 — explicit save only is correct, auto-save on navigate away is not needed. Findings 12 and 13 are unclear to me. Finding 14 is a real issue. Please explain findings 15, 16, 17, and 19 in more detail. Finding 18 is a valid optimization."
31. "Fix finding 11. Custom tags should be saved persistently. Also add a delete feature — put an × after each custom tag so the user can remove it from the tag list, but this should not affect existing records (it only removes the shortcut). Do you have any clarifying questions?"
32. "The × should only appear on custom tags. The delete feature should be in both places. Also add a × button in the search bar to clear the current search input. Any other questions?"
33. "(Screenshot) I was timing a session that ran from around 12:54 AM to 1:12 AM. When I try to edit the record, the app says my input is invalid. Is this the time calculation error you mentioned earlier?"
34. "Summarize what still needs to be fixed, based on the review findings and my feedback so far."
35. "Finding 1 must be fixed — switch everything to 24-hour format. Finding 14 must be fixed — handle cross-midnight sessions. Finding 12 needs fixing — the logic should be: if the user's input is valid, update the displayed Total in real time; if invalid, highlight the field without waiting for Save. Confirm dead code is truly dead before removing it. Finding 17 should show a validation prompt. Also add a Default tag for when the user doesn't know what category to use — place it after 'All' in the filter row. If the user starts a session without selecting a tag, automatically assign Default. It should not conflict with other tags (e.g. Default + Study is valid). Also fix findings 15 and 16. Do you have any clarifying questions?"
36. "Validate on blur (when leaving the field). Default should not be deletable. For the 'no tag selected' case in the New Activity modal — show a toast notification saying 'Default tag is selected' centered on screen, which fades away after a moment. Same behavior for the Detail Screen when all tags are cleared. Any other questions?"
37. "What items are still not optimized?"
38. "List all the files that make up the working app, and mark any file over 400 lines."
39. "What are the two remaining items we haven't addressed?"
40. "Finding 19 can be ignored — it's acceptable for the SPEC and README to describe the structure differently. Optimize finding 13, but first confirm the refactor produces identical results before making any changes."
41. "I choose to split index.tsx as well. Go ahead and start the refactor."

***Agent 3***

**Debugging & Feature Improvement Phase**

42. "Read the files in my current directory and tell me what this project is doing."
43. "In the record detail page, pressing Save Changes triggers a native alert dialog requiring the user to tap OK to continue. Find all interactions that require an OK confirmation, and replace them with auto-dismissing toast notifications that match the app's visual theme. First identify every place that requires OK."
44. "There is a bug in the time editor on the record detail page: given an original segment a→b, if the user changes the start to a' where a' > b (so the app correctly infers a' is the previous day), then changes it back to a, the app now treats a as being 24 hours in the past."
45. "*(Rejecting a direct code edit)* Just explain where the original code's logic is wrong."
46. "Add a date input feature to the time editor: collapsed by default (▼ to expand, ▲ to collapse). Do not change the existing time-editing logic — only add date control on top of it. When midnight-crossing is detected (e.g. 23:00→16:00), the date field should be updated automatically. Any clarifying questions?"
47. "*(Answering clarifying questions)* Use a plain text input for dates; do not clear the field when the user taps into it. Start date and end date are edited independently — changing one must not affect the other. On blur, if the date is invalid, show a small red error message below the input, styled consistently with the rest of the UI. If no more questions, give me pseudocode for the time-change logic only (excluding date)."
48. "Don't overthink the time logic — keep the existing time-editing behavior exactly as-is and simply add date control alongside it."
49. "Also enforce that the combined start datetime must be strictly before the combined end datetime; otherwise it is an invalid input. Go ahead and make the code changes."
