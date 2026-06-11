-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AcademicProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'literature',
    "stageData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AcademicProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AcademicProject" ("createdAt", "description", "id", "name", "topic", "updatedAt", "userId") SELECT "createdAt", "description", "id", "name", "topic", "updatedAt", "userId" FROM "AcademicProject";
DROP TABLE "AcademicProject";
ALTER TABLE "new_AcademicProject" RENAME TO "AcademicProject";
CREATE INDEX "AcademicProject_userId_idx" ON "AcademicProject"("userId");
CREATE TABLE "new_AcademicReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'literature_review',
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "config" TEXT,
    "score" REAL,
    "verdict" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AcademicProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AcademicReview" ("config", "content", "createdAt", "id", "projectId", "score", "type", "verdict") SELECT "config", "content", "createdAt", "id", "projectId", "score", "type", "verdict" FROM "AcademicReview";
DROP TABLE "AcademicReview";
ALTER TABLE "new_AcademicReview" RENAME TO "AcademicReview";
CREATE INDEX "AcademicReview_projectId_idx" ON "AcademicReview"("projectId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
