-- CreateTable
CREATE TABLE "SearchSuggestions" (
    "id" SERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SearchSuggestions_pkey" PRIMARY KEY ("id")
);
