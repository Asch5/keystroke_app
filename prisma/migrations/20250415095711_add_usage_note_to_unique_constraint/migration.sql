/*
  Warnings:

  - A unique constraint covering the columns `[definition,part_of_speech,language_code,source,subject_status_labels,general_labels,grammatical_note,usage_note,is_in_short_def,plural]` on the table `definitions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "definitions_definition_part_of_speech_language_code_source__key";

-- CreateIndex
CREATE UNIQUE INDEX "definitions_definition_part_of_speech_language_code_source__key" ON "definitions"("definition", "part_of_speech", "language_code", "source", "subject_status_labels", "general_labels", "grammatical_note", "usage_note", "is_in_short_def", "plural");
