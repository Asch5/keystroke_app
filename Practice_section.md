We have to improve here dashboard/practice our Typing Practice section.

We will have 5 types of exercises:

\*NEW: all these types work together as a single Practice. They (types of exercises) alternate between each other according to the word's progress.

1.Name "Choose the right word": look at these screens to understand it
@game_1_choose_the_right_translation.jpg
Difficulty level:2
instruction:

- if it was done correctly we move to this word's wordCard with cheering sound effect automatically.
- if it was done incorrectly we move to this word's wordCard with sad sound effect automatically.

2. "Make up the word"
   @game_2_make_up_word.jpg
   Difficulty level:3
   instruction:
   - by default has 3 attempts to make up the word. (but it can be changed in the settings)
   - sometimes we have a colocation of phrases of the word. (for example: "come over") in this case we have 6 attemps 3 for the first word and 3 for the second word.
   - if it was done correctly we move to this word's wordCard with cheering sound effect automatically.
   - if it was done incorrectly we move to this word's wordCard with sad sound effect automatically.

3. "Do you remember the translation"
   @game_3_do_you_remember_the-translation.jpg
   Difficulty level:1
   instruction:
   - if it was done correctly we move to this word's wordCard with cheering sound effect automatically.
   - if it was done incorrectly we move to this word's wordCard with sad sound effect automatically.

4. "Write the word_by_definition" (using definition or translation (not sound))
   @game_4_write_the_word-withKeyBoard.jpg
   @game_4_write_the_word-withoutKeyBoard.jpg
   Difficulty level:4
   \*CORRECT: instruction:
   this exercise has the button "Next" on the bottom of the screen.

5. "Write the word_by_sound" (using sound)
   @game_5_write_the_word-withSound.jpg
   Difficulty level:4
   \*CORRECT: instruction:
   this exercise has the button "Next" on the bottom of the screen.

- Universal WordCard:
  @word_card_p1.jpg
  @word_card_p2.jpg

desccription: WordCard aways has the same structure.

General rules:

1. Evrey game has the shared progress indicator on the top of the screen.
2. After the answer is submited we automatically move to the wordCard on this word. (with cheering or sad sound effect)
3. Games do not have the button "Next" on the bottom of the screen. (They move to the next word or the next exercise automatically.)

Work flow:

1. User click on the "Practice" button in the dashboard.
2. If a word gets to our practice for the first time, we will show the WordCard.
3. At the bottom of the screen we have a button "Next" that will move to the next word or the next exercise. (Clicking a button "Next" accompained with sound effect.)
4. As soon as we move to the exercise the word plays.

Actually if look at the structure of component we will see that the progress indicator is always at the top of the screen at the same place despite a game it is or a WordCard it is.

Also important that we have the strong system of evaluation a word (a word definitions as a unit) in terms of difficulty level and progress system. Here we need to look at a Difficulty level of game to astimate a progress of a word correctly. We can take a hight difficult game before a low difficult game as a 100% progress of a word.

////////////////////////////////////////////////////////////

New: Overal we have to have only one Practice here /dashboard/practice section. And this Practice will be a combination of all 5 types of exercises.
