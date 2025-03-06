/*
  Warnings:

  - The primary key for the `user_list_words` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dictionary_id` on the `user_list_words` table. All the data in the column will be lost.
  - Added the required column `user_dictionary_id` to the `user_list_words` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_list_words" DROP CONSTRAINT "user_list_words_dictionary_id_fkey";

-- AlterTable
ALTER TABLE "user_list_words" DROP CONSTRAINT "user_list_words_pkey",
DROP COLUMN "dictionary_id",
ADD COLUMN     "user_dictionary_id" UUID NOT NULL,
ADD CONSTRAINT "user_list_words_pkey" PRIMARY KEY ("user_list_id", "user_dictionary_id");

-- AddForeignKey
ALTER TABLE "user_list_words" ADD CONSTRAINT "user_list_words_user_dictionary_id_fkey" FOREIGN KEY ("user_dictionary_id") REFERENCES "user_dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
