export interface CourseSectionDto {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionInput {
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string | null;
  sortOrder?: number;
}

export interface ReorderSectionsInput {
  sectionOrders: {
    id: string;
    sortOrder: number;
  }[];
}
