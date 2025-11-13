-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "uid" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "safe" BOOLEAN NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);
